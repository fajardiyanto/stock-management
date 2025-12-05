package models

type AnalyticStatsResponse struct {
	TotalStock          int64 `json:"total_stock"`
	TotalFiber          int64 `json:"total_fiber"`
	TotalPurchase       int64 `json:"total_purchase"`
	TotalSales          int64 `json:"total_sales"`
	TotalPurchaseWeight int64 `json:"total_purchase_weight"`
	TotalSalesWeight    int64 `json:"total_sales_weight"`
}

type DailyAnalyticStatsResponse struct {
	DailyPurchaseWeight int64 `json:"daily_purchase_weight"`
	DailyPurchaseValue  int64 `json:"daily_purchase_value"`
	DailySalesWeight    int64 `json:"daily_sales_weight"`
	DailySalesValue     int64 `json:"daily_sales_value"`
}

type SalesTrendData struct {
	Month           string `json:"month"`
	SalesRevenue    int64  `json:"sales_revenue"`
	PurchaseRevenue int64  `json:"purchase_revenue"`
}

type StockDistributionData struct {
	Name  string `json:"name"`
	Value int64  `json:"value"`
	Color string `json:"color"`
}

type UserData struct {
	Name  string `json:"name"`
	Total int64  `json:"total"`
}
