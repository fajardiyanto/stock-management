package service

import (
	"dashboard-app/pkg/apperror"
	"fmt"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/pkg/errors"
	"gorm.io/gorm"

	"dashboard-app/internal/config"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
)

type StockService struct{}

func NewStockService() repository.StockRepository {
	return &StockService{}
}

// GetAllStockEntries - Optimized
// =====================================================
func (s *StockService) GetAllStockEntries(filter models.StockEntryFilter) (*models.StockResponse, error) {
	db := config.GetDBConn()

	// Normalize pagination
	if filter.PageNo < 1 {
		filter.PageNo = 1
	}
	if filter.Size < 1 {
		filter.Size = 10
	}
	offset := (filter.PageNo - 1) * filter.Size

	// Build optimized query with single JOIN
	query := db.Table("stock_entries AS se").
		Select(`
			se.uuid,
			se.id,
			se.created_at,
			p.uuid AS purchase_uuid,
			p.supplier_id,
			p.purchase_date,
			u.uuid AS supplier_uuid,
			u.name AS supplier_name,
			u.phone AS supplier_phone
		`).
		Joins("INNER JOIN purchase p ON p.stock_id = se.uuid AND p.deleted = false").
		Joins("INNER JOIN \"user\" u ON u.uuid = p.supplier_id AND u.status = true").
		Where("se.deleted = false")

	// Apply filters efficiently
	query = s.applyStockFilters(query, filter, db)

	// Get total count
	var total int64
	countQuery := *query
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to count stock entries: ", err)
	}

	// Fetch stock entries with related data
	var stockData []models.StockData
	if err := query.
		Order("se.created_at DESC").
		Limit(filter.Size).
		Offset(offset).
		Scan(&stockData).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NewNotFound("stock entries not found")
		}
		return nil, apperror.NewUnprocessableEntity("failed to fetch stock entries: ", err)
	}

	if len(stockData) == 0 {
		return &models.StockResponse{
			Size:   filter.Size,
			PageNo: filter.PageNo,
			Total:  int(total),
			Data:   []models.StockEntriesResponse{},
		}, nil
	}

	// Extract stock entry IDs
	stockEntryIDs := make([]string, len(stockData))
	for i, data := range stockData {
		stockEntryIDs[i] = data.Uuid
	}

	// Fetch all related data in batch
	stockItemsMap, stockSortsMap, err := s.fetchStockItemsAndSorts(db, stockEntryIDs)
	if err != nil {
		return nil, err
	}

	// Build response
	responses := s.buildStockEntriesResponse(stockData, stockItemsMap, stockSortsMap)

	return &models.StockResponse{
		Size:   filter.Size,
		PageNo: filter.PageNo,
		Total:  int(total),
		Data:   responses,
	}, nil
}

// Apply filters efficiently
func (s *StockService) applyStockFilters(query *gorm.DB, filter models.StockEntryFilter, db *gorm.DB) *gorm.DB {
	if filter.SupplierId != "" {
		query = query.Where("p.supplier_id = ?", filter.SupplierId)
	}

	if filter.PurchaseDate != "" {
		if parsed, err := time.Parse("2006-01-02", filter.PurchaseDate); err == nil {
			query = query.Where("DATE(p.purchase_date) = ?", parsed.Format("2006-01-02"))
		}
	}

	if filter.AgeInDay != "" {
		now := time.Now()
		switch filter.AgeInDay {
		case "LT_1":
			query = query.Where("se.created_at >= ?", now.Add(-24*time.Hour))
		case "GT_1":
			query = query.Where("se.created_at < ?", now.Add(-24*time.Hour))
		case "GT_10":
			query = query.Where("se.created_at < ?", now.Add(-240*time.Hour))
		case "GT_30":
			query = query.Where("se.created_at < ?", now.Add(-720*time.Hour))
		}
	}

	if filter.Keyword != "" {
		query = s.applyKeywordFilter(query, filter.Keyword, db)
	}

	return query
}

