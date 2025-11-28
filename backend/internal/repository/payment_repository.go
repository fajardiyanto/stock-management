package repository

import "dashboard-app/internal/models"

type PaymentRepository interface {
	GetAllPaymentFromUserId(string) (*models.CashFlowResponse, error)
	GetAllBalance(string) (int, error)
	CreateManualPayment(string, []models.CreateManualPaymentRequest) error
	DeleteManualPayment(string) error
	GetAllPaymentFromPurchaseId(string) (*models.CashFlowResponse, error)
	CreatePaymentByPurchaseId(models.CreatePaymentRequest) error
}
