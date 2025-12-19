package service

import (
	"dashboard-app/pkg/apperror"
	"fmt"
	"gorm.io/gorm"
	"time"

	"github.com/google/uuid"

	"dashboard-app/internal/config"
	"dashboard-app/internal/constants"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
)

type PurchaseService struct {
	userRepo repository.UserRepository
}

func NewPurchaseService(userRepo repository.UserRepository) repository.PurchaseRepository {
	return &PurchaseService{userRepo: userRepo}
}

// CreatePurchase - Optimized with Better Transaction Handling
// =====================================================
func (p *PurchaseService) CreatePurchase(request models.CreatePurchaseRequest) (*models.PurchaseDataResponse, error) {
	db := config.GetDBConn()

	// Validate request
	if err := p.validatePurchaseRequest(request); err != nil {
		return nil, apperror.NewBadRequest(fmt.Sprintf("validation error: %v", err))
	}

	// Verify supplier exists before starting transaction
	user, err := p.userRepo.GetUserById(request.SupplierID)
	if err != nil {
		return nil, apperror.NewNotFound(fmt.Sprintf("supplier not found: %v", err))
	}

	tx := db.Begin()
	if tx.Error != nil {
		return nil, apperror.NewInternal("failed to begin transaction: ", tx.Error)
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	now := time.Now()

	// Create stock entry
	stockEntry := models.StockEntry{
		Uuid:      uuid.New().String(),
		Deleted:   false,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err = tx.Create(&stockEntry).Error; err != nil {
		tx.Rollback()
		return nil, apperror.NewUnprocessableEntity("failed to create stock entry: ", err)
	}

	// Prepare stock items
	stockItems := make([]models.StockItem, 0, len(request.StockItems))
	var totalAmount int

	for _, v := range request.StockItems {
		totalPayment := v.Weight * v.PricePerKilogram
		stockItems = append(stockItems, models.StockItem{
			Uuid:             uuid.New().String(),
			StockEntryID:     stockEntry.Uuid,
			ItemName:         v.ItemName,
			Weight:           v.Weight,
			PricePerKilogram: v.PricePerKilogram,
			TotalPayment:     totalPayment,
			IsSorted:         false,
			Deleted:          false,
			CreatedAt:        now,
			UpdatedAt:        now,
		})
		totalAmount += totalPayment
	}

	// Batch insert stock items
	if len(stockItems) > 0 {
		if err = tx.Create(&stockItems).Error; err != nil {
			tx.Rollback()
			return nil, apperror.NewUnprocessableEntity("failed to create stock items: ", err)
		}
	}

	// Create purchase
	purchase := models.Purchase{
		Uuid:          uuid.New().String(),
		SupplierID:    request.SupplierID,
		PurchaseDate:  request.PurchaseDate,
		PaymentStatus: constants.PaymentNotMadeYet,
		TotalAmount:   totalAmount,
		PaidAmount:    0,
		StockId:       stockEntry.Uuid,
		Deleted:       false,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err = tx.Create(&purchase).Error; err != nil {
		tx.Rollback()
		return nil, apperror.NewUnprocessableEntity("failed to create purchase: ", err)
	}

	// Create payment record
	payment := models.Payment{
		Uuid:        uuid.New().String(),
		UserId:      request.SupplierID,
		Total:       totalAmount,
		Type:        constants.Income,
		Description: fmt.Sprintf("Hutang Buying STOCK%d", stockEntry.ID),
		PurchaseId:  purchase.Uuid,
		Deleted:     false,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err = tx.Create(&payment).Error; err != nil {
		tx.Rollback()
		return nil, apperror.NewUnprocessableEntity("failed to create payment: ", err)
	}

	// Commit transaction
	if err = tx.Commit().Error; err != nil {
		return nil, apperror.NewInternal("failed to commit transaction: ", err)
	}

	// Build response
	userDetail := models.GetUserDetail{
		Uuid:  user.Uuid,
		Name:  user.Name,
		Phone: user.Phone,
	}

	response := &models.PurchaseDataResponse{
		PurchaseId:      purchase.Uuid,
		PurchaseDate:    purchase.PurchaseDate.Format(time.RFC3339),
		Supplier:        userDetail,
		StockId:         stockEntry.Uuid,
		StockCode:       fmt.Sprintf("STOCK%d", stockEntry.ID),
		TotalAmount:     totalAmount,
		PaidAmount:      0,
		RemainingAmount: totalAmount,
		PaymentStatus:   purchase.PaymentStatus,
		LastPayment:     "",
	}

	// Build stock entry response
	stockItemResponses := make([]models.StockItemResponse, 0, len(stockItems))
	for _, item := range stockItems {
		stockItemResponses = append(stockItemResponses, models.StockItemResponse{
			Uuid:               item.Uuid,
			StockEntryID:       stockEntry.Uuid,
			ItemName:           item.ItemName,
			Weight:             item.Weight,
			PricePerKilogram:   item.PricePerKilogram,
			TotalPayment:       item.TotalPayment,
			IsSorted:           false,
			StockSortResponses: []models.StockSortResponse{},
		})
	}

	response.StockEntry = &models.StockEntriesResponse{
		Uuid:              stockEntry.Uuid,
		StockCode:         fmt.Sprintf("STOCK-%d", stockEntry.ID),
		AgeInDay:          0,
		PurchaseId:        purchase.Uuid,
		Supplier:          userDetail,
		StockItemResponse: stockItemResponses,
	}

	return response, nil
}

// GetAllPurchases - Optimized with Single Query
// =====================================================
func (p *PurchaseService) GetAllPurchases(filter models.PurchaseFilter) (*models.PurchaseResponse, error) {
	db := config.GetDBConn()

	// Normalize pagination
	if filter.PageNo < 1 {
		filter.PageNo = 1
	}
	if filter.Size < 1 {
		filter.Size = 10
	}
	if filter.Size > 100 {
		filter.Size = 100
	}

	offset := (filter.PageNo - 1) * filter.Size

	// Build optimized query with JOINs
	query := db.Table("purchase AS pur").
		Select(`
			pur.uuid,
			pur.supplier_id,
			pur.purchase_date,
			pur.payment_status,
			pur.total_amount,
			pur.paid_amount,
			pur.stock_id,
			pur.created_at,
			u.uuid AS supplier_uuid,
			u.name AS supplier_name,
			u.phone AS supplier_phone,
			se.id AS stock_entry_id,
			p.created_at AS last_payment_date
		`).
		Joins("INNER JOIN \"user\" u ON u.uuid = pur.supplier_id AND u.status = true").
		Joins("LEFT JOIN stock_entries se ON se.uuid = pur.stock_id AND se.deleted = false").
		Joins(`LEFT JOIN LATERAL (
			SELECT created_at
			FROM payment
			WHERE purchase_id = pur.uuid AND deleted = false
			ORDER BY created_at DESC
			LIMIT 1
		) p ON true`).
		Where("pur.deleted = false")

	// Apply filters
	query = p.applyPurchaseFilters(query, filter)

	// Get total count
	var total int64
	countQuery := *query
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to count purchases: ", err)
	}

	// Early return if no results
	if total == 0 {
		return &models.PurchaseResponse{
			Size:   filter.Size,
			PageNo: filter.PageNo,
			Total:  0,
			Data:   []models.PurchaseDataResponse{},
		}, nil
	}

	// Fetch purchases with related data

	var purchasesData []models.PurchaseData
	if err := query.
		Order("pur.created_at DESC").
		Limit(filter.Size).
		Offset(offset).
		Scan(&purchasesData).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch purchases: ", err)
	}

	// Extract stock IDs for batch fetching stock items
	stockIDs := make([]string, 0, len(purchasesData))
	for _, pur := range purchasesData {
		stockIDs = append(stockIDs, pur.StockId)
	}

	// Batch fetch stock items totals
	stockItemTotals, err := p.getBatchStockItemTotals(db, stockIDs)
	if err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch stock item totals: ", err)
	}

	// Build response
	responses := make([]models.PurchaseDataResponse, 0, len(purchasesData))
	for _, pur := range purchasesData {
		userDetail := models.GetUserDetail{
			Uuid:  pur.SupplierUuid,
			Name:  pur.SupplierName,
			Phone: pur.SupplierPhone,
		}

		lastPayment := ""
		if pur.LastPaymentDate != nil {
			lastPayment = pur.LastPaymentDate.Format(time.RFC3339)
		}

		// Get total from batch results
		totalAmount := stockItemTotals[pur.StockId]

		responses = append(responses, models.PurchaseDataResponse{
			PurchaseId:      pur.Uuid,
			Supplier:        userDetail,
			PurchaseDate:    pur.PurchaseDate.Format(time.RFC3339),
			StockId:         pur.StockId,
			StockCode:       fmt.Sprintf("STOCK%d", pur.StockEntryID),
			TotalAmount:     totalAmount,
			PaidAmount:      pur.PaidAmount,
			RemainingAmount: totalAmount - pur.PaidAmount,
			PaymentStatus:   pur.PaymentStatus,
			LastPayment:     lastPayment,
			StockEntry:      nil,
		})
	}

	return &models.PurchaseResponse{
		Size:   filter.Size,
		PageNo: filter.PageNo,
		Total:  int(total),
		Data:   responses,
	}, nil
}

// Apply filters to purchase query
func (p *PurchaseService) applyPurchaseFilters(query *gorm.DB, filter models.PurchaseFilter) *gorm.DB {
	if filter.PurchaseId != "" {
		query = query.Where("pur.id = ?", filter.PurchaseId)
	}

	if filter.PaymentStatus != "ALL" && filter.PaymentStatus != "" {
		query = query.Where("pur.payment_status = ?", filter.PaymentStatus)
	}

	if filter.PurchaseDate != "" {
		if parsedDate, err := time.Parse("2006-01-02", filter.PurchaseDate); err == nil {
			query = query.Where("DATE(pur.purchase_date) = ?", parsedDate.Format("2006-01-02"))
		}
	}

	if filter.AgeInDay != "" {
		now := time.Now()
		switch filter.AgeInDay {
		case "LT_1":
			query = query.Where("pur.purchase_date >= ?", now.Add(-24*time.Hour))
		case "GT_1":
			query = query.Where("pur.purchase_date <= ?", now.Add(-24*time.Hour))
		case "GT_10":
			query = query.Where("pur.purchase_date <= ?", now.Add(-240*time.Hour))
		case "GT_30":
			query = query.Where("pur.purchase_date <= ?", now.Add(-720*time.Hour))
		}
	}

	if filter.SupplierId != "" {
		query = query.Where("pur.supplier_id = ?", filter.SupplierId)
	}

	return query
}

// Batch fetch stock item totals
func (p *PurchaseService) getBatchStockItemTotals(db *gorm.DB, stockIDs []string) (map[string]int, error) {
	if len(stockIDs) == 0 {
		return make(map[string]int), nil
	}

	type StockTotal struct {
		StockEntryID string `gorm:"column:stock_entry_id"`
		Total        int    `gorm:"column:total"`
	}

	var totals []StockTotal
	if err := db.Table("stock_items").
		Select("stock_entry_id, COALESCE(SUM(total_payment), 0) AS total").
		Where("stock_entry_id IN ? AND deleted = false", stockIDs).
		Group("stock_entry_id").
		Scan(&totals).Error; err != nil {
		return nil, err
	}

	totalMap := make(map[string]int, len(stockIDs))
	for _, t := range totals {
		totalMap[t.StockEntryID] = t.Total
	}

	// Ensure all stock IDs have a value
	for _, stockID := range stockIDs {
		if _, exists := totalMap[stockID]; !exists {
			totalMap[stockID] = 0
		}
	}

	return totalMap, nil
}

// Validate purchase request
func (p *PurchaseService) validatePurchaseRequest(request models.CreatePurchaseRequest) error {
	if request.SupplierID == "" {
		return apperror.NewBadRequest("supplier ID is required")
	}

	if len(request.StockItems) == 0 {
		return apperror.NewBadRequest("at least one stock item is required")
	}

	for i, item := range request.StockItems {
		if item.ItemName == "" {
			return apperror.NewBadRequest(fmt.Sprintf("item name is required for item %d", i+1))
		}
		if item.Weight <= 0 {
			return apperror.NewBadRequest(fmt.Sprintf("weight must be positive for item %d", i+1))
		}
		if item.PricePerKilogram <= 0 {
			return apperror.NewBadRequest(fmt.Sprintf("price per kilogram must be positive for item %d", i+1))
		}
	}

	return nil
}

// UpdatePurchase - Optimized with Validation
// =====================================================
func (p *PurchaseService) UpdatePurchase(purchaseId string, request models.UpdatePurchaseRequest) error {
	db := config.GetDBConn()

	// Validate purchase exists
	var exists bool
	if err := db.Model(&models.Purchase{}).
		Select("1").
		Where("uuid = ? AND deleted = false", purchaseId).
		Limit(1).
		Find(&exists).Error; err != nil {
		return apperror.NewUnprocessableEntity("failed to check purchase: ", err)
	}

	if !exists {
		return apperror.NewNotFound("purchase not found")
	}

	updates := map[string]interface{}{
		"purchase_date": request.PurchaseDate,
		"updated_at":    time.Now(),
	}

	result := db.Model(&models.Purchase{}).
		Where("uuid = ? AND deleted = false", purchaseId).
		Updates(updates)

	if result.Error != nil {
		return apperror.NewUnprocessableEntity("failed to update purchase: ", result.Error)
	}

	if result.RowsAffected == 0 {
		return apperror.NewNotFound("purchase not found or already deleted")
	}

	return nil
}

// GetPurchaseById - New Method
// =====================================================
func (p *PurchaseService) GetPurchaseById(purchaseId string) (*models.PurchaseDataResponse, error) {
	db := config.GetDBConn()

	// Single optimized query with JOINs
	var detail models.PurchaseData
	if err := db.Table("purchase AS pur").
		Select(`
			pur.uuid,
			pur.supplier_id,
			pur.purchase_date,
			pur.payment_status,
			pur.total_amount,
			pur.paid_amount,
			pur.stock_id,
			u.uuid AS supplier_uuid,
			u.name AS supplier_name,
			u.phone AS supplier_phone,
			se.id AS stock_entry_id,
			p.created_at AS last_payment_date
		`).
		Joins("INNER JOIN \"user\" u ON u.uuid = pur.supplier_id AND u.status = true").
		Joins("LEFT JOIN stock_entries se ON se.uuid = pur.stock_id AND se.deleted = false").
		Joins(`LEFT JOIN LATERAL (
			SELECT created_at
			FROM payment
			WHERE purchase_id = pur.uuid AND deleted = false
			ORDER BY created_at DESC
			LIMIT 1
		) p ON true`).
		Where("pur.uuid = ? AND pur.deleted = false", purchaseId).
		Scan(&detail).Error; err != nil {
		return nil, apperror.NewNotFound(fmt.Sprintf("purchase not found: %v", err))
	}

	// Fetch stock items
	var stockItems []models.StockItem
	if err := db.Where("stock_entry_id = ? AND deleted = false", detail.StockId).
		Find(&stockItems).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch stock items: %w", err)
	}

	var totalAmount int
	stockItemResponses := make([]models.StockItemResponse, 0, len(stockItems))
	for _, item := range stockItems {
		totalAmount += item.TotalPayment
		stockItemResponses = append(stockItemResponses, models.StockItemResponse{
			Uuid:               item.Uuid,
			StockEntryID:       detail.StockId,
			ItemName:           item.ItemName,
			Weight:             item.Weight,
			PricePerKilogram:   item.PricePerKilogram,
			TotalPayment:       item.TotalPayment,
			IsSorted:           item.IsSorted,
			StockSortResponses: []models.StockSortResponse{},
		})
	}

	userDetail := models.GetUserDetail{
		Uuid:  detail.SupplierUuid,
		Name:  detail.SupplierName,
		Phone: detail.SupplierPhone,
	}

	lastPayment := ""
	if detail.LastPaymentDate != nil {
		lastPayment = detail.LastPaymentDate.Format(time.RFC3339)
	}

	response := &models.PurchaseDataResponse{
		PurchaseId:      detail.Uuid,
		Supplier:        userDetail,
		PurchaseDate:    detail.PurchaseDate.Format(time.RFC3339),
		StockId:         detail.StockId,
		StockCode:       fmt.Sprintf("STOCK%d", detail.StockEntryID),
		TotalAmount:     totalAmount,
		PaidAmount:      detail.PaidAmount,
		RemainingAmount: totalAmount - detail.PaidAmount,
		PaymentStatus:   detail.PaymentStatus,
		LastPayment:     lastPayment,
		StockEntry: &models.StockEntriesResponse{
			Uuid:              detail.StockId,
			StockCode:         fmt.Sprintf("STOCK-%d", detail.StockEntryID),
			PurchaseId:        detail.Uuid,
			Supplier:          userDetail,
			StockItemResponse: stockItemResponses,
		},
	}

	return response, nil
}

