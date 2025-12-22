package service

import (
	"dashboard-app/internal/config"
	"dashboard-app/internal/constants"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"dashboard-app/pkg/apperror"
	"fmt"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"
)

type PaymentService struct {
}

func NewPaymentService() repository.PaymentRepository {
	return &PaymentService{}
}

func (p *PaymentService) basePaymentQuery() *gorm.DB {
	return config.GetDBConn().Model(&models.Payment{}).Where("deleted = ?", false)
}

// Helper to calculate balance from payments
func calculateBalance(payments []models.Payment) (totalIncome, totalOutcome int) {
	for _, payment := range payments {
		if payment.Type == constants.Income {
			totalIncome += payment.Total
		} else if payment.Type == constants.Expense {
			totalOutcome += payment.Total
		}
	}
	return
}

// Helper to convert payment to response with deletion rules
func (p *PaymentService) buildPaymentResponse(payment models.Payment, userRole string) models.PaymentResponse {
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
		IsDeleted:   false,
	}

	// Apply deletion rules
	if payment.Type == constants.Expense {
		result.IsDeleted = true
		return result
	}

	if userRole == constants.SupplierRole && payment.PurchaseId == "" && payment.Type != constants.Income {
		result.IsDeleted = true
		return result
	}

	if userRole == constants.BuyerRole && payment.SalesId == "" && payment.Type != constants.Income {
		result.IsDeleted = true
		return result
	}

	if payment.Type == constants.Income && payment.PurchaseId == "" && payment.SalesId == "" {
		result.IsDeleted = true
	}

	return result
}

func (p *PaymentService) GetAllPaymentFromUserId(userId string) (*models.CashFlowResponse, error) {
	var payments []models.Payment
	if err := p.basePaymentQuery().Where("user_id = ?", userId).Find(&payments).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch payments: ", err)
	}

	var user models.User
	if err := config.GetDBConn().Model(&models.User{}).
		Where("uuid = ? AND status = ?", userId, true).
		First(&user).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch user: ", err)
	}

	totalIncome, totalOutcome := calculateBalance(payments)

	results := models.CashFlowResponse{
		Balance: totalIncome - totalOutcome,
		Payment: make([]models.PaymentResponse, 0, len(payments)),
	}

	for _, payment := range payments {
		results.Payment = append(results.Payment, p.buildPaymentResponse(payment, user.Role))
	}

	return &results, nil
}

func (p *PaymentService) GetAllBalance(userId string) (int, error) {
	var payments []models.Payment
	if err := p.basePaymentQuery().
		Select("type, total").
		Where("user_id = ?", userId).
		Find(&payments).Error; err != nil {
		return 0, apperror.NewUnprocessableEntity("failed to fetch payments: ", err)
	}

	totalIncome, totalOutcome := calculateBalance(payments)
	return totalIncome - totalOutcome, nil
}

func (p *PaymentService) CreateManualPayment(userId string, requests []models.CreateManualPaymentRequest) error {
	if len(requests) == 0 {
		return nil
	}

	payments := make([]models.Payment, 0, len(requests))
	for _, req := range requests {
		payments = append(payments, models.Payment{
			Uuid:        uuid.NewString(),
			UserId:      userId,
			Total:       req.Total,
			Type:        req.Type,
			Description: req.Description,
		})
	}

	return config.GetDBConn().Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&payments).Error; err != nil {
			return apperror.NewUnprocessableEntity("failed to create payments: ", err)
		}
		return nil
	})
}

