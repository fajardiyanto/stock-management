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

type Sales struct {
	salesRepository repository.SalesRepository
	*baseHandler.BaseHandler
}

func NewSalesHandler(salesRepository repository.SalesRepository, validate *validator.Validate) *Sales {
	return &Sales{
		salesRepository: salesRepository,
		BaseHandler:     baseHandler.NewBaseHandler(validate),
	}
}

// CreateSales godoc
// @Summary Create a new sale
// @Description Create a new sale with items and optional fibers
// @Tags sales
// @Accept json
// @Produce json
// @Param sale body models.SaleRequest true "Sale data"
// @Success 201 {object} models.HTTPResponseSuccess
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /sales [post]
func (h *Sales) CreateSales(c *gin.Context) {
	var req models.SaleRequest

	// Bind and validate request using base handler
	if err := h.BindAndValidate(c, &req); err != nil {
		return // Error already sent
	}

	// Create sale
	if err := h.salesRepository.CreateSales(c.Request.Context(), req); err != nil {
		h.HandleError(c, err, "Failed to create sale")
		return
	}

	h.SendSuccess(c, http.StatusCreated, "Sale created successfully", nil)
}

// GetAllSales godoc
// @Summary Get all sales
// @Description Retrieve paginated list of sales with optional filters
// @Tags sales
// @Accept json
// @Produce json
// @Param page_no query int false "Page number" default(1)
// @Param size query int false "Page size" default(10)
// @Param sales_id query string false "Filter by sales ID"
// @Param customer_id query string false "Filter by customer ID"
// @Param sales_date query string false "Filter by sales date (YYYY-MM-DD)"
// @Param payment_status query string false "Filter by payment status"
// @Param keyword query string false "Search keyword"
// @Success 200 {object} models.HTTPResponseSuccess{data=models.SalePaginationResponse}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /sales [get]
func (h *Sales) GetAllSales(c *gin.Context) {
	var filter models.SalesFilter

	// Bind query parameters using base handler
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

	// Fetch sales
	data, err := h.salesRepository.GetAllSales(c.Request.Context(), filter)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch sales")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Sales retrieved successfully", data)
}

// GetSaleByID godoc
// @Summary Get sale by ID
// @Description Retrieve detailed information about a specific sale
// @Tags sales
// @Accept json
// @Produce json
// @Param saleId path string true "Sale ID"
// @Success 200 {object} models.HTTPResponseSuccess{data=models.SaleResponse}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 404 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /sales/{saleId} [get]
func (h *Sales) GetSaleByID(c *gin.Context) {
	// Get and validate UUID parameter using base handler
	saleID, err := h.GetUUIDParam(c, "saleId")
	if err != nil {
		return // Error already sent
	}

	// Fetch sale
	data, err := h.salesRepository.GetSaleById(c.Request.Context(), saleID)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch sale")
		return
	}

	h.SendSuccess(c, http.StatusOK, fmt.Sprintf("Sale %s retrieved successfully", saleID), data)
}

// DeleteSale godoc
// @Summary Delete a sale
// @Description Soft delete a sale and restore related stock
// @Tags sales
// @Accept json
// @Produce json
// @Param saleId path string true "Sale ID"
// @Success 200 {object} models.HTTPResponseSuccess
// @Failure 400 {object} models.HTTPResponseError
// @Failure 404 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /sales/{saleId} [delete]
func (h *Sales) DeleteSale(c *gin.Context) {
	// Get and validate UUID parameter
	saleID, err := h.GetUUIDParam(c, "saleId")
	if err != nil {
		return // Error already sent
	}

	// Delete sale
	if err = h.salesRepository.DeleteSale(c.Request.Context(), saleID); err != nil {
		h.HandleError(c, err, "Failed to delete sale")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Sale deleted successfully", nil)
}

// UpdateSale godoc
// @Summary Update an existing sale
// @Description Update sale information including items and fibers
// @Tags sales
// @Accept json
// @Produce json
// @Param saleId path string true "Sale ID"
// @Param sale body models.SaleRequest true "Updated sale data"
// @Success 200 {object} models.HTTPResponseSuccess
// @Failure 400 {object} models.HTTPResponseError
// @Failure 404 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /sales/{saleId} [put]
func (h *Sales) UpdateSale(c *gin.Context) {
	// Get and validate UUID parameter
	saleID, err := h.GetUUIDParam(c, "saleId")
	if err != nil {
		return // Error already sent
	}

	var req models.SaleRequest

	// Bind and validate request
	if err = h.BindAndValidate(c, &req); err != nil {
		return // Error already sent
	}

	// Update sale
	if err = h.salesRepository.UpdateSales(c.Request.Context(), saleID, req); err != nil {
		h.HandleError(c, err, "Failed to update sale")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Sale updated successfully", nil)
}

// RegisterRoutes registers all sales routes
func (h *Sales) RegisterRoutes(router *gin.RouterGroup) {
	sales := router.Group("/sales")
	{
		sales.POST("", h.CreateSales)
		sales.GET("", h.GetAllSales)
		sales.GET("/:saleId", h.GetSaleByID)
		sales.PUT("/:saleId", h.UpdateSale)
		sales.DELETE("/:saleId", h.DeleteSale)
	}
}
