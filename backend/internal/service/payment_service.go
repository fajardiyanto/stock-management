package service

import (
	"dashboard-app/internal/config"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"github.com/google/uuid"
)

type PaymentService struct {
}

func NewPaymentService() repository.PaymentRepository {
	return &PaymentService{}
}

func (p *PaymentService) GetAllPaymentFromUserId(userId string) (*models.CashFlowResponse, error) {
	var payments []models.Payment
	if err := config.GetDBConn().Orm().Debug().Model(&models.Payment{}).Where("user_id = ? AND deleted = false", userId).Find(&payments).Error; err != nil {
		return nil, err
	}

	var results models.CashFlowResponse
	var totalIncome, totalOutcome int

	for _, payment := range payments {
		if payment.Type == "INCOME" {
			totalIncome += payment.Total
		} else if payment.Type == "EXPENSE" {
			totalOutcome += payment.Total
		}

		result := models.PaymentResponse{
			Uuid:        payment.Uuid,
			UserId:      payment.UserId,
			Total:       payment.Total,
			Type:        payment.Type,
			Description: payment.Description,
			SalesId:     payment.SalesId,
			PurchaseId:  payment.PurchaseId,
			CreatedAt:   payment.CreatedAt,
			UpdatedAt:   payment.UpdatedAt,
		}

		results.Payment = append(results.Payment, result)
	}

	results.Balance = totalIncome - totalOutcome

	return &results, nil
}

func (p *PaymentService) GetAllBalance(userId string) (int, error) {
	var payments []models.Payment

	db := config.GetDBConn().Orm().Debug()

	if err := db.
		Model(&models.Payment{}).
		Where("user_id = ? AND deleted = false", userId).
		Find(&payments).Error; err != nil {
		return 0, err
	}

	var totalIncome, totalOutcome int

	for _, payment := range payments {
		if payment.Type == "INCOME" {
			totalIncome += payment.Total
		} else if payment.Type == "EXPENSE" {
			totalOutcome += payment.Total
		}
	}

	balance := totalIncome - totalOutcome

	return balance, nil
}

func (p *PaymentService) CreateManualPayment(userId string, requests []models.CreatePaymentRequest) error {
	db := config.GetDBConn().Orm().Debug()

	tx := db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	var payments []models.Payment

	for _, req := range requests {
		payment := models.Payment{
			Uuid:        uuid.NewString(),
			UserId:      userId,
			Total:       req.Total,
			Type:        req.Type,
			Description: req.Description,
		}
		payments = append(payments, payment)
	}

	if err := tx.Create(&payments).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Commit().Error; err != nil {
		return err
	}

	return nil
}

func (p *PaymentService) DeleteManualPayment(paymentId string) error {
	return config.GetDBConn().Orm().Debug().
		Model(&models.Payment{}).
		Where("uuid = ? AND deleted = false", paymentId).
		Update("deleted", true).Error
}