func (p *PaymentService) DeleteManualPayment(paymentId string) error {
	db := config.GetDBConn()

	tx := db.Begin()
	if tx.Error != nil {
		return apperror.NewInternal("failed to begin transaction: ", tx.Error)
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	var payment models.Payment
	if err := tx.Model(&models.Payment{}).
		Where("uuid = ? AND deleted = ?", paymentId, false).
		First(&payment).Error; err != nil {
		return apperror.NewNotFound(fmt.Sprintf("payment not found: %v", err))
	}

	// Soft delete payment
	if err := tx.Model(&models.Payment{}).
		Where("uuid = ?", paymentId).
		Update("deleted", true).Error; err != nil {
		return apperror.NewNotFound(fmt.Sprintf("failed to delete payment: %v", err))
	}

	// Update related purchase if exists
	if payment.PurchaseId != "" {
		var purchase models.Purchase
		if err := tx.Model(&models.Purchase{}).
			Where("uuid = ? AND deleted = ?", payment.PurchaseId, false).
			First(&purchase).Error; err != nil {
			return apperror.NewNotFound(fmt.Sprintf("purchase not found: %v", err))
		}

		updates := map[string]interface{}{
			"remaining_amount": purchase.RemainingAmount + payment.Total,
			"paid_amount":      purchase.PaidAmount - payment.Total,
			"updated_at":       time.Now(),
		}

		if err := tx.Model(&models.Purchase{}).
			Where("uuid = ?", purchase.Uuid).
			Updates(updates).Error; err != nil {
			return apperror.NewNotFound(fmt.Sprintf("failed to update purchase: %v", err))
		}
	}

	if err := tx.Commit().Error; err != nil {
		return apperror.NewInternal("failed to commit transaction: ", err)
	}

	return nil
}

func (p *PaymentService) GetAllPaymentByFieldId(id string, field string) (*models.CashFlowResponse, error) {
	query := p.basePaymentQuery()

	switch field {
	case "purchase":
		query = query.Where("purchase_id = ?", id)
	case "sale":
		query = query.Where("sales_id = ?", id)
	default:
		return nil, apperror.NewBadRequest(fmt.Sprintf("invalid field: %s (allowed: purchase, sale)", field))
	}

	var payments []models.Payment
	if err := query.Find(&payments).Error; err != nil {
		return nil, apperror.NewNotFound("Payment is not found")
	}

	totalIncome, totalOutcome := calculateBalance(payments)

	results := models.CashFlowResponse{
		Balance: totalIncome - totalOutcome,
		Payment: make([]models.PaymentResponse, 0, len(payments)),
	}

	for _, payment := range payments {
		results.Payment = append(results.Payment, models.PaymentResponse{
			Uuid:        payment.Uuid,
			UserId:      payment.UserId,
			Total:       payment.Total,
			Type:        payment.Type,
			Description: payment.Description,
			SalesId:     payment.SalesId,
			PurchaseId:  payment.PurchaseId,
			CreatedAt:   payment.CreatedAt,
			UpdatedAt:   payment.UpdatedAt,
		})
	}

	return &results, nil
}

func (p *PaymentService) CreatePaymentByPurchaseId(request models.CreatePaymentPurchaseRequest) error {
	db := config.GetDBConn()

	tx := db.Begin()
	if tx.Error != nil {
		return apperror.NewInternal("failed to begin transaction: ", tx.Error)
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	var purchase models.Purchase
	if err := tx.Model(&models.Purchase{}).
		Where("uuid = ? AND deleted = ?", request.PurchaseId, false).
		First(&purchase).Error; err != nil {
		return apperror.NewNotFound(fmt.Sprintf("purchase not found: %v", err))
	}

	paidAmount := purchase.PaidAmount + request.Total
	remainingAmount := purchase.TotalAmount - paidAmount

	paymentStatus := constants.PartialPayment
	if paidAmount >= purchase.TotalAmount {
		paymentStatus = constants.PaymentInFull
	}

	updates := map[string]interface{}{
		"purchase_date":    request.PurchaseDate,
		"remaining_amount": remainingAmount,
		"payment_status":   paymentStatus,
		"paid_amount":      paidAmount,
		"updated_at":       time.Now(),
	}

	if err := tx.Model(&models.Purchase{}).
		Where("uuid = ?", purchase.Uuid).
		Updates(updates).Error; err != nil {
		return apperror.NewUnprocessableEntity("failed to update purchase: ", err)
	}

	payment := models.Payment{
		Uuid:        uuid.New().String(),
		PurchaseId:  purchase.Uuid,
		UserId:      purchase.SupplierID,
		Description: fmt.Sprintf("Pembayaran Buying %s", request.StockCode),
		Total:       request.Total,
		Type:        constants.Expense,
		Deleted:     false,
		CreatedAt:   request.PurchaseDate,
	}

	if err := tx.Create(&payment).Error; err != nil {
		return apperror.NewUnprocessableEntity("failed to create payment: ", err)
	}

	if err := tx.Commit().Error; err != nil {
		return apperror.NewInternal("failed to commit transaction: ", err)
	}

	return nil
}

func (p *PaymentService) CreatePaymentBySalesId(request models.CreatePaymentSaleRequest) error {
	db := config.GetDBConn()

	tx := db.Begin()
	if tx.Error != nil {
		return apperror.NewInternal("failed to begin transaction: ", tx.Error)
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	var sale models.Sale
	if err := tx.Model(&models.Sale{}).
		Where("uuid = ? AND deleted = ?", request.SalesId, false).
		First(&sale).Error; err != nil {
		return apperror.NewNotFound(fmt.Sprintf("sale not found: %v", err))
	}

	paidAmount := sale.PaidAmount + request.Total
	remainingAmount := sale.TotalAmount - paidAmount

	paymentStatus := constants.PartialPayment
	if paidAmount >= sale.TotalAmount {
		paymentStatus = constants.PaymentInFull
	}

	updates := map[string]interface{}{
		"purchase_date":    request.SalesDate,
		"remaining_amount": remainingAmount,
		"payment_status":   paymentStatus,
		"paid_amount":      paidAmount,
		"updated_at":       time.Now(),
	}

	if err := tx.Model(&models.Sale{}).
		Where("uuid = ?", sale.Uuid).
		Updates(updates).Error; err != nil {
		return apperror.NewUnprocessableEntity("failed to update sale: ", err)
	}

	payment := models.Payment{
		Uuid:        uuid.New().String(),
		SalesId:     sale.Uuid,
		UserId:      sale.CustomerId,
		Description: fmt.Sprintf("Pembayaran Buying %s", request.SalesCode),
		Total:       request.Total,
		Type:        constants.Expense,
		Deleted:     false,
		CreatedAt:   request.SalesDate,
	}

	if err := tx.Create(&payment).Error; err != nil {
		return apperror.NewUnprocessableEntity("failed to create payment: ", err)
	}

	if err := tx.Commit().Error; err != nil {
		return apperror.NewInternal("failed to commit transaction: ", err)
	}

	return nil
}
