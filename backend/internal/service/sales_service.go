package service

import (
	"context"
	"dashboard-app/internal/config"
	"dashboard-app/internal/constants"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"dashboard-app/pkg/apperror"
	"fmt"
	"github.com/google/uuid"
	"github.com/pkg/errors"
	"gorm.io/gorm"
	"strconv"
	"strings"
	"time"
)

type SalesService struct{}

func NewSalesService() repository.SalesRepository {
	return &SalesService{}
}

func (s *SalesService) CreateSales(ctx context.Context, request models.SaleRequest) error {
	db := config.GetDBConn().WithContext(ctx)

	tx := db.Begin()
	if tx.Error != nil {
		return apperror.NewUnprocessableEntity("failed to begin transaction: ", tx.Error)
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	saleId := uuid.New().String()

	var fiberList string
	if !request.ExportSale && len(request.FiberList) > 0 {
		fiberIDs := make([]string, 0, len(request.FiberList))

		for _, v := range request.FiberList {
			fiberIDs = append(fiberIDs, v.FiberId)

			if err := tx.Model(&models.Fiber{}).
				Where("uuid = ? AND deleted = false", v.FiberId).
				Updates(map[string]interface{}{
					"status":        "USED",
					"sale_id":       saleId,
					"stock_sort_id": v.StockSortId,
					"updated_at":    time.Now(),
				}).Error; err != nil {
				tx.Rollback()
				return apperror.NewUnprocessableEntity("failed to update fibers: ", err)
			}

			fiberAllocation := models.FiberAllocation{
				Uuid:        uuid.New().String(),
				FiberId:     v.FiberId,
				StockSortId: v.StockSortId,
				Weight:      v.Weight,
			}

			if err := tx.Create(&fiberAllocation).Error; err != nil {
				tx.Rollback()
				return apperror.NewUnprocessableEntity("failed to create allocated fiber: ", err)
			}
		}

		fiberList = strings.Join(fiberIDs, ",")
	}

	sale := models.Sale{
		Uuid:            saleId,
		CustomerId:      request.CustomerId,
		PurchaseDate:    request.SalesDate,
		PaidAmount:      0,
		TotalAmount:     request.TotalAmount,
		RemainingAmount: request.TotalAmount,
		PaymentStatus:   constants.PaymentNotMadeYet,
		ExportSale:      request.ExportSale,
		FiberList:       fiberList,
		Deleted:         false,
	}

	if err := tx.Create(&sale).Error; err != nil {
		tx.Rollback()
		return apperror.NewUnprocessableEntity("failed to create sale: ", err)
	}

	if len(request.ItemSales) > 0 {
		if err := s.batchCreateItemSales(tx, saleId, request.ItemSales); err != nil {
			tx.Rollback()
			return err
		}
	}

	if len(request.ItemAddOnn) > 0 {
		itemAddOns := make([]models.ItemAddOnn, 0, len(request.ItemAddOnn))
		for _, v := range request.ItemAddOnn {
			itemAddOns = append(itemAddOns, models.ItemAddOnn{
				Uuid:        uuid.New().String(),
				SaleId:      saleId,
				AddOnnName:  v.Name,
				AddOnnPrice: v.Price,
				Deleted:     false,
			})
		}

		if err := tx.Create(&itemAddOns).Error; err != nil {
			tx.Rollback()
			return apperror.NewUnprocessableEntity("failed to create add-ons: ", err)
		}
	}

	payment := models.Payment{
		Uuid:        uuid.New().String(),
		UserId:      request.CustomerId,
		Total:       request.TotalAmount,
		Type:        constants.Income,
		Description: fmt.Sprintf("Hutang selling SELL%d", sale.ID),
		SalesId:     saleId,
		Deleted:     false,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := tx.Create(&payment).Error; err != nil {
		tx.Rollback()
		return apperror.NewUnprocessableEntity("failed to create payment: ", err)
	}

	if err := tx.Commit().Error; err != nil {
		return apperror.NewInternal("failed to commit transaction: ", err)
	}

	return nil
}

func (s *SalesService) batchCreateItemSales(tx *gorm.DB, saleId string, items []models.ItemSalesRequest) error {
	if len(items) == 0 {
		return nil
	}

	stockSortIDs := make([]string, 0, len(items))
	for _, item := range items {
		stockSortIDs = append(stockSortIDs, item.StockSortId)
	}

	var stockSorts []models.StockSort
	if err := tx.Where("uuid IN ?", stockSortIDs).Find(&stockSorts).Error; err != nil {
		return apperror.NewNotFound("stock sorts not found")
	}

	stockSortMap := make(map[string]*models.StockSort)
	for i := range stockSorts {
		stockSortMap[stockSorts[i].Uuid] = &stockSorts[i]
	}

	itemSales := make([]models.ItemSales, 0, len(items))
	stockUpdates := make([]models.StockSort, 0, len(items))

	for _, v := range items {
		stockSort, exists := stockSortMap[v.StockSortId]
		if !exists {
			return apperror.NewNotFound(fmt.Sprintf("stock sort not found: %s", v.StockSortId))
		}

		itemSales = append(itemSales, models.ItemSales{
			Uuid:             uuid.New().String(),
			SaleId:           saleId,
			Weight:           v.Weight,
			PricePerKilogram: v.PricePerKilogram,
			StockSortId:      v.StockSortId,
			StockCode:        v.StockCode,
			TotalAmount:      v.TotalAmount,
			Deleted:          false,
		})

		stockSort.CurrentWeight -= v.Weight
		stockUpdates = append(stockUpdates, *stockSort)
	}

	if err := tx.Create(&itemSales).Error; err != nil {
		return apperror.NewUnprocessableEntity("failed to create item sales: ", err)
	}

	if len(stockUpdates) > 0 {
		cases := make([]string, 0, len(stockUpdates))
		ids := make([]string, 0, len(stockUpdates))

		for _, stock := range stockUpdates {
			cases = append(cases, fmt.Sprintf("WHEN '%s' THEN %d", stock.Uuid, stock.CurrentWeight))
			ids = append(ids, fmt.Sprintf("'%s'", stock.Uuid))
		}

		updateStockSortsQuery := fmt.Sprintf(`
			UPDATE stock_sorts 
			SET current_weight = CASE uuid %s END,
			    updated_at = NOW()
			WHERE uuid IN (%s)
		`, strings.Join(cases, " "), strings.Join(ids, ","))

		if err := tx.Exec(updateStockSortsQuery).Error; err != nil {
			return apperror.NewUnprocessableEntity("failed to update stock sorts: ", err)
		}
	}

	return nil
}

func (s *SalesService) UpdateSales(ctx context.Context, id string, request models.SaleRequest) error {
	db := config.GetDBConn().WithContext(ctx)

	tx := db.Begin()
	if tx.Error != nil {
		return apperror.NewInternal("failed to begin transaction: %w", tx.Error)
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var sale models.Sale
	if err := tx.Where("uuid = ? AND deleted = false", id).First(&sale).Error; err != nil {
		tx.Rollback()
		return apperror.NewNotFound(fmt.Sprintf("sale not found: %v", err))
	}

	if err := s.updateFibers(tx, &sale, request); err != nil {
		tx.Rollback()
		return err
	}

	if err := s.updateItemSales(tx, id, request.ItemSales); err != nil {
		tx.Rollback()
		return err
	}

	if err := s.updateAddOns(tx, id, request.ItemAddOnn); err != nil {
		tx.Rollback()
		return err
	}

	sale.TotalAmount = request.TotalAmount
	sale.RemainingAmount = request.TotalAmount - sale.PaidAmount
	sale.PurchaseDate = request.SalesDate
	sale.ExportSale = request.ExportSale
	sale.CustomerId = request.CustomerId

	if err := tx.Save(&sale).Error; err != nil {
		tx.Rollback()
		return apperror.NewUnprocessableEntity("failed to update sale: %w", err)
	}

	if err := tx.Model(&models.Payment{}).
		Where("sales_id = ?", id).
		Updates(map[string]interface{}{
			"user_id":    request.CustomerId,
			"total":      request.TotalAmount,
			"updated_at": time.Now(),
		}).Error; err != nil {
		tx.Rollback()
		return apperror.NewUnprocessableEntity("failed to update payment: %w", err)
	}

	if err := tx.Commit().Error; err != nil {
		return apperror.NewInternal("failed to commit transaction: ", err)
	}

	return nil
}

func (s *SalesService) updateFibers(tx *gorm.DB, sale *models.Sale, request models.SaleRequest) error {
	if sale.FiberList != "" {
		oldFiberIDs := strings.Split(sale.FiberList, ",")
		if len(oldFiberIDs) > 0 {
			fiberUpdates := map[string]interface{}{
				"status":        "FREE",
				"sale_id":       "",
				"updated_at":    time.Now(),
				"stock_sort_id": "",
			}
			if err := tx.Model(&models.Fiber{}).
				Where("uuid IN ?", oldFiberIDs).
				Updates(fiberUpdates).Error; err != nil {
				return apperror.NewUnprocessableEntity("failed to free old fibers: ", err)
			}

			if err := tx.Model(&models.Fiber{}).
				Where("uuid IN ?", oldFiberIDs).
				Update("deleted", false).Error; err != nil {
				return apperror.NewUnprocessableEntity("failed to free old fibers: ", err)
			}
		}
	}

	if !request.ExportSale && len(request.FiberList) > 0 {
		newFiberIDs := make([]string, 0, len(request.FiberList))
		for _, v := range request.FiberList {
			newFiberIDs = append(newFiberIDs, v.FiberId)
			if err := tx.Model(&models.Fiber{}).
				Where("uuid = ? AND deleted = false", v.FiberId).
				Updates(map[string]interface{}{
					"status":        "USED",
					"sale_id":       sale.Uuid,
					"updated_at":    time.Now(),
					"stock_sort_id": v.StockSortId,
				}).Error; err != nil {
				return apperror.NewUnprocessableEntity("failed to allocate new fibers: ", err)
			}

			fiberAllocation := models.FiberAllocation{
				Uuid:        uuid.New().String(),
				FiberId:     v.FiberId,
				StockSortId: v.StockSortId,
				Weight:      v.Weight,
			}

			if err := tx.Create(&fiberAllocation).Error; err != nil {
				tx.Rollback()
				return apperror.NewUnprocessableEntity("failed to create allocated fiber: ", err)
			}
		}

		sale.FiberList = strings.Join(newFiberIDs, ",")
	} else {
		sale.FiberList = ""
	}

	return nil
}

func (s *SalesService) updateItemSales(tx *gorm.DB, saleId string, newItems []models.ItemSalesRequest) error {
	var oldItems []struct {
		models.ItemSales
		StockSortId string `gorm:"column:stock_sort_id"`
	}

	if err := tx.Table("item_sales").
		Where("sale_id = ? AND deleted = false", saleId).
		Find(&oldItems).Error; err != nil {
		return apperror.NewNotFound(fmt.Sprintf("item sale not found for: %s", saleId))
	}

	if len(oldItems) > 0 {
		stockSortIDs := make([]string, 0, len(oldItems))
		weightMap := make(map[string]int)

		for _, item := range oldItems {
			stockSortIDs = append(stockSortIDs, item.StockSortId)
			weightMap[item.StockSortId] += item.Weight
		}

		var stockSorts []models.StockSort
		if err := tx.Where("uuid IN ?", stockSortIDs).Find(&stockSorts).Error; err != nil {
			return apperror.NewNotFound(fmt.Sprintf("stock sort not found for: %s", saleId))
		}

		for i := range stockSorts {
			stockSorts[i].CurrentWeight += weightMap[stockSorts[i].Uuid]
		}

		cases := make([]string, 0, len(stockSorts))
		ids := make([]string, 0, len(stockSorts))

		for _, stock := range stockSorts {
			cases = append(cases, fmt.Sprintf("WHEN '%s' THEN %d", stock.Uuid, stock.CurrentWeight))
			ids = append(ids, fmt.Sprintf("'%s'", stock.Uuid))
		}

		sql := fmt.Sprintf(`
			UPDATE stock_sorts 
			SET current_weight = CASE uuid %s END,
			    updated_at = NOW()
			WHERE uuid IN (%s)
		`, strings.Join(cases, " "), strings.Join(ids, ","))

		if err := tx.Exec(sql).Error; err != nil {
			return apperror.NewUnprocessableEntity("failed to restore stock weights: ", err)
		}
	}

	if err := tx.Model(&models.ItemSales{}).
		Where("sale_id = ?", saleId).
		Update("deleted", true).Error; err != nil {
		return apperror.NewUnprocessableEntity("failed to delete old items: ", err)
	}

	if len(newItems) > 0 {
		return s.batchCreateItemSales(tx, saleId, newItems)
	}

	return nil
}

func (s *SalesService) updateAddOns(tx *gorm.DB, saleId string, newAddOns []models.AddOnnRequest) error {
	if err := tx.Model(&models.ItemAddOnn{}).
		Where("sale_id = ?", saleId).
		Update("deleted", true).Error; err != nil {
		return apperror.NewUnprocessableEntity("failed to delete old add-ons: ", err)
	}

	if len(newAddOns) > 0 {
		itemAddOns := make([]models.ItemAddOnn, 0, len(newAddOns))
		for _, v := range newAddOns {
			itemAddOns = append(itemAddOns, models.ItemAddOnn{
				Uuid:        uuid.New().String(),
				SaleId:      saleId,
				AddOnnName:  v.Name,
				AddOnnPrice: v.Price,
				Deleted:     false,
			})
		}

		if err := tx.Create(&itemAddOns).Error; err != nil {
			return apperror.NewUnprocessableEntity("failed to create new add-ons: ", err)
		}
	}

	return nil
}

func (s *SalesService) DeleteSale(ctx context.Context, saleId string) error {
	db := config.GetDBConn().WithContext(ctx)

	tx := db.Begin()
	if tx.Error != nil {
		return apperror.NewInternal("failed to begin transaction: %w", tx.Error)
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var saleData struct {
		models.Sale
		Items     []models.ItemSales `gorm:"foreignKey:SaleId;references:Uuid"`
		FiberList string             `gorm:"column:fiber_list"`
	}

	if err := tx.Where("uuid = ?", saleId).
		Preload("Items", "deleted = false").
		First(&saleData).Error; err != nil {
		tx.Rollback()
		return apperror.NewNotFound(fmt.Sprintf("sale not found: %v", err))
	}

	if len(saleData.Items) > 0 {
		stockSortIDs := make([]string, 0, len(saleData.Items))
		weightMap := make(map[string]int)

		for _, item := range saleData.Items {
			stockSortIDs = append(stockSortIDs, item.StockSortId)
			weightMap[item.StockSortId] += item.Weight
		}

		var stockSorts []models.StockSort
		if err := tx.Where("uuid IN ?", stockSortIDs).Find(&stockSorts).Error; err != nil {
			tx.Rollback()
			return apperror.NewUnprocessableEntity("failed to fetch stock sorts: %w", err)
		}

		for i := range stockSorts {
			stockSorts[i].CurrentWeight += weightMap[stockSorts[i].Uuid]
		}

		cases := make([]string, 0, len(stockSorts))
		ids := make([]string, 0, len(stockSorts))

		for _, stock := range stockSorts {
			cases = append(cases, fmt.Sprintf("WHEN '%s' THEN %d", stock.Uuid, stock.CurrentWeight))
			ids = append(ids, fmt.Sprintf("'%s'", stock.Uuid))
		}

		sql := fmt.Sprintf(`
			UPDATE stock_sorts 
			SET current_weight = CASE uuid %s END,
			    updated_at = NOW()
			WHERE uuid IN (%s)
		`, strings.Join(cases, " "), strings.Join(ids, ","))

		if err := tx.Exec(sql).Error; err != nil {
			tx.Rollback()
			return apperror.NewUnprocessableEntity("failed to restore stock weights: ", err)
		}
	}

	if saleData.FiberList != "" {
		fiberIDs := strings.Split(saleData.FiberList, ",")
		if len(fiberIDs) > 0 {
			cleanIDs := make([]string, 0, len(fiberIDs))
			for _, id := range fiberIDs {
				if trimmed := strings.TrimSpace(id); trimmed != "" {
					cleanIDs = append(cleanIDs, trimmed)
				}
			}

			if len(cleanIDs) > 0 {
				if err := tx.Model(&models.Fiber{}).
					Where("uuid IN ? AND deleted = false", cleanIDs).
					Update("status", "FREE").Error; err != nil {
					tx.Rollback()
					return apperror.NewUnprocessableEntity("failed to free fibers: ", err)
				}

				if err := tx.Model(&models.FiberAllocation{}).
					Where("fiber_id IN ? AND deleted = false", cleanIDs).
					Update("deleted", true).Error; err != nil {
					tx.Rollback()
					return apperror.NewUnprocessableEntity("failed to free fibers: ", err)
				}
			}
		}
	}

	updates := []struct {
		model interface{}
		where string
	}{
		{&models.Sale{}, "uuid = ?"},
		{&models.ItemSales{}, "sale_id = ?"},
		{&models.ItemAddOnn{}, "sale_id = ?"},
		{&models.Payment{}, "sales_id = ?"},
	}

	for _, update := range updates {
		if err := tx.Model(update.model).
			Where(update.where, saleId).
			Update("deleted", true).Error; err != nil {
			tx.Rollback()
			return apperror.NewUnprocessableEntity("failed to delete records: ", err)
		}
	}

	if err := tx.Commit().Error; err != nil {
		return apperror.NewInternal("failed to commit transaction: ", err)
	}

	return nil
}

func (s *SalesService) GetSaleById(ctx context.Context, saleId string) (*models.SaleResponse, error) {
	db := config.GetDBConn().WithContext(ctx)

	var result models.RawSalesData

	if err := db.Table("sales AS s").
		Select(`
			s.*,
			u.uuid AS customer_uuid,
			u.name AS customer_name,
			u.phone AS customer_phone,
			u.address AS customer_address,
			u.shipping_address AS customer_shipping,
			p.created_at AS last_payment_date
		`).
		Joins("LEFT JOIN \"user\" u ON u.uuid = s.customer_id AND u.status = TRUE").
		Joins(`LEFT JOIN LATERAL (
			SELECT created_at 
			FROM payment 
			WHERE sales_id = s.uuid AND deleted = FALSE 
			ORDER BY created_at DESC 
			LIMIT 1
		) p ON TRUE`).
		Where("s.uuid = ? AND s.deleted = false", saleId).
		Scan(&result).Error; err != nil {
		return nil, apperror.NewNotFound(fmt.Sprintf("sale not found: %v", err))
	}

	itemSales, stockSorts, err := s.fetchItemSalesWithStockSorts(db, saleId)
	if err != nil {
		return nil, err
	}

	var addOns []models.ItemAddOnn
	if err = db.Where("sale_id = ? AND deleted = false", saleId).
		Find(&addOns).Error; err != nil {
		return nil, apperror.NewNotFound(fmt.Sprintf("add-onn not found: %v", err))
	}

	fiberUsedList, err := s.fetchFiberList(db, result.FiberList, result.ExportSale)
	if err != nil {
		return nil, err
	}

	return s.buildSaleResponse(result, itemSales, stockSorts, addOns, fiberUsedList), nil
}

func (s *SalesService) fetchItemSalesWithStockSorts(db *gorm.DB, saleId string) ([]models.ItemSales, map[string]models.StockSort, error) {
	var itemSales []models.ItemSales
	if err := db.Where("sale_id = ? AND deleted = false", saleId).
		Find(&itemSales).Error; err != nil {
		return nil, nil, apperror.NewNotFound(fmt.Sprintf("item sale not found: %v", err))
	}

	if len(itemSales) == 0 {
		return itemSales, make(map[string]models.StockSort), nil
	}

	stockSortIDs := make([]string, 0, len(itemSales))
	seen := make(map[string]bool)
	for _, item := range itemSales {
		if !seen[item.StockSortId] {
			stockSortIDs = append(stockSortIDs, item.StockSortId)
			seen[item.StockSortId] = true
		}
	}

	var stockSorts []models.StockSort
	if err := db.Where("uuid IN ?", stockSortIDs).
		Find(&stockSorts).Error; err != nil {
		return nil, nil, apperror.NewNotFound(fmt.Sprintf("stock sorts not found: %s", err))
	}

	stockSortMap := make(map[string]models.StockSort)
	for _, ss := range stockSorts {
		stockSortMap[ss.Uuid] = ss
	}

	return itemSales, stockSortMap, nil
}

func (s *SalesService) fetchFiberList(db *gorm.DB, fiberList string, isExportSale bool) ([]models.FiberUsedList, error) {
	if isExportSale || fiberList == "" {
		return []models.FiberUsedList{}, nil
	}

	fiberIDs := strings.Split(fiberList, ",")
	cleanIDs := make([]string, 0, len(fiberIDs))
	for _, id := range fiberIDs {
		if trimmed := strings.TrimSpace(id); trimmed != "" {
			cleanIDs = append(cleanIDs, trimmed)
		}
	}

	if len(cleanIDs) == 0 {
		return []models.FiberUsedList{}, nil
	}

	var fibers []models.Fiber
	db.Where("uuid IN ?", cleanIDs).Find(&fibers)

	result := make([]models.FiberUsedList, 0, len(fibers))
	for _, fiber := range fibers {
		result = append(result, models.FiberUsedList{
			FiberId:   fiber.Uuid,
			FiberName: fiber.Name,
		})
	}

	return result, nil
}

func (s *SalesService) buildSaleResponse(
	result models.RawSalesData,
	itemSales []models.ItemSales,
	stockSortMap map[string]models.StockSort,
	addOns []models.ItemAddOnn,
	fiberUsedList []models.FiberUsedList,
) *models.SaleResponse {

	customer := models.GetUserDetail{
		Uuid:            result.CustomerUuid,
		Name:            result.CustomerName,
		Phone:           result.CustomerPhone,
		Address:         result.CustomerAddress,
		ShippingAddress: result.CustomerShipping,
	}

	lastPay := ""
	if result.LastPaymentDate != nil {
		lastPay = result.LastPaymentDate.Format(time.RFC3339)
	}

	itemSalesList := make([]models.ItemSaleList, 0, len(itemSales))
	for _, item := range itemSales {
		stockSort := stockSortMap[item.StockSortId]
		itemSalesList = append(itemSalesList, models.ItemSaleList{
			Uuid:             item.Uuid,
			StockCode:        item.StockCode,
			StockSortId:      stockSort.Uuid,
			StockSortName:    stockSort.ItemName,
			PricePerKilogram: item.PricePerKilogram,
			Weight:           item.Weight,
			TotalAmount:      item.TotalAmount,
		})
	}

	itemAddOnList := make([]models.ItemAddOnnList, 0, len(addOns))
	for _, a := range addOns {
		itemAddOnList = append(itemAddOnList, models.ItemAddOnnList{
			Uuid:        a.Uuid,
			AddOnnName:  a.AddOnnName,
			AddOnnPrice: a.AddOnnPrice,
		})
	}

	return &models.SaleResponse{
		ID:              result.ID,
		Uuid:            result.Uuid,
		SaleCode:        fmt.Sprintf("SELL%d", result.ID),
		Customer:        customer,
		CreateAt:        result.CreatedAt,
		PaymentLateDay:  int(time.Since(result.CreatedAt).Hours() / 24),
		ExportSale:      result.ExportSale,
		TotalAmount:     result.TotalAmount,
		PaidAmount:      result.PaidAmount,
		RemainingAmount: result.TotalAmount - result.PaidAmount,
		PaymentStatus:   result.PaymentStatus,
		SalesDate:       result.PurchaseDate,
		LastPaymentDate: lastPay,
		FiberUsed:       fiberUsedList,
		SoldItem:        itemSalesList,
		AddOn:           itemAddOnList,
	}
}

func (s *SalesService) GetAllSales(ctx context.Context, filter models.SalesFilter) (*models.SalePaginationResponse, error) {
	db := config.GetDBConn().WithContext(ctx)

	if filter.PageNo < 1 {
		filter.PageNo = 1
	}
	if filter.Size < 1 {
		filter.Size = 10
	}
	offset := (filter.PageNo - 1) * filter.Size

	query := db.Table("sales AS s").
		Select(`
            s.*,
            u.uuid AS customer_uuid,
            u.name AS customer_name,
            u.phone AS customer_phone,
            u.address AS customer_address,
            u.shipping_address AS customer_shipping_address,
            p.created_at AS last_payment_date
        `).
		Joins(`LEFT JOIN "user" u ON u.uuid = s.customer_id AND u.status = TRUE`).
		Joins(`LEFT JOIN LATERAL (
            SELECT created_at, uuid 
            FROM payment 
            WHERE sales_id = s.uuid AND deleted = FALSE 
            ORDER BY created_at DESC 
            LIMIT 1
        ) p ON TRUE`).
		Where("s.deleted = FALSE")

	query = s.applyFilters(query, filter, db)

	var rawSales []models.RawSalesData

	if err := query.
		Order("s.created_at DESC").
		Limit(filter.Size).
		Offset(offset).
		Scan(&rawSales).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NewNotFound(fmt.Sprintf("sales data not found: %v", err))
		}
		return nil, apperror.NewUnprocessableEntity("Failed to fetch sales data", err)
	}

	if len(rawSales) == 0 {
		total := s.getTotalCount(db, filter)
		return &models.SalePaginationResponse{
			Size:   filter.Size,
			PageNo: filter.PageNo,
			Total:  total,
			Data:   []models.SaleResponse{},
		}, nil
	}

	saleIDs := make([]string, len(rawSales))
	for i, val := range rawSales {
		saleIDs[i] = val.Uuid
	}

	dataChan := make(chan models.RelatedDataSales, 1)
	errChan := make(chan error, 1)

	go func() {
		data, err := s.fetchRelatedData(db, saleIDs)
		if err != nil {
			errChan <- err
			return
		}
		dataChan <- data
	}()

	select {
	case err := <-errChan:
		return nil, err
	case data := <-dataChan:
		responses := s.buildResponses(rawSales, data)
		total := s.getTotalCount(db, filter)

		return &models.SalePaginationResponse{
			Size:   filter.Size,
			PageNo: filter.PageNo,
			Total:  total,
			Data:   responses,
		}, nil
	}
}

func (s *SalesService) applyFilters(query *gorm.DB, filter models.SalesFilter, db *gorm.DB) *gorm.DB {
	if filter.SalesId != "" {
		query = query.Where("s.uuid = ?", filter.SalesId)
	}

	if filter.PaymentStatus != "" && filter.PaymentStatus != "ALL" {
		query = query.Where("s.payment_status = ?", filter.PaymentStatus)
	}

	if filter.SalesDate != "" {
		if parsed, err := time.Parse("2006-01-02", filter.SalesDate); err == nil {
			query = query.Where("DATE(s.purchase_date) = ?", parsed.Format("2006-01-02"))
		}
	}

	if filter.CustomerId != "" {
		query = query.Where("s.customer_id = ?", filter.CustomerId)
	}

	if filter.Keyword != "" {
		query = s.applyKeywordFilter(query, filter.Keyword, db)
	}

	return query
}

func (s *SalesService) applyKeywordFilter(query *gorm.DB, keyword string, db *gorm.DB) *gorm.DB {
	if _, err := strconv.Atoi(keyword); err == nil {
		return s.applyNumericKeywordFilter(query, keyword, db)
	}
	return s.applyTextKeywordFilter(query, keyword, db)
}

func (s *SalesService) applyNumericKeywordFilter(query *gorm.DB, keyword string, db *gorm.DB) *gorm.DB {
	var salesIDs []string

	db.Raw(`
		WITH stock_entries AS (
			SELECT uuid FROM stock_entries WHERE id = ?
		),
		stock_items AS (
			SELECT uuid FROM stock_items
			WHERE deleted = false 
			AND stock_entry_id IN (SELECT uuid FROM stock_entries)
		),
		stock_sorts AS (
			SELECT uuid FROM stock_sorts 
			WHERE deleted = false 
			AND stock_item_id IN (SELECT uuid FROM stock_items)
		)
		SELECT DISTINCT sale_id 
		FROM item_sales 
		WHERE deleted = false 
		AND stock_sort_id IN (SELECT uuid FROM stock_sorts)
	`, keyword).Pluck("sale_id", &salesIDs)

	if len(salesIDs) > 0 {
		return query.Where("s.uuid IN ?", salesIDs)
	}

	return query.Where("s.id = ?", keyword)
}

func (s *SalesService) applyTextKeywordFilter(query *gorm.DB, keyword string, db *gorm.DB) *gorm.DB {
	var salesIDs []string

	db.Raw(`
		SELECT DISTINCT i.sale_id 
		FROM item_sales i
		INNER JOIN stock_sorts ss ON ss.uuid = i.stock_sort_id
		WHERE i.deleted = false 
		AND ss.deleted = false 
		AND ss.sorted_item_name ILIKE ?
	`, "%"+keyword+"%").Pluck("sale_id", &salesIDs)

	if len(salesIDs) == 0 {
		return query.Where("1 = 0")
	}

	return query.Where("s.uuid IN ?", salesIDs)
}

func (s *SalesService) fetchRelatedData(db *gorm.DB, saleIDs []string) (models.RelatedDataSales, error) {
	var data models.RelatedDataSales

	if err := db.Table("item_sales AS i").
		Select(`
			i.*,
			ss.uuid AS stock_sort_uuid,
			ss.sorted_item_name AS stock_sort_name
		`).
		Joins("LEFT JOIN stock_sorts ss ON ss.uuid = i.stock_sort_id").
		Where("i.sale_id IN ?", saleIDs).
		Where("i.deleted = FALSE").
		Scan(&data.ItemSales).Error; err != nil {
		return data, apperror.NewUnprocessableEntity("failed to fetch item sales: ", err)
	}

	stockSortIDs := make([]string, 0, len(data.ItemSales))
	seen := make(map[string]bool)
	for _, item := range data.ItemSales {
		if !seen[item.StockSortId] {
			stockSortIDs = append(stockSortIDs, item.StockSortId)
			seen[item.StockSortId] = true
		}
	}

	if len(stockSortIDs) > 0 {
		if err := db.Where("uuid IN ?", stockSortIDs).
			Find(&data.StockSorts).Error; err != nil {
			return data, apperror.NewNotFound(fmt.Sprintf("stock sorts not found: %v", err))
		}
	}

	if err := db.Where("sale_id IN ?", saleIDs).
		Where("deleted = FALSE").
		Find(&data.AddOns).Error; err != nil {
		return data, apperror.NewNotFound(fmt.Sprintf("add-ons not found: %v", err))
	}

	if err := db.Where("sale_id IN ?", saleIDs).
		Where("deleted = FALSE").
		Find(&data.Fibers).Error; err != nil {
		return data, apperror.NewNotFound(fmt.Sprintf("fibers not found: %v", err))
	}

	fiberIDs := make([]string, 0, len(data.Fibers))
	for _, f := range data.Fibers {
		fiberIDs = append(fiberIDs, f.Uuid)
	}

	if len(fiberIDs) > 0 {
		if err := db.
			Where("fiber_id IN ? AND deleted = FALSE", fiberIDs).
			Find(&data.FiberAllocations).Error; err != nil {
			return data, apperror.NewNotFound(fmt.Sprintf("fiber allocations not found: %v", err))
		}
	}

	return data, nil
}

func (s *SalesService) buildResponses(rawSales []models.RawSalesData, data models.RelatedDataSales) []models.SaleResponse {
	itemMap := make(map[string][]models.ItemSales)
	for _, item := range data.ItemSales {
		itemMap[item.SaleId] = append(itemMap[item.SaleId], item)
	}

	stockMap := make(map[string]models.StockSort)
	for _, ss := range data.StockSorts {
		stockMap[ss.Uuid] = ss
	}

	addOnMap := make(map[string][]models.ItemAddOnn)
	for _, a := range data.AddOns {
		addOnMap[a.SaleId] = append(addOnMap[a.SaleId], a)
	}

	fiberMap := make(map[string][]models.FiberUsedList)
	for _, f := range data.Fibers {
		fiberMap[f.SaleId] = append(fiberMap[f.SaleId], models.FiberUsedList{
			FiberId:     f.Uuid,
			FiberName:   f.Name,
			StockSortId: f.StockSortId,
			SaleId:      f.SaleId,
		})
	}

	responses := make([]models.SaleResponse, 0, len(rawSales))
	for _, val := range rawSales {
		customer := models.GetUserDetail{
			Uuid:            val.CustomerUuid,
			Name:            val.CustomerName,
			Phone:           val.CustomerPhone,
			Address:         val.CustomerAddress,
			ShippingAddress: val.CustomerShipping,
		}

		lastPay := ""
		if val.LastPaymentDate != nil {
			lastPay = val.LastPaymentDate.Format(time.RFC3339)
		}

		itemList := make([]models.ItemSaleList, 0, len(itemMap[val.Uuid]))
		for _, it := range itemMap[val.Uuid] {
			ss := stockMap[it.StockSortId]
			itemList = append(itemList, models.ItemSaleList{
				Uuid:             it.Uuid,
				StockCode:        it.StockCode,
				StockSortId:      ss.Uuid,
				StockSortName:    ss.ItemName,
				PricePerKilogram: it.PricePerKilogram,
				Weight:           it.Weight,
				TotalAmount:      it.TotalAmount,
			})
		}

		addList := make([]models.ItemAddOnnList, 0, len(addOnMap[val.Uuid]))
		for _, a := range addOnMap[val.Uuid] {
			addList = append(addList, models.ItemAddOnnList{
				Uuid:        a.Uuid,
				AddOnnName:  a.AddOnnName,
				AddOnnPrice: a.AddOnnPrice,
			})
		}

		fiberList := fiberMap[val.Uuid]
		if fiberList == nil {
			fiberList = []models.FiberUsedList{}
		}

		fiberAllocMap := make(map[string][]models.FiberAllocation)
		for _, fa := range data.FiberAllocations {
			fiberAllocMap[fa.FiberId] = append(
				fiberAllocMap[fa.FiberId],
				fa,
			)
		}

		fiberNameMap := make(map[string]string)
		for _, f := range data.Fibers {
			fiberNameMap[f.Uuid] = f.Name
		}

		fiberGroupMap := make(map[string]*models.FiberGroupResponse)

		for _, f := range data.Fibers {
			if f.SaleId != val.Uuid {
				continue
			}

			allocs := fiberAllocMap[f.Uuid]
			if len(allocs) == 0 {
				continue
			}

			for _, fa := range allocs {
				for _, it := range itemMap[val.Uuid] {
					if it.StockSortId != fa.StockSortId {
						continue
					}

					ss := stockMap[it.StockSortId]

					if _, exists := fiberGroupMap[f.Uuid]; !exists {
						fiberGroupMap[f.Uuid] = &models.FiberGroupResponse{
							FiberId:   f.Uuid,
							FiberName: f.Name,
							Items:     []models.ItemSaleList{},
						}
					}

					fiberGroupMap[f.Uuid].Items = append(
						fiberGroupMap[f.Uuid].Items,
						models.ItemSaleList{
							Uuid:             it.Uuid,
							StockCode:        it.StockCode,
							StockSortId:      ss.Uuid,
							StockSortName:    ss.ItemName,
							PricePerKilogram: it.PricePerKilogram,
							Weight:           fa.Weight,
							TotalAmount:      it.TotalAmount,
						},
					)
				}
			}
		}
		fiberGroups := make([]models.FiberGroupResponse, 0, len(fiberGroupMap))
		for _, fg := range fiberGroupMap {
			fiberGroups = append(fiberGroups, *fg)
		}

		response := models.SaleResponse{
			ID:                 val.ID,
			Uuid:               val.Uuid,
			SaleCode:           fmt.Sprintf("SELL%d", val.ID),
			Customer:           customer,
			CreateAt:           val.CreatedAt,
			PaymentLateDay:     int(time.Since(val.CreatedAt).Hours() / 24),
			ExportSale:         val.ExportSale,
			TotalAmount:        val.TotalAmount,
			PaidAmount:         val.PaidAmount,
			RemainingAmount:    val.TotalAmount - val.PaidAmount,
			PaymentStatus:      val.PaymentStatus,
			SalesDate:          val.PurchaseDate.UTC(),
			FiberUsed:          fiberList,
			LastPaymentDate:    lastPay,
			SoldItem:           itemList,
			AddOn:              addList,
			FiberGroupResponse: fiberGroups,
		}

		responses = append(responses, response)
	}

	return responses
}

func (s *SalesService) getTotalCount(db *gorm.DB, filter models.SalesFilter) int {
	var total int64

	countQuery := db.Model(&models.Sale{}).Where("deleted = FALSE")
	countQuery = s.applyFilters(countQuery, filter, db)

	countQuery.Count(&total)
	return int(total)
}
