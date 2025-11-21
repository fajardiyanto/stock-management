package repository

import "dashboard-app/internal/models"

type StockRepository interface {
	GetAllStockEntries(int, int) (*models.StockResponse, error)
}
