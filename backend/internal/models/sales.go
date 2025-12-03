package models

import "time"

type Sale struct {
	ID              int       `json:"id" gorm:"primary_key;AUTO_INCREMENT"`
	Uuid            string    `json:"uuid" gorm:"column:uuid"`
	CustomerId      string    `json:"customer_id" gorm:"column:customer_id"`
	PurchaseDate    time.Time `json:"purchase_date" gorm:"column:purchase_date"`
	PaidAmount      int       `json:"paid_amount" gorm:"column:paid_amount"`
	RemainingAmount int       `json:"remaining_amount" gorm:"column:remaining_amount"`
	TotalAmount     int       `json:"total_amount" gorm:"column:total_amount"`
	PaymentStatus   string    `json:"payment_status" gorm:"column:payment_status"`
	FiberList       string    `json:"fiber_list" gorm:"column:fiber_list"`
	ExportSale      bool      `json:"export_sale" gorm:"column:export_sale"`
	Deleted         bool      `json:"deleted" gorm:"column:deleted"`
	CreatedAt       time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt       time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (*Sale) TableName() string {
	return "sales"
}

type ItemAddOnn struct {
	ID          int       `json:"id" gorm:"primary_key;AUTO_INCREMENT"`
	Uuid        string    `json:"uuid" gorm:"column:uuid"`
	SaleId      string    `json:"sale_id" gorm:"column:sale_id"`
	AddOnnName  string    `json:"add_onn_name" gorm:"column:add_onn_name"`
	AddOnnPrice int       `json:"add_onn_price" gorm:"column:add_onn_price"`
	Deleted     bool      `json:"deleted" gorm:"column:deleted"`
	CreatedAt   time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (*ItemAddOnn) TableName() string {
	return "item_add_onn"
}

type ItemSales struct {
	ID               int       `json:"id" gorm:"primary_key;AUTO_INCREMENT"`
	Uuid             string    `json:"uuid" gorm:"column:uuid"`
	StockSortId      string    `json:"stock_sort_id" gorm:"column:stock_sort_id"`
	StockCode        string    `json:"stock_code" gorm:"column:stock_code"`
	SaleId           string    `json:"sale_id" gorm:"column:sale_id"`
	Weight           int       `json:"weight" gorm:"column:weight"`
	PricePerKilogram int       `json:"price_per_kilogram" gorm:"column:price_per_kilogram"`
	TotalAmount      int       `json:"total_amount" gorm:"column:total_amount"`
	Deleted          bool      `json:"deleted" gorm:"column:deleted"`
	CreatedAt        time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt        time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (*ItemSales) TableName() string {
	return "item_sales"
}

type ItemSalesRequest struct {
	StockSortId      string `json:"stock_sort_id"`
	Weight           int    `json:"weight"`
	PricePerKilogram int    `json:"price_per_kilogram"`
	TotalAmount      int    `json:"total_amount"`
	StockCode        string `json:"stock_code"`
}

type AddOnnRequest struct {
	Name  string `json:"name"`
	Price int    `json:"price"`
}

type ItemSaleList struct {
	Uuid             string `json:"id"`
	StockCode        string `json:"stock_code"`
	StockSortId      string `json:"stock_sort_id"`
	StockSortName    string `json:"stock_sort_name"`
	PricePerKilogram int    `json:"price_per_kilogram"`
	Weight           int    `json:"weight"`
	TotalAmount      int    `json:"total_amount"`
}

type ItemAddOnnList struct {
	Uuid        string `json:"id"`
	AddOnnName  string `json:"addon_name"`
	AddOnnPrice int    `json:"addon_price"`
}

type SaleRequest struct {
	CustomerId  string                   `json:"customer_id" validate:"required"`
	SalesDate   time.Time                `json:"sales_date" validate:"required"`
	ExportSale  bool                     `json:"export_sale"`
	ItemSales   []ItemSalesRequest       `json:"sale_items"`
	FiberList   []FiberAllocationRequest `json:"fiber_allocations"`
	ItemAddOnn  []AddOnnRequest          `json:"add_ons"`
	TotalAmount int                      `json:"total_amount" validate:"required"`
}

type SaleResponse struct {
	ID              int              `json:"id"`
	Uuid            string           `json:"uuid"`
	SaleCode        string           `json:"sale_code"`
	Customer        GetUserDetail    `json:"customer"`
	CreateAt        time.Time        `json:"create_at"`
	PaymentLateDay  int              `json:"payment_late_day"`
	ExportSale      bool             `json:"export_sale"`
	TotalAmount     int              `json:"total_amount"`
	PaidAmount      int              `json:"paid_amount"`
	RemainingAmount int              `json:"remaining_amount"`
	PaymentStatus   string           `json:"payment_status"`
	SalesDate       time.Time        `json:"sales_date"`
	FiberUsed       []FiberUsedList  `json:"fiber_used"`
	SoldItem        []ItemSaleList   `json:"sold_items"`
	AddOn           []ItemAddOnnList `json:"add_ons"`
	LastPaymentDate string           `json:"last_payment_date"`
}

type SalesFilter struct {
	Size          int    `form:"size"`
	PageNo        int    `form:"page_no"`
	SalesId       string `form:"id"`
	CustomerId    string `form:"customer_id"`
	SalesDate     string `form:"sales_date"`
	PaymentStatus string `form:"payment_status"`
	//LastPaymentDate string `form:"last_payment_date"`
}

type SalePaginationResponse struct {
	Size   int            `json:"size"`
	PageNo int            `json:"page_no"`
	Total  int            `json:"total"`
	Data   []SaleResponse `json:"data"`
}
