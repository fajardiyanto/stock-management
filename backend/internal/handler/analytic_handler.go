package handler

import (
	"dashboard-app/internal/config"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
)

type Analytic struct {
	analyticRepository repository.AnalyticRepository
}

func NewAnalyticsHandler(analyticRepository repository.AnalyticRepository) *Analytic {
	return &Analytic{analyticRepository: analyticRepository}
}

func (s *Analytic) GetAnalyticStatsHandler(c *gin.Context) {
	data, err := s.analyticRepository.GetAnalyticStats()
	if err != nil {
		config.GetLogger().Error(err)
		c.JSON(http.StatusInternalServerError, models.HTTPResponseError{
			StatusCode: http.StatusInternalServerError,
			Message:    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.HTTPResponseSuccess{
		StatusCode: http.StatusOK,
		Message:    "get analytics stats",
		Data:       data,
	})
}

func (s *Analytic) GetDailyAnalyticStatsHandler(c *gin.Context) {
	date := c.Param("date")

	data, err := s.analyticRepository.GetDailyGetAnalyticStats(date)
	if err != nil {
		config.GetLogger().Error(err)
		c.JSON(http.StatusInternalServerError, models.HTTPResponseError{
			StatusCode: http.StatusInternalServerError,
			Message:    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.HTTPResponseSuccess{
		StatusCode: http.StatusOK,
		Message:    fmt.Sprintf("get analytics stats for %s", date),
		Data:       data,
	})
}

func (s *Analytic) GetSalesTrendDataHandler(c *gin.Context) {
	year := c.Param("year")

	data, err := s.analyticRepository.GetSalesTrendData(year)
	if err != nil {
		config.GetLogger().Error(err)
		c.JSON(http.StatusInternalServerError, models.HTTPResponseError{
			StatusCode: http.StatusInternalServerError,
			Message:    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.HTTPResponseSuccess{
		StatusCode: http.StatusOK,
		Message:    "get sales trend data analytics",
		Data:       data,
	})
}

func (s *Analytic) GetStockDistributionDataHandler(c *gin.Context) {
	data, err := s.analyticRepository.GetStockDistributionData()
	if err != nil {
		config.GetLogger().Error(err)
		c.JSON(http.StatusInternalServerError, models.HTTPResponseError{
			StatusCode: http.StatusInternalServerError,
			Message:    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.HTTPResponseSuccess{
		StatusCode: http.StatusOK,
		Message:    "get stock distribution data analytics",
		Data:       data,
	})
}

func (s *Analytic) GetSupplierPerformanceHandler(c *gin.Context) {
	data, err := s.analyticRepository.GetSupplierPerformance()
	if err != nil {
		config.GetLogger().Error(err)
		c.JSON(http.StatusInternalServerError, models.HTTPResponseError{
			StatusCode: http.StatusInternalServerError,
			Message:    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.HTTPResponseSuccess{
		StatusCode: http.StatusOK,
		Message:    "get supplier performance data analytics",
		Data:       data,
	})
}

func (s *Analytic) GetCustomerPerformanceHandler(c *gin.Context) {
	data, err := s.analyticRepository.GetCustomerPerformance()
	if err != nil {
		config.GetLogger().Error(err)
		c.JSON(http.StatusInternalServerError, models.HTTPResponseError{
			StatusCode: http.StatusInternalServerError,
			Message:    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.HTTPResponseSuccess{
		StatusCode: http.StatusOK,
		Message:    "get supplier performance data analytics",
		Data:       data,
	})
}
