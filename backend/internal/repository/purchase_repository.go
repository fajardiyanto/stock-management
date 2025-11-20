package repository

import "dashboard-app/internal/models"

type PurchaseRepository interface {
	CreatePurchase(models.CreatePurchaseRequest) (*models.PurchaseResponse, error)
	GetAllPurchases() ([]models.PurchaseResponse, error)
}
