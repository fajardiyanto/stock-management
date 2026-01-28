package repository

import "dashboard-app/internal/models"

type AnalyticRepository interface {
	GetAnalyticStats(models.AnalyticStatsFilter) (*models.AnalyticStatsResponse, error)
	GetDailyGetAnalyticStats(string) (*models.DailyAnalyticStatsResponse, error)
	GetSalesTrendData(string) ([]models.SalesTrendData, error)
	GetStockDistributionData(models.AnalyticStatsFilter) ([]models.StockDistributionData, error)
	GetSupplierPerformance(models.AnalyticStatsFilter) ([]models.UserData, error)
	GetCustomerPerformance(models.AnalyticStatsFilter) ([]models.UserData, error)
	GetSalesSupplierDetail(models.DailyBookKeepingFilter) (*models.SalesSupplierDetailPaginationResponse, error)
	SalesSupplierDetailWithPurchaseData(models.DailyBookKeepingFilter) (*models.SalesSupplierDetailWithPurchaseDataPaginationResponse, error)
}
