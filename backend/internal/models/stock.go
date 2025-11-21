package models

import "time"

type StockEntry struct {
	ID        int       `json:"id" gorm:"primary_key;AUTO_INCREMENT"`
	Uuid      string    `json:"uuid" gorm:"column:uuid;size:255;unique;not null"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (*StockEntry) TableName() string {
	return "stock_entries"
}

type StockItem struct {
	ID               int       `json:"id" gorm:"primary_key;AUTO_INCREMENT"`
	Uuid             string    `json:"uuid" gorm:"column:uuid;size:255;unique;not null"`
	StockEntryID     string    `json:"stock_entry_id" gorm:"column:stock_entry_id"`
	ItemName         string    `json:"item_name" gorm:"column:item_name"`
	Weight           float64   `json:"weight" gorm:"column:weight"`
	PricePerKilogram float64   `json:"price_per_kilogram" gorm:"column:price_per_kilogram"`
	TotalPayment     float64   `json:"total_payment" gorm:"column:total_payment"`
	CreatedAt        time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt        time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (*StockItem) TableName() string {
	return "stock_items"
}

type StockSort struct {
	ID               int       `json:"id" gorm:"primary_key;AUTO_INCREMENT"`
	Uuid             string    `json:"uuid" gorm:"column:uuid;size:255;unique;not null"`
	StockItemID      string    `json:"stock_item_id" gorm:"column:stock_item_id"`
	ItemName         string    `json:"sorted_item_name" gorm:"column:sorted_item_name"`
	Weight           float64   `json:"weight" gorm:"column:weight"`
	PricePerKilogram float64   `json:"price_per_kilogram" gorm:"column:price_per_kilogram"`
	CurrentWeight    float64   `json:"current_weight" gorm:"column:current_weight"`
	TotalCost        float64   `json:"total_cost" gorm:"column:total_cost"`
	IsShrinkage      bool      `json:"is_shrinkage" gorm:"column:is_shrinkage"`
	CreatedAt        time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt        time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (*StockSort) TableName() string {
	return "stock_sorts"
}

type StockItemRequest struct {
	ItemName         string  `json:"item_name"`
	Weight           float64 `json:"weight"`
	PricePerKilogram float64 `json:"price_per_kilogram"`
}

type StockEntryResponse struct {
	Uuid              string              `json:"uuid"`
	StockCode         string              `json:"stock_code"`
	AgeInDay          int                 `json:"age_in_day"`
	PurchaseId        string              `json:"purchase_id"`
	Supplier          GetUserDetail       `json:"supplier"`
	StockItemResponse []StockItemResponse `json:"stock_items"`
}

type StockItemResponse struct {
	Uuid               string              `json:"uuid"`
	StockEntryID       string              `json:"stock_entry_id"`
	ItemName           string              `json:"item_name"`
	Weight             float64             `json:"weight"`
	PricePerKilogram   float64             `json:"price_per_kilogram"`
	TotalPayment       float64             `json:"total_payment"`
	IsSorted           bool                `json:"is_sorted"`
	StockSortResponses []StockSortResponse `json:"stock_sorts"`
}

type StockSortResponse struct {
	Uuid             string  `json:"uuid"`
	StockItemID      string  `json:"stock_item_id"`
	ItemName         string  `json:"sorted_item_name"`
	Weight           float64 `json:"weight"`
	PricePerKilogram float64 `json:"price_per_kilogram"`
	CurrentWeight    float64 `json:"current_weight"`
	TotalCost        float64 `json:"total_cost"`
	IsShrinkage      bool    `json:"is_shrinkage"`
}

type StockResponse struct {
	Size   int                  `json:"size"`
	PageNo int                  `json:"page_no"`
	Total  int                  `json:"total"`
	Data   []StockEntryResponse `json:"data"`
}
