package repository

import "dashboard-app/internal/models"

type PurchaseRepository interface {
	CreatePurchase(models.CreatePurchaseRequest) (*models.PurchaseDataResponse, error)
	GetAllPurchases(models.PurchaseFilter) (*models.PurchaseResponse, error)
	UpdatePurchase(string, models.UpdatePurchaseRequest) error
}
