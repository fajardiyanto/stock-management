package service

import (
	"dashboard-app/internal/config"
	"dashboard-app/internal/constants"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"fmt"
	"github.com/google/uuid"
	"time"
)

type PaymentService struct {
}

func NewPaymentService() repository.PaymentRepository {
	return &PaymentService{}
}

func (p *PaymentService) GetAllPaymentFromUserId(userId string) (*models.CashFlowResponse, error) {
	var payments []models.Payment
	if err := config.GetDBConn().Model(&models.Payment{}).Where("user_id = ? AND deleted = false", userId).Find(&payments).Error; err != nil {
		return nil, err
	}

	var results models.CashFlowResponse
	var totalIncome, totalOutcome int

	var user models.User
	if err := config.GetDBConn().Model(&models.User{}).Where("uuid = ? AND status = false", userId).Find(&user).Error; err != nil {
		return nil, err
	}

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

		if payment.Type == constants.Expense {
			result.IsDeleted = true
		}

		if user.Role == constants.SupplierRole && payment.PurchaseId == "" && payment.Type != constants.Income {
			result.IsDeleted = true
		}

		if user.Role == constants.BuyerRole && payment.SalesId == "" && payment.Type != constants.Income {
			result.IsDeleted = true
		}

		if payment.Type == constants.Income && payment.PurchaseId == "" && payment.SalesId == "" {
			result.IsDeleted = true
		}

		results.Payment = append(results.Payment, result)
	}

	results.Balance = totalIncome - totalOutcome

	return &results, nil
}

func (p *PaymentService) GetAllBalance(userId string) (int, error) {
	var payments []models.Payment

	db := config.GetDBConn()

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

func (p *PaymentService) CreateManualPayment(userId string, requests []models.CreateManualPaymentRequest) error {
	db := config.GetDBConn()

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
	db := config.GetDBConn()

	tx := db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	var payment models.Payment
	if err := tx.Model(&models.Payment{}).Where("uuid = ? AND deleted = false", paymentId).First(&payment).Error; err != nil {
		return err
	}

	if err := tx.Model(&models.Payment{}).
		Where("uuid = ? AND deleted = false", paymentId).
		Update("deleted", true).Error; err != nil {
		tx.Rollback()
		return err
	}

	if payment.PurchaseId != "" {
		var purchase models.Purchase
		if err := tx.Model(&models.Purchase{}).Where("uuid = ? AND deleted = false", payment.PurchaseId).First(&purchase).Error; err != nil {
			return err
		}

		paidAmount := purchase.PaidAmount - payment.Total
		remainingAmount := purchase.RemainingAmount + payment.Total

		purchaseRequest := map[string]interface{}{
			"remaining_amount": remainingAmount,
			"paid_amount":      paidAmount,
			"updated_at":       time.Now(),
		}

		if err := tx.Model(&purchase).Where("uuid = ? AND deleted = false", purchase.Uuid).Updates(purchaseRequest).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	tx.Commit()

	return nil
}

func (p *PaymentService) GetAllPaymentByFieldId(id string, field string) (*models.CashFlowResponse, error) {
	query := config.GetDBConn().Model(&models.Payment{})

	switch field {
	case "purchase":
		query = query.Where("purchase_id = ? AND deleted = false", id)
	case "sale":
		query = query.Where("sales_id = ? AND deleted = false", id)
	default:
		return nil, fmt.Errorf("invalid field: %s (allowed: purchase, sales)", field)
	}

	var payments []models.Payment
	if err := query.Find(&payments).Error; err != nil {
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

func (p *PaymentService) CreatePaymentByPurchaseId(request models.CreatePaymentPurchaseRequest) error {
	db := config.GetDBConn()

	tx := db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	var purchase models.Purchase
	if err := tx.Model(&models.Purchase{}).Where("uuid = ? AND deleted = false", request.PurchaseId).First(&purchase).Error; err != nil {
		return err
	}

	paidAmount := purchase.PaidAmount + request.Total
	remainingAmount := purchase.TotalAmount - paidAmount

	paymentStatus := constants.PartialPayment
	if purchase.TotalAmount == paidAmount {
		paymentStatus = constants.PaymentInFull
	}

	purchaseRequest := map[string]interface{}{
		"purchase_date":    request.PurchaseDate,
		"remaining_amount": remainingAmount,
		"payment_status":   paymentStatus,
		"paid_amount":      paidAmount,
		"updated_at":       time.Now(),
	}

	if err := tx.Model(&purchase).Where("uuid = ? AND deleted = false", purchase.Uuid).Updates(purchaseRequest).Error; err != nil {
		tx.Rollback()
		return err
	}

	payment := models.Payment{
		Uuid:        uuid.New().String(),
		PurchaseId:  purchase.Uuid,
		UserId:      purchase.SupplierID,
		Description: fmt.Sprintf("Pembayaran Buying %s", request.StockCode),
		Total:       request.Total,
		Type:        "EXPENSE",
		Deleted:     false,
		CreatedAt:   request.PurchaseDate,
	}

	if err := tx.Create(&payment).Error; err != nil {
		tx.Rollback()
		return err
	}

	tx.Commit()

	return nil
}

func (p *PaymentService) CreatePaymentBySalesId(request models.CreatePaymentSaleRequest) error {
	db := config.GetDBConn()

	tx := db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	var sale models.Sale
	if err := tx.Model(&models.Sale{}).Where("uuid = ? AND deleted = false", request.SalesId).First(&sale).Error; err != nil {
		return err
	}

	paidAmount := sale.PaidAmount + request.Total
	remainingAmount := sale.TotalAmount - paidAmount

	paymentStatus := constants.PartialPayment
	if sale.TotalAmount == paidAmount {
		paymentStatus = constants.PaymentInFull
	}

	saleRequest := map[string]interface{}{
		"purchase_date":    request.SalesDate,
		"remaining_amount": remainingAmount,
		"payment_status":   paymentStatus,
		"paid_amount":      paidAmount,
		"updated_at":       time.Now(),
	}

	if err := tx.Model(&sale).Where("uuid = ? AND deleted = false", sale.Uuid).Updates(saleRequest).Error; err != nil {
		tx.Rollback()
		return err
	}

	payment := models.Payment{
		Uuid:        uuid.New().String(),
		SalesId:     sale.Uuid,
		UserId:      sale.CustomerId,
		Description: fmt.Sprintf("Pembayaran Buying %s", request.SalesCode),
		Total:       request.Total,
		Type:        "EXPENSE",
		Deleted:     false,
		CreatedAt:   request.SalesDate,
	}

	if err := tx.Create(&payment).Error; err != nil {
		tx.Rollback()
		return err
	}

	tx.Commit()

	return nil
}
