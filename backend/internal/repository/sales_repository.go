package repository

import "dashboard-app/internal/models"

type SalesRepository interface {
	CreateSales(request models.SaleRequest) error
	GetAllSales() ([]models.SaleResponse, error)
	DeleteSale(string) error
}
