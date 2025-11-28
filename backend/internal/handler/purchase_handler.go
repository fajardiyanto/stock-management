package handler

import (
	"dashboard-app/internal/config"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type Purchase struct {
	purchaseRepository repository.PurchaseRepository
	validator          *validator.Validate
}

func NewPurchaseHandler(purchaseRepository repository.PurchaseRepository, validate *validator.Validate) *Purchase {
	return &Purchase{
		purchaseRepository: purchaseRepository,
		validator:          validate,
	}
}

func (s *Purchase) CreatePurchaseHandler(c *gin.Context) {
	var req models.CreatePurchaseRequest

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

	data, err := s.purchaseRepository.CreatePurchase(req)
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
		Message:    "purchasing created",
		Data:       data,
	})
}

func (s *Purchase) GetAllPurchasesHandler(c *gin.Context) {
	var filter models.PurchaseFilter

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

	data, err := s.purchaseRepository.GetAllPurchases(filter)
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
		Message:    "get all purchasing",
		Data:       data,
	})
}

func (s *Purchase) UpdatePurchaseHandler(c *gin.Context) {
	purchaseId := c.Param("purchaseId")

	var req models.UpdatePurchaseRequest

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

	if err := s.purchaseRepository.UpdatePurchase(purchaseId, req); err != nil {
		config.GetLogger().Error(err)
		c.JSON(http.StatusInternalServerError, models.HTTPResponseError{
			StatusCode: http.StatusInternalServerError,
			Message:    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.HTTPResponseSuccess{
		StatusCode: http.StatusOK,
		Message:    fmt.Sprintf("Successfully update purchase from purchase id %s", purchaseId),
	})
}
