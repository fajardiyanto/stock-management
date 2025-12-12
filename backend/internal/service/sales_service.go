package service

import (
	"dashboard-app/internal/config"
	"dashboard-app/internal/constatnts"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"dashboard-app/util/apperror"
	"fmt"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"strconv"
	"strings"
	"time"
)

type SalesService struct{}

func NewSalesService() repository.SalesRepository {
	return &SalesService{}
}

func (s *SalesService) CreateSales(request models.SaleRequest) error {
	db := config.GetDBConn()

	tx := db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	saleId := uuid.New().String()
	sale := models.Sale{
		Uuid:            saleId,
		CustomerId:      request.CustomerId,
		PurchaseDate:    request.SalesDate,
		PaidAmount:      0,
		TotalAmount:     request.TotalAmount,
		RemainingAmount: request.TotalAmount,
		PaymentStatus:   constatnts.PaymentNotMadeYet,
		ExportSale:      request.ExportSale,
		Deleted:         false,
	}

	if !request.ExportSale {
		ids := make([]string, 0, len(request.FiberList))

		for _, v := range request.FiberList {
			fiberUpdateData := map[string]interface{}{
				"status":        "USED",
				"stock_sort_id": v.ItemId,
				"sale_id":       saleId,
				"updated_at":    time.Now(),
			}
			if err := tx.Model(&models.Fiber{}).
				Where("uuid = ? AND deleted = false", v.FiberId).
				Updates(fiberUpdateData).Error; err != nil {
				tx.Rollback()
				return err
			}

			ids = append(ids, v.FiberId)
		}

		fiberList := strings.Join(ids, ",")

		sale.FiberList = fiberList
	}

	if err := tx.Create(&sale).Error; err != nil {
		tx.Rollback()
		return err
	}

	itemSales := make([]models.ItemSales, 0)
	for _, v := range request.ItemSales {
		itemSale := models.ItemSales{
			Uuid:             uuid.New().String(),
			SaleId:           saleId,
			Weight:           v.Weight,
			PricePerKilogram: v.PricePerKilogram,
			StockSortId:      v.StockSortId,
			StockCode:        v.StockCode,
			TotalAmount:      v.TotalAmount,
			Deleted:          false,
		}

		var stockSort models.StockSort
		if err := tx.Model(&models.StockSort{}).Where("uuid = ?", v.StockSortId).First(&stockSort).Error; err != nil {
			tx.Rollback()
			return err
		}

		currentWeight := stockSort.CurrentWeight - v.Weight
		if err := tx.Model(&models.StockSort{}).Where("uuid = ?", v.StockSortId).Update("current_weight", currentWeight).Error; err != nil {
			tx.Rollback()
			return err
		}

		itemSales = append(itemSales, itemSale)
	}

	if len(itemSales) > 0 {
		if err := tx.Create(&itemSales).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	if request.ItemAddOnn != nil {
		itemAddOns := make([]models.ItemAddOnn, 0)
		for _, v := range request.ItemAddOnn {
			itemAddOn := models.ItemAddOnn{
				Uuid:        uuid.New().String(),
				SaleId:      saleId,
				AddOnnName:  v.Name,
				AddOnnPrice: v.Price,
				Deleted:     false,
			}

			itemAddOns = append(itemAddOns, itemAddOn)
		}

		if len(itemAddOns) > 0 {
			if err := tx.Create(&itemAddOns).Error; err != nil {
				tx.Rollback()
				return err
			}
		}
	}

	payment := models.Payment{
		Uuid:        uuid.New().String(),
		UserId:      request.CustomerId,
		Total:       request.TotalAmount,
		Type:        constatnts.Income,
		Description: fmt.Sprintf("Hutang selling SELL%d", sale.ID),
		SalesId:     saleId,
		Deleted:     false,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := tx.Create(&payment).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Commit().Error; err != nil {
		return err
	}

	return nil
}

func (s *SalesService) DeleteSale(saleId string) error {
	db := config.GetDBConn()

	tx := db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	var itemSale models.ItemSales
	if err := tx.Model(&models.ItemSales{}).Where("sale_id = ?", saleId).First(&itemSale).Error; err != nil {
		tx.Rollback()
		return err
	}

	var stockSort models.StockSort
	if err := tx.Model(&models.StockSort{}).Where("uuid = ?", itemSale.StockSortId).First(&stockSort).Error; err != nil {
		tx.Rollback()
		return err
	}

	currentWeight := stockSort.CurrentWeight + itemSale.Weight
	if err := tx.Model(&models.StockSort{}).Where("uuid = ?", itemSale.StockSortId).Update("current_weight", currentWeight).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Model(&models.Sale{}).
		Where("uuid = ?", saleId).
		Update("deleted", true).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Model(&models.ItemSales{}).
		Where("sale_id = ?", saleId).
		Update("deleted", true).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Model(&models.ItemAddOnn{}).
		Where("sale_id = ?", saleId).
		Update("deleted", true).Error; err != nil {
		tx.Rollback()
		return err
	}

	var sale models.Sale
	if err := tx.Model(&models.Sale{}).Where("uuid = ?", saleId).First(&sale).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Model(&models.Payment{}).
		Where("sales_id = ? AND deleted = false", sale.Uuid).
		Update("deleted", true).Error; err != nil {

		tx.Rollback()
		return err
	}

	fiberList := strings.Split(sale.FiberList, ",")
	for _, v := range fiberList {
		if err := tx.Model(&models.Fiber{}).
			Where("uuid = ? AND deleted = false", v).
			Update("status", "FREE").Error; err != nil {
			tx.Rollback()
			return err
		}

	}

	if err := tx.Commit().Error; err != nil {
		return err
	}
	return nil
}

func (s *SalesService) GetSaleById(saleId string) (*models.SaleResponse, error) {
	db := config.GetDBConn()

	var sale models.Sale
	if err := db.Model(&models.Sale{}).Where("uuid = ? AND deleted = false", saleId).
		First(&sale).Error; err != nil {
		return nil, err
	}

	var customer models.User
	if err := db.Where("uuid = ? AND status = true", sale.CustomerId).First(&customer).Error; err != nil {
		return nil, err
	}

	userDetail := models.GetUserDetail{
		Uuid:  customer.Uuid,
		Name:  customer.Name,
		Phone: customer.Phone,
	}

	var payment models.Payment
	lastPayment := ""
	if err := db.Where("sales_id = ? AND deleted = false", sale.Uuid).
		Order("created_at DESC").
		First(&payment).Error; err == nil {
		lastPayment = payment.CreatedAt.Format(time.RFC3339)
	}

	fiberUsedList := make([]models.FiberUsedList, 0)
	if !sale.ExportSale && sale.FiberList != "" {
		fibers := strings.Split(sale.FiberList, ",")

		for _, fiberID := range fibers {
			fiberID = strings.TrimSpace(fiberID)
			if fiberID == "" {
				continue
			}

			var fiber models.Fiber
			if err := db.Model(&models.Fiber{}).Where("uuid = ? AND deleted = false", fiberID).First(&fiber).Error; err != nil {
				return nil, err
			}

			fiberUsedList = append(fiberUsedList, models.FiberUsedList{
				FiberId:   fiber.Uuid,
				FiberName: fiber.Name,
			})
		}
	}

	var itemSales []models.ItemSales
	if err := db.Model(&models.ItemSales{}).Where("sale_id = ? AND deleted = false", sale.Uuid).Find(&itemSales).Error; err != nil {
		return nil, err
	}

	itemSalesList := make([]models.ItemSaleList, 0)
	for _, item := range itemSales {
		var stockSort models.StockSort
		if err := db.Model(&models.StockSort{}).Where("uuid = ?", item.StockSortId).First(&stockSort).Error; err != nil {
			return nil, err
		}

		itemSale := models.ItemSaleList{
			Uuid:             item.Uuid,
			StockCode:        item.StockCode,
			StockSortId:      stockSort.Uuid,
			StockSortName:    stockSort.ItemName,
			PricePerKilogram: item.PricePerKilogram,
			Weight:           item.Weight,
			TotalAmount:      item.TotalAmount,
		}

		itemSalesList = append(itemSalesList, itemSale)
	}

	itemAddOns := make([]models.ItemAddOnn, 0)
	if err := db.Model(&models.ItemAddOnn{}).Where("sale_id = ? AND deleted = false", sale.Uuid).Find(&itemAddOns).Error; err != nil {
		return nil, err
	}

	itemAddOnList := make([]models.ItemAddOnnList, 0)
	for _, a := range itemAddOns {
		itemAddOn := models.ItemAddOnnList{
			Uuid:        a.Uuid,
			AddOnnName:  a.AddOnnName,
			AddOnnPrice: a.AddOnnPrice,
		}

		itemAddOnList = append(itemAddOnList, itemAddOn)
	}

	saleResponse := models.SaleResponse{
		ID:              sale.ID,
		Uuid:            sale.Uuid,
		SaleCode:        fmt.Sprintf("SELL%d", sale.ID),
		Customer:        userDetail,
		CreateAt:        sale.CreatedAt,
		PaymentLateDay:  int(time.Since(sale.CreatedAt).Hours() / 24),
		ExportSale:      sale.ExportSale,
		TotalAmount:     sale.TotalAmount,
		PaidAmount:      sale.PaidAmount,
		RemainingAmount: sale.TotalAmount - sale.PaidAmount,
		PaymentStatus:   sale.PaymentStatus,
		SalesDate:       sale.PurchaseDate,
		LastPaymentDate: lastPayment,
		FiberUsed:       fiberUsedList,
		SoldItem:        itemSalesList,
		AddOn:           itemAddOnList,
	}

	return &saleResponse, nil
}

func (s *SalesService) UpdateSales(id string, request models.SaleRequest) error {
	db := config.GetDBConn()
	tx := db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	var sale models.Sale
	if err := tx.Where("uuid = ? AND deleted = false", id).First(&sale).Error; err != nil {
		tx.Rollback()
		return err
	}

	if sale.FiberList != "" {
		oldFibers := strings.Split(sale.FiberList, ",")
		for _, f := range oldFibers {
			if err := tx.Model(&models.Fiber{}).
				Where("uuid = ?", f).
				Update("status", "FREE").Error; err != nil {
				tx.Rollback()
				return err
			}
		}
	}

	if !request.ExportSale {
		newIDs := make([]string, 0)
		for _, v := range request.FiberList {
			if err := tx.Model(&models.Fiber{}).
				Where("uuid = ? AND deleted = false", v.FiberId).
				Update("status", "USED").Error; err != nil {
				tx.Rollback()
				return err
			}
			newIDs = append(newIDs, v.FiberId)
		}
		sale.FiberList = strings.Join(newIDs, ",")
	} else {
		sale.FiberList = ""
	}

	var oldItems []models.ItemSales
	if err := tx.Where("sale_id = ? AND deleted = false", id).Find(&oldItems).Error; err != nil {
		tx.Rollback()
		return err
	}

	for _, old := range oldItems {
		var stockSort models.StockSort
		if err := tx.Where("uuid = ?", old.StockSortId).First(&stockSort).Error; err != nil {
			tx.Rollback()
			return err
		}

		restoreWeight := stockSort.CurrentWeight + old.Weight
		if err := tx.Model(&models.StockSort{}).
			Where("uuid = ?", old.StockSortId).
			Update("current_weight", restoreWeight).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	if err := tx.Model(&models.ItemSales{}).
		Where("sale_id = ?", id).
		Update("deleted", true).Error; err != nil {
		tx.Rollback()
		return err
	}

	var newItemSales []models.ItemSales
	for _, v := range request.ItemSales {
		itemSale := models.ItemSales{
			Uuid:             uuid.New().String(),
			SaleId:           id,
			Weight:           v.Weight,
			PricePerKilogram: v.PricePerKilogram,
			StockSortId:      v.StockSortId,
			StockCode:        v.StockCode,
			TotalAmount:      v.TotalAmount,
			Deleted:          false,
		}

		var stockSort models.StockSort
		if err := tx.Where("uuid = ?", v.StockSortId).First(&stockSort).Error; err != nil {
			tx.Rollback()
			return err
		}

		newWeight := stockSort.CurrentWeight - v.Weight
		if err := tx.Model(&models.StockSort{}).
			Where("uuid = ?", v.StockSortId).
			Update("current_weight", newWeight).Error; err != nil {
			tx.Rollback()
			return err
		}

		newItemSales = append(newItemSales, itemSale)
	}

	if len(newItemSales) > 0 {
		if err := tx.Create(&newItemSales).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	if err := tx.Model(&models.ItemAddOnn{}).Where("sale_id = ?", id).Update("deleted", true).Error; err != nil {
		tx.Rollback()
		return err
	}

	var newAddOns []models.ItemAddOnn
	for _, v := range request.ItemAddOnn {
		newAddOns = append(newAddOns, models.ItemAddOnn{
			Uuid:        uuid.New().String(),
			SaleId:      id,
			AddOnnName:  v.Name,
			AddOnnPrice: v.Price,
			Deleted:     false,
		})
	}

	if len(newAddOns) > 0 {
		if err := tx.Create(&newAddOns).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	sale.TotalAmount = request.TotalAmount
	sale.RemainingAmount = request.TotalAmount - sale.PaidAmount
	sale.PurchaseDate = request.SalesDate
	sale.ExportSale = request.ExportSale
	sale.CustomerId = request.CustomerId

	if err := tx.Save(&sale).Error; err != nil {
		tx.Rollback()
		return err
	}

	updatePayments := map[string]interface{}{
		"user_id":    request.CustomerId,
		"total":      request.TotalAmount,
		"updated_at": time.Now(),
	}

	if err := tx.Model(&models.Payment{}).
		Where("sales_id = ?", id).
		Updates(updatePayments).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

func (s *SalesService) GetAllSales(filter models.SalesFilter) (*models.SalePaginationResponse, error) {
	db := config.GetDBConn()

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
		errMsg := "Failed to fetch sales data"
		config.GetLogger().Error("%s: %s", errMsg, err.Error())
		return nil, apperror.NewInternal(errMsg, err)
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
		return data, fmt.Errorf("failed to fetch item sales: %w", err)
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
			return data, fmt.Errorf("failed to fetch stock sorts: %w", err)
		}
	}

	if err := db.Where("sale_id IN ?", saleIDs).
		Where("deleted = FALSE").
		Find(&data.AddOns).Error; err != nil {
		return data, fmt.Errorf("failed to fetch add-ons: %w", err)
	}

	if err := db.Where("sale_id IN ?", saleIDs).
		Where("deleted = FALSE").
		Find(&data.Fibers).Error; err != nil {
		return data, fmt.Errorf("failed to fetch fibers: %w", err)
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
			FiberId:   f.Uuid,
			FiberName: f.Name,
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

		response := models.SaleResponse{
			ID:              val.ID,
			Uuid:            val.Uuid,
			SaleCode:        fmt.Sprintf("SELL%d", val.ID),
			Customer:        customer,
			CreateAt:        val.CreatedAt,
			PaymentLateDay:  int(time.Since(val.CreatedAt).Hours() / 24),
			ExportSale:      val.ExportSale,
			TotalAmount:     val.TotalAmount,
			PaidAmount:      val.PaidAmount,
			RemainingAmount: val.TotalAmount - val.PaidAmount,
			PaymentStatus:   val.PaymentStatus,
			SalesDate:       val.PurchaseDate,
			FiberUsed:       fiberList,
			LastPaymentDate: lastPay,
			SoldItem:        itemList,
			AddOn:           addList,
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
