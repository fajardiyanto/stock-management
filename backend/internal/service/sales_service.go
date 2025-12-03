package service

import (
	"dashboard-app/internal/config"
	"dashboard-app/internal/constatnts"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"fmt"
	"github.com/google/uuid"
	"strconv"
	"strings"
	"time"
)

type SalesService struct{}

func NewSalesService() repository.SalesRepository {
	return &SalesService{}
}

func (s *SalesService) CreateSales(request models.SaleRequest) error {
	db := config.GetDBConn().Orm().Debug()

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
			if err := tx.Model(&models.Fiber{}).
				Where("uuid = ? AND deleted = false", v.FiberId).
				Update("status", "USED").Error; err != nil {
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

		currentWeight := stockSort.Weight - v.Weight
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
		Description: fmt.Sprintf("Pembayaran selling SELL%d", sale.ID),
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

func (s *SalesService) GetAllSales(filter models.SalesFilter) (*models.SalePaginationResponse, error) {
	db := config.GetDBConn().Orm().Debug()

	if filter.PageNo < 1 {
		filter.PageNo = 1
	}
	if filter.Size < 1 {
		filter.Size = 10
	}

	offset := (filter.PageNo - 1) * filter.Size

	query := db.Model(&models.Sale{})

	if filter.SalesId != "" {
		salesId, err := strconv.Atoi(filter.SalesId)
		if err != nil {
			return nil, err
		}
		query = query.Where("id = ?", salesId)
	}

	if filter.PaymentStatus != "ALL" && filter.PaymentStatus != "" {
		query = query.Where("payment_status = ?", filter.PaymentStatus)
	}

	if filter.SalesDate != "" {
		parsedDate, err := time.Parse("2006-01-02", filter.SalesDate)
		if err == nil {
			query = query.Where("DATE(purchase_date) = ?", parsedDate.Format("2006-01-02"))
		}
	}

	if filter.CustomerId != "" {
		query = query.Where("customer_id = ?", filter.CustomerId)
	}

	query = query.Where("deleted = false")

	var sales []models.Sale
	if err := query.
		Limit(filter.Size).
		Offset(offset).
		Order("created_at desc").
		Find(&sales).Error; err != nil {
		return nil, err
	}

	responses := make([]models.SaleResponse, 0)
	for _, v := range sales {
		var customer models.User
		if err := db.Where("uuid = ? AND status = true", v.CustomerId).First(&customer).Error; err != nil {
			return nil, err
		}

		userDetail := models.GetUserDetail{
			Uuid:  customer.Uuid,
			Name:  customer.Name,
			Phone: customer.Phone,
		}

		var payment models.Payment
		lastPayment := ""
		if err := db.Where("sales_id = ? AND deleted = false", v.Uuid).
			Order("created_at DESC").
			First(&payment).Error; err == nil {
			lastPayment = payment.CreatedAt.Format(time.RFC3339)
		}

		fiberUsedList := make([]models.FiberUsedList, 0)
		if !v.ExportSale && v.FiberList != "" {
			fibers := strings.Split(v.FiberList, ",")

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
		if err := db.Model(&models.ItemSales{}).Where("sale_id = ? AND deleted = false", v.Uuid).Find(&itemSales).Error; err != nil {
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
		if err := db.Model(&models.ItemAddOnn{}).Where("sale_id = ? AND deleted = false", v.Uuid).Find(&itemAddOns).Error; err != nil {
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
			ID:              v.ID,
			Uuid:            v.Uuid,
			SaleCode:        fmt.Sprintf("SELL%d", v.ID),
			Customer:        userDetail,
			CreateAt:        v.CreatedAt,
			PaymentLateDay:  int(time.Since(v.CreatedAt).Hours() / 24),
			ExportSale:      v.ExportSale,
			TotalAmount:     v.TotalAmount,
			PaidAmount:      v.PaidAmount,
			RemainingAmount: v.TotalAmount - v.PaidAmount,
			PaymentStatus:   v.PaymentStatus,
			SalesDate:       v.PurchaseDate,
			LastPaymentDate: lastPayment,
			FiberUsed:       fiberUsedList,
			SoldItem:        itemSalesList,
			AddOn:           itemAddOnList,
		}

		responses = append(responses, saleResponse)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}

	res := models.SalePaginationResponse{
		Size:   filter.Size,
		PageNo: filter.PageNo,
		Total:  int(total),
		Data:   responses,
	}

	return &res, nil
}

func (s *SalesService) DeleteSale(saleId string) error {
	db := config.GetDBConn().Orm().Debug()

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

	currentWeight := stockSort.Weight + itemSale.Weight
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
