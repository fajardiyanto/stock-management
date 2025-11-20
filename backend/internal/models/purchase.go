package models

import "time"

type Purchase struct {
	ID              int       `json:"id"`
	Uuid            string    `json:"uuid" gorm:"column:uuid"`
	SupplierID      string    `json:"supplier_id" gorm:"column:supplier_id"`
	PurchaseDate    time.Time `json:"purchase_date" gorm:"column:purchase_date"`
	TotalAmount     float64   `json:"total_amount" gorm:"column:total_amount"`
	PaidAmount      float64   `json:"paid_amount" gorm:"column:paid_amount"`
	RemainingAmount float64   `json:"remaining_amount" gorm:"column:remaining_amount"`
	PaymentStatus   string    `json:"payment_status" gorm:"column:payment_status"`
	StockId         string    `json:"stock_id" gorm:"column:stock_id"`
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

type UpdatePaymentRequest struct {
	Amount float64 `json:"amount" validate:"required,gt=0"`
}

type PurchaseDataResponse struct {
	PurchaseId      string             `json:"purchase_id"`
	Supplier        GetUserDetail      `json:"supplier"`
	PurchaseDate    string             `json:"purchase_date"`
	AgeInDay        int                `json:"age_in_day"`
	StockId         string             `json:"stock_id"`
	TotalAmount     float64            `json:"total_amount"`
	PaidAmount      float64            `json:"paid_amount"`
	RemainingAmount float64            `json:"remaining_amount"`
	PaymentStatus   string             `json:"payment_status"`
	StockEntry      StockEntryResponse `json:"stock_entry"`
	LastPayment     string             `json:"last_payment"`
}

type PurchaseResponse struct {
	Size   int                    `json:"size"`
	PageNo int                    `json:"page_no"`
	Total  int                    `json:"total"`
	Data   []PurchaseDataResponse `json:"data"`
}
