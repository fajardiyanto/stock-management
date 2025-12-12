package service

import (
	"dashboard-app/internal/config"
	"dashboard-app/internal/constants"
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
	db := config.GetDBConn()

	tx := db.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}

	stockEntry := models.StockEntry{
		Uuid:      uuid.New().String(),
		Deleted:   false,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := tx.Create(&stockEntry).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	stockItems := make([]models.StockItem, 0)
	var totalAmount int
	for _, v := range request.StockItems {
		totalPayment := v.Weight * v.PricePerKilogram
		stockItem := models.StockItem{
			Uuid:             uuid.New().String(),
			StockEntryID:     stockEntry.Uuid,
			ItemName:         v.ItemName,
			Weight:           v.Weight,
			PricePerKilogram: v.PricePerKilogram,
			TotalPayment:     totalPayment,
			Deleted:          false,
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
		PaymentStatus: constants.PaymentNotMadeYet,
		TotalAmount:   totalAmount,
		StockId:       stockEntry.Uuid,
		Deleted:       false,
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
		Type:        constants.Income,
		Description: fmt.Sprintf("Hutang Buying STOCK%d", stockEntry.ID),
		PurchaseId:  purchase.Uuid,
		Deleted:     false,
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
		Supplier:        userDetail,
		StockId:         stockEntry.Uuid,
		StockCode:       fmt.Sprintf("STOCK%d", stockEntry.ID),
		TotalAmount:     totalAmount,
		PaidAmount:      0,
		RemainingAmount: 0,
		PaymentStatus:   purchase.PaymentStatus,
	}

	response.StockEntry = &models.StockEntriesResponse{
		Uuid:              stockEntry.Uuid,
		StockCode:         fmt.Sprintf("STOCK-%d", stockEntry.ID),
		AgeInDay:          int(time.Since(stockEntry.CreatedAt).Hours() / 24),
		PurchaseId:        purchase.Uuid,
		Supplier:          userDetail,
		StockItemResponse: make([]models.StockItemResponse, 0),
	}

	for _, item := range stockItems {
		response.StockEntry.StockItemResponse = append(response.StockEntry.StockItemResponse, models.StockItemResponse{
			Uuid:               item.Uuid,
			StockEntryID:       stockEntry.Uuid,
			ItemName:           item.ItemName,
			Weight:             item.Weight,
			PricePerKilogram:   item.PricePerKilogram,
			TotalPayment:       item.TotalPayment,
			IsSorted:           false,
			StockSortResponses: []models.StockSortResponse{},
		})

		response.TotalAmount += item.TotalPayment
		response.RemainingAmount = response.TotalAmount
	}

	return response, nil
}

func (p *PurchaseService) GetAllPurchases(filter models.PurchaseFilter) (*models.PurchaseResponse, error) {
	db := config.GetDBConn()

	if filter.PageNo < 1 {
		filter.PageNo = 1
	}
	if filter.Size < 1 {
		filter.Size = 10
	}

	offset := (filter.PageNo - 1) * filter.Size

	query := db.Model(&models.Purchase{})

	if filter.PurchaseId != "" {
		query = query.Where("id = ?", filter.PurchaseId)
	}

	if filter.PaymentStatus != "ALL" && filter.PaymentStatus != "" {
		query = query.Where("payment_status = ?", filter.PaymentStatus)
	}

	if filter.PurchaseDate != "" {
		parsedDate, err := time.Parse("2006-01-02", filter.PurchaseDate)
		if err == nil {
			query = query.Where("DATE(purchase_date) = ?", parsedDate.Format("2006-01-02"))
		}
	}

	if filter.AgeInDay != "" {
		now := time.Now()

		switch filter.AgeInDay {
		case "LT_1": // LessThan1Day
			query = query.Where("purchase_date >= ?", now.Add(-24*time.Hour))
		case "GT_1": // MoreThan1Day
			query = query.Where("purchase_date <= ?", now.Add(-24*time.Hour))
		case "GT_10": // MoreThan10Day
			query = query.Where("purchase_date <= ?", now.Add(-240*time.Hour))
		case "GT_30": // MoreThan30Day
			query = query.Where("purchase_date <= ?", now.Add(-720*time.Hour))
		}
	}

	if filter.SupplierId != "" {
		query = query.Where("supplier_id = ?", filter.SupplierId)
	}

	query = query.Where("deleted = false")

	var purchases []models.Purchase
	if err := query.
		Limit(filter.Size).
		Offset(offset).
		Order("created_at desc").
		Find(&purchases).Error; err != nil {
		return nil, err
	}

	responses := make([]models.PurchaseDataResponse, 0)

	for _, pur := range purchases {
		var supplier models.User
		if err := db.Where("uuid = ? AND status = true", pur.SupplierID).First(&supplier).Error; err != nil {
			return nil, err
		}

		var payment models.Payment
		lastPayment := ""
		err := db.Where("purchase_id = ? AND deleted = false", pur.Uuid).
			Order("created_at DESC").
			First(&payment).Error
		if err == nil {
			lastPayment = payment.CreatedAt.Format(time.RFC3339)
		}

		var totalAmount int

		userDetail := models.GetUserDetail{
			Uuid:  supplier.Uuid,
			Name:  supplier.Name,
			Phone: supplier.Phone,
		}

		var stockEntry models.StockEntry
		if err = db.Where("uuid = ? AND deleted = false", pur.StockId).First(&stockEntry).Error; err != nil {
			return nil, err
		}

		var stockItems []models.StockItem
		if err = db.Where("stock_entry_id = ? AND deleted = false", stockEntry.Uuid).Find(&stockItems).Error; err != nil {
			return nil, err
		}
		for _, item := range stockItems {
			totalAmount += item.TotalPayment
		}

		resp := models.PurchaseDataResponse{
			PurchaseId:      pur.Uuid,
			Supplier:        userDetail,
			PurchaseDate:    pur.PurchaseDate.Format(time.RFC3339),
			StockId:         pur.StockId,
			StockCode:       fmt.Sprintf("STOCK%d", stockEntry.ID),
			TotalAmount:     totalAmount,
			PaidAmount:      pur.PaidAmount,
			RemainingAmount: totalAmount - pur.PaidAmount,
			PaymentStatus:   pur.PaymentStatus,
			LastPayment:     lastPayment,
		}
		resp.StockEntry = nil

		responses = append(responses, resp)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}

	res := models.PurchaseResponse{
		Size:   filter.Size,
		PageNo: filter.PageNo,
		Total:  int(total),
		Data:   responses,
	}

	return &res, nil
}

func (p *PurchaseService) UpdatePurchase(purchaseId string, request models.UpdatePurchaseRequest) error {
	purchaseRequest := map[string]interface{}{
		"purchase_date": request.PurchaseDate,
		"updated_at":    time.Now(),
	}

	var purchase models.Purchase
	if err := config.GetDBConn().Model(&purchase).Where("uuid = ? AND deleted = false", purchaseId).Updates(purchaseRequest).Error; err != nil {
		return err
	}

	return nil
}
