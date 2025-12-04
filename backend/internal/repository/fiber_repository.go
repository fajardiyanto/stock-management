package repository

import "dashboard-app/internal/models"

type FiberRepository interface {
	GetAllFibers(models.FiberFilter) (*models.FiberPaginationResponse, error)
	GetFiberById(string) (*models.FiberResponse, error)
	CreateFiber(models.FiberRequest) (*models.FiberResponse, error)
	MarkFiberAvailable(string) error
	DeleteFiber(string) error
	UpdateFiber(string, models.FiberRequest) error
	GetAllUsedFibers() ([]models.FiberResponse, error)
}
