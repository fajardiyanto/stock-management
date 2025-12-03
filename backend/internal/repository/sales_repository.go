package repository

import "dashboard-app/internal/models"

type SalesRepository interface {
	CreateSales(models.SaleRequest) error
	GetAllSales(models.SalesFilter) (*models.SalePaginationResponse, error)
	DeleteSale(string) error
}
