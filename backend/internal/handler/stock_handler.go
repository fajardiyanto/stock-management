package handler

import (
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"dashboard-app/pkg/baseHandler"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"net/http"
)

type Stock struct {
	stockRepository repository.StockRepository
	*baseHandler.BaseHandler
}

func NewStockHandler(stockRepository repository.StockRepository, validate *validator.Validate) *Stock {
	return &Stock{
		stockRepository: stockRepository,
		BaseHandler:     baseHandler.NewBaseHandler(validate),
	}
}

// GetAllStockEntries godoc
// @Summary Get all stock entries
// @Description Retrieve paginated list of stock entries with optional filters
// @Tags stock
// @Accept json
// @Produce json
// @Param page_no query int false "Page number" default(1)
// @Param size query int false "Page size" default(10)
// @Param supplier_id query string false "Filter by supplier ID"
// @Param purchase_date query string false "Filter by purchase date"
// @Param age_in_day query string false "Filter by age (LT_1, GT_1, GT_10, GT_30)"
// @Param keyword query string false "Search keyword"
// @Success 200 {object} models.HTTPResponseSuccess{data=models.StockResponse}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /stocks [get]
func (h *Stock) GetAllStockEntries(c *gin.Context) {
	var filter models.StockEntryFilter

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

	// Fetch stock entries
	data, err := h.stockRepository.GetAllStockEntries(filter)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch stock entries")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Stock entries retrieved successfully", data)
}

// GetStockEntryByID godoc
// @Summary Get stock entry by ID
// @Description Retrieve detailed information about a specific stock entry
// @Tags stock
// @Accept json
// @Produce json
// @Param stockId path string true "Stock Entry ID"
// @Success 200 {object} models.HTTPResponseSuccess{data=models.StockEntriesResponse}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 404 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /stocks/{stockId} [get]
func (h *Stock) GetStockEntryByID(c *gin.Context) {
	// Get and validate UUID parameter
	stockID, err := h.GetUUIDParam(c, "stockId")
	if err != nil {
		return // Error already sent
	}

	// Fetch stock entry
	data, err := h.stockRepository.GetStockEntryById(stockID)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch stock entry")
		return
	}

	h.SendSuccess(c, http.StatusOK, fmt.Sprintf("Stock entry %s retrieved successfully", stockID), data)
}

