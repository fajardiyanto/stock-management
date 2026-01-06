package handler

import (
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"dashboard-app/pkg/baseHandler"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"net/http"
)

type Purchase struct {
	purchaseRepository repository.PurchaseRepository
	*baseHandler.BaseHandler
}

func NewPurchaseHandler(purchaseRepository repository.PurchaseRepository, validate *validator.Validate) *Purchase {
	return &Purchase{
		purchaseRepository: purchaseRepository,
		BaseHandler:        baseHandler.NewBaseHandler(validate),
	}
}

// CreatePurchase godoc
// @Summary Create a new purchase
// @Description Create a new purchase order with stock items
// @Tags purchases
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param purchase body models.CreatePurchaseRequest true "Purchase data"
// @Success 201 {object} models.HTTPResponseSuccess{data=models.PurchaseDataResponse}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /purchases [post]
func (h *Purchase) CreatePurchase(c *gin.Context) {
	var req models.CreatePurchaseRequest

	// Bind and validate request
	if err := h.BindAndValidate(c, &req); err != nil {
		return // Error already sent
	}

	// Validate stock items
	if len(req.StockItems) == 0 {
		h.SendError(c, http.StatusBadRequest, "At least one stock item is required", nil)
		return
	}

	// Create purchase
	data, err := h.purchaseRepository.CreatePurchase(req)
	if err != nil {
		h.HandleError(c, err, "Failed to create purchase")
		return
	}

	h.SendSuccess(c, http.StatusCreated, "Purchase created successfully", data)
}

// GetAllPurchases godoc
// @Summary Get all purchases
// @Description Retrieve paginated list of purchases with optional filters
// @Tags purchases
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param page_no query int false "Page number" default(1)
// @Param size query int false "Page size" default(10)
// @Param supplier_id query string false "Filter by supplier ID"
// @Param purchase_date query string false "Filter by purchase date (YYYY-MM-DD)"
// @Param payment_status query string false "Filter by payment status"
// @Param keyword query string false "Search keyword"
// @Success 200 {object} models.HTTPResponseSuccess{data=models.PurchasePaginationResponse}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /purchases [get]
func (h *Purchase) GetAllPurchases(c *gin.Context) {
	var filter models.PurchaseFilter

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

	// Fetch purchases
	data, err := h.purchaseRepository.GetAllPurchases(filter)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch purchases")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Purchases retrieved successfully", data)
}

// UpdatePurchase godoc
// @Summary Update purchase
// @Description Update purchase information
// @Tags purchases
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param purchaseId path string true "Purchase ID"
// @Param purchase body models.UpdatePurchaseRequest true "Updated purchase data"
// @Success 200 {object} models.HTTPResponseSuccess
// @Failure 400 {object} models.HTTPResponseError
// @Failure 404 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /purchases/{purchaseId} [put]
func (h *Purchase) UpdatePurchase(c *gin.Context) {
	// Get and validate UUID parameter
	purchaseID, err := h.GetUUIDParam(c, "purchaseId")
	if err != nil {
		return // Error already sent
	}

	var req models.UpdatePurchaseRequest

	// Bind and validate request
	if err = h.BindAndValidate(c, &req); err != nil {
		return // Error already sent
	}

	// Update purchase
	if err = h.purchaseRepository.UpdatePurchase(purchaseID, req); err != nil {
		h.HandleError(c, err, "Failed to update purchase")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Purchase updated successfully", nil)
}

// RegisterRoutes registers all purchase routes
func (h *Purchase) RegisterRoutes(router *gin.RouterGroup) {
	purchases := router.Group("/purchases")
	{
		purchases.POST("", h.CreatePurchase)
		purchases.GET("", h.GetAllPurchases)
		purchases.PUT("/:purchaseId", h.UpdatePurchase)
	}
}
