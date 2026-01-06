package service

import (
	"dashboard-app/pkg/apperror"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"dashboard-app/internal/config"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
)

type FiberService struct{}

func NewFiberService() repository.FiberRepository {
	return &FiberService{}
}

// GetAllFibers - Optimized with Batch Query
// =====================================================
func (s *FiberService) GetAllFibers(filter models.FiberFilter) (*models.FiberPaginationResponse, error) {
	db := config.GetDBConn()

	// Normalize pagination
	if filter.Size <= 0 {
		filter.Size = 10
	}
	if filter.PageNo <= 0 {
		filter.PageNo = 1
	}
	offset := (filter.PageNo - 1) * filter.Size

	// Build optimized query with JOIN to get sale info in one query
	query := db.Table("fibers AS f").
		Select(`
			f.uuid,
			f.name,
			f.status,
			f.stock_sort_id,
			f.deleted,
			f.created_at,
			f.sale_id,
			CASE 
				WHEN s.id IS NOT NULL THEN CONCAT('SELL', s.id)
				ELSE NULL
			END AS sale_code
		`).
		Joins("LEFT JOIN sales s ON s.uuid = f.sale_id AND s.deleted = false").
		Where("f.deleted = false")

	// Apply filters
	if filter.Name != "" {
		query = query.Where("LOWER(f.name) LIKE ?", "%"+strings.ToLower(filter.Name)+"%")
	}

	if filter.Status != "" {
		query = query.Where("f.status = ?", filter.Status)
	}

	// Get total count
	var total int64
	countQuery := *query
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to count fibers: ", err)
	}

	// Fetch fibers with sale codes in single query
	var results []models.FiberResponse
	if err := query.
		Order("f.created_at DESC").
		Offset(offset).
		Limit(filter.Size).
		Scan(&results).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch fibers: ", err)
	}

	// Build response
	responseData := make([]models.FiberResponse, 0, len(results))
	for _, result := range results {
		response := models.FiberResponse{
			Uuid:        result.Uuid,
			Name:        result.Name,
			Status:      result.Status,
			StockSortId: result.StockSortId,
			SaleId:      result.SaleId,
			Deleted:     result.Deleted,
			CreatedAt:   result.CreatedAt,
		}

		if result.SaleCode != nil {
			response.SaleCode = result.SaleCode
		}

		responseData = append(responseData, response)
	}

	return &models.FiberPaginationResponse{
		Size:   filter.Size,
		PageNo: filter.PageNo,
		Total:  int(total),
		Data:   responseData,
	}, nil
}

// GetFiberById - Optimized with Single Query
// =====================================================
func (s *FiberService) GetFiberById(id string) (*models.FiberResponse, error) {
	db := config.GetDBConn()

	// Single optimized query with JOIN
	var result models.FiberResponse
	if err := db.Table("fibers AS f").
		Select(`
			f.uuid,
			f.name,
			f.status,
			f.stock_sort_id,
			f.deleted,
			f.created_at,
			f.sale_id,
			CASE 
				WHEN s.id IS NOT NULL THEN CONCAT('SELL', s.id)
				ELSE NULL
			END AS sale_code
		`).
		Joins("LEFT JOIN sales s ON s.uuid = f.sale_id AND s.deleted = false").
		Where("f.uuid = ? AND f.deleted = false", id).
		Scan(&result).Error; err != nil {
		return nil, apperror.NewNotFound(fmt.Sprintf("fiber not found: %v", err))
	}

	return &result, nil
}

