package repository

import "dashboard-app/internal/models"

type PaymentRepository interface {
	GetAllPaymentFromUserId(string) (*models.CashFlowResponse, error)
	GetAllBalance(string) (int, error)
	CreateManualPayment(string, []models.CreateManualPaymentRequest) error
	DeleteManualPayment(string) error
	GetAllPaymentByFieldId(string, string) (*models.CashFlowResponse, error)
	CreatePaymentByPurchaseId(models.CreatePaymentPurchaseRequest) error
	CreatePaymentBySalesId(models.CreatePaymentSaleRequest) error
}
