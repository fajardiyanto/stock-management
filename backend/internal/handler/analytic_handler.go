package handler

import (
	"dashboard-app/internal/repository"
	"dashboard-app/pkg/baseHandler"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"net/http"
)

type Analytic struct {
	analyticRepository repository.AnalyticRepository
	*baseHandler.BaseHandler
}

func NewAnalyticsHandler(analyticRepository repository.AnalyticRepository, validate *validator.Validate) *Analytic {
	return &Analytic{
		analyticRepository: analyticRepository,
		BaseHandler:        baseHandler.NewBaseHandler(validate),
	}
}

// GetOverallStats godoc
// @Summary Get overall statistics
// @Description Retrieve overall business statistics including stock, sales, and purchases
// @Tags analytics
// @Accept json
// @Produce json
// @Success 200 {object} models.HTTPResponseSuccess{data=models.AnalyticStatsResponse}
// @Failure 500 {object} models.HTTPResponseError
// @Router /analytics/stats [get]
func (h *Analytic) GetOverallStats(c *gin.Context) {
	month := c.Param("month")
	year := c.Param("year")
	// Fetch overall statistics
	data, err := h.analyticRepository.GetAnalyticStats(year, month)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch analytics statistics")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Overall statistics retrieved successfully", data)
}

// GetDailyStats godoc
// @Summary Get daily statistics
// @Description Retrieve statistics for a specific date
// @Tags analytics
// @Accept json
// @Produce json
// @Param date path string true "Date in YYYY-MM-DD format"
// @Success 200 {object} models.HTTPResponseSuccess{data=models.DailyAnalyticStatsResponse}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /analytics/daily/{date} [get]
func (h *Analytic) GetDailyStats(c *gin.Context) {
	date := c.Param("date")

	// Validate date format
	if !h.IsValidDate(date) {
		h.SendError(c, http.StatusBadRequest, "Invalid date format. Use YYYY-MM-DD", nil)
		return
	}

	// Fetch daily statistics
	data, err := h.analyticRepository.GetDailyGetAnalyticStats(date)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch daily statistics")
		return
	}

	h.SendSuccess(c, http.StatusOK, fmt.Sprintf("Statistics for %s retrieved successfully", date), data)
}

// GetSalesTrend godoc
// @Summary Get sales trend data
// @Description Retrieve monthly sales and purchase trends for a specific year
// @Tags analytics
// @Accept json
// @Produce json
// @Param year path string true "Year (YYYY)"
// @Success 200 {object} models.HTTPResponseSuccess{data=[]models.SalesTrendData}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /analytics/trends/{year} [get]
func (h *Analytic) GetSalesTrend(c *gin.Context) {
	year := c.Param("year")

	// Validate year format
	if !h.IsValidYear(year) {
		h.SendError(c, http.StatusBadRequest, "Invalid year format. Use YYYY (e.g., 2025)", nil)
		return
	}

	// Fetch sales trend data
	data, err := h.analyticRepository.GetSalesTrendData(year)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch sales trend data")
		return
	}

	h.SendSuccess(c, http.StatusOK, fmt.Sprintf("Sales trend for %s retrieved successfully", year), data)
}

// GetStockDistribution godoc
// @Summary Get stock distribution
// @Description Retrieve stock distribution across different stock entries
// @Tags analytics
// @Accept json
// @Produce json
// @Success 200 {object} models.HTTPResponseSuccess{data=[]models.StockDistributionData}
// @Failure 500 {object} models.HTTPResponseError
// @Router /analytics/distribution [get]
func (h *Analytic) GetStockDistribution(c *gin.Context) {
	// Fetch stock distribution data
	data, err := h.analyticRepository.GetStockDistributionData()
	if err != nil {
		h.HandleError(c, err, "Failed to fetch stock distribution")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Stock distribution retrieved successfully", data)
}

// GetSupplierPerformance godoc
// @Summary Get supplier performance
// @Description Retrieve performance metrics for all suppliers
// @Tags analytics
// @Accept json
// @Produce json
// @Success 200 {object} models.HTTPResponseSuccess{data=[]models.UserData}
// @Failure 500 {object} models.HTTPResponseError
// @Router /analytics/suppliers [get]
func (h *Analytic) GetSupplierPerformance(c *gin.Context) {
	// Fetch supplier performance data
	data, err := h.analyticRepository.GetSupplierPerformance()
	if err != nil {
		h.HandleError(c, err, "Failed to fetch supplier performance")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Supplier performance retrieved successfully", data)
}

// GetCustomerPerformance godoc
// @Summary Get customer performance
// @Description Retrieve performance metrics for all customers
// @Tags analytics
// @Accept json
// @Produce json
// @Success 200 {object} models.HTTPResponseSuccess{data=[]models.UserData}
// @Failure 500 {object} models.HTTPResponseError
// @Router /analytics/customers [get]
func (h *Analytic) GetCustomerPerformance(c *gin.Context) {
	// Fetch customer performance data
	data, err := h.analyticRepository.GetCustomerPerformance()
	if err != nil {
		h.HandleError(c, err, "Failed to fetch customer performance")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Customer performance retrieved successfully", data)
}

// RegisterRoutes registers all analytics routes
func (h *Analytic) RegisterRoutes(router *gin.RouterGroup) {
	analytics := router.Group("/analytics")
	{
		// Core analytics
		analytics.GET("/stats/:month/:year", h.GetOverallStats)
		analytics.GET("/daily/:date/stats", h.GetDailyStats)

		// Trends and distribution
		analytics.GET("/sales/trend/:year", h.GetSalesTrend)
		analytics.GET("/stock/distribution", h.GetStockDistribution)

		// Performance metrics
		analytics.GET("/supplier/performance", h.GetSupplierPerformance)
		analytics.GET("/customer/performance", h.GetCustomerPerformance)
	}
}