// CreateFiber - Optimized with Validation
// =====================================================
func (s *FiberService) CreateFiber(request models.FiberRequest) (*models.FiberResponse, error) {
	// Validate status
	if !s.isValidStatus(request.Status) {
		return nil, fmt.Errorf("invalid status: must be FREE or USED")
	}

	now := time.Now()
	newFiber := models.Fiber{
		Uuid:        uuid.New().String(),
		Name:        strings.TrimSpace(request.Name),
		Status:      request.Status,
		StockSortId: request.StockSortId,
		Deleted:     false,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := config.GetDBConn().Create(&newFiber).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to create fiber: ", err)
	}

	return &models.FiberResponse{
		Uuid:        newFiber.Uuid,
		Name:        newFiber.Name,
		Status:      newFiber.Status,
		StockSortId: newFiber.StockSortId,
		Deleted:     newFiber.Deleted,
		CreatedAt:   newFiber.CreatedAt,
	}, nil
}

// UpdateFiber - Optimized with Validation
// =====================================================
func (s *FiberService) UpdateFiber(fiberId string, request models.FiberRequest) error {
	// Validate status
	if !s.isValidStatus(request.Status) {
		return apperror.NewBadRequest("invalid status: must be FREE or USED")
	}

	updates := map[string]interface{}{
		"name":       strings.TrimSpace(request.Name),
		"status":     request.Status,
		"updated_at": time.Now(),
	}

	// Only update stock_sort_id if provided
	if request.StockSortId != "" {
		updates["stock_sort_id"] = request.StockSortId
	}

	result := config.GetDBConn().
		Model(&models.Fiber{}).
		Where("uuid = ? AND deleted = false", fiberId).
		Updates(updates)

	if result.Error != nil {
		return apperror.NewUnprocessableEntity("failed to update fiber: ", result.Error)
	}

	if result.RowsAffected == 0 {
		return apperror.NewNotFound("fiber not found or already deleted")
	}

	return nil
}

// MarkFiberAvailable - Optimized with Check
// =====================================================
func (s *FiberService) MarkFiberAvailable(fiberId string) error {
	result := config.GetDBConn().
		Model(&models.Fiber{}).
		Where("uuid = ? AND deleted = false", fiberId).
		Updates(map[string]interface{}{
			"status":        "FREE",
			"sale_id":       nil,
			"stock_sort_id": "",
			"updated_at":    time.Now(),
		})

	if result.Error != nil {
		return apperror.NewUnprocessableEntity("failed to mark fiber as available: ", result.Error)
	}

	if result.RowsAffected == 0 {
		return apperror.NewNotFound("fiber not found or already deleted")
	}

	return nil
}

// BatchMarkAvailable - New Optimized Method
// =====================================================
func (s *FiberService) BatchMarkAvailable(fiberIds []string) (int, []string, error) {
	if len(fiberIds) == 0 {
		return 0, nil, apperror.NewNotFound("no fiber IDs provided")
	}

	// Single batch update query
	result := config.GetDBConn().
		Model(&models.Fiber{}).
		Where("uuid IN ? AND deleted = false", fiberIds).
		Updates(map[string]interface{}{
			"status":        "FREE",
			"sale_id":       nil,
			"stock_sort_id": "",
			"updated_at":    time.Now(),
		})

	if result.Error != nil {
		return 0, nil, apperror.NewUnprocessableEntity("batch update failed: ", result.Error)
	}

	successCount := int(result.RowsAffected)
	var failedIds []string

	// If not all succeeded, identify failed IDs
	if successCount < len(fiberIds) {
		var updatedIds []string
		if err := config.GetDBConn().
			Model(&models.Fiber{}).
			Where("uuid IN ? AND status = 'FREE' AND deleted = false", fiberIds).
			Pluck("uuid", &updatedIds).Error; err != nil {
			return 0, failedIds, apperror.NewUnprocessableEntity("batch update failed: ", result.Error)
		}

		updatedMap := make(map[string]bool)
		for _, id := range updatedIds {
			updatedMap[id] = true
		}

		for _, id := range fiberIds {
			if !updatedMap[id] {
				failedIds = append(failedIds, id)
			}
		}
	}

	return successCount, failedIds, nil
}