// Apply keyword filter with optimized query
func (s *StockService) applyKeywordFilter(query *gorm.DB, keyword string, db *gorm.DB) *gorm.DB {
	if _, err := strconv.Atoi(keyword); err == nil {
		// Numeric keyword - search by ID
		return query.Where("se.id = ?", keyword)
	}

	// Text keyword - search by item name using optimized CTE
	var stockIDs []string
	db.Raw(`
		SELECT DISTINCT si.stock_entry_id
		FROM stock_items si
		WHERE si.deleted = false
		AND si.item_name ILIKE ?
		UNION
		SELECT DISTINCT si.stock_entry_id
		FROM stock_sorts ss
		INNER JOIN stock_items si ON si.uuid = ss.stock_item_id
		WHERE ss.deleted = false
		AND si.deleted = false
		AND ss.sorted_item_name ILIKE ?
	`, "%"+keyword+"%", "%"+keyword+"%").Pluck("stock_entry_id", &stockIDs)

	if len(stockIDs) == 0 {
		return query.Where("1 = 0") // Return empty result
	}

	return query.Where("se.uuid IN ?", stockIDs)
}

// Fetch stock items and sorts in batch
func (s *StockService) fetchStockItemsAndSorts(db *gorm.DB, stockEntryIDs []string) (
	map[string][]models.StockItem,
	map[string][]models.StockSort,
	error,
) {
	// Fetch all stock items
	var stockItems []models.StockItem
	if err := db.Where("stock_entry_id IN ? AND deleted = false", stockEntryIDs).
		Find(&stockItems).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, apperror.NewNotFound("stock items not found")
		}
		return nil, nil, apperror.NewUnprocessableEntity("failed to fetch stock items: %w", err)
	}

	// Build stock items map
	stockItemsMap := make(map[string][]models.StockItem)
	stockItemIDs := make([]string, 0, len(stockItems))
	for _, item := range stockItems {
		stockItemsMap[item.StockEntryID] = append(stockItemsMap[item.StockEntryID], item)
		stockItemIDs = append(stockItemIDs, item.Uuid)
	}

	// Fetch all stock sorts
	var stockSorts []models.StockSort
	stockSortsMap := make(map[string][]models.StockSort)

	if len(stockItemIDs) > 0 {
		if err := db.Where("stock_item_id IN ? AND deleted = false", stockItemIDs).
			Find(&stockSorts).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, nil, apperror.NewNotFound("stock sorts not found")
			}
			return nil, nil, apperror.NewUnprocessableEntity("failed to fetch stock sorts: ", err)
		}

		for _, sort := range stockSorts {
			stockSortsMap[sort.StockItemID] = append(stockSortsMap[sort.StockItemID], sort)
		}
	}

	return stockItemsMap, stockSortsMap, nil
}

// Build stock entries response
func (s *StockService) buildStockEntriesResponse(
	stockData []models.StockData,
	stockItemsMap map[string][]models.StockItem,
	stockSortsMap map[string][]models.StockSort,
) []models.StockEntriesResponse {
	responses := make([]models.StockEntriesResponse, 0, len(stockData))
	for _, data := range stockData {
		supplierDetail := models.GetUserDetail{
			Uuid:  data.SupplierUuid,
			Name:  data.SupplierName,
			Phone: data.SupplierPhone,
		}

		resp := models.StockEntriesResponse{
			Uuid:              data.Uuid,
			StockCode:         fmt.Sprintf("STOCK%d", data.ID),
			AgeInDay:          int(time.Now().Sub(data.PurchaseDate).Hours() / 24),
			PurchaseId:        data.PurchaseUuid,
			Supplier:          supplierDetail,
			PurchaseDate:      data.PurchaseDate.UTC().Format(time.RFC3339),
			StockItemResponse: make([]models.StockItemResponse, 0),
		}

		// Add stock items
		items := stockItemsMap[data.Uuid]
		for _, item := range items {
			itemResp := models.StockItemResponse{
				Uuid:               item.Uuid,
				StockEntryID:       item.StockEntryID,
				ItemName:           item.ItemName,
				Weight:             item.Weight,
				PricePerKilogram:   item.PricePerKilogram,
				TotalPayment:       item.TotalPayment,
				IsSorted:           item.IsSorted,
				StockSortResponses: make([]models.StockSortResponse, 0),
			}

			// Add stock sorts
			sorts := stockSortsMap[item.Uuid]
			for _, srt := range sorts {
				itemResp.StockSortResponses = append(itemResp.StockSortResponses,
					models.StockSortResponse{
						Uuid:             srt.Uuid,
						StockItemID:      srt.StockItemID,
						ItemName:         srt.ItemName,
						Weight:           srt.Weight,
						PricePerKilogram: srt.PricePerKilogram,
						CurrentWeight:    srt.CurrentWeight,
						TotalCost:        srt.TotalCost,
						IsShrinkage:      srt.IsShrinkage,
					})
			}

			resp.StockItemResponse = append(resp.StockItemResponse, itemResp)
		}

		responses = append(responses, resp)
	}

	return responses
}

