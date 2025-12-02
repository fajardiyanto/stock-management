package models

import "time"

type StockEntry struct {
	ID        int       `json:"id" gorm:"primary_key;AUTO_INCREMENT"`
	Uuid      string    `json:"uuid" gorm:"column:uuid;unique;not null;type:varchar(36)"`
	Deleted   bool      `json:"deleted" gorm:"column:deleted"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (*StockEntry) TableName() string {
	return "stock_entries"
}

type StockItem struct {
	ID               int       `json:"id" gorm:"primary_key;AUTO_INCREMENT"`
	Uuid             string    `json:"uuid" gorm:"column:uuid;unique;not null;type:varchar(36)"`
	StockEntryID     string    `json:"stock_entry_id" gorm:"column:stock_entry_id;type:varchar(36)"`
	ItemName         string    `json:"item_name" gorm:"column:item_name"`
	Weight           int       `json:"weight" gorm:"column:weight"`
	PricePerKilogram int       `json:"price_per_kilogram" gorm:"column:price_per_kilogram"`
	TotalPayment     int       `json:"total_payment" gorm:"column:total_payment"`
	IsSorted         bool      `json:"is_sorted" gorm:"column:is_sorted"`
	Deleted          bool      `json:"deleted" gorm:"column:deleted"`
	CreatedAt        time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt        time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (*StockItem) TableName() string {
	return "stock_items"
}

type StockSort struct {
	ID               int       `json:"id" gorm:"primary_key;AUTO_INCREMENT"`
	Uuid             string    `json:"uuid" gorm:"column:uuid;unique;not null;type:varchar(36)"`
	StockItemID      string    `json:"stock_item_id" gorm:"column:stock_item_id;type:varchar(36)"`
	ItemName         string    `json:"sorted_item_name" gorm:"column:sorted_item_name"`
	Weight           int       `json:"weight" gorm:"column:weight"`
	PricePerKilogram int       `json:"price_per_kilogram" gorm:"column:price_per_kilogram"`
	CurrentWeight    int       `json:"current_weight" gorm:"column:current_weight"`
	TotalCost        int       `json:"total_cost" gorm:"column:total_cost"`
	IsShrinkage      bool      `json:"is_shrinkage" gorm:"column:is_shrinkage"`
	Deleted          bool      `json:"deleted" gorm:"column:deleted"`
	CreatedAt        time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt        time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (*StockSort) TableName() string {
	return "stock_sorts"
}

type StockItemRequest struct {
	ItemName         string `json:"item_name"`
	Weight           int    `json:"weight"`
	PricePerKilogram int    `json:"price_per_kilogram"`
}

type StockEntriesResponse struct {
	Uuid              string              `json:"uuid"`
	StockCode         string              `json:"stock_code"`
	AgeInDay          int                 `json:"age_in_day"`
	PurchaseId        string              `json:"purchase_id"`
	Supplier          GetUserDetail       `json:"supplier"`
	PurchaseDate      string              `json:"purchase_date"`
	StockItemResponse []StockItemResponse `json:"stock_items"`
}

type StockEntryResponse struct {
	Uuid              string            `json:"uuid"`
	StockCode         string            `json:"stock_code"`
	StockItemResponse StockItemResponse `json:"stock_item"`
}

type StockItemResponse struct {
	Uuid               string              `json:"uuid"`
	StockEntryID       string              `json:"stock_entry_id"`
	ItemName           string              `json:"item_name"`
	Weight             int                 `json:"weight"`
	PricePerKilogram   int                 `json:"price_per_kilogram"`
	TotalPayment       int                 `json:"total_payment"`
	IsSorted           bool                `json:"is_sorted"`
	RemainingWeight    int                 `json:"remaining_weight"`
	AlreadySorted      int                 `json:"already_sortir"`
	StockSortResponses []StockSortResponse `json:"stock_sorts"`
}

type StockSortResponse struct {
	ID               int    `json:"id"`
	Uuid             string `json:"uuid"`
	StockItemID      string `json:"stock_item_id"`
	ItemName         string `json:"sorted_item_name"`
	StockEntryID     string `json:"stock_entry_id"`
	StockCode        string `json:"stock_code"`
	Weight           int    `json:"weight"`
	PricePerKilogram int    `json:"price_per_kilogram"`
	CurrentWeight    int    `json:"current_weight"`
	TotalCost        int    `json:"total_cost"`
	IsShrinkage      bool   `json:"is_shrinkage"`
}

type StockResponse struct {
	Size   int                    `json:"size"`
	PageNo int                    `json:"page_no"`
	Total  int                    `json:"total"`
	Data   []StockEntriesResponse `json:"data"`
}

type StockEntryFilter struct {
	Size         int    `form:"size"`
	PageNo       int    `form:"page_no"`
	StockId      string `form:"stock_id"`
	SupplierId   string `form:"supplier_id"`
	PurchaseDate string `form:"purchase_date"`
	AgeInDay     string `form:"age_in_day"`
}

type StockSortRequest struct {
	SortedItemName   string `json:"sorted_item_name" validate:"required,min=3"`
	Weight           int    `json:"weight" validate:"required"`
	PricePerKilogram int    `json:"price_per_kilogram" validate:"required"`
	CurrentWeight    int    `json:"current_weight"`
	IsShrinkage      bool   `json:"is_shrinkage"`
}

type SubmitSortRequest struct {
	StockItemId      string             `json:"stock_item_uuid" validate:"required"`
	StockSortRequest []StockSortRequest `json:"stock_sort_request"`
}
