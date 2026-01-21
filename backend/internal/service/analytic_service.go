package service

import (
	"dashboard-app/pkg/apperror"
	"fmt"
	"strconv"
	"time"

	"dashboard-app/internal/config"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"dashboard-app/util"
)

type AnalyticService struct{}

func NewAnalyticService() repository.AnalyticRepository {
	return &AnalyticService{}
}

// GetAnalyticStats =====================================================
// GET ANALYTIC STATS - Optimized with Single Query
// =====================================================
func (s *AnalyticService) GetAnalyticStats(year, month string) (*models.AnalyticStatsResponse, error) {
	db := config.GetDBConn()

	// Single optimized query using CTEs to fetch all stats at once
	monthInt, err := strconv.Atoi(month)
	if err != nil || monthInt < 1 || monthInt > 12 {
		return nil, apperror.NewBadRequest("invalid month")
	}

	var result models.AnalyticStatsResponse

	if err = db.Raw(`
		WITH stock_totals AS (
			SELECT COALESCE(SUM(current_weight), 0) AS total_stock
			FROM stock_sorts
			WHERE deleted = false
			  AND is_shrinkage = false
			  AND created_at >= make_date(?, ?, 1)
			  AND created_at <  make_date(?, ?, 1) + INTERVAL '1 month'
		),
		fiber_totals AS (
			SELECT COUNT(*) AS total_fiber
			FROM fibers
			WHERE status = 'FREE'
			  AND deleted = false
		),
		purchase_totals AS (
			SELECT
				COALESCE(SUM(total_payment), 0) AS total_purchase,
				COALESCE(SUM(weight), 0) AS total_purchase_weight
			FROM stock_items
			WHERE deleted = false
			  AND created_at >= make_date(?, ?, 1)
			  AND created_at <  make_date(?, ?, 1) + INTERVAL '1 month'
		),
		sales_totals AS (
			 SELECT
				 COALESCE(SUM(s.total_amount), 0) AS total_sales,
				 COALESCE(SUM(i.weight), 0) AS total_sales_weight
			 FROM item_sales i
					  JOIN sales s
						   ON s.uuid = i.sale_id
			 WHERE i.deleted = false
			   AND s.deleted = false
			   AND i.created_at >= make_date(?, ?, 1)
			   AND i.created_at <  make_date(?, ?, 1) + INTERVAL '1 month'
		 )
		SELECT
			st.total_stock,
			ft.total_fiber,
			pt.total_purchase,
			sa.total_sales,
			pt.total_purchase_weight,
			sa.total_sales_weight
		FROM stock_totals st
		CROSS JOIN fiber_totals ft
		CROSS JOIN purchase_totals pt
		CROSS JOIN sales_totals sa
	`,
		year, monthInt,
		year, monthInt,
		year, monthInt,
		year, monthInt,
		year, monthInt,
		year, monthInt,
	).Scan(&result).Error; err != nil {
		config.GetLogger().Error("eerrr", err.Error())
		return nil, apperror.NewUnprocessableEntity("failed to fetch analytics stats: ", err)
	}

	return &models.AnalyticStatsResponse{
		TotalStock:          result.TotalStock,
		TotalFiber:          result.TotalFiber,
		TotalPurchase:       result.TotalPurchase,
		TotalSales:          result.TotalSales,
		TotalPurchaseWeight: result.TotalPurchaseWeight,
		TotalSalesWeight:    result.TotalSalesWeight,
	}, nil
}

