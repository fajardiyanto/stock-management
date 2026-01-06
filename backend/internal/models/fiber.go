package models

import "time"

type Fiber struct {
	ID          int       `json:"id" gorm:"primary_key;AUTO_INCREMENT"`
	Uuid        string    `json:"uuid" gorm:"column:uuid;unique;not null;type:varchar(36)"`
	Name        string    `json:"name" gorm:"column:name;not null"`
	Status      string    `json:"status" gorm:"column:status"`
	StockSortId string    `json:"stock_sort_id" gorm:"column:stock_sort_id"`
	SaleId      string    `json:"sale_id" gorm:"column:sale_id"`
	Deleted     bool      `json:"deleted" gorm:"column:deleted"`
	CreatedAt   time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (*Fiber) TableName() string {
	return "fibers"
}

type FiberRequest struct {
	Name        string `json:"name" validate:"required"`
	Status      string `json:"status" validate:"required"`
	StockSortId string `json:"stock_sort_id"`
}

type FiberResponse struct {
	Uuid        string    `json:"uuid" gorm:"column:uuid"`
	Name        string    `json:"name" gorm:"column:name"`
	Status      string    `json:"status" gorm:"column:status"`
	StockSortId string    `json:"stock_sort_id" gorm:"column:stock_sort_id"`
	Deleted     bool      `json:"deleted" gorm:"column:deleted"`
	CreatedAt   time.Time `json:"created_at" gorm:"column:created_at"`
	SaleCode    *string   `json:"sale_code" gorm:"column:sale_code"`
	SaleId      string    `json:"sale_id" gorm:"column:sale_id"`
}

type FiberPaginationResponse struct {
	Size   int             `json:"size"`
	PageNo int             `json:"page_no"`
	Total  int             `json:"total"`
	Data   []FiberResponse `json:"data"`
}

type BulkFiberRequest struct {
	Data []FiberRequest `json:"data"`
}

type FiberFilter struct {
	Size   int    `form:"size"`
	PageNo int    `form:"page_no"`
	Name   string `form:"name"`
	Status string `form:"status"`
}

type FiberAllocationRequest struct {
	ItemId    string `json:"item_id"`
	FiberId   string `json:"fiber_id"`
	FiberName string `json:"fiber_name"`
}

type FiberUsedList struct {
	FiberId   string `json:"uuid"`
	FiberName string `json:"name"`
}

type FiberStatistics struct {
	Total       int64   `json:"total"`
	Free        int64   `json:"free"`
	Used        int64   `json:"used"`
	Utilization float64 `json:"utilization_percentage"`
}

type FiberStats struct {
	Total int64 `gorm:"column:total"`
	Free  int64 `gorm:"column:free"`
	Used  int64 `gorm:"column:used"`
}
