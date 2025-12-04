package models

import (
	"time"
)

type User struct {
	ID              int       `json:"id"`
	Uuid            string    `json:"uuid" gorm:"column:uuid;type:varchar(36)"`
	Name            string    `json:"name" gorm:"column:name"`
	Phone           string    `json:"phone" gorm:"column:phone"`
	Password        string    `json:"-" gorm:"column:password"`
	Role            string    `json:"role" gorm:"column:role"`
	Status          bool      `json:"status" gorm:"column:status"`
	Address         string    `json:"address" gorm:"column:address"`
	ShippingAddress string    `json:"shipping_address" gorm:"column:shipping_address"`
	CreatedAt       time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt       time.Time `json:"updated_at" gorm:"column:updated_at"`
}

type LoginRequest struct {
	Phone    string `json:"phone"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type UserResponse struct {
	ID              int       `json:"id"`
	Uuid            string    `json:"uuid"`
	Name            string    `json:"name"`
	Phone           string    `json:"phone"`
	Role            string    `json:"role"`
	Status          bool      `json:"status"`
	Address         string    `json:"address"`
	ShippingAddress string    `json:"shipping_address"`
	Balance         int       `json:"balance"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type UserRequest struct {
	Name            string `json:"name" validate:"required,min=3"`
	Phone           string `json:"phone" validate:"required"`
	Password        string `json:"password" validate:"required,min=6"`
	Role            string `json:"role" validate:"required,oneof=SUPER_ADMIN ADMIN BUYER SUPPLIER"`
	Address         string `json:"address" validate:"required"`
	ShippingAddress string `json:"shipping_address" validate:"omitempty"`
}

type UpdateUserRequest struct {
	Name            string `json:"name" validate:"required,min=3"`
	Phone           string `json:"phone" validate:"required"`
	Password        string `json:"password" validate:"omitempty"`
	Role            string `json:"role" validate:"required,oneof=SUPER_ADMIN ADMIN BUYER SUPPLIER"`
	Address         string `json:"address" validate:"required"`
	ShippingAddress string `json:"shipping_address" validate:"omitempty"`
}

type UserTokenModel struct {
	ID   string
	Name string
	Role string
}

type CreateUserResponse struct {
	User User `json:"user"`
}

type GetAllUserResponse struct {
	Size   int            `json:"size"`
	PageNo int            `json:"page_no"`
	Data   []UserResponse `json:"data"`
	Total  int            `json:"total"`
}

type GetUserDetail struct {
	Uuid            string `json:"uuid"`
	Name            string `json:"name"`
	Phone           string `json:"phone"`
	Address         string `json:"address"`
	ShippingAddress string `json:"shipping_address"`
}

func (*User) TableName() string {
	return "user"
}