// GetStockEntryById - Optimized
// =====================================================
func (s *StockService) GetStockEntryById(stockId string) (*models.StockEntriesResponse, error) {
	db := config.GetDBConn()

	// Single optimized query with JOINs
	var result struct {
		Uuid          string    `gorm:"column:uuid"`
		ID            int       `gorm:"column:id"`
		CreatedAt     time.Time `gorm:"column:created_at"`
		PurchaseUuid  string    `gorm:"column:purchase_uuid"`
		PurchaseDate  time.Time `gorm:"column:purchase_date"`
		SupplierUuid  string    `gorm:"column:supplier_uuid"`
		SupplierName  string    `gorm:"column:supplier_name"`
		SupplierPhone string    `gorm:"column:supplier_phone"`
	}

	if err := db.Table("stock_entries AS se").
		Select(`
			se.uuid,
			se.id,
			se.created_at,
			p.uuid AS purchase_uuid,
			p.purchase_date,
			u.uuid AS supplier_uuid,
			u.name AS supplier_name,
			u.phone AS supplier_phone
		`).
		Joins("INNER JOIN purchase p ON p.stock_id = se.uuid AND p.deleted = false").
		Joins("INNER JOIN \"user\" u ON u.uuid = p.supplier_id AND u.status = true").
		Where("se.uuid = ? AND se.deleted = false", stockId).
		Scan(&result).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NewNotFound("stock entries not found")
		}
		return nil, apperror.NewUnprocessableEntity("failed to fetch stock entries: ", err)
	}

	supplierDetail := models.GetUserDetail{
		Uuid:  result.SupplierUuid,
		Name:  result.SupplierName,
		Phone: result.SupplierPhone,
	}

	resp := models.StockEntriesResponse{
		Uuid:              result.Uuid,
		StockCode:         fmt.Sprintf("STOCK-%d", result.ID),
		AgeInDay:          int(time.Now().Sub(result.PurchaseDate).Hours() / 24),
		PurchaseId:        result.PurchaseUuid,
		Supplier:          supplierDetail,
		PurchaseDate:      result.PurchaseDate.Format(time.RFC3339),
		StockItemResponse: make([]models.StockItemResponse, 0),
	}

	// Fetch stock items with sorts in batch
	stockItemsMap, stockSortsMap, err := s.fetchStockItemsAndSorts(db, []string{stockId})
	if err != nil {
		return nil, err
	}

	items := stockItemsMap[stockId]
	for _, item := range items {
		itemResp := models.StockItemResponse{
			Uuid:               item.Uuid,
			StockEntryID:       item.StockEntryID,
			ItemName:           item.ItemName,
			Weight:             item.Weight,
			PricePerKilogram:   item.PricePerKilogram,
			TotalPayment:       item.TotalPayment,
			IsSorted:           len(stockSortsMap[item.Uuid]) > 0,
			StockSortResponses: make([]models.StockSortResponse, 0),
		}

		sorts := stockSortsMap[item.Uuid]
		for _, srt := range sorts {
			itemResp.StockSortResponses = append(itemResp.StockSortResponses,
				models.StockSortResponse{
					Uuid:             srt.Uuid,
					StockItemID:      srt.StockItemID,
					ItemName:         srt.ItemName,
					Weight:           srt.Weight,
					PricePerKilogram: srt.PricePerKilogram,
					CurrentWeight:    srt.CurrentWeight,
					TotalCost:        srt.TotalCost,
					IsShrinkage:      srt.IsShrinkage,
				})
		}

		resp.StockItemResponse = append(resp.StockItemResponse, itemResp)
	}

	return &resp, nil
}

