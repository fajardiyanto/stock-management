package repository

import "dashboard-app/internal/models"

type StockRepository interface {
	GetAllStockEntries(models.StockEntryFilter) (*models.StockResponse, error)
	GetStockEntryById(string) (*models.StockEntriesResponse, error)
	UpdateStockById(string, models.CreatePurchaseRequest) (*models.PurchaseDataResponse, error)
	GetStockItemById(string) (*models.StockEntryResponse, error)
	CreateStockSort(models.SubmitSortRequest) error
	UpdateStockSort(models.SubmitSortRequest) error
	DeleteStockEntryById(string) error
	GetAllStockSorts() ([]models.StockSortResponse, error)
}
