package models

import "time"

type Fiber struct {
	ID        int       `json:"id" gorm:"primary_key;AUTO_INCREMENT"`
	Uuid      string    `json:"uuid" gorm:"column:uuid;unique;not null;type:varchar(36)"`
	Name      string    `json:"name" gorm:"column:name;not null"`
	Status    string    `json:"status" gorm:"column:status"`
	Deleted   bool      `json:"deleted" gorm:"column:deleted"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (*Fiber) TableName() string {
	return "fibers"
}

type FiberRequest struct {
	Name   string `json:"name" validate:"required"`
	Status string `json:"status" validate:"required"`
}

type FiberResponse struct {
	Uuid      string    `json:"uuid"`
	Name      string    `json:"name"`
	Status    string    `json:"status"`
	Deleted   bool      `json:"deleted"`
	CreatedAt time.Time `json:"created_at"`
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
