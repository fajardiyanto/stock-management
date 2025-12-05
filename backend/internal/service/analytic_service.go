package service

import (
	"dashboard-app/internal/config"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
)

type AnalyticService struct{}

func NewAnalyticService() repository.AnalyticRepository {
	return &AnalyticService{}
}

func (s *AnalyticService) GetAnalyticStats() (*models.AnalyticStatsResponse, error) {
	db := config.GetDBConn().Orm().Debug()

	var totalStock int64
	if err := db.Model(&models.StockSort{}).
		Where("deleted = false").
		Pluck("COALESCE(SUM(current_weight), 0) AS total_stock", &totalStock).
		Error; err != nil {
		return nil, err
	}

	var totalFiber int64
	if err := db.Model(&models.Fiber{}).
		Where("status = 'FREE' AND deleted = false").
		Count(&totalFiber).Error; err != nil {
		return nil, err
	}

	var totalPurchase int64
	if err := db.Model(&models.StockItem{}).
		Where("deleted = false").
		Pluck("COALESCE(SUM(total_payment), 0) AS total_purchase", &totalPurchase).
		Error; err != nil {
		return nil, err
	}

	var totalSales int64
	if err := db.Model(&models.ItemSales{}).
		Where("deleted = false").
		Pluck("COALESCE(SUM(total_amount), 0) AS total_sales", &totalSales).
		Error; err != nil {
		return nil, err
	}

	var totalPurchaseWeight int64
	if err := db.Model(&models.StockItem{}).
		Where("deleted = false").
		Pluck("COALESCE(SUM(weight), 0) AS total_purchase_weight", &totalPurchaseWeight).
		Error; err != nil {
		return nil, err
	}

	var totalSalesWeight int64
	if err := db.Model(&models.ItemSales{}).
		Where("deleted = false").
		Pluck("COALESCE(SUM(weight), 0) AS total_purchase_weight", &totalSalesWeight).
		Error; err != nil {
		return nil, err
	}

	response := models.AnalyticStatsResponse{
		TotalStock:          totalStock,
		TotalFiber:          totalFiber,
		TotalPurchase:       totalPurchase,
		TotalSales:          totalSales,
		TotalPurchaseWeight: totalPurchaseWeight,
		TotalSalesWeight:    totalSalesWeight,
	}

	return &response, nil
}

func (s *AnalyticService) GetDailyGetAnalyticStats(date string) (*models.DailyAnalyticStatsResponse, error) {
	db := config.GetDBConn().Orm().Debug()

	var totalPurchaseWeight int64
	if err := db.Model(&models.StockItem{}).
		Where("deleted = false AND DATE(created_at) = ?", date).
		Pluck("COALESCE(SUM(weight), 0)", &totalPurchaseWeight).Error; err != nil {
		return nil, err
	}

	var totalPurchase int64
	if err := db.Model(&models.StockItem{}).
		Where("deleted = false AND DATE(created_at) = ?", date).
		Pluck("COALESCE(SUM(total_payment), 0) AS total_purchase", &totalPurchase).
		Error; err != nil {
		return nil, err
	}

	var totalSalesWeight int64
	if err := db.Model(&models.ItemSales{}).
		Where("deleted = false AND DATE(created_at) = ?", date).
		Pluck("COALESCE(SUM(weight), 0) AS total_purchase_weight", &totalSalesWeight).
		Error; err != nil {
		return nil, err
	}

	var totalSales int64
	if err := db.Model(&models.ItemSales{}).
		Where("deleted = false AND DATE(created_at) = ?", date).
		Pluck("COALESCE(SUM(total_amount), 0) AS total_sales", &totalSales).
		Error; err != nil {
		return nil, err
	}

	response := models.DailyAnalyticStatsResponse{
		DailyPurchaseWeight: totalPurchaseWeight,
		DailyPurchaseValue:  totalPurchase,
		DailySalesWeight:    totalSalesWeight,
		DailySalesValue:     totalSales,
	}

	return &response, nil
}