// DeleteFiber - Optimized with Check
// =====================================================
func (s *FiberService) DeleteFiber(fiberId string) error {
	result := config.GetDBConn().
		Model(&models.Fiber{}).
		Where("uuid = ? AND deleted = false", fiberId).
		Updates(map[string]interface{}{
			"deleted":    true,
			"updated_at": time.Now(),
		})

	if result.Error != nil {
		return apperror.NewUnprocessableEntity("failed to delete fiber: ", result.Error)
	}

	if result.RowsAffected == 0 {
		return apperror.NewNotFound("fiber not found or already deleted")
	}

	return nil
}

// GetAllUsedFibers - Optimized Query
// =====================================================
func (s *FiberService) GetAllUsedFibers() ([]models.FiberResponse, error) {
	db := config.GetDBConn()

	// Optimized query with JOIN for sale codes
	var results []models.FiberResponse
	if err := db.Table("fibers AS f").
		Select(`
			f.uuid,
			f.name,
			f.status,
			f.stock_sort_id,
			f.deleted,
			f.created_at,
			CASE 
				WHEN s.id IS NOT NULL THEN CONCAT('SELL', s.id)
				ELSE NULL
			END AS sale_code
		`).
		Joins("LEFT JOIN sales s ON s.uuid = f.sale_id AND s.deleted = false").
		Where("f.status = ? AND f.deleted = false", "USED").
		Order("f.created_at DESC").
		Scan(&results).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch used fibers: ", err)
	}

	// Build response
	responseData := make([]models.FiberResponse, 0, len(results))
	for _, result := range results {
		response := models.FiberResponse{
			Uuid:        result.Uuid,
			Name:        result.Name,
			Status:      result.Status,
			StockSortId: result.StockSortId,
			Deleted:     result.Deleted,
			CreatedAt:   result.CreatedAt,
		}

		if result.SaleCode != nil {
			response.SaleCode = result.SaleCode
		}

		responseData = append(responseData, response)
	}

	return responseData, nil
}

// GetAvailableFibers - New Optimized Method
// =====================================================
func (s *FiberService) GetAvailableFibers() ([]models.FiberResponse, error) {
	db := config.GetDBConn()

	var fibers []models.Fiber
	if err := db.Where("status = ? AND deleted = false", "FREE").
		Order("created_at DESC").
		Find(&fibers).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch available fibers: ", err)
	}

	responseData := make([]models.FiberResponse, 0, len(fibers))
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

// GetFibersByStockSort - New Optimized Method
// =====================================================
func (s *FiberService) GetFibersByStockSort(stockSortId string) ([]models.FiberResponse, error) {
	db := config.GetDBConn()

	var fibers []models.Fiber
	if err := db.Where("stock_sort_id = ? AND deleted = false", stockSortId).
		Order("created_at DESC").
		Find(&fibers).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch fibers by stock sort: ", err)
	}

	responseData := make([]models.FiberResponse, 0, len(fibers))
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

// GetFiberStatistics - New Method
// =====================================================
func (s *FiberService) GetFiberStatistics() (*models.FiberStatistics, error) {
	db := config.GetDBConn()

	var stats models.FiberStats
	if err := db.Raw(`
		SELECT 
			COUNT(*) AS total,
			COUNT(CASE WHEN status = 'FREE' THEN 1 END) AS free,
			COUNT(CASE WHEN status = 'USED' THEN 1 END) AS used
		FROM fibers
		WHERE deleted = false
	`).Scan(&stats).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch fiber statistics: ", err)
	}

	return &models.FiberStatistics{
		Total:       stats.Total,
		Free:        stats.Free,
		Used:        stats.Used,
		Utilization: float64(stats.Used) / float64(stats.Total) * 100,
	}, nil
}

// isValidStatus checks if the fiber status is valid
func (s *FiberService) isValidStatus(status string) bool {
	validStatuses := map[string]bool{
		"FREE": true,
		"USED": true,
	}
	return validStatuses[status]
}
