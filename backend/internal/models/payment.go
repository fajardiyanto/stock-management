package models

import "time"

type Payment struct {
	ID        int       `json:"id"`
	Uuid      string    `json:"uuid" gorm:"column:uuid"`
	UserId    string    `json:"user_id" gorm:"column:user_id"`
	Total     float64   `json:"total" gorm:"column:total"`
	Type      string    `json:"type" gorm:"column:type"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (*Payment) TableName() string {
	return "payment"
}
