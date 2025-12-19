package models

import "time"

type AuditLog struct {
	ID           int       `json:"id" gorm:"primary_key;AUTO_INCREMENT"`
	UserID       string    `json:"user_id" gorm:"column:user_id;type:varchar(36);"`
	Name         string    `json:"name" gorm:"column:name;type:varchar(255)"`
	UserRole     string    `json:"user_role" gorm:"column:role;type:varchar(50)"`
	Action       string    `json:"action" gorm:"column:action;type:varchar(255)"`
	Method       string    `json:"method" gorm:"column:method;type:varchar(10)"`
	Path         string    `json:"path" gorm:"column:path;type:varchar(500);"`
	IPAddress    string    `json:"ip_address" gorm:"column:ip;type:varchar(45)"`
	UserAgent    string    `json:"user_agent" gorm:"column:user_agent;type:text"`
	RequestBody  string    `json:"request_body" gorm:"column:request_body;type:text"`
	ResponseBody string    `json:"response_body" gorm:"column:response_body;type:text"`
	StatusCode   int       `json:"status_code" gorm:"column:status_code;type:int"`
	Duration     int64     `json:"duration" gorm:"column:duration;type:bigint"` // milliseconds
	ErrorMessage string    `json:"error_message" gorm:"column:error_message;type:text"`
	Timestamp    time.Time `json:"timestamp" gorm:"column:timestamp"`
	CreatedAt    time.Time `json:"created_at" gorm:"column:created_at"`
}

func (*AuditLog) TableName() string {
	return "audit_logs"
}

type AuditLogFilter struct {
	ID         int    `form:"id"`
	UserID     string `form:"user_id"`
	Name       string `form:"name"`
	Action     string `form:"action"`
	Method     string `form:"method"`
	Path       string `form:"path"`
	StartDate  string `form:"start_date"`
	EndDate    string `form:"end_date"`
	StatusCode int    `form:"status_code"`
	Page       int    `form:"page" binding:"min=1"`
	PageSize   int    `form:"page_size" binding:"min=1,max=100"`
	Keyword    string `form:"keyword"`
}

type AuditLogResponse struct {
	Total int        `json:"total"`
	Page  int        `json:"page"`
	Data  []AuditLog `json:"data"`
}

type UserActivityResponse struct {
	UserId            string         `json:"user_id"`
	PeriodDays        int            `json:"period_days"`
	TotalActions      int            `json:"total_actions"`
	ActionBreakdown   map[string]int `json:"action_breakdown"`
	AvgResponseTimeMs int64          `json:"avg_response_time_ms"`
}
