package config

import (
	"dashboard-app/internal/models"
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
		); err != nil {
			logger.Error("Error when migrate table, with err: %s", err)
			return
		}
	}
}

func GetDBConn() *gorm.DB {
	if models.GetConfig().Environment == "development" {
		return database.Orm().Debug()
	} else {
		return database.Orm()
	}
}

func GetLogger() interfaces.Logger {
	logger = lib.NewLib()
	logger.Init(models.GetConfig().Name)
	return logger
}
