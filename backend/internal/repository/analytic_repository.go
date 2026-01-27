package repository

import "dashboard-app/internal/models"

type AnalyticRepository interface {
	GetAnalyticStats(string, int) (*models.AnalyticStatsResponse, error)
	GetDailyGetAnalyticStats(string) (*models.DailyAnalyticStatsResponse, error)
	GetSalesTrendData(string) ([]models.SalesTrendData, error)
	GetStockDistributionData() ([]models.StockDistributionData, error)
	GetSupplierPerformance() ([]models.UserData, error)
	GetCustomerPerformance() ([]models.UserData, error)
	GetSalesSupplierDetail(models.SalesSupplierDetailFilter) (*models.SalesSupplierDetailPaginationResponse, error)
	SalesSupplierDetailWithPurchaseData(models.SalesSupplierDetailFilter) (*models.SalesSupplierDetailWithPurchaseDataPaginationResponse, error)
}
