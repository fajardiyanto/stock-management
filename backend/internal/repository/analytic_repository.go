package repository

import "dashboard-app/internal/models"

type AnalyticRepository interface {
	GetAnalyticStats() (*models.AnalyticStatsResponse, error)
	GetDailyGetAnalyticStats(string) (*models.DailyAnalyticStatsResponse, error)
}
