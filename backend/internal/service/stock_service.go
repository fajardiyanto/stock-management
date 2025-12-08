package service

import (
	"dashboard-app/internal/config"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"fmt"
	"github.com/google/uuid"
	"github.com/pkg/errors"
	"gorm.io/gorm"
	"strconv"
	"time"
)

type StockService struct{}

func NewStockService() repository.StockRepository {
	return &StockService{}
}

func (s *StockService) GetAllStockEntries(filter models.StockEntryFilter) (*models.StockResponse, error) {
	db := config.GetDBConn().Orm().Debug()

	if filter.PageNo < 1 {
		filter.PageNo = 1
	}
	if filter.Size < 1 {
		filter.Size = 10
	}

	offset := (filter.PageNo - 1) * filter.Size

	query := db.Model(&models.StockEntry{})

	if filter.SupplierId != "" {
		var stockIDs []string
		if err := db.Model(&models.Purchase{}).
			Where("supplier_id = ? AND deleted = false", filter.SupplierId).
			Pluck("stock_id", &stockIDs).Error; err != nil {
			return nil, err
		}

		if len(stockIDs) == 0 {
			return &models.StockResponse{
				Size:   filter.Size,
				PageNo: filter.PageNo,
				Total:  0,
				Data:   []models.StockEntriesResponse{},
			}, nil
		}

		query = query.Where("uuid IN ?", stockIDs)
	}

	if filter.PurchaseDate != "" {
		parsed, err := time.Parse("2006-01-02", filter.PurchaseDate)
		if err == nil {
			var stockIDs []string
			db.Model(&models.Purchase{}).
				Where("DATE(purchase_date) = ?", parsed.Format("2006-01-02")).
				Pluck("stock_id", &stockIDs)

			query = query.Where("uuid IN ?", stockIDs)
		}
	}

	if filter.AgeInDay != "" {
		now := time.Now()
		switch filter.AgeInDay {
		case "LT_1": // Less than 1 day
			query = query.Where("created_at >= ?", now.Add(-24*time.Hour))
		case "GT_1": // More than 1 day
			query = query.Where("created_at < ?", now.Add(-24*time.Hour))
		case "GT_10": // More than 10 days
			query = query.Where("created_at < ?", now.Add(-240*time.Hour))
		case "GT_30": // More than 30 days
			query = query.Where("created_at < ?", now.Add(-720*time.Hour))
		}
	}

	if filter.Keyword != "" {
		if _, err := strconv.Atoi(filter.Keyword); err == nil {
			if filter.Keyword != "" {
				query = query.Where("id = ?", filter.Keyword)
			}
		} else {
			var stockIDs []string

			var itemStockIDs []string
			db.Model(&models.StockItem{}).
				Where("deleted = false AND item_name ILIKE ?", "%"+filter.Keyword+"%").
				Pluck("stock_entry_id", &itemStockIDs)

			var sortItemIDs []string
			db.Model(&models.StockSort{}).
				Where("deleted = false AND sorted_item_name ILIKE ?", "%"+filter.Keyword+"%").
				Pluck("stock_item_id", &sortItemIDs)

			var sortStockIDs []string
			if len(sortItemIDs) > 0 {
				db.Model(&models.StockItem{}).
					Where("uuid IN ? AND deleted = false", sortItemIDs).
					Pluck("stock_entry_id", &sortStockIDs)
			}

			stockIDs = append(stockIDs, itemStockIDs...)
			stockIDs = append(stockIDs, sortStockIDs...)

			if len(stockIDs) == 0 {
				return &models.StockResponse{
					Size:   filter.Size,
					PageNo: filter.PageNo,
					Total:  0,
					Data:   []models.StockEntriesResponse{},
				}, nil
			}

			query = query.Where("uuid IN ?", stockIDs)
		}
	}

	query = query.Where("deleted = false")

	var total int64
	query.Count(&total)

	var stockEntries []models.StockEntry
	if err := query.
		Order("created_at desc").
		Limit(filter.Size).
		Offset(offset).
		Find(&stockEntries).Error; err != nil {
		return nil, err
	}

	stockEntriesResponse := make([]models.StockEntriesResponse, 0)

	for _, stockEntry := range stockEntries {
		var purchase models.Purchase
		if err := db.Where("stock_id = ? AND deleted = false", stockEntry.Uuid).First(&purchase).Error; err != nil {
			return nil, err
		}

		var supplier models.User
		if err := db.Where("uuid = ? AND status = true", purchase.SupplierID).First(&supplier).Error; err != nil {
			return nil, err
		}

		supplierDetail := models.GetUserDetail{
			Uuid:  supplier.Uuid,
			Name:  supplier.Name,
			Phone: supplier.Phone,
		}

		resp := models.StockEntriesResponse{
			Uuid:         stockEntry.Uuid,
			StockCode:    fmt.Sprintf("STOCK%d", stockEntry.ID),
			AgeInDay:     int(time.Since(stockEntry.CreatedAt).Hours() / 24),
			PurchaseId:   purchase.Uuid,
			Supplier:     supplierDetail,
			PurchaseDate: purchase.PurchaseDate.Format(time.RFC3339),
		}

		var stockItems []models.StockItem
		db.Where("stock_entry_id = ? AND deleted = false", stockEntry.Uuid).Find(&stockItems)

		for _, item := range stockItems {
			itemResp := models.StockItemResponse{
				Uuid:             item.Uuid,
				StockEntryID:     item.StockEntryID,
				ItemName:         item.ItemName,
				Weight:           item.Weight,
				PricePerKilogram: item.PricePerKilogram,
				TotalPayment:     item.TotalPayment,
				IsSorted:         item.IsSorted,
			}

			var sorted []models.StockSort
			db.Where("stock_item_id = ? AND deleted = false", item.Uuid).Find(&sorted)

			for _, srt := range sorted {
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

		stockEntriesResponse = append(stockEntriesResponse, resp)
	}

	return &models.StockResponse{
		Size:   filter.Size,
		PageNo: filter.PageNo,
		Total:  int(total),
		Data:   stockEntriesResponse,
	}, nil
}

func (s *StockService) GetStockEntryById(stockId string) (*models.StockEntriesResponse, error) {
	db := config.GetDBConn().Orm().Debug()
	var stockEntry models.StockEntry
	if err := db.Where("uuid = ? AND deleted = false", stockId).First(&stockEntry).Error; err != nil {
		return nil, err
	}

	var purchase models.Purchase
	if err := db.Where("stock_id = ? AND deleted = false", stockEntry.Uuid).First(&purchase).Error; err != nil {
		return nil, err
	}

	var supplier models.User
	if err := db.Where("uuid = ? AND status = true", purchase.SupplierID).First(&supplier).Error; err != nil {
		return nil, err
	}

	supplierDetail := models.GetUserDetail{
		Uuid:  supplier.Uuid,
		Name:  supplier.Name,
		Phone: supplier.Phone,
	}

	resp := models.StockEntriesResponse{
		Uuid:         stockEntry.Uuid,
		StockCode:    fmt.Sprintf("STOCK-%d", stockEntry.ID),
		AgeInDay:     int(time.Since(stockEntry.CreatedAt).Hours() / 24),
		PurchaseId:   purchase.Uuid,
		Supplier:     supplierDetail,
		PurchaseDate: purchase.PurchaseDate.Format(time.RFC3339),
	}

	var stockItems []models.StockItem
	db.Where("stock_entry_id = ? AND deleted = false", stockEntry.Uuid).Find(&stockItems)

	for _, item := range stockItems {
		itemResp := models.StockItemResponse{
			Uuid:             item.Uuid,
			StockEntryID:     item.StockEntryID,
			ItemName:         item.ItemName,
			Weight:           item.Weight,
			PricePerKilogram: item.PricePerKilogram,
			TotalPayment:     item.TotalPayment,
		}

		var sorted []models.StockSort
		db.Where("stock_item_id = ? AND deleted = false", item.Uuid).Find(&sorted)

		itemResp.IsSorted = len(sorted) > 0

		for _, srt := range sorted {
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

func (s *StockService) UpdateStockById(stockId string, request models.CreatePurchaseRequest) (*models.PurchaseDataResponse, error) {
	db := config.GetDBConn().Orm().Debug()

	tx := db.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		} else if tx.Error != nil {
			tx.Rollback()
		} else {
			tx.Commit()
		}
	}()

	var existingStockEntry models.StockEntry
	if err := tx.Where("uuid = ? AND deleted = false", stockId).First(&existingStockEntry).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Errorf("Stock entry not found with ID: %s", stockId)
		}
		return nil, err
	}

	var existingPurchase models.Purchase
	if err := tx.Where("stock_id = ? AND deleted = false", existingStockEntry.Uuid).First(&existingPurchase).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Errorf("Purchase record not found for stock ID: %s", stockId)
		}
		return nil, err
	}

	stockItems := make([]models.StockItem, 0)
	var newTotalAmount int
	for _, v := range request.StockItems {
		totalPayment := v.Weight * v.PricePerKilogram
		stockItem := models.StockItem{
			Uuid:             uuid.New().String(),
			StockEntryID:     existingStockEntry.Uuid,
			ItemName:         v.ItemName,
			Weight:           v.Weight,
			PricePerKilogram: v.PricePerKilogram,
			IsSorted:         false,
			TotalPayment:     totalPayment,
			Deleted:          false,
			CreatedAt:        time.Now(),
			UpdatedAt:        time.Now(),
		}
		newTotalAmount += totalPayment
		stockItems = append(stockItems, stockItem)
	}

	if err := tx.Where("stock_entry_id = ? AND deleted = false", existingStockEntry.Uuid).Delete(&models.StockItem{}).Error; err != nil {
		return nil, err
	}

	if len(stockItems) > 0 {
		if err := tx.Create(&stockItems).Error; err != nil {
			return nil, err
		}
	}

	updatePurchaseMap := map[string]interface{}{
		"supplier_id":   request.SupplierID,
		"purchase_date": request.PurchaseDate,
		"total_amount":  newTotalAmount,
		"updated_at":    time.Now(),
	}

	if err := tx.Model(&existingPurchase).Where("uuid = ? AND deleted = false", existingPurchase.Uuid).Updates(updatePurchaseMap).Error; err != nil {
		return nil, err
	}

	existingPurchase.SupplierID = request.SupplierID
	existingPurchase.PurchaseDate = request.PurchaseDate
	existingPurchase.TotalAmount = newTotalAmount

	var existingPayment models.Payment
	if err := tx.Where("purchase_id = ? AND deleted = false", existingPurchase.Uuid).First(&existingPayment).Error; err != nil {
		return nil, err
	}

	updatePaymentMap := map[string]interface{}{
		"total":      newTotalAmount,
		"updated_at": time.Now(),
	}

	if err := tx.Model(&existingPayment).Where("uuid = ? AND deleted = false", existingPayment.Uuid).Updates(updatePaymentMap).Error; err != nil {
		return nil, err
	}

	var supplier models.User
	if err := db.Where("uuid = ? AND status = true", request.SupplierID).First(&supplier).Error; err != nil {
		return nil, err
	}

	userDetail := models.GetUserDetail{
		Uuid:  supplier.Uuid,
		Name:  supplier.Name,
		Phone: supplier.Phone,
	}

	response := &models.PurchaseDataResponse{
		PurchaseId:      existingPurchase.Uuid,
		PurchaseDate:    existingPurchase.PurchaseDate.Format(time.RFC3339),
		Supplier:        userDetail,
		StockId:         existingStockEntry.Uuid,
		StockCode:       fmt.Sprintf("STOCK%d", existingStockEntry.ID),
		TotalAmount:     newTotalAmount,
		PaidAmount:      0,
		RemainingAmount: newTotalAmount,
		PaymentStatus:   existingPurchase.PaymentStatus,
	}

	response.StockEntry = &models.StockEntriesResponse{
		Uuid:              existingStockEntry.Uuid,
		StockCode:         fmt.Sprintf("STOCK-%d", existingStockEntry.ID),
		AgeInDay:          int(time.Since(existingStockEntry.CreatedAt).Hours() / 24),
		PurchaseId:        existingPurchase.Uuid,
		Supplier:          userDetail,
		StockItemResponse: make([]models.StockItemResponse, 0),
	}

	for _, item := range stockItems {
		response.StockEntry.StockItemResponse = append(response.StockEntry.StockItemResponse, models.StockItemResponse{
			Uuid:               item.Uuid,
			StockEntryID:       existingStockEntry.Uuid,
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

func (s *StockService) GetStockItemById(stockItemId string) (*models.StockEntryResponse, error) {
	db := config.GetDBConn().Orm().Debug()

	var stockItem models.StockItem
	if err := db.Where("uuid = ? AND deleted = false", stockItemId).First(&stockItem).Error; err != nil {
		return nil, err
	}

	var stockEntry models.StockEntry
	if err := db.Where("uuid = ? AND deleted = false", stockItem.StockEntryID).First(&stockEntry).Error; err != nil {
		return nil, err
	}

	var stockSort []models.StockSort
	if err := db.Where("stock_item_id = ? AND deleted = false", stockItem.Uuid).Find(&stockSort).Error; err != nil {
		return nil, err
	}

	result := models.StockEntryResponse{
		Uuid:      stockEntry.Uuid,
		StockCode: fmt.Sprintf("STOCK-%d", stockEntry.ID),
		StockItemResponse: models.StockItemResponse{
			Uuid:               stockItem.Uuid,
			StockEntryID:       stockItem.StockEntryID,
			ItemName:           stockItem.ItemName,
			Weight:             stockItem.Weight,
			PricePerKilogram:   stockItem.PricePerKilogram,
			TotalPayment:       stockItem.TotalPayment,
			AlreadySorted:      0,
			IsSorted:           stockItem.IsSorted,
			StockSortResponses: make([]models.StockSortResponse, 0),
		},
	}

	var remainingWeight int
	for _, v := range stockSort {
		remainingWeight += v.Weight
		stockSortResponse := models.StockSortResponse{
			Uuid:             v.Uuid,
			StockItemID:      v.StockItemID,
			ItemName:         v.ItemName,
			Weight:           v.Weight,
			PricePerKilogram: v.PricePerKilogram,
			CurrentWeight:    v.CurrentWeight,
			TotalCost:        v.TotalCost,
			IsShrinkage:      v.IsShrinkage,
		}

		result.StockItemResponse.StockSortResponses = append(result.StockItemResponse.StockSortResponses, stockSortResponse)
	}
	result.StockItemResponse.RemainingWeight = stockItem.Weight - remainingWeight

	return &result, nil
}

func (s *StockService) CreateStockSort(request models.SubmitSortRequest) error {
	db := config.GetDBConn().Orm().Debug()

	tx := db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	stockSorts := make([]models.StockSort, 0)
	for _, v := range request.StockSortRequest {
		stockSort := models.StockSort{
			Uuid:             uuid.New().String(),
			StockItemID:      request.StockItemId,
			ItemName:         v.SortedItemName,
			Weight:           v.Weight,
			PricePerKilogram: v.PricePerKilogram,
			CurrentWeight:    v.CurrentWeight,
			TotalCost:        v.PricePerKilogram * v.Weight,
			IsShrinkage:      v.IsShrinkage,
			Deleted:          false,
		}

		stockSorts = append(stockSorts, stockSort)
	}

	if len(stockSorts) > 0 {
		if err := tx.Create(&stockSorts).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	if err := tx.Model(&models.StockItem{}).Where("uuid = ? AND deleted = false", request.StockItemId).Update("is_sorted", true).Error; err != nil {
		tx.Rollback()
		return err
	}

	if tx.Commit().Error != nil {
		return tx.Commit().Error
	}

	return nil
}

func (s *StockService) UpdateStockSort(request models.SubmitSortRequest) error {
	db := config.GetDBConn().Orm().Debug()

	tx := db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	if err := tx.Where("stock_item_id = ? AND deleted = false", request.StockItemId).Delete(&models.StockSort{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	stockSorts := make([]models.StockSort, 0)
	for _, v := range request.StockSortRequest {
		totalCost := v.PricePerKilogram * v.Weight

		stockSort := models.StockSort{
			Uuid:             uuid.New().String(),
			StockItemID:      request.StockItemId,
			ItemName:         v.SortedItemName,
			Weight:           v.Weight,
			PricePerKilogram: v.PricePerKilogram,
			CurrentWeight:    v.CurrentWeight,
			TotalCost:        totalCost,
			IsShrinkage:      v.IsShrinkage,
			Deleted:          false,
			CreatedAt:        time.Now(),
			UpdatedAt:        time.Now(),
		}

		stockSorts = append(stockSorts, stockSort)
	}

	if len(stockSorts) > 0 {
		if err := tx.Create(&stockSorts).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	if err := tx.Model(&models.StockItem{}).Where("uuid = ? AND deleted = false", request.StockItemId).Update("is_sorted", true).Error; err != nil {
		tx.Rollback()
		return err
	}

	if tx.Commit().Error != nil {
		return tx.Commit().Error
	}

	return nil
}

func (s *StockService) DeleteStockEntryById(stockEntryId string) error {
	db := config.GetDBConn().Orm().Debug()

	tx := db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	var purchase models.Purchase
	if err := tx.Where("stock_id = ? AND deleted = false", stockEntryId).
		First(&purchase).Error; err != nil {

		tx.Rollback()
		return err
	}

	if err := tx.Model(&models.Purchase{}).
		Where("uuid = ?", purchase.Uuid).
		Update("deleted", true).Error; err != nil {

		tx.Rollback()
		return err
	}

	if err := tx.Model(&models.Payment{}).
		Where("purchase_id = ? AND deleted = false", purchase.Uuid).
		Update("deleted", true).Error; err != nil {

		tx.Rollback()
		return err
	}

	if err := tx.Model(&models.StockEntry{}).
		Where("uuid = ? AND deleted = false", stockEntryId).
		Update("deleted", true).Error; err != nil {

		tx.Rollback()
		return err
	}

	var stockItems []models.StockItem
	if err := tx.Where("stock_entry_id = ? AND deleted = false", stockEntryId).
		Find(&stockItems).Error; err != nil {

		tx.Rollback()
		return err
	}

	if len(stockItems) > 0 {
		stockItemIds := make([]string, 0)
		for _, item := range stockItems {
			stockItemIds = append(stockItemIds, item.Uuid)
		}

		if err := tx.Model(&models.StockSort{}).
			Where("stock_item_id IN (?) AND deleted = false", stockItemIds).
			Update("deleted", true).Error; err != nil {

			tx.Rollback()
			return err
		}
	}

	if err := tx.Model(&models.StockItem{}).
		Where("stock_entry_id = ? AND deleted = false", stockEntryId).
		Update("deleted", true).Error; err != nil {

		tx.Rollback()
		return err
	}

	if tx.Commit().Error != nil {
		return tx.Commit().Error
	}

	return nil
}

func (s *StockService) GetAllStockSorts() ([]models.StockSortResponse, error) {
	db := config.GetDBConn().Orm().Debug()

	var stockSorts []models.StockSort
	if err := db.
		Model(&models.StockSort{}).
		Where("deleted = false AND is_shrinkage = false AND current_weight != 0").
		Find(&stockSorts).Error; err != nil {
		return nil, err
	}

	response := make([]models.StockSortResponse, 0, len(stockSorts))

	for _, ss := range stockSorts {
		var stockItem models.StockItem
		if err := db.
			Model(&models.StockItem{}).
			Where("uuid = ? AND deleted = false", ss.StockItemID).
			First(&stockItem).Error; err != nil {
			return nil, err
		}

		var stockEntry models.StockEntry
		if err := db.
			Model(&models.StockEntry{}).
			Where("uuid = ? AND deleted = false", stockItem.StockEntryID).
			First(&stockEntry).Error; err != nil {
			return nil, err
		}

		response = append(response, models.StockSortResponse{
			ID:               ss.ID,
			Uuid:             ss.Uuid,
			StockItemID:      ss.StockItemID,
			ItemName:         ss.ItemName,
			Weight:           ss.Weight,
			PricePerKilogram: ss.PricePerKilogram,
			StockEntryID:     stockEntry.Uuid,
			StockCode:        fmt.Sprintf("STOCK%d", stockEntry.ID),
			CurrentWeight:    ss.CurrentWeight,
			TotalCost:        ss.TotalCost,
			IsShrinkage:      ss.IsShrinkage,
		})
	}

	return response, nil
}
