package repository

import "dashboard-app/internal/models"

type AuditTrailRepository interface {
	GetAuditLogs(models.AuditLogFilter) (*models.AuditLogResponse, error)
	GetUserActivity(string, int) (*models.UserActivityResponse, error)
}
