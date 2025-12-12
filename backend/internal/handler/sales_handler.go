package handler

import (
	"dashboard-app/internal/config"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"dashboard-app/util/apperror"
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
	ctx := c.Request.Context()

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

	if err := s.salesRepository.CreateSales(ctx, req); err != nil {
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
	ctx := c.Request.Context()

	var filter models.SalesFilter

	if err := c.BindQuery(&filter); err != nil {
		c.JSON(http.StatusBadRequest, models.HTTPResponseError{
			StatusCode: http.StatusBadRequest,
			Message:    "invalid query params: " + err.Error(),
		})
		return
	}

	if filter.PageNo == 0 {
		filter.PageNo = 1
	}
	if filter.Size == 0 {
		filter.Size = 10
	}

	data, err := s.salesRepository.GetAllSales(ctx, filter)
	if err != nil {
		if appErr, ok := apperror.AsAppError(err); ok {
			config.GetLogger().Error(err)
			c.JSON(appErr.Code, models.HTTPResponseError{
				StatusCode: appErr.Code,
				Message:    appErr.Message,
			})
			return
		}
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
	ctx := c.Request.Context()

	saleId := c.Param("saleId")

	err := s.salesRepository.DeleteSale(ctx, saleId)
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

func (s *Sales) GetSaleByIdHandler(c *gin.Context) {
	ctx := c.Request.Context()

	saleId := c.Param("saleId")

	data, err := s.salesRepository.GetSaleById(ctx, saleId)
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
		Message:    fmt.Sprintf("successfully get sale for id %s", saleId),
		Data:       data,
	})
}

func (s *Sales) UpdateSalesHandler(c *gin.Context) {
	ctx := c.Request.Context()

	saleId := c.Param("saleId")
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

	if err := s.salesRepository.UpdateSales(ctx, saleId, req); err != nil {
		config.GetLogger().Error(err)
		c.JSON(http.StatusInternalServerError, models.HTTPResponseError{
			StatusCode: http.StatusInternalServerError,
			Message:    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.HTTPResponseSuccess{
		StatusCode: http.StatusOK,
		Message:    "successfully update sales",
	})
}
