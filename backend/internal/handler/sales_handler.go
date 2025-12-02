package handler

import (
	"dashboard-app/internal/config"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"net/http"
	"strings"
)

type Sales struct {
	salesRepository repository.SalesRepository
	validator       *validator.Validate
}

func NewSalesHandler(salesRepository repository.SalesRepository, validator *validator.Validate) *Sales {
	return &Sales{
		salesRepository: salesRepository,
		validator:       validator,
	}
}

func (s *Sales) CreateSalesHandler(c *gin.Context) {
	var req models.SaleRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		config.GetLogger().Error(err)
		c.JSON(http.StatusBadRequest, models.HTTPResponseError{
			StatusCode: http.StatusBadRequest,
			Message:    err.Error(),
		})
		return
	}

	if err := s.validator.Struct(req); err != nil {
		var errs []string
		for _, e := range err.(validator.ValidationErrors) {
			errs = append(errs, fmt.Sprintf("Field %s failed on '%s'", e.Field(), e.Tag()))
		}
		errMsg := strings.Join(errs, ", ")

		config.GetLogger().Error(errMsg)
		c.JSON(http.StatusBadRequest, models.HTTPResponseError{
			StatusCode: http.StatusBadRequest,
			Message:    errMsg,
		})
		return
	}

	if err := s.salesRepository.CreateSales(req); err != nil {
		config.GetLogger().Error(err)
		c.JSON(http.StatusInternalServerError, models.HTTPResponseError{
			StatusCode: http.StatusInternalServerError,
			Message:    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.HTTPResponseSuccess{
		StatusCode: http.StatusOK,
		Message:    "successfully create sales",
	})
}

func (s *Sales) GetAllSalesHandler(c *gin.Context) {
	data, err := s.salesRepository.GetAllSales()
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
		Message:    "successfully get all sales",
		Data:       data,
	})
}

func (s *Sales) DeleteSaleHandler(c *gin.Context) {
	saleId := c.Param("saleId")

	err := s.salesRepository.DeleteSale(saleId)
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
		Message:    "successfully delete sales",
	})
}