// UpdateStockEntry godoc
// @Summary Update stock entry
// @Description Update stock entry information including items
// @Tags stock
// @Accept json
// @Produce json
// @Param stockId path string true "Stock Entry ID"
// @Param stock body models.CreatePurchaseRequest true "Updated stock data"
// @Success 200 {object} models.HTTPResponseSuccess{data=models.PurchaseDataResponse}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 404 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /stocks/{stockId} [put]
func (h *Stock) UpdateStockEntry(c *gin.Context) {
	// Get and validate UUID parameter
	stockID, err := h.GetUUIDParam(c, "stockId")
	if err != nil {
		return // Error already sent
	}

	var req models.CreatePurchaseRequest

	// Bind and validate request
	if err = h.BindAndValidate(c, &req); err != nil {
		return // Error already sent
	}

	// Update stock entry
	data, err := h.stockRepository.UpdateStockById(stockID, req)
	if err != nil {
		h.HandleError(c, err, "Failed to update stock entry")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Stock entry updated successfully", data)
}

// DeleteStockEntry godoc
// @Summary Delete stock entry
// @Description Soft delete a stock entry and all related items
// @Tags stock
// @Accept json
// @Produce json
// @Param stockId path string true "Stock Entry ID"
// @Success 200 {object} models.HTTPResponseSuccess
// @Failure 400 {object} models.HTTPResponseError
// @Failure 404 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /stocks/{stockId} [delete]
func (h *Stock) DeleteStockEntry(c *gin.Context) {
	// Get and validate UUID parameter
	stockID, err := h.GetUUIDParam(c, "stockId")
	if err != nil {
		return // Error already sent
	}

	// Delete stock entry
	if err = h.stockRepository.DeleteStockEntryById(stockID); err != nil {
		h.HandleError(c, err, "Failed to delete stock entry")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Stock entry deleted successfully", nil)
}

// =====================================================
// STOCK ITEMS HANDLERS
// =====================================================

// GetStockItemByID godoc
// @Summary Get stock item by ID
// @Description Retrieve detailed information about a specific stock item
// @Tags stock
// @Accept json
// @Produce json
// @Param stockId path string true "Stock Entry ID"
// @Param itemId path string true "Stock Item ID"
// @Success 200 {object} models.HTTPResponseSuccess{data=models.StockEntryResponse}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 404 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /stocks/{stockId}/items/{itemId} [get]
func (h *Stock) GetStockItemByID(c *gin.Context) {
	// Get and validate UUID parameters
	stockItemId, err := h.GetUUIDParam(c, "stockItemId")
	if err != nil {
		return // Error already sent
	}

	// Fetch stock item
	data, err := h.stockRepository.GetStockItemById(stockItemId)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch stock item")
		return
	}

	h.SendSuccess(c, http.StatusOK, fmt.Sprintf("Stock item %s retrieved successfully", stockItemId), data)
}

// =====================================================
// STOCK SORTS HANDLERS
// =====================================================

// GetAllStockSorts godoc
// @Summary Get all stock sorts
// @Description Retrieve all available stock sorts (not shrinkage, with stock)
// @Tags stock
// @Accept json
// @Produce json
// @Success 200 {object} models.HTTPResponseSuccess{data=[]models.StockSortResponse}
// @Failure 500 {object} models.HTTPResponseError
// @Router /stocks/sorts [get]
func (h *Stock) GetAllStockSorts(c *gin.Context) {
	// Fetch all stock sorts
	data, err := h.stockRepository.GetAllStockSorts()
	if err != nil {
		h.HandleError(c, err, "Failed to fetch stock sorts")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Stock sorts retrieved successfully", data)
}

// CreateStockSort godoc
// @Summary Create stock sorts for an item
// @Description Create sorted items from a stock item
// @Tags stock
// @Accept json
// @Produce json
// @Param stockId path string true "Stock Entry ID"
// @Param itemId path string true "Stock Item ID"
// @Param sorts body models.SubmitSortRequest true "Sort data"
// @Success 201 {object} models.HTTPResponseSuccess
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /stocks/{stockId}/items/{itemId}/sorts [post]
func (h *Stock) CreateStockSort(c *gin.Context) {
	// Get and validate UUID parameters
	stockItemId, err := h.GetUUIDParam(c, "stockItemId")
	if err != nil {
		return // Error already sent
	}

	var req models.SubmitSortRequest

	// Bind and validate request
	if err = h.BindAndValidate(c, &req); err != nil {
		return // Error already sent
	}

	// Set stock item ID from URL parameter
	req.StockItemId = stockItemId

	// Create stock sorts
	if err = h.stockRepository.CreateStockSort(req); err != nil {
		h.HandleError(c, err, "Failed to create stock sorts")
		return
	}

	h.SendSuccess(c, http.StatusCreated, "Stock sorts created successfully", nil)
}

// UpdateStockSort godoc
// @Summary Update stock sorts for an item
// @Description Update sorted items for a stock item
// @Tags stock
// @Accept json
// @Produce json
// @Param stockId path string true "Stock Entry ID"
// @Param itemId path string true "Stock Item ID"
// @Param sorts body models.SubmitSortRequest true "Updated sort data"
// @Success 200 {object} models.HTTPResponseSuccess
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /stocks/{stockId}/items/{itemId}/sorts [put]
func (h *Stock) UpdateStockSort(c *gin.Context) {
	// Get and validate UUID parameters
	stockItemId, err := h.GetUUIDParam(c, "stockItemId")
	if err != nil {
		return // Error already sent
	}

	var req models.SubmitSortRequest

	// Bind and validate request
	if err = h.BindAndValidate(c, &req); err != nil {
		return // Error already sent
	}

	// Set stock item ID from URL parameter
	req.StockItemId = stockItemId

	// Update stock sorts
	if err = h.stockRepository.UpdateStockSort(req); err != nil {
		h.HandleError(c, err, "Failed to update stock sorts")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Stock sorts updated successfully", nil)
}

// RegisterRoutes registers all stock routes with improved RESTful structure
func (h *Stock) RegisterRoutes(router *gin.RouterGroup) {
	stocks := router.Group("/stocks")
	{
		// Stock entries
		stocks.GET("", h.GetAllStockEntries)
		stocks.GET("/:stockId", h.GetStockEntryByID)
		stocks.PUT("/:stockId", h.UpdateStockEntry)
		stocks.DELETE("/:stockId", h.DeleteStockEntry)

		// Stock items (nested under stock entries)
		stocks.GET("/items/:stockItemId", h.GetStockItemByID)

		// Stock sorts
		stocks.GET("/sorts", h.GetAllStockSorts)
		stocks.POST("/sorts/:stockItemId", h.CreateStockSort)
		stocks.PUT("/sorts/:stockItemId", h.UpdateStockSort)
	}
}
