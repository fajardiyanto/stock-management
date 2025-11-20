package service

import (
	"dashboard-app/internal/config"
	"dashboard-app/internal/constatnts"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type PurchaseService struct {
	userRepo repository.UserRepository
}

func NewPurchaseService(userRepo repository.UserRepository) repository.PurchaseRepository {
	return &PurchaseService{userRepo: userRepo}
}

func (p *PurchaseService) CreatePurchase(request models.CreatePurchaseRequest) (*models.PurchaseDataResponse, error) {
	db := config.GetDBConn().Orm().Debug()

	tx := db.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}

	stockEntry := models.StockEntry{
		Uuid:      uuid.New().String(),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := tx.Create(&stockEntry).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	stockItems := make([]models.StockItem, 0)
	var totalAmount float64
	for _, v := range request.StockItems {
		totalPayment := v.Weight * v.PricePerKilogram
		stockItem := models.StockItem{
			Uuid:             uuid.New().String(),
			StockEntryID:     stockEntry.Uuid,
			ItemName:         v.ItemName,
			Weight:           v.Weight,
			PricePerKilogram: v.PricePerKilogram,
			TotalPayment:     totalPayment,
			CreatedAt:        time.Now(),
			UpdatedAt:        time.Now(),
		}
		totalAmount += totalPayment
		stockItems = append(stockItems, stockItem)
	}

	if len(stockItems) > 0 {
		if err := tx.Create(&stockItems).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	purchase := models.Purchase{
		Uuid:          uuid.New().String(),
		SupplierID:    request.SupplierID,
		PurchaseDate:  request.PurchaseDate,
		PaymentStatus: constatnts.PaymentNotMadeYet,
		TotalAmount:   totalAmount,
		StockId:       stockEntry.Uuid,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := tx.Create(&purchase).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	payment := models.Payment{
		Uuid:        uuid.New().String(),
		UserId:      request.SupplierID,
		Total:       totalAmount,
		Type:        constatnts.Income,
		Description: fmt.Sprintf("Hutang Buying STOCK%d", stockEntry.ID),
		PurchaseId:  purchase.Uuid,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := tx.Create(&payment).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	user, err := p.userRepo.GetUserById(request.SupplierID)
	if err != nil {
		return nil, err
	}

	tx.Commit()

	userDetail := models.GetUserDetail{
		Uuid:  user.Uuid,
		Name:  user.Name,
		Phone: user.Phone,
	}

	response := &models.PurchaseDataResponse{
		PurchaseId:      purchase.Uuid,
		PurchaseDate:    purchase.PurchaseDate.Format(time.RFC3339),
		AgeInDay:        int(time.Since(purchase.PurchaseDate).Hours() / 24),
		Supplier:        userDetail,
		StockId:         stockEntry.Uuid,
		TotalAmount:     totalAmount,
		PaidAmount:      0,
		RemainingAmount: 0,
		PaymentStatus:   purchase.PaymentStatus,
		StockEntry: models.StockEntryResponse{
			Uuid:      stockEntry.Uuid,
			StockCode: fmt.Sprintf("STOCK%d", stockEntry.ID),
			Items:     make([]models.StockItemResponse, 0),
		},
	}

	for _, item := range stockItems {
		response.StockEntry.Items = append(response.StockEntry.Items, models.StockItemResponse{
			Uuid:             item.Uuid,
			StockEntryID:     stockEntry.Uuid,
			ItemName:         item.ItemName,
			Weight:           item.Weight,
			PricePerKilogram: item.PricePerKilogram,
			TotalPayment:     item.TotalPayment,
			Sort:             []models.StockSortResponse{},
		})

		response.TotalAmount += item.TotalPayment
		response.RemainingAmount = response.TotalAmount
	}

	return response, nil
}

func (p *PurchaseService) GetAllPurchases(page, size int) (*models.PurchaseResponse, error) {
	db := config.GetDBConn().Orm().Debug()

	if page < 1 {
		page = 1
	}
	if size < 1 {
		size = 10
	}

	offset := (page - 1) * size

	var purchases []models.Purchase
	if err := db.
		Limit(size).
		Offset(offset).
		Find(&purchases).Error; err != nil {
		return nil, err
	}

	responses := make([]models.PurchaseDataResponse, 0)

	for _, pur := range purchases {

		var supplier models.User
		if err := db.Where("uuid = ?", pur.SupplierID).First(&supplier).Error; err != nil {
			return nil, err
		}

		var stockEntry models.StockEntry
		if err := db.Where("uuid = ?", pur.StockId).First(&stockEntry).Error; err != nil {
			return nil, err
		}

		var stockItems []models.StockItem
		if err := db.Where("stock_entry_id = ?", stockEntry.Uuid).Find(&stockItems).Error; err != nil {
			return nil, err
		}

		var payment models.Payment
		lastPayment := ""
		err := db.Where("purchase_id = ? AND type = ?", pur.Uuid, constatnts.Expense).
			Order("created_at DESC").
			First(&payment).Error
		if err == nil {
			lastPayment = payment.CreatedAt.Format(time.RFC3339)
		}

		totalAmount := 0.0

		stockEntryResp := models.StockEntryResponse{
			Uuid:      stockEntry.Uuid,
			StockCode: fmt.Sprintf("STOCK%d", stockEntry.ID),
			Items:     make([]models.StockItemResponse, 0),
		}

		for _, item := range stockItems {

			var sortir []models.StockSort
			db.Where("stock_item_id = ?", item.Uuid).Find(&sortir)

			itemResp := models.StockItemResponse{
				Uuid:             item.Uuid,
				StockEntryID:     item.StockEntryID,
				ItemName:         item.ItemName,
				Weight:           item.Weight,
				PricePerKilogram: item.PricePerKilogram,
				TotalPayment:     item.TotalPayment,
				Sort:             make([]models.StockSortResponse, 0),
			}

			totalAmount += item.TotalPayment
			for _, s := range sortir {
				itemResp.Sort = append(itemResp.Sort, models.StockSortResponse{
					Uuid:             s.Uuid,
					StockItemID:      item.Uuid,
					ItemName:         s.ItemName,
					Weight:           s.Weight,
					PricePerKilogram: s.PricePerKilogram,
					CurrentWeight:    s.CurrentWeight,
					TotalCost:        s.TotalCost,
					IsShrinkage:      s.IsShrinkage,
				})
			}

			stockEntryResp.Items = append(stockEntryResp.Items, itemResp)
		}

		userDetail := models.GetUserDetail{
			Uuid:  supplier.Uuid,
			Name:  supplier.Name,
			Phone: supplier.Phone,
		}

		resp := models.PurchaseDataResponse{
			PurchaseId:      pur.Uuid,
			Supplier:        userDetail,
			PurchaseDate:    pur.PurchaseDate.Format(time.RFC3339),
			AgeInDay:        int(time.Since(pur.PurchaseDate).Hours() / 24),
			StockId:         pur.StockId,
			TotalAmount:     totalAmount,
			PaidAmount:      pur.PaidAmount,
			RemainingAmount: totalAmount - pur.PaidAmount,
			PaymentStatus:   pur.PaymentStatus,
			StockEntry:      stockEntryResp,
			LastPayment:     lastPayment,
		}

		responses = append(responses, resp)
	}

	var total int64
	if err := db.Model(&models.Purchase{}).Count(&total).Error; err != nil {
		return nil, err
	}

	res := models.PurchaseResponse{
		Size:   size,
		PageNo: page,
		Total:  int(total),
		Data:   responses,
	}

	return &res, nil
}
