package models

import "time"

type Payment struct {
	ID          int       `json:"id" gorm:"primary_key;AUTO_INCREMENT"`
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
	IsDeleted   bool      `json:"is_deleted"`
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

type CreatePaymentPurchaseRequest struct {
	PurchaseId   string    `json:"purchase_id" validate:"required"`
	PurchaseDate time.Time `json:"purchase_date" validate:"required"`
	StockCode    string    `json:"stock_code" validate:"required"`
	Total        int       `json:"total" validate:"required"`
}

type CreatePaymentSaleRequest struct {
	SalesId   string    `json:"sales_id" validate:"required"`
	SalesDate time.Time `json:"sales_date" validate:"required"`
	SalesCode string    `json:"sales_code" validate:"required"`
	Total     int       `json:"total" validate:"required"`
}

type UserBalanceDepositResponse struct {
	Balance int  `json:"balance"`
	Deposit bool `json:"deposit"`
}