// UpdateStockById - Optimized
// =====================================================
func (s *StockService) UpdateStockById(stockId string, request models.CreatePurchaseRequest) (*models.PurchaseDataResponse, error) {
	db := config.GetDBConn()

	tx := db.Begin()
	if tx.Error != nil {
		return nil, apperror.NewInternal("failed to begin transaction: %w", tx.Error)
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	// Fetch existing records in single query
	var stockEntry models.StockEntry
	if err := tx.Where("uuid = ? AND deleted = false", stockId).
		First(&stockEntry).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NewNotFound("stock entries not found")
		}
		return nil, apperror.NewUnprocessableEntity("failed to fetch stock entry: ", err)
	}

	var purchase models.Purchase
	if err := tx.Where("stock_id = ? AND deleted = false", stockEntry.Uuid).
		First(&purchase).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NewNotFound(fmt.Sprintf("purchase not found for stock: %s", stockId))
		}
		return nil, apperror.NewUnprocessableEntity("failed to fetch purchase entry: ", err)
	}

	// Delete old stock items (soft delete)
	if err := tx.Model(&models.StockItem{}).
		Where("stock_entry_id = ? AND deleted = false", stockEntry.Uuid).
		Update("deleted", true).Error; err != nil {
		tx.Rollback()
		return nil, apperror.NewUnprocessableEntity("failed to delete old stock items: %w", err)
	}

	// Prepare new stock items
	stockItems := make([]models.StockItem, 0, len(request.StockItems))
	var newTotalAmount int
	now := time.Now()

	for _, v := range request.StockItems {
		totalPayment := v.Weight * v.PricePerKilogram
		stockItems = append(stockItems, models.StockItem{
			Uuid:             uuid.New().String(),
			StockEntryID:     stockEntry.Uuid,
			ItemName:         v.ItemName,
			Weight:           v.Weight,
			PricePerKilogram: v.PricePerKilogram,
			IsSorted:         false,
			TotalPayment:     totalPayment,
			Deleted:          false,
			CreatedAt:        now,
			UpdatedAt:        now,
		})
		newTotalAmount += totalPayment
	}

	// Batch insert new stock items
	if len(stockItems) > 0 {
		if err := tx.Create(&stockItems).Error; err != nil {
			tx.Rollback()
			return nil, apperror.NewUnprocessableEntity("failed to create stock items: %w", err)
		}
	}

	// Update purchase
	if err := tx.Model(&purchase).
		Updates(map[string]interface{}{
			"supplier_id":   request.SupplierID,
			"purchase_date": request.PurchaseDate,
			"total_amount":  newTotalAmount,
			"updated_at":    now,
		}).Error; err != nil {
		tx.Rollback()
		return nil, apperror.NewUnprocessableEntity("failed to update purchase: %w", err)
	}

	// Update payment
	if err := tx.Model(&models.Payment{}).
		Where("purchase_id = ? AND deleted = false", purchase.Uuid).
		Updates(map[string]interface{}{
			"total":      newTotalAmount,
			"updated_at": now,
		}).Error; err != nil {
		tx.Rollback()
		return nil, apperror.NewUnprocessableEntity("failed to update payment: %w", err)
	}

	if err := tx.Commit().Error; err != nil {
		return nil, apperror.NewInternal("failed to commit transaction: ", err)
	}

	// Fetch supplier for response
	var supplier models.User
	if err := db.Where("uuid = ? AND status = true", request.SupplierID).
		First(&supplier).Error; err != nil {
		return nil, fmt.Errorf("supplier not found: %w", err)
	}

	userDetail := models.GetUserDetail{
		Uuid:  supplier.Uuid,
		Name:  supplier.Name,
		Phone: supplier.Phone,
	}

	// Build response
	response := &models.PurchaseDataResponse{
		PurchaseId:      purchase.Uuid,
		PurchaseDate:    request.PurchaseDate.Format(time.RFC3339),
		Supplier:        userDetail,
		StockId:         stockEntry.Uuid,
		StockCode:       fmt.Sprintf("STOCK%d", stockEntry.ID),
		TotalAmount:     newTotalAmount,
		PaidAmount:      0,
		RemainingAmount: newTotalAmount,
		PaymentStatus:   purchase.PaymentStatus,
	}

	response.StockEntry = &models.StockEntriesResponse{
		Uuid:              stockEntry.Uuid,
		StockCode:         fmt.Sprintf("STOCK-%d", stockEntry.ID),
		AgeInDay:          int(time.Now().Sub(stockEntry.CreatedAt).Hours() / 24),
		PurchaseId:        purchase.Uuid,
		Supplier:          userDetail,
		StockItemResponse: make([]models.StockItemResponse, 0, len(stockItems)),
	}

	for _, item := range stockItems {
		response.StockEntry.StockItemResponse = append(response.StockEntry.StockItemResponse,
			models.StockItemResponse{
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

	return response, nil
}

// GetStockItemById - Optimized
// =====================================================
func (s *StockService) GetStockItemById(stockItemId string) (*models.StockEntryResponse, error) {
	db := config.GetDBConn()

	// Single query with JOIN
	var result struct {
		ItemUuid         string `gorm:"column:item_uuid"`
		StockEntryID     string `gorm:"column:stock_entry_id"`
		ItemName         string `gorm:"column:item_name"`
		Weight           int    `gorm:"column:weight"`
		PricePerKilogram int    `gorm:"column:price_per_kilogram"`
		TotalPayment     int    `gorm:"column:total_payment"`
		IsSorted         bool   `gorm:"column:is_sorted"`
		EntryUuid        string `gorm:"column:entry_uuid"`
		EntryID          int    `gorm:"column:entry_id"`
	}

	if err := db.Table("stock_items AS si").
		Select(`
			si.uuid AS item_uuid,
			si.stock_entry_id,
			si.item_name,
			si.weight,
			si.price_per_kilogram,
			si.total_payment,
			si.is_sorted,
			se.uuid AS entry_uuid,
			se.id AS entry_id
		`).
		Joins("INNER JOIN stock_entries se ON se.uuid = si.stock_entry_id AND se.deleted = false").
		Where("si.uuid = ? AND si.deleted = false", stockItemId).
		Scan(&result).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NewNotFound("stock item not found")
		}
		return nil, apperror.NewUnprocessableEntity("failed to get stock item: ", err)
	}

	// Fetch stock sorts
	var stockSorts []models.StockSort
	if err := db.Where("stock_item_id = ? AND deleted = false", stockItemId).
		Find(&stockSorts).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NewNotFound("stock sort not found")
		}
		return nil, apperror.NewUnprocessableEntity("failed to fetch stock sorts: ", err)
	}

	// Calculate remaining weight
	var sortedWeight int
	sortResponses := make([]models.StockSortResponse, 0, len(stockSorts))

	for _, srt := range stockSorts {
		sortedWeight += srt.Weight
		sortResponses = append(sortResponses, models.StockSortResponse{
			Uuid:             srt.Uuid,
			StockItemID:      srt.StockItemID,
			ItemName:         srt.ItemName,
			Weight:           srt.Weight,
			PricePerKilogram: srt.PricePerKilogram,
			CurrentWeight:    srt.CurrentWeight,
			TotalCost:        srt.TotalCost,
			IsShrinkage:      srt.IsShrinkage,
		})
	}

	return &models.StockEntryResponse{
		Uuid:      result.EntryUuid,
		StockCode: fmt.Sprintf("STOCK-%d", result.EntryID),
		StockItemResponse: models.StockItemResponse{
			Uuid:               result.ItemUuid,
			StockEntryID:       result.StockEntryID,
			ItemName:           result.ItemName,
			Weight:             result.Weight,
			PricePerKilogram:   result.PricePerKilogram,
			TotalPayment:       result.TotalPayment,
			IsSorted:           result.IsSorted,
			RemainingWeight:    result.Weight - sortedWeight,
			AlreadySorted:      sortedWeight,
			StockSortResponses: sortResponses,
		},
	}, nil
}