// GetDailyGetAnalyticStats - Optimized with Single Query
// =====================================================
func (s *AnalyticService) GetDailyGetAnalyticStats(date string) (*models.DailyAnalyticStatsResponse, error) {
	db := config.GetDBConn()

	// Single query with CTEs for daily stats
	var result models.DailyAnalyticStatsResponse
	if err := db.Raw(`
		WITH daily_purchases AS (
			SELECT
				COALESCE(SUM(weight), 0) AS purchase_weight,
				COALESCE(SUM(total_payment), 0) AS purchase_value
			FROM stock_items
			WHERE deleted = false
			AND DATE(created_at) = ?
		),
		daily_sales AS (
			SELECT
             COALESCE(SUM(i.weight), 0) AS sales_weight,
             COALESCE(SUM(s.total_amount), 0) AS sales_value
			 FROM item_sales i
					  JOIN sales s
						   ON s.uuid = i.sale_id
			 WHERE i.deleted = false
			   AND s.deleted = false
			   AND DATE(i.created_at) = ?
		)
		SELECT
			dp.purchase_weight AS daily_purchase_weight,
			dp.purchase_value AS daily_purchase_value,
			ds.sales_weight AS daily_sales_weight,
			ds.sales_value AS daily_sales_value
		FROM daily_purchases dp
		CROSS JOIN daily_sales ds
	`, date, date).Scan(&result).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch daily stats: ", err)
	}

	return &models.DailyAnalyticStatsResponse{
		DailyPurchaseWeight: result.DailyPurchaseWeight,
		DailyPurchaseValue:  result.DailyPurchaseValue,
		DailySalesWeight:    result.DailySalesWeight,
		DailySalesValue:     result.DailySalesValue,
	}, nil
}

// GetSalesTrendData - Optimized with Single Query
// =====================================================
func (s *AnalyticService) GetSalesTrendData(year string) ([]models.SalesTrendData, error) {
	db := config.GetDBConn()

	// Single query to get both sales and purchases data
	var monthlyData []models.SalesTrendDataRow
	if err := db.Raw(`
		WITH sales_by_month AS (
			SELECT
				EXTRACT(MONTH FROM created_at)::int AS month,
				COALESCE(SUM(total_amount), 0) AS total
			FROM item_sales
			WHERE deleted = false
			AND EXTRACT(YEAR FROM created_at) = ?
			GROUP BY EXTRACT(MONTH FROM created_at)
		),
		purchases_by_month AS (
			SELECT
				EXTRACT(MONTH FROM created_at)::int AS month,
				COALESCE(SUM(total_payment), 0) AS total
			FROM stock_items
			WHERE deleted = false
			AND EXTRACT(YEAR FROM created_at) = ?
			GROUP BY EXTRACT(MONTH FROM created_at)
		),
		months AS (
			SELECT generate_series(1, 12) AS month
		)
		SELECT
			m.month,
			COALESCE(s.total, 0) AS sales_revenue,
			COALESCE(p.total, 0) AS purchase_revenue
		FROM months m
		LEFT JOIN sales_by_month s ON s.month = m.month
		LEFT JOIN purchases_by_month p ON p.month = m.month
		ORDER BY m.month
	`, year, year).Scan(&monthlyData).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch sales trend data: ", err)
	}

	// Build response with month names
	monthNames := []string{
		"Jan", "Feb", "Mar", "Apr", "May", "Jun",
		"Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
	}
	result := make([]models.SalesTrendData, 12)

	for _, r := range monthlyData {
		if r.Month >= 1 && r.Month <= 12 {
			result[r.Month-1] = models.SalesTrendData{
				Month:           monthNames[r.Month-1],
				SalesRevenue:    r.SalesRevenue,
				PurchaseRevenue: r.PurchaseRevenue,
			}
		}
	}

	return result, nil
}

