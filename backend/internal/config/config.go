package config

import (
	"dashboard-app/internal/constants"
	"dashboard-app/internal/models"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	databaseInterface "github.com/fajarardiyanto/flt-go-database/interfaces"
	databaseLib "github.com/fajarardiyanto/flt-go-database/lib"
	"github.com/fajarardiyanto/flt-go-logger/interfaces"
	"github.com/fajarardiyanto/flt-go-logger/lib"
)

var (
	database databaseInterface.SQL
	logger   interfaces.Logger
)

func Config() {
	db := databaseLib.NewLib()
	db.Init(GetLogger())

	InitMysql(db)
}

func InitMysql(db databaseInterface.Database) {
	if models.GetConfig().Database.Mysql.Enable {
		database = db.LoadSQLDatabase(models.GetConfig().Database.Mysql)

		if err := database.LoadSQL(); err != nil {
			logger.Error(err).Quit()
		}

		if err := database.Orm().AutoMigrate(
			&models.User{},
			&models.Purchase{},
			&models.Payment{},
			&models.StockEntry{},
			&models.StockItem{},
			&models.StockSort{},
			&models.Fiber{},
			&models.Sale{},
			&models.ItemAddOnn{},
			&models.ItemSales{},
			&models.AuditLog{},
		); err != nil {
			logger.Error("Error when migrate table, with err: %s", err)
			return
		}

		autoInitSuperAdmin(database.Orm())
	}
}

func GetDBConn() *gorm.DB {
	if models.GetConfig().Environment == "production" {
		return database.Orm()
	} else {
		return database.Orm().Debug()
	}
}

func GetDBConnAuditTrail() *gorm.DB {
	return database.Orm()
}

func GetLogger() interfaces.Logger {
	logger = lib.NewLib()
	logger.Init(models.GetConfig().Name)
	return logger
}

func autoInitSuperAdmin(db *gorm.DB) {
	password := "123"
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	defaultAdmin := models.User{
		Uuid:            uuid.New().String(),
		Name:            "Fajar",
		Phone:           "123",
		Password:        string(hash),
		Role:            constants.SuperAdminRole,
		Status:          true,
		Address:         "123 Main Street, Jakarta",
		ShippingAddress: "",
	}

	result := db.Where("phone = ?", defaultAdmin.Phone).
		FirstOrCreate(&defaultAdmin)

	if result.Error != nil {
		logger.Error("Failed to auto-create SUPER_ADMIN: %v", result.Error)
		return
	}

	if result.RowsAffected == 0 {
		logger.Info("SUPER_ADMIN already exists — skip creating")
	} else {
		logger.Info("SUPER_ADMIN created successfully")
	}
}
