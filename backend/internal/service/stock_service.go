package service

import (
	"dashboard-app/internal/config"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"fmt"
	"time"
)

type StockService struct{}

func NewStockService() repository.StockRepository {
	return &StockService{}
}

func (s *StockService) GetAllStockEntries(page int, size int) (*models.StockResponse, error) {
	db := config.GetDBConn().Orm().Debug()

	if page < 1 {
		page = 1
	}
	if size < 1 {
		size = 10
	}

	offset := (page - 1) * size

	var total int64
	db.Model(&models.StockEntry{}).Count(&total)

	var stockEntries []models.StockEntry
	if err := db.
		Limit(size).
		Offset(offset).
		Order("created_at DESC").
		Find(&stockEntries).Error; err != nil {
		return nil, err
	}

	stockEntriesResponse := make([]models.StockEntryResponse, 0)

	for _, stockEntry := range stockEntries {
		var purchase models.Purchase
		if err := db.Where("stock_id = ?", stockEntry.Uuid).First(&purchase).Error; err != nil {
			return nil, err
		}

		var supplier models.User
		if err := db.Where("uuid = ?", purchase.SupplierID).First(&supplier).Error; err != nil {
			return nil, err
		}

		supplierDetail := models.GetUserDetail{
			Uuid:  supplier.Uuid,
			Name:  supplier.Name,
			Phone: supplier.Phone,
		}

		stockEntryResp := models.StockEntryResponse{
			Uuid:              stockEntry.Uuid,
			StockCode:         fmt.Sprintf("STOCK%d", stockEntry.ID),
			AgeInDay:          int(time.Since(stockEntry.CreatedAt).Hours() / 24),
			PurchaseId:        purchase.Uuid,
			Supplier:          supplierDetail,
			StockItemResponse: make([]models.StockItemResponse, 0),
		}

		var stockItems []models.StockItem
		if err := db.Where("stock_entry_id = ?", stockEntry.Uuid).Find(&stockItems).Error; err != nil {
			return nil, err
		}

		for _, item := range stockItems {

			var sorted []models.StockSort
			db.Where("stock_item_id = ?", item.Uuid).Find(&sorted)

			itemResp := models.StockItemResponse{
				Uuid:             item.Uuid,
				StockEntryID:     item.StockEntryID,
				ItemName:         item.ItemName,
				Weight:           item.Weight,
				PricePerKilogram: item.PricePerKilogram,
				TotalPayment:     item.TotalPayment,
				IsSorted:         len(sorted) > 0,
			}

			for _, v := range sorted {
				itemResp.StockSortResponses = append(itemResp.StockSortResponses, models.StockSortResponse{
					Uuid:             v.Uuid,
					StockItemID:      item.Uuid,
					ItemName:         v.ItemName,
					Weight:           v.Weight,
					PricePerKilogram: v.PricePerKilogram,
					CurrentWeight:    v.CurrentWeight,
					TotalCost:        v.TotalCost,
					IsShrinkage:      v.IsShrinkage,
				})
			}

			stockEntryResp.StockItemResponse = append(stockEntryResp.StockItemResponse, itemResp)
		}

		stockEntriesResponse = append(stockEntriesResponse, stockEntryResp)
	}

	response := &models.StockResponse{
		Size:   size,
		PageNo: page,
		Total:  int(total),
		Data:   stockEntriesResponse,
	}

	return response, nil
}