// GetStockDistributionData - Optimized with Single Query
// =====================================================
func (s *AnalyticService) GetStockDistributionData() ([]models.StockDistributionData, error) {
	db := config.GetDBConn()

	// Optimized query with proper grouping

	var distributions []models.StockDistResult
	if err := db.Raw(`
		SELECT
			se.id AS stock_entry_id,
			COALESCE(SUM(si.weight), 0) AS total_weight
		FROM stock_items si
		INNER JOIN stock_entries se ON se.uuid = si.stock_entry_id
		WHERE si.deleted = false
		AND se.deleted = false
		GROUP BY se.id
		HAVING SUM(si.weight) > 0
		ORDER BY se.id
	`).Scan(&distributions).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch stock distribution: ", err)
	}

	results := make([]models.StockDistributionData, 0, len(distributions))
	for _, dist := range distributions {
		results = append(results, models.StockDistributionData{
			Name:  fmt.Sprintf("STOCK%d", dist.StockEntryID),
			Value: dist.TotalWeight,
			Color: util.RandomHexColor(),
		})
	}

	return results, nil
}

// GetSupplierPerformance - Optimized with Single Query
// =====================================================
func (s *AnalyticService) GetSupplierPerformance() ([]models.UserData, error) {
	db := config.GetDBConn()

	var userData []models.UserData
	if err := db.Raw(`
		SELECT
			u.name,
			COALESCE(SUM(p.total_amount), 0) AS total
		FROM purchase p
		INNER JOIN "user" u ON u.uuid = p.supplier_id
		WHERE p.deleted = false
		AND u.status = true
		GROUP BY u.uuid, u.name
		HAVING SUM(p.total_amount) > 0
		ORDER BY total DESC
	`).Scan(&userData).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch supplier performance: ", err)
	}

	return userData, nil
}

// GetCustomerPerformance - Optimized with Single Query
// =====================================================
func (s *AnalyticService) GetCustomerPerformance() ([]models.UserData, error) {
	db := config.GetDBConn()

	var userData []models.UserData
	if err := db.Raw(`
		SELECT
			u.name,
			COALESCE(SUM(s.total_amount), 0) AS total
		FROM sales s
		INNER JOIN "user" u ON u.uuid = s.customer_id
		WHERE s.deleted = false
		AND u.status = true
		GROUP BY u.uuid, u.name
		HAVING SUM(s.total_amount) > 0
		ORDER BY total DESC
	`).Scan(&userData).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch customer performance: ", err)
	}

	return userData, nil
}

// GetAnalyticsWithCache - Cached version for frequently accessed data
func (s *AnalyticService) GetAnalyticsWithCache(cacheKey string, ttl time.Duration) (*models.AnalyticStatsResponse, error) {
	// Implement caching logic here if you have a cache library
	// For now, just call the regular method
	return s.GetAnalyticStats("", "")
}

// GetDateRangeStats - Get stats for a specific date range
func (s *AnalyticService) GetDateRangeStats(startDate, endDate string) (*models.DateRangeStatsResponse, error) {
	db := config.GetDBConn()

	var result models.DateRangeStatsResponse
	if err := db.Raw(`
		WITH purchase_stats AS (
			SELECT
				COUNT(*) AS purchase_count,
				COALESCE(SUM(weight), 0) AS purchase_weight,
				COALESCE(SUM(total_payment), 0) AS purchase_value
			FROM stock_items
			WHERE deleted = false
			AND DATE(created_at) BETWEEN ? AND ?
		),
		sales_stats AS (
			SELECT
				COUNT(*) AS sales_count,
				COALESCE(SUM(weight), 0) AS sales_weight,
				COALESCE(SUM(total_amount), 0) AS sales_value
			FROM item_sales
			WHERE deleted = false
			AND DATE(created_at) BETWEEN ? AND ?
		)
		SELECT
			ps.purchase_weight AS total_purchase_weight,
			ps.purchase_value AS total_purchase_value,
			ss.sales_weight AS total_sales_weight,
			ss.sales_value AS total_sales_value,
			ps.purchase_count,
			ss.sales_count
		FROM purchase_stats ps
		CROSS JOIN sales_stats ss
	`, startDate, endDate, startDate, endDate).Scan(&result).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch date range stats: ", err)
	}

	return &models.DateRangeStatsResponse{
		TotalPurchaseWeight: result.TotalPurchaseWeight,
		TotalPurchaseValue:  result.TotalPurchaseValue,
		TotalSalesWeight:    result.TotalSalesWeight,
		TotalSalesValue:     result.TotalSalesValue,
		PurchaseCount:       result.PurchaseCount,
		SalesCount:          result.SalesCount,
		StartDate:           startDate,
		EndDate:             endDate,
	}, nil
}

