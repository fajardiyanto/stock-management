package repository

import "dashboard-app/internal/models"

type PurchaseRepository interface {
	CreatePurchase(models.CreatePurchaseRequest) (*models.PurchaseDataResponse, error)
	GetAllPurchases(int, int) (*models.PurchaseResponse, error)
}
