package repository

import (
	"context"
	"dashboard-app/internal/models"
)

type SalesRepository interface {
	CreateSales(context.Context, models.SaleRequest) error
	GetAllSales(context.Context, models.SalesFilter) (*models.SalePaginationResponse, error)
	DeleteSale(context.Context, string) error
	GetSaleById(context.Context, string) (*models.SaleResponseById, error)
	UpdateSales(context.Context, string, models.SaleRequest) error
}