// CreateStockSort - Optimized
// =====================================================
func (s *StockService) CreateStockSort(request models.SubmitSortRequest) error {
	return s.saveStockSort(request, false)
}

func (s *StockService) UpdateStockSort(request models.SubmitSortRequest) error {
	return s.saveStockSort(request, true)
}

func (s *StockService) saveStockSort(request models.SubmitSortRequest, isUpdate bool) error {
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

	// Delete old sorts if updating
	if isUpdate {
		if err := tx.Model(&models.StockSort{}).
			Where("stock_item_id = ? AND deleted = false", request.StockItemId).
			Update("deleted", true).Error; err != nil {
			tx.Rollback()
			return apperror.NewUnprocessableEntity("failed to delete old sorts: ", err)
		}
	}

	// Batch insert new sorts
	if len(request.StockSortRequest) > 0 {
		stockSorts := make([]models.StockSort, 0, len(request.StockSortRequest))
		now := time.Now()

		for _, v := range request.StockSortRequest {
			currentWeight := v.Weight
			if isUpdate {
				currentWeight = v.CurrentWeight
			}

			stockSorts = append(stockSorts, models.StockSort{
				Uuid:             uuid.New().String(),
				StockItemID:      request.StockItemId,
				ItemName:         v.SortedItemName,
				Weight:           v.Weight,
				PricePerKilogram: v.PricePerKilogram,
				CurrentWeight:    currentWeight,
				TotalCost:        v.PricePerKilogram * v.Weight,
				IsShrinkage:      v.IsShrinkage,
				Deleted:          false,
				CreatedAt:        now,
				UpdatedAt:        now,
			})
		}

		if err := tx.Create(&stockSorts).Error; err != nil {
			tx.Rollback()
			return apperror.NewUnprocessableEntity("failed to create stock sorts: ", err)
		}
	}

	// Update stock item is_sorted flag
	if err := tx.Model(&models.StockItem{}).
		Where("uuid = ? AND deleted = false", request.StockItemId).
		Update("is_sorted", true).Error; err != nil {
		tx.Rollback()
		return apperror.NewUnprocessableEntity("failed to update stock item: %w", err)
	}

	if err := tx.Commit().Error; err != nil {
		return apperror.NewInternal("failed to commit transaction: ", err)
	}

	return nil
}

