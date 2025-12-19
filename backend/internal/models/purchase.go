package models

import "time"

type Purchase struct {
	ID              int       `json:"id" gorm:"primary_key;AUTO_INCREMENT"`
	Uuid            string    `json:"uuid" gorm:"column:uuid"`
	SupplierID      string    `json:"supplier_id" gorm:"column:supplier_id;type:varchar(36)"`
	PurchaseDate    time.Time `json:"purchase_date" gorm:"column:purchase_date"`
	TotalAmount     int       `json:"total_amount" gorm:"column:total_amount"`
	PaidAmount      int       `json:"paid_amount" gorm:"column:paid_amount"`
	RemainingAmount int       `json:"remaining_amount" gorm:"column:remaining_amount"`
	PaymentStatus   string    `json:"payment_status" gorm:"column:payment_status"`
	StockId         string    `json:"stock_id" gorm:"column:stock_id;type:varchar(36)"`
	Deleted         bool      `json:"deleted" gorm:"column:deleted"`
	CreatedAt       time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt       time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (*Purchase) TableName() string {
	return "purchase"
}

type CreatePurchaseRequest struct {
	SupplierID   string             `json:"supplier_id" validate:"required"`
	PurchaseDate time.Time          `json:"purchase_date" validate:"required"`
	StockItems   []StockItemRequest `json:"stock_items" validate:"required,dive,required"`
}

type UpdatePurchaseRequest struct {
	PurchaseDate time.Time `json:"purchase_date"`
}

type PurchaseDataResponse struct {
	PurchaseId      string                `json:"purchase_id"`
	Supplier        GetUserDetail         `json:"supplier"`
	PurchaseDate    string                `json:"purchase_date"`
	StockId         string                `json:"stock_id"`
	StockCode       string                `json:"stock_code"`
	TotalAmount     int                   `json:"total_amount"`
	PaidAmount      int                   `json:"paid_amount"`
	RemainingAmount int                   `json:"remaining_amount"`
	PaymentStatus   string                `json:"payment_status"`
	StockEntry      *StockEntriesResponse `json:"stock_entry,omitempty"`
	LastPayment     string                `json:"last_payment"`
}

type PurchaseData struct {
	Uuid            string     `gorm:"column:uuid"`
	SupplierID      string     `gorm:"column:supplier_id"`
	PurchaseDate    time.Time  `gorm:"column:purchase_date"`
	PaymentStatus   string     `gorm:"column:payment_status"`
	TotalAmount     int        `gorm:"column:total_amount"`
	PaidAmount      int        `gorm:"column:paid_amount"`
	StockId         string     `gorm:"column:stock_id"`
	CreatedAt       time.Time  `gorm:"column:created_at"`
	SupplierUuid    string     `gorm:"column:supplier_uuid"`
	SupplierName    string     `gorm:"column:supplier_name"`
	SupplierPhone   string     `gorm:"column:supplier_phone"`
	StockEntryID    int        `gorm:"column:stock_entry_id"`
	LastPaymentDate *time.Time `gorm:"column:last_payment_date"`
}

type PurchaseResponse struct {
	Size   int                    `json:"size"`
	PageNo int                    `json:"page_no"`
	Total  int                    `json:"total"`
	Data   []PurchaseDataResponse `json:"data"`
}

type PurchaseFilter struct {
	Size          int    `form:"size"`
	PageNo        int    `form:"page_no"`
	PurchaseId    string `form:"purchase_id"`
	SupplierId    string `form:"supplier_id"`
	PurchaseDate  string `form:"purchase_date"`
	PaymentStatus string `form:"payment_status"`
	AgeInDay      string `form:"age_in_day"`
}
