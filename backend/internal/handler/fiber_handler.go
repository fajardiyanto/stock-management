package handler

import (
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"dashboard-app/pkg/base_handler"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"net/http"
)

type Fiber struct {
	fiberRepository repository.FiberRepository
	*base_handler.BaseHandler
}

func NewFiberHandler(fiberRepository repository.FiberRepository, validate *validator.Validate) *Fiber {
	return &Fiber{
		fiberRepository: fiberRepository,
		BaseHandler:     base_handler.NewBaseHandler(validate),
	}
}

// GetAllFibers godoc
// @Summary Get all fibers
// @Description Retrieve paginated list of fibers with optional filters
// @Tags fibers
// @Accept json
// @Produce json
// @Param page_no query int false "Page number" default(1)
// @Param size query int false "Page size" default(10)
// @Param name query string false "Filter by fiber name"
// @Param status query string false "Filter by status (FREE, USED)"
// @Success 200 {object} models.HTTPResponseSuccess{data=models.FiberPaginationResponse}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /fibers [get]
func (h *Fiber) GetAllFibers(c *gin.Context) {
	var filter models.FiberFilter

	// Bind query parameters
	if err := h.BindQuery(c, &filter); err != nil {
		return // Error already sent
	}

	// Normalize pagination
	if filter.PageNo < 1 {
		filter.PageNo = 1
	}
	if filter.Size < 1 {
		filter.Size = 10
	}
	if filter.Size > 100 {
		filter.Size = 100
	}

	// Fetch fibers
	data, err := h.fiberRepository.GetAllFibers(filter)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch fibers")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Fibers retrieved successfully", data)
}

// GetFiberByID godoc
// @Summary Get fiber by ID
// @Description Retrieve detailed information about a specific fiber
// @Tags fibers
// @Accept json
// @Produce json
// @Param fiberId path string true "Fiber ID"
// @Success 200 {object} models.HTTPResponseSuccess{data=models.FiberResponse}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 404 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /fibers/{fiberId} [get]
func (h *Fiber) GetFiberByID(c *gin.Context) {
	// Get and validate UUID parameter
	fiberID, err := h.GetUUIDParam(c, "fiberId")
	if err != nil {
		return // Error already sent
	}

	// Fetch fiber
	data, err := h.fiberRepository.GetFiberById(fiberID)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch fiber")
		return
	}

	h.SendSuccess(c, http.StatusOK, fmt.Sprintf("Fiber %s retrieved successfully", fiberID), data)
}

// CreateFiber godoc
// @Summary Create a new fiber
// @Description Create a new fiber entry
// @Tags fibers
// @Accept json
// @Produce json
// @Param fiber body models.FiberRequest true "Fiber data"
// @Success 201 {object} models.HTTPResponseSuccess{data=models.FiberResponse}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /fibers [post]
func (h *Fiber) CreateFiber(c *gin.Context) {
	var req models.FiberRequest

	// Bind and validate request
	if err := h.BindAndValidate(c, &req); err != nil {
		return // Error already sent
	}

	// Validate status value
	if !h.isValidFiberStatus(req.Status) {
		h.SendError(c, http.StatusBadRequest, "Invalid status. Must be FREE or USED", nil)
		return
	}

	// Create fiber
	data, err := h.fiberRepository.CreateFiber(req)
	if err != nil {
		h.HandleError(c, err, "Failed to create fiber")
		return
	}

	h.SendSuccess(c, http.StatusCreated, "Fiber created successfully", data)
}