// DeleteStockEntryById - Optimized with Batch Operations
// =====================================================
func (s *StockService) DeleteStockEntryById(stockEntryId string) error {
	db := config.GetDBConn()

	tx := db.Begin()
	if tx.Error != nil {
		return apperror.NewInternal("failed to begin transaction: %w", tx.Error)
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()

	// Fetch purchase
	var purchase models.Purchase
	if err := tx.Where("stock_id = ? AND deleted = false", stockEntryId).
		First(&purchase).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperror.NewNotFound("purchase not found")
		}
		return apperror.NewUnprocessableEntity("failed to fetch old purchases: %w", err)
	}

	// Batch soft delete all related records
	updates := []struct {
		model interface{}
		where string
		param interface{}
	}{
		{&models.Purchase{}, "uuid = ?", purchase.Uuid},
		{&models.Payment{}, "purchase_id = ?", purchase.Uuid},
		{&models.StockEntry{}, "uuid = ?", stockEntryId},
		{&models.StockItem{}, "stock_entry_id = ?", stockEntryId},
	}

	for _, update := range updates {
		if err := tx.Model(update.model).
			Where(update.where, update.param).
			Update("deleted", true).Error; err != nil {
			tx.Rollback()
			return apperror.NewUnprocessableEntity("failed to delete records: %w", err)
		}
	}

	// Delete stock sorts for this entry
	if err := tx.Exec(`
		UPDATE stock_sorts
		SET deleted = true
		WHERE stock_item_id IN (
			SELECT uuid FROM stock_items
			WHERE stock_entry_id = ?
		) AND deleted = false
	`, stockEntryId).Error; err != nil {
		tx.Rollback()
		return apperror.NewUnprocessableEntity("failed to delete stock sorts: %w", err)
	}

	if err := tx.Commit().Error; err != nil {
		return apperror.NewInternal("failed to commit transaction: ", err)
	}

	return nil
}

// GetAllStockSorts - Optimized with Single JOIN
// =====================================================
func (s *StockService) GetAllStockSorts() ([]models.StockSortResponse, error) {
	db := config.GetDBConn()

	// Single optimized query with JOINs
	var results []models.StockSortResponse
	if err := db.Table("stock_sorts AS ss").
		Select(`
			ss.id AS sort_id,
			ss.uuid AS sort_uuid,
			ss.stock_item_id,
			ss.sorted_item_name AS item_name,
			ss.weight,
			ss.price_per_kilogram,
			ss.current_weight,
			ss.total_cost,
			ss.is_shrinkage,
			se.uuid AS entry_uuid,
			se.id AS entry_id
		`).
		Joins("INNER JOIN stock_items si ON si.uuid = ss.stock_item_id AND si.deleted = false").
		Joins("INNER JOIN stock_entries se ON se.uuid = si.stock_entry_id AND se.deleted = false").
		Where("ss.deleted = false AND ss.is_shrinkage = false AND ss.current_weight != 0").
		Scan(&results).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NewNotFound("stock sort not found")
		}
		return nil, apperror.NewUnprocessableEntity("failed to fetch stock sorts: %w", err)
	}

	for i := range results {
		results[i].StockCode = fmt.Sprintf("STOCK%d", results[i].EntryId)
	}

	return results, nil
}