// GetTopPerformingItems - Get top-selling items
func (s *AnalyticService) GetTopPerformingItems(limit int) ([]models.ItemPerformance, error) {
	db := config.GetDBConn()

	var items []models.ItemPerformance
	if err := db.Raw(`
		SELECT
			ss.sorted_item_name AS item_name,
			COUNT(DISTINCT i.uuid) AS sales_count,
			COALESCE(SUM(i.weight), 0) AS total_weight,
			COALESCE(SUM(i.total_amount), 0) AS total_revenue
		FROM item_sales i
		INNER JOIN stock_sorts ss ON ss.uuid = i.stock_sort_id
		WHERE i.deleted = false
		AND ss.deleted = false
		GROUP BY ss.sorted_item_name
		ORDER BY total_revenue DESC
		LIMIT ?
	`, limit).Scan(&items).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch top performing items: ", err)
	}

	return items, nil
}

// GetProfitAnalysis - Calculate profit margins
func (s *AnalyticService) GetProfitAnalysis() (*models.ProfitAnalysis, error) {
	db := config.GetDBConn()

	var result models.ProfitAnalysis
	if err := db.Raw(`
		WITH costs AS (
			SELECT COALESCE(SUM(total_payment), 0) AS total_cost
			FROM stock_items
			WHERE deleted = false
		),
		revenues AS (
			SELECT COALESCE(SUM(total_amount), 0) AS total_revenue
			FROM item_sales
			WHERE deleted = false
		)
		SELECT
			c.total_cost AS total_purchase_cost,
			r.total_revenue AS total_sales_revenue,
			(r.total_revenue - c.total_cost) AS gross_profit,
			CASE
				WHEN r.total_revenue > 0
				THEN ((r.total_revenue - c.total_cost)::float / r.total_revenue::float) * 100
				ELSE 0
			END AS profit_margin
		FROM costs c
		CROSS JOIN revenues r
	`).Scan(&result).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch profit analysis: ", err)
	}

	return &models.ProfitAnalysis{
		TotalPurchaseCost: result.TotalPurchaseCost,
		TotalSalesRevenue: result.TotalSalesRevenue,
		GrossProfit:       result.GrossProfit,
		ProfitMargin:      result.ProfitMargin,
	}, nil
}

// GetInventoryTurnover - Calculate inventory turnover metrics
func (s *AnalyticService) GetInventoryTurnover() (*models.InventoryTurnover, error) {
	db := config.GetDBConn()

	var result models.InventoryTurnover
	if err := db.Raw(`
		WITH inventory_stats AS (
			SELECT
				AVG(current_weight) AS avg_inventory
			FROM stock_sorts
			WHERE deleted = false
		),
		sales_stats AS (
			SELECT
				COALESCE(SUM(weight), 0) AS total_sold
			FROM item_sales
			WHERE deleted = false
		)
		SELECT
			COALESCE(inv.avg_inventory, 0) AS average_inventory,
			COALESCE(sal.total_sold, 0) AS total_sold,
			CASE
				WHEN inv.avg_inventory > 0
				THEN sal.total_sold::float / inv.avg_inventory
				ELSE 0
			END AS turnover_rate,
			CASE
				WHEN sal.total_sold > 0
				THEN (inv.avg_inventory / sal.total_sold::float) * 365
				ELSE 0
			END AS days_on_hand
		FROM inventory_stats inv
		CROSS JOIN sales_stats sal
	`).Scan(&result).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch inventory turnover: ", err)
	}

	return &models.InventoryTurnover{
		AverageInventory: result.AverageInventory,
		TotalSold:        result.TotalSold,
		TurnoverRate:     result.TurnoverRate,
		DaysOnHand:       result.DaysOnHand,
	}, nil
}