// UpdateFiber godoc
// @Summary Update fiber
// @Description Update fiber information
// @Tags fibers
// @Accept json
// @Produce json
// @Param fiberId path string true "Fiber ID"
// @Param fiber body models.FiberRequest true "Updated fiber data"
// @Success 200 {object} models.HTTPResponseSuccess
// @Failure 400 {object} models.HTTPResponseError
// @Failure 404 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /fibers/{fiberId} [put]
func (h *Fiber) UpdateFiber(c *gin.Context) {
	// Get and validate UUID parameter
	fiberID, err := h.GetUUIDParam(c, "fiberId")
	if err != nil {
		return // Error already sent
	}

	var req models.FiberRequest

	// Bind and validate request
	if err = h.BindAndValidate(c, &req); err != nil {
		return // Error already sent
	}

	// Validate status value
	if !h.isValidFiberStatus(req.Status) {
		h.SendError(c, http.StatusBadRequest, "Invalid status. Must be FREE or USED", nil)
		return
	}

	// Update fiber
	if err = h.fiberRepository.UpdateFiber(fiberID, req); err != nil {
		h.HandleError(c, err, "Failed to update fiber")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Fiber updated successfully", nil)
}

// MarkFiberAvailable godoc
// @Summary Mark fiber as available
// @Description Change fiber status to FREE/available
// @Tags fibers
// @Accept json
// @Produce json
// @Param fiberId path string true "Fiber ID"
// @Success 200 {object} models.HTTPResponseSuccess
// @Failure 400 {object} models.HTTPResponseError
// @Failure 404 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /fibers/{fiberId}/mark-available [patch]
func (h *Fiber) MarkFiberAvailable(c *gin.Context) {
	// Get and validate UUID parameter
	fiberID, err := h.GetUUIDParam(c, "fiberId")
	if err != nil {
		return // Error already sent
	}

	// Mark fiber as available
	if err = h.fiberRepository.MarkFiberAvailable(fiberID); err != nil {
		h.HandleError(c, err, "Failed to mark fiber as available")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Fiber marked as available successfully", nil)
}

// DeleteFiber godoc
// @Summary Delete fiber
// @Description Soft delete a fiber
// @Tags fibers
// @Accept json
// @Produce json
// @Param fiberId path string true "Fiber ID"
// @Success 200 {object} models.HTTPResponseSuccess
// @Failure 400 {object} models.HTTPResponseError
// @Failure 404 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /fibers/{fiberId} [delete]
func (h *Fiber) DeleteFiber(c *gin.Context) {
	// Get and validate UUID parameter
	fiberID, err := h.GetUUIDParam(c, "fiberId")
	if err != nil {
		return // Error already sent
	}

	// Delete fiber
	if err = h.fiberRepository.DeleteFiber(fiberID); err != nil {
		h.HandleError(c, err, "Failed to delete fiber")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Fiber deleted successfully", nil)
}

// GetAllUsedFibers godoc
// @Summary Get all used fibers
// @Description Retrieve list of all fibers currently in use
// @Tags fibers
// @Accept json
// @Produce json
// @Success 200 {object} models.HTTPResponseSuccess{data=[]models.FiberResponse}
// @Failure 500 {object} models.HTTPResponseError
// @Router /fibers/used [get]
func (h *Fiber) GetAllUsedFibers(c *gin.Context) {
	// Fetch used fibers
	data, err := h.fiberRepository.GetAllUsedFibers()
	if err != nil {
		h.HandleError(c, err, "Failed to fetch used fibers")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Used fibers retrieved successfully", data)
}

// GetAvailableFibers godoc
// @Summary Get available fibers
// @Description Retrieve list of all free/available fibers
// @Tags fibers
// @Accept json
// @Produce json
// @Success 200 {object} models.HTTPResponseSuccess{data=[]models.FiberResponse}
// @Failure 500 {object} models.HTTPResponseError
// @Router /fibers/available [get]
func (h *Fiber) GetAvailableFibers(c *gin.Context) {
	// Create filter for FREE fibers
	filter := models.FiberFilter{
		Status: "FREE",
		PageNo: 1,
		Size:   1000, // Get all available fibers
	}

	// Fetch available fibers
	data, err := h.fiberRepository.GetAllFibers(filter)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch available fibers")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Available fibers retrieved successfully", data.Data)
}

// BulkMarkAvailable godoc
// @Summary Bulk mark fibers as available
// @Description Mark multiple fibers as available/free in one operation
// @Tags fibers
// @Accept json
// @Produce json
// @Param fiberIds body []string true "Array of fiber IDs"
// @Success 200 {object} models.HTTPResponseSuccess
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /fibers/bulk/mark-available [patch]
func (h *Fiber) BulkMarkAvailable(c *gin.Context) {
	var fiberIDs []string

	// Bind JSON
	if err := c.ShouldBindJSON(&fiberIDs); err != nil {
		h.SendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Validate fiber IDs
	if len(fiberIDs) == 0 {
		h.SendError(c, http.StatusBadRequest, "At least one fiber ID is required", nil)
		return
	}

	// Validate each UUID
	for i, id := range fiberIDs {
		if err := h.ValidateUUID(id); err != nil {
			h.SendError(c, http.StatusBadRequest,
				fmt.Sprintf("Invalid UUID format at index %d: %s", i, id), nil)
			return
		}
	}

	// Mark fibers as available
	successCount := 0
	var failedIDs []string

	for _, fiberID := range fiberIDs {
		if err := h.fiberRepository.MarkFiberAvailable(fiberID); err != nil {
			failedIDs = append(failedIDs, fiberID)
		} else {
			successCount++
		}
	}

	// Build response message
	message := fmt.Sprintf("Successfully marked %d fiber(s) as available", successCount)
	if len(failedIDs) > 0 {
		message += fmt.Sprintf(", failed %d fiber(s)", len(failedIDs))
	}

	h.SendSuccess(c, http.StatusOK, message, gin.H{
		"success_count": successCount,
		"failed_count":  len(failedIDs),
		"failed_ids":    failedIDs,
	})
}

// =====================================================
// HELPER METHODS
// =====================================================

// isValidFiberStatus checks if the fiber status is valid
func (h *Fiber) isValidFiberStatus(status string) bool {
	validStatuses := map[string]bool{
		"FREE": true,
		"USED": true,
	}
	return validStatuses[status]
}

// RegisterRoutes registers all fiber routes
func (h *Fiber) RegisterRoutes(router *gin.RouterGroup) {
	fibers := router.Group("/fibers")
	{
		// Main CRUD operations
		fibers.GET("", h.GetAllFibers)
		fibers.POST("", h.CreateFiber)
		fibers.GET("/:fiberId", h.GetFiberByID)
		fibers.PUT("/:fiberId", h.UpdateFiber)
		fibers.DELETE("/:fiberId", h.DeleteFiber)

		// Status-specific endpoints
		fibers.GET("/used", h.GetAllUsedFibers)
		fibers.GET("/available", h.GetAvailableFibers)
		fibers.PATCH("/:fiberId/mark", h.MarkFiberAvailable)

		// Bulk operations
		fibers.PATCH("/bulk/mark-available", h.BulkMarkAvailable)
	}
}
