package models

import "time"

type AnalyticStatsResponse struct {
	TotalStock          int64 `json:"total_stock" gorm:"column:total_stock"`
	TotalFiber          int64 `json:"total_fiber" gorm:"column:total_fiber"`
	TotalPurchase       int64 `json:"total_purchase" gorm:"column:total_purchase"`
	TotalSales          int64 `json:"total_sales" gorm:"column:total_sales"`
	TotalPurchaseWeight int64 `json:"total_purchase_weight" gorm:"column:total_purchase_weight"`
	TotalSalesWeight    int64 `json:"total_sales_weight" gorm:"column:total_sales_weight"`
}

type DailyAnalyticStatsResponse struct {
	DailyPurchaseWeight int64 `json:"daily_purchase_weight" gorm:"column:daily_purchase_weight"`
	DailyPurchaseValue  int64 `json:"daily_purchase_value" gorm:"column:daily_purchase_value"`
	DailySalesWeight    int64 `json:"daily_sales_weight" gorm:"column:daily_sales_weight"`
	DailySalesValue     int64 `json:"daily_sales_value" gorm:"column:daily_sales_value"`
}

type SalesTrendData struct {
	Month           string `json:"month"`
	SalesRevenue    int64  `json:"sales_revenue"`
	PurchaseRevenue int64  `json:"purchase_revenue"`
}

type SalesTrendDataRow struct {
	Month           int   `json:"month" gorm:"column:month"`
	SalesRevenue    int64 `json:"sales_revenue" gorm:"column:sales_revenue"`
	PurchaseRevenue int64 `json:"purchase_revenue" gorm:"column:purchase_revenue"`
}

type StockDistributionData struct {
	Name  string `json:"name"`
	Value int64  `json:"value"`
	Color string `json:"color"`
}

type UserData struct {
	Name  string `json:"name" gorm:"column:name"`
	Total int64  `json:"total" gorm:"column:total"`
}

type SalesResult struct {
	Month        time.Time `json:"month" gorm:"column:month"`
	TotalRevenue int64     `json:"total" gorm:"column:total"`
}

type PurchaseResult struct {
	Month        time.Time `json:"month" gorm:"column:month"`
	TotalPayment int64     `json:"total" gorm:"column:total"`
}

type StockDistributionDataResult struct {
	Id    int `json:"id" gorm:"column:id"`
	Value int `json:"value" gorm:"column:value"`
}

type DateRangeStatsResponse struct {
	TotalPurchaseWeight int64  `json:"total_purchase_weight"`
	TotalPurchaseValue  int64  `json:"total_purchase_value"`
	TotalSalesWeight    int64  `json:"total_sales_weight"`
	TotalSalesValue     int64  `json:"total_sales_value"`
	PurchaseCount       int64  `json:"purchase_count"`
	SalesCount          int64  `json:"sales_count"`
	StartDate           string `json:"start_date"`
	EndDate             string `json:"end_date"`
}
type ItemPerformance struct {
	ItemName     string `json:"item_name" gorm:"column:item_name"`
	SalesCount   int64  `json:"sales_count" gorm:"column:sales_count"`
	TotalWeight  int64  `json:"total_weight" gorm:"column:total_weight"`
	TotalRevenue int64  `json:"total_revenue" gorm:"column:total_revenue"`
}

type ProfitAnalysis struct {
	TotalPurchaseCost int64   `gorm:"column:total_purchase_cost"`
	TotalSalesRevenue int64   `gorm:"column:total_sales_revenue"`
	GrossProfit       int64   `gorm:"column:gross_profit"`
	ProfitMargin      float64 `gorm:"column:profit_margin"`
}

type InventoryTurnover struct {
	AverageInventory float64 `gorm:"column:average_inventory"`
	TotalSold        int64   `gorm:"column:total_sold"`
	TurnoverRate     float64 `gorm:"column:turnover_rate"`
	DaysOnHand       float64 `gorm:"column:days_on_hand"`
}

type StockDistResult struct {
	StockEntryID int   `gorm:"column:stock_entry_id"`
	TotalWeight  int64 `gorm:"column:total_weight"`
}

type SalesSupplierDetailFilter struct {
	Size   int    `form:"size"`
	PageNo int    `form:"page_no"`
	Month  int    `form:"month"`
	Year   string `form:"year"`
}

type SalesSupplierDetailResponse struct {
	SupplierName string `json:"supplier_name" gorm:"column:supplier_name"`
	ItemName     string `json:"item_name" gorm:"column:item_name"`
	Quantity     int64  `json:"qty" gorm:"column:qty"`
	Price        int64  `json:"price" gorm:"column:price"`
	CustomerName string `json:"customer_name" gorm:"column:customer_name"`
	FiberName    string `json:"fiber_name" gorm:"column:fiber_name"`
}

type SalesSupplierDetailPaginationResponse struct {
	Size   int                           `json:"size"`
	PageNo int                           `json:"page_no"`
	Total  int64                         `json:"total"`
	Data   []SalesSupplierDetailResponse `json:"data"`
}

type SalesSupplierDetailWithPurchaseDataResponse struct {
	SupplierName  string    `json:"supplier_name" gorm:"column:supplier_name"`
	PurchaseDate  time.Time `json:"purchase_date" gorm:"column:purchase_date"`
	StockWeight   int64     `json:"stock_weight" gorm:"column:stock_weight"`
	ItemName      string    `json:"item_name" gorm:"column:item_name"`
	Quantity      int64     `json:"qty" gorm:"column:qty"`
	Price         int64     `json:"price" gorm:"column:price"`
	CustomerName  string    `json:"customer_name" gorm:"column:customer_name"`
	FiberName     string    `json:"fiber_name" gorm:"column:fiber_name"`
	CurrentWeight int64     `json:"current_weight" gorm:"column:current_weight"`
	AgeInDay      int       `json:"age_in_day"`
}

type SalesSupplierDetailWithPurchaseDataPaginationResponse struct {
	Size   int                                           `json:"size"`
	PageNo int                                           `json:"page_no"`
	Total  int64                                         `json:"total"`
	Data   []SalesSupplierDetailWithPurchaseDataResponse `json:"data"`
}