func (s *AnalyticService) GetSalesSupplierDetail(
	filter models.SalesSupplierDetailFilter,
) (*models.SalesSupplierDetailPaginationResponse, error) {

	db := config.GetDBConn()

	if filter.PageNo < 1 {
		filter.PageNo = 1
	}
	if filter.Size <= 0 {
		filter.Size = 10
	}

	offset := (filter.PageNo - 1) * filter.Size

	var result []models.SalesSupplierDetailResponse
	var total int64

	query := `
	WITH base_data AS (
		SELECT
			sup.name              AS supplier_name,
			ss.sorted_item_name   AS item_name,
			fa.weight             AS qty,
			it.price_per_kilogram AS price,
			cust.name             AS customer_name,
			f.name                AS fiber_name
		FROM sales s
				 JOIN "user" cust ON cust.uuid = s.customer_id
				 JOIN fibers f ON f.uuid = ANY(string_to_array(s.fiber_list, ','))
				 JOIN fiber_allocations fa
					  ON fa.fiber_id = f.uuid
					 AND fa.deleted = false
				 LEFT JOIN item_sales it
						ON it.sale_id = s.uuid
					   AND it.stock_sort_id = fa.stock_sort_id
					   AND it.deleted = false
				 JOIN stock_sorts ss ON ss.uuid = fa.stock_sort_id
				 JOIN stock_items si ON si.uuid = ss.stock_item_id
				 JOIN stock_entries se ON se.uuid = si.stock_entry_id
				 JOIN purchase p ON p.stock_id = se.uuid
				 JOIN "user" sup ON sup.uuid = p.supplier_id
		WHERE s.deleted = false
		  AND s.fiber_list IS NOT NULL
		  AND s.fiber_list <> ''

		UNION ALL

		SELECT
			sup.name              AS supplier_name,
			ss.sorted_item_name   AS item_name,
			it.weight             AS qty,
			it.price_per_kilogram AS price,
			cust.name             AS customer_name,
			''                    AS fiber_name
		FROM sales s
				 JOIN "user" cust ON cust.uuid = s.customer_id
				 JOIN item_sales it
					  ON it.sale_id = s.uuid
					 AND it.deleted = false
				 JOIN stock_sorts ss ON ss.uuid = it.stock_sort_id
				 JOIN stock_items si ON si.uuid = ss.stock_item_id
				 JOIN stock_entries se ON se.uuid = si.stock_entry_id
				 JOIN purchase p ON p.stock_id = se.uuid
				 JOIN "user" sup ON sup.uuid = p.supplier_id
		WHERE s.deleted = false
		  AND (s.fiber_list IS NULL OR s.fiber_list = '')
	)

	SELECT
		supplier_name,
		item_name,
		qty,
		price,
		customer_name,
		fiber_name
	FROM base_data
	ORDER BY supplier_name, item_name
	LIMIT ? OFFSET ?;
	`

	if err := db.Raw(query, filter.Size, offset).Scan(&result).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity(
			"failed to fetch analytics stats", err,
		)
	}

	countQuery := `
	WITH base_data AS (
		SELECT 1
		FROM sales s
				 JOIN "user" cust ON cust.uuid = s.customer_id
				 JOIN fibers f
					  ON f.uuid = ANY(string_to_array(s.fiber_list, ','))
				 JOIN fiber_allocations fa
					  ON fa.fiber_id = f.uuid
						  AND fa.deleted = false
				 LEFT JOIN item_sales it
						   ON it.sale_id = s.uuid
							   AND it.stock_sort_id = fa.stock_sort_id
							   AND it.deleted = false
				 JOIN stock_sorts ss ON ss.uuid = fa.stock_sort_id
				 JOIN stock_items si ON si.uuid = ss.stock_item_id
				 JOIN stock_entries se ON se.uuid = si.stock_entry_id
				 JOIN purchase p ON p.stock_id = se.uuid
				 JOIN "user" sup ON sup.uuid = p.supplier_id
		WHERE s.deleted = false
		  AND s.fiber_list IS NOT NULL
		  AND s.fiber_list <> ''
	
		UNION ALL
	
		SELECT 1
		FROM sales s
				 JOIN "user" cust ON cust.uuid = s.customer_id
				 JOIN item_sales it
					  ON it.sale_id = s.uuid
						  AND it.deleted = false
				 JOIN stock_sorts ss ON ss.uuid = it.stock_sort_id
				 JOIN stock_items si ON si.uuid = ss.stock_item_id
				 JOIN stock_entries se ON se.uuid = si.stock_entry_id
				 JOIN purchase p ON p.stock_id = se.uuid
				 JOIN "user" sup ON sup.uuid = p.supplier_id
		WHERE s.deleted = false
		  AND (s.fiber_list IS NULL OR s.fiber_list = '')
	)
	
	SELECT COUNT(*) FROM base_data;
	`

	if err := db.Raw(countQuery).Scan(&total).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity(
			"failed to count analytics stats", err,
		)
	}

	return &models.SalesSupplierDetailPaginationResponse{
		PageNo: filter.PageNo,
		Size:   filter.Size,
		Total:  total,
		Data:   result,
	}, nil
}

