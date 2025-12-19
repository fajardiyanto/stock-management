package service

import (
	"dashboard-app/internal/config"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"gorm.io/gorm"
	"time"
)

type AuditLogService struct {
	db *gorm.DB
}

func NewAuditLogService() repository.AuditTrailRepository {
	return &AuditLogService{db: config.GetDBConn()}
}

// GetAuditLogs retrieves audit logs with filtering and pagination
func (s *AuditLogService) GetAuditLogs(filter models.AuditLogFilter) (*models.AuditLogResponse, error) {
	query := s.db.Model(&models.AuditLog{})

	// Apply filters
	if filter.ID != 0 {
		query = query.Where("id = ?", filter.ID)
	}
	if filter.UserID != "" {
		query = query.Where("user_id = ?", filter.UserID)
	}
	if filter.Name != "" {
		query = query.Where("name LIKE ?", "%"+filter.Name+"%")
	}
	if filter.Action != "" {
		query = query.Where("action LIKE ?", "%"+filter.Action+"%")
	}
	if filter.Method != "" {
		query = query.Where("method = ?", filter.Method)
	}
	if filter.Path != "" {
		query = query.Where("path LIKE ?", "%"+filter.Path+"%")
	}
	if filter.StartDate != "" && filter.EndDate != "" {
		start, errStart := time.Parse("2006-01-02", filter.StartDate)
		end, errEnd := time.Parse("2006-01-02", filter.EndDate)
		if errStart == nil && errEnd == nil {
			query = query.Where(
				"DATE(timestamp) >= ? AND DATE(timestamp) <= ?",
				start.Format("2006-01-02"),
				end.Format("2006-01-02"),
			)
		}
	} else if filter.StartDate != "" {
		if parsed, err := time.Parse("2006-01-02", filter.StartDate); err == nil {
			query = query.Where("DATE(timestamp) = ?", parsed.Format("2006-01-02"))
		}
	}
	if filter.StatusCode > 0 {
		query = query.Where("status_code = ?", filter.StatusCode)
	}
	if filter.Keyword != "" {
		searchPattern := "%" + filter.Keyword + "%"
		query = query.Where("action LIKE ? OR path LIKE ? OR name LIKE ? OR request_body LIKE ? OR response_body LIKE ?",
			searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
	}

	// Count total
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}

	// Pagination
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 {
		filter.PageSize = 20
	}

	offset := (filter.Page - 1) * filter.PageSize

	var logs []models.AuditLog
	if err := query.
		Order("timestamp DESC").
		Limit(filter.PageSize).
		Offset(offset).
		Find(&logs).Error; err != nil {
		return nil, err
	}

	return &models.AuditLogResponse{
		Total: int(total),
		Page:  filter.Page,
		Data:  logs,
	}, nil
}

// GetUserActivity retrieves activity summary for a specific user
func (s *AuditLogService) GetUserActivity(userID string, days int) (*models.UserActivityResponse, error) {
	startDate := time.Now().AddDate(0, 0, -days)

	var logs []models.AuditLog
	if err := s.db.
		Where("user_id = ? AND timestamp >= ?", userID, startDate).
		Find(&logs).Error; err != nil {
		return nil, err
	}

	// Calculate statistics
	actionCount := make(map[string]int)
	var totalDuration int64

	for _, log := range logs {
		actionCount[log.Action]++
		totalDuration += log.Duration
	}

	avgDuration := int64(0)
	if len(logs) > 0 {
		avgDuration = totalDuration / int64(len(logs))
	}

	return &models.UserActivityResponse{
		UserId:            userID,
		PeriodDays:        days,
		TotalActions:      len(logs),
		ActionBreakdown:   actionCount,
		AvgResponseTimeMs: avgDuration,
	}, nil
}
