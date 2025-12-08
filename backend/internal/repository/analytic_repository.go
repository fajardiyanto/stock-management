package repository

import "dashboard-app/internal/models"

type AnalyticRepository interface {
	GetAnalyticStats() (*models.AnalyticStatsResponse, error)
	GetDailyGetAnalyticStats(string) (*models.DailyAnalyticStatsResponse, error)
	GetSalesTrendData(string) ([]models.SalesTrendData, error)
	GetStockDistributionData() ([]models.StockDistributionData, error)
	GetSupplierPerformance() ([]models.UserData, error)
	GetCustomerPerformance() ([]models.UserData, error)
}