func (s *AnalyticService) SalesSupplierDetailWithPurchaseData(
	filter models.SalesSupplierDetailFilter,
) (*models.SalesSupplierDetailWithPurchaseDataPaginationResponse, error) {

	db := config.GetDBConn()

	if filter.PageNo < 1 {
		filter.PageNo = 1
	}
	if filter.Size <= 0 {
		filter.Size = 10
	}

	offset := (filter.PageNo - 1) * filter.Size

	var result []models.SalesSupplierDetailWithPurchaseDataResponse
	var total int64

	query := `
	WITH base_data AS (
		SELECT
			sup.name              AS supplier_name,
			p.purchase_date       AS purchase_date,
			ss.weight             AS stock_weight,
			ss.current_weight     AS current_weight,
			ss.sorted_item_name   AS item_name,
			fa.weight             AS qty,
			it.price_per_kilogram AS price,
			cust.name             AS customer_name,
			f.name                AS fiber_name
		FROM sales s
				 JOIN "user" cust ON cust.uuid = s.customer_id
				 JOIN fibers f ON f.uuid = ANY(string_to_array(s.fiber_list, ','))
				 JOIN fiber_allocations fa ON fa.fiber_id = f.uuid AND fa.deleted = false
				 LEFT JOIN item_sales it
						   ON it.sale_id = s.uuid
							   AND it.stock_sort_id = fa.stock_sort_id
							   AND it.deleted = false
				 JOIN stock_sorts ss ON ss.uuid = fa.stock_sort_id
				 JOIN stock_items si ON si.uuid = ss.stock_item_id
				 JOIN stock_entries se ON se.uuid = si.stock_entry_id
				 JOIN purchase p ON p.stock_id = se.uuid
				 JOIN "user" sup ON sup.uuid = p.supplier_id
		WHERE s.deleted = false
		  AND s.fiber_list IS NOT NULL
		  AND s.fiber_list <> ''
	
		UNION ALL
	
		SELECT
			sup.name              AS supplier_name,
			p.purchase_date       AS purchase_date,
			ss.weight             AS stock_weight,
			ss.current_weight     AS current_weight,
			ss.sorted_item_name   AS item_name,
			it.weight             AS qty,
			si.price_per_kilogram AS price,
			cust.name             AS customer_name,
			''                    AS fiber_name
		FROM sales s
				 JOIN "user" cust ON cust.uuid = s.customer_id
				 JOIN item_sales it ON it.sale_id = s.uuid
				 JOIN stock_sorts ss ON ss.uuid = it.stock_sort_id
				 JOIN stock_items si ON si.uuid = ss.stock_item_id
				 JOIN stock_entries se ON se.uuid = si.stock_entry_id
				 JOIN purchase p ON p.stock_id = se.uuid
				 JOIN "user" sup ON sup.uuid = p.supplier_id
		WHERE s.deleted = false
		  AND (s.fiber_list IS NULL OR s.fiber_list = '')
	),
	
		 numbered AS (
			 SELECT *,
					ROW_NUMBER() OVER (PARTITION BY supplier_name ORDER BY item_name) AS rn
			 FROM base_data
		 )
	
	SELECT
		supplier_name,
		purchase_date,
		stock_weight,
		item_name,
		qty,
		price,
		customer_name,
		fiber_name,
		current_weight
	FROM numbered
	ORDER BY supplier_name, item_name
	LIMIT ? OFFSET ?;
	`

	if err := db.Raw(query, filter.Size, offset).Scan(&result).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity(
			"failed to fetch analytics stats", err,
		)
	}

	countQuery := `
	WITH base_data AS (
		SELECT 1
		FROM sales s
				 JOIN "user" cust ON cust.uuid = s.customer_id
				 JOIN fibers f
					  ON f.uuid = ANY(string_to_array(s.fiber_list, ','))
				 JOIN fiber_allocations fa
					  ON fa.fiber_id = f.uuid
						  AND fa.deleted = false
				 LEFT JOIN item_sales it
						   ON it.sale_id = s.uuid
							   AND it.stock_sort_id = fa.stock_sort_id
							   AND it.deleted = false
				 JOIN stock_sorts ss ON ss.uuid = fa.stock_sort_id
				 JOIN stock_items si ON si.uuid = ss.stock_item_id
				 JOIN stock_entries se ON se.uuid = si.stock_entry_id
				 JOIN purchase p ON p.stock_id = se.uuid
				 JOIN "user" sup ON sup.uuid = p.supplier_id
		WHERE s.deleted = false
		  AND s.fiber_list IS NOT NULL
		  AND s.fiber_list <> ''
	
		UNION ALL
	
		SELECT 1
		FROM sales s
				 JOIN "user" cust ON cust.uuid = s.customer_id
				 JOIN item_sales it
					  ON it.sale_id = s.uuid
						  AND it.deleted = false
				 JOIN stock_sorts ss ON ss.uuid = it.stock_sort_id
				 JOIN stock_items si ON si.uuid = ss.stock_item_id
				 JOIN stock_entries se ON se.uuid = si.stock_entry_id
				 JOIN purchase p ON p.stock_id = se.uuid
				 JOIN "user" sup ON sup.uuid = p.supplier_id
		WHERE s.deleted = false
		  AND (s.fiber_list IS NULL OR s.fiber_list = '')
	)
	
	SELECT COUNT(*) FROM base_data;
	`

	if err := db.Raw(countQuery).Scan(&total).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity(
			"failed to count analytics stats", err,
		)
	}

	results := make([]models.SalesSupplierDetailWithPurchaseDataResponse, 0)
	for _, v := range result {
		res := models.SalesSupplierDetailWithPurchaseDataResponse{
			SupplierName:  v.SupplierName,
			PurchaseDate:  v.PurchaseDate,
			StockWeight:   v.StockWeight,
			ItemName:      v.ItemName,
			Quantity:      v.Quantity,
			Price:         v.Price,
			CustomerName:  v.CustomerName,
			FiberName:     v.FiberName,
			CurrentWeight: v.CurrentWeight,
			AgeInDay:      int(time.Since(v.PurchaseDate).Hours() / 24),
		}
		results = append(results, res)
	}

	return &models.SalesSupplierDetailWithPurchaseDataPaginationResponse{
		PageNo: filter.PageNo,
		Size:   filter.Size,
		Total:  total,
		Data:   results,
	}, nil
}
