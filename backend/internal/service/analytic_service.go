package service

import (
	"dashboard-app/internal/config"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"dashboard-app/util"
	"fmt"
)

type AnalyticService struct{}

func NewAnalyticService() repository.AnalyticRepository {
	return &AnalyticService{}
}

func (s *AnalyticService) GetAnalyticStats() (*models.AnalyticStatsResponse, error) {
	db := config.GetDBConn()

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
	db := config.GetDBConn()

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

func (s *AnalyticService) GetSalesTrendData(year string) ([]models.SalesTrendData, error) {
	db := config.GetDBConn()

	var sales []models.SalesResult
	if err := db.Model(&models.ItemSales{}).
		Select("DATE_TRUNC('month', created_at) AS month, SUM(total_amount) AS total").
		Where("deleted = false AND EXTRACT(YEAR FROM created_at) = ?", 2025).
		Group("month").
		Order("month ASC").
		Scan(&sales).Error; err != nil {
		return nil, err
	}

	var purchases []models.PurchaseResult
	if err := db.Model(&models.StockItem{}).
		Select("DATE_TRUNC('month', created_at) AS month, SUM(total_payment) AS total").
		Where("deleted = false AND EXTRACT(YEAR FROM created_at) = ?", year).
		Group("month").
		Order("month ASC").
		Scan(&purchases).Error; err != nil {
		return nil, err
	}

	monthNames := []string{"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"}
	result := make([]models.SalesTrendData, 12)
	for i := 0; i < 12; i++ {
		result[i] = models.SalesTrendData{
			Month:           monthNames[i],
			SalesRevenue:    0,
			PurchaseRevenue: 0,
		}
	}

	for _, row := range sales {
		m := int(row.Month.Month()) - 1
		result[m].SalesRevenue = row.TotalRevenue
	}

	for _, row := range purchases {
		m := int(row.Month.Month()) - 1
		result[m].PurchaseRevenue = row.TotalPayment
	}

	return result, nil
}

func (s *AnalyticService) GetStockDistributionData() ([]models.StockDistributionData, error) {
	db := config.GetDBConn()

	var stockDistribution []models.StockDistributionDataResult
	if err := db.Table("stock_items si").
		Select("si.id AS id, COALESCE(SUM(si.weight), 0) AS value").
		Joins("LEFT JOIN stock_entries se ON si.stock_entry_id = se.uuid").
		Where("si.deleted = false").
		Group("si.id").
		Scan(&stockDistribution).Error; err != nil {
		return nil, err
	}

	var results []models.StockDistributionData
	for _, v := range stockDistribution {
		result := models.StockDistributionData{
			Name:  fmt.Sprintf("STOCK%d", v.Id),
			Value: int64(v.Value),
			Color: util.RandomHexColor(),
		}

		results = append(results, result)
	}

	return results, nil
}

func (s *AnalyticService) GetSupplierPerformance() ([]models.UserData, error) {
	db := config.GetDBConn()

	var userData []models.UserData
	if err := db.Table("purchase p").
		Select("u.name as name, COALESCE(SUM(p.total_amount), 0) as total").
		Joins(`LEFT JOIN "user" u ON u.uuid = p.supplier_id`).
		Where("p.deleted = false").
		Group("u.name").
		Scan(&userData).Error; err != nil {
		return nil, err
	}

	return userData, nil
}

func (s *AnalyticService) GetCustomerPerformance() ([]models.UserData, error) {
	db := config.GetDBConn()

	var userData []models.UserData
	if err := db.Table("sales p").
		Select("u.name as name, COALESCE(SUM(p.total_amount), 0) as total").
		Joins(`LEFT JOIN "user" u ON u.uuid = p.customer_id`).
		Where("p.deleted = false").
		Group("u.name").
		Scan(&userData).Error; err != nil {
		return nil, err
	}

	return userData, nil
}
