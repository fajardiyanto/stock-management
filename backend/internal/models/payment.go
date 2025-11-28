package models

import "time"

type Payment struct {
	ID          int       `json:"id"`
	Uuid        string    `json:"uuid" gorm:"column:uuid;type:varchar(36)"`
	UserId      string    `json:"user_id" gorm:"column:user_id;type:varchar(36)"`
	Total       int       `json:"total" gorm:"column:total"`
	Type        string    `json:"type" gorm:"column:type"`
	Description string    `json:"description" gorm:"column:description"`
	SalesId     string    `json:"sales_id" gorm:"column:sales_id;type:varchar(36)"`
	PurchaseId  string    `json:"purchase_id" gorm:"column:purchase_id;type:varchar(36)"`
	Deleted     bool      `json:"deleted" gorm:"column:deleted"`
	CreatedAt   time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (*Payment) TableName() string {
	return "payment"
}

type PaymentResponse struct {
	Uuid        string    `json:"uuid"`
	UserId      string    `json:"user_id"`
	Total       int       `json:"total"`
	Type        string    `json:"type"`
	Description string    `json:"description"`
	SalesId     string    `json:"sales_id"`
	PurchaseId  string    `json:"purchase_id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CashFlowResponse struct {
	Balance int               `json:"balance"`
	Payment []PaymentResponse `json:"payment"`
}

type CreateManualPaymentRequest struct {
	Total       int    `json:"total"`
	Type        string `json:"type"`
	Description string `json:"description"`
}

type CreatePaymentRequest struct {
	PurchaseId   string    `json:"purchase_id" validate:"required"`
	PurchaseDate time.Time `json:"purchase_date" validate:"required"`
	StockCode    string    `json:"stock_code" validate:"required"`
	Total        int       `json:"total" validate:"required"`
}
