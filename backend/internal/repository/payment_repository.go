package repository

import "dashboard-app/internal/models"

type PaymentRepository interface {
	GetAllPaymentFromUserId(string) (*models.CashFlowResponse, error)
	GetAllBalance(string) (int, error)
	CreateManualPayment(string, []models.CreatePaymentRequest) error
	DeleteManualPayment(string) error
}
