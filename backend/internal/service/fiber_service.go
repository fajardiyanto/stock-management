package service

import (
	"dashboard-app/internal/config"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"errors"
	"github.com/google/uuid"
	"strings"
	"time"
)

type FiberService struct{}

func NewFiberService() repository.FiberRepository {
	return &FiberService{}
}

func (f *FiberService) GetAllFibers(filter models.FiberFilter) (*models.FiberPaginationResponse, error) {
	db := config.GetDBConn().Orm().Model(&models.Fiber{})

	if filter.Size <= 0 {
		filter.Size = 10
	}
	if filter.PageNo <= 0 {
		filter.PageNo = 1
	}

	offset := (filter.PageNo - 1) * filter.Size

	db = db.Where("deleted = false")

	if filter.Name != "" {
		db = db.Where("LOWER(name) LIKE ?", "%"+strings.ToLower(filter.Name)+"%")
	}

	if filter.Status != "" {
		db = db.Where("status = ?", filter.Status)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, err
	}

	var fibers []models.Fiber
	if err := db.Offset(offset).Limit(filter.Size).Order("created_at DESC").Find(&fibers).Error; err != nil {
		return nil, err
	}

	var responseData []models.FiberResponse
	for _, fiber := range fibers {
		responseData = append(responseData, models.FiberResponse{
			Uuid:      fiber.Uuid,
			Name:      fiber.Name,
			Status:    fiber.Status,
			Deleted:   fiber.Deleted,
			CreatedAt: fiber.CreatedAt,
		})
	}

	response := models.FiberPaginationResponse{
		Size:   filter.Size,
		PageNo: filter.PageNo,
		Total:  int(total),
		Data:   responseData,
	}

	return &response, nil
}

func (f *FiberService) GetFiberById(id string) (*models.FiberResponse, error) {
	db := config.GetDBConn().Orm()

	var fiber models.Fiber

	if err := db.Where("uuid = ? AND deleted = false", id).First(&fiber).Error; err != nil {
		return nil, err
	}

	response := &models.FiberResponse{
		Uuid:      fiber.Uuid,
		Name:      fiber.Name,
		Status:    fiber.Status,
		Deleted:   fiber.Deleted,
		CreatedAt: fiber.CreatedAt,
	}

	return response, nil
}

func (f *FiberService) CreateFiber(request models.FiberRequest) (*models.FiberResponse, error) {
	db := config.GetDBConn().Orm()

	var lastCreated models.Fiber

	if request.Name == "" || request.Status == "" {
		return nil, errors.New("name and status are required")
	}

	newFiber := models.Fiber{
		Uuid:   uuid.New().String(),
		Name:   request.Name,
		Status: request.Status,
	}

	if err := db.Create(&newFiber).Error; err != nil {
		return nil, err
	}

	lastCreated = newFiber

	response := &models.FiberResponse{
		Uuid:      lastCreated.Uuid,
		Name:      lastCreated.Name,
		Status:    lastCreated.Status,
		Deleted:   lastCreated.Deleted,
		CreatedAt: lastCreated.CreatedAt,
	}

	return response, nil
}

func (f *FiberService) MarkFiberAvailable(fiberId string) error {
	return config.GetDBConn().Orm().
		Model(&models.Fiber{}).
		Where("uuid = ? AND deleted = false", fiberId).
		Update("status", "FREE").Error
}

func (f *FiberService) DeleteFiber(fiberId string) error {
	return config.GetDBConn().Orm().
		Model(&models.Fiber{}).
		Where("uuid = ? AND deleted = false", fiberId).
		Update("deleted", true).Error
}

func (f *FiberService) UpdateFiber(fiberId string, request models.FiberRequest) error {
	updates := map[string]interface{}{
		"name":       request.Name,
		"status":     request.Status,
		"updated_at": time.Now(),
	}

	return config.GetDBConn().Orm().
		Model(&models.Fiber{}).
		Where("uuid = ? AND deleted = false", fiberId).
		Updates(updates).Error
}
