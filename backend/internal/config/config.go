package config

import (
	"dashboard-app/internal/models"

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
		); err != nil {
			logger.Error("Error when migrate table, with err: ", err)
			return
		}
	}
}

func GetDBConn() databaseInterface.SQL {
	return database
}

func GetLogger() interfaces.Logger {
	logger = lib.NewLib()
	logger.Init(models.GetConfig().Name)
	return logger
}