// DeletePurchase - New Method
// =====================================================
func (p *PurchaseService) DeletePurchase(purchaseId string) error {
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

	// Fetch purchase
	var purchase models.Purchase
	if err := tx.Where("uuid = ? AND deleted = false", purchaseId).
		First(&purchase).Error; err != nil {
		tx.Rollback()
		return apperror.NewNotFound(fmt.Sprintf("purchase not found: %v", err))
	}

	now := time.Now()

	// Soft delete all related records
	updates := []struct {
		model interface{}
		where string
		param interface{}
	}{
		{&models.Purchase{}, "uuid = ?", purchaseId},
		{&models.Payment{}, "purchase_id = ?", purchaseId},
		{&models.StockEntry{}, "uuid = ?", purchase.StockId},
		{&models.StockItem{}, "stock_entry_id = ?", purchase.StockId},
	}

	for _, update := range updates {
		if err := tx.Model(update.model).
			Where(update.where, update.param).
			Updates(map[string]interface{}{
				"deleted":    true,
				"updated_at": now,
			}).Error; err != nil {
			tx.Rollback()
			return apperror.NewUnprocessableEntity("failed to delete records: ", err)
		}
	}

	// Delete stock sorts
	if err := tx.Exec(`
		UPDATE stock_sorts
		SET deleted = true, updated_at = ?
		WHERE stock_item_id IN (
			SELECT uuid FROM stock_items
			WHERE stock_entry_id = ?
		) AND deleted = false
	`, now, purchase.StockId).Error; err != nil {
		tx.Rollback()
		return apperror.NewUnprocessableEntity("failed to delete stock sorts: ", err)
	}

	if err := tx.Commit().Error; err != nil {
		return apperror.NewInternal("failed to commit transaction: ", err)
	}

	return nil
}
