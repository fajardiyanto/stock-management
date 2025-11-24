package handler

import (
	"dashboard-app/internal/config"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"net/http"
	"strconv"
)

type Stock struct {
	stockRepository repository.StockRepository
	validator       *validator.Validate
}

func NewStockHandler(stockRepository repository.StockRepository, validate *validator.Validate) *Stock {
	return &Stock{stockRepository: stockRepository, validator: validate}
}

func (s *Stock) GetAllStockEntriesHandler(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))

	data, err := s.stockRepository.GetAllStockEntries(page, size)
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
		Message:    "get all stock entries",
		Data:       data,
	})
}
