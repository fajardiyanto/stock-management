package service

import (
	"dashboard-app/internal/config"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"fmt"
	"github.com/google/uuid"
	"strings"
	"time"
)

type FiberService struct{}

func NewFiberService() repository.FiberRepository {
	return &FiberService{}
}

func (f *FiberService) GetAllFibers(filter models.FiberFilter) (*models.FiberPaginationResponse, error) {
	db := config.GetDBConn().Model(&models.Fiber{})

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
		var sale models.Sale
		config.GetDBConn().Model(&models.Sale{}).Where("uuid = ? AND deleted = false", fiber.SaleId).First(&sale)

		fiberResponse := models.FiberResponse{
			Uuid:        fiber.Uuid,
			Name:        fiber.Name,
			Status:      fiber.Status,
			StockSortId: fiber.StockSortId,
			Deleted:     fiber.Deleted,
			CreatedAt:   fiber.CreatedAt,
		}
		if sale.ID != 0 {
			fiberResponse.SaleCode = fmt.Sprintf("SELL%d", sale.ID)
		}

		responseData = append(responseData, fiberResponse)
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
	db := config.GetDBConn()

	var fiber models.Fiber
	var sale models.Sale

	if err := db.Where("uuid = ? AND deleted = false", id).First(&fiber).Error; err != nil {
		return nil, err
	}

	if err := db.Model(&models.Sale{}).Where("uuid = ? AND deleted = false", fiber.SaleId).
		First(&sale).Error; err != nil {
		return nil, err
	}

	response := &models.FiberResponse{
		Uuid:        fiber.Uuid,
		Name:        fiber.Name,
		Status:      fiber.Status,
		StockSortId: fiber.StockSortId,
		SaleCode:    fmt.Sprintf("SELL%d", sale.ID),
		Deleted:     fiber.Deleted,
		CreatedAt:   fiber.CreatedAt,
	}

	return response, nil
}

func (f *FiberService) CreateFiber(request models.FiberRequest) (*models.FiberResponse, error) {
	newFiber := models.Fiber{
		Uuid:        uuid.New().String(),
		Name:        request.Name,
		Status:      request.Status,
		StockSortId: "",
	}

	if err := config.GetDBConn().Create(&newFiber).Error; err != nil {
		return nil, err
	}

	response := &models.FiberResponse{
		Uuid:        newFiber.Uuid,
		Name:        newFiber.Name,
		Status:      newFiber.Status,
		StockSortId: newFiber.StockSortId,
		Deleted:     newFiber.Deleted,
		CreatedAt:   newFiber.CreatedAt,
	}

	return response, nil
}

func (f *FiberService) MarkFiberAvailable(fiberId string) error {
	return config.GetDBConn().
		Model(&models.Fiber{}).
		Where("uuid = ? AND deleted = false", fiberId).
		Update("status", "FREE").Error
}

func (f *FiberService) DeleteFiber(fiberId string) error {
	return config.GetDBConn().
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

	return config.GetDBConn().
		Model(&models.Fiber{}).
		Where("uuid = ? AND deleted = false", fiberId).
		Updates(updates).Error
}

func (f *FiberService) GetAllUsedFibers() ([]models.FiberResponse, error) {
	db := config.GetDBConn().Model(&models.Fiber{})

	var fibers []models.Fiber
	if err := db.Where("status = ? AND deleted = false", "FREE").Order("created_at DESC").Find(&fibers).Error; err != nil {
		return nil, err
	}

	var responseData []models.FiberResponse
	for _, fiber := range fibers {
		responseData = append(responseData, models.FiberResponse{
			Uuid:        fiber.Uuid,
			Name:        fiber.Name,
			Status:      fiber.Status,
			StockSortId: fiber.StockSortId,
			Deleted:     fiber.Deleted,
			CreatedAt:   fiber.CreatedAt,
		})
	}

	return responseData, nil
}
