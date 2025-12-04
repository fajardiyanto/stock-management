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

type Payment struct {
	paymentRepository repository.PaymentRepository
	validator         *validator.Validate
}

func NewPaymentHandler(paymentRepository repository.PaymentRepository, validator *validator.Validate) *Payment {
	return &Payment{paymentRepository: paymentRepository, validator: validator}
}

func (s *Payment) GetAllPaymentFromUserIdHandler(c *gin.Context) {
	userId := c.Param("userId")

	data, err := s.paymentRepository.GetAllPaymentFromUserId(userId)
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
		Message:    fmt.Sprintf("get all payment from user id %s", userId),
		Data:       data,
	})
}

func (s *Payment) CreateManualPaymentHandler(c *gin.Context) {
	userId := c.Param("userId")

	var req []models.CreateManualPaymentRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		config.GetLogger().Error(err)
		c.JSON(http.StatusBadRequest, models.HTTPResponseError{
			StatusCode: http.StatusBadRequest,
			Message:    err.Error(),
		})
		return
	}

	for i, r := range req {
		if err := s.validator.Struct(r); err != nil {
			var errs []string
			for _, e := range err.(validator.ValidationErrors) {
				errs = append(errs, fmt.Sprintf(
					"Item[%d] Field %s failed on '%s'",
					i, e.Field(), e.Tag(),
				))
			}

			errMsg := strings.Join(errs, ", ")
			config.GetLogger().Error(errMsg)

			c.JSON(http.StatusBadRequest, models.HTTPResponseError{
				StatusCode: http.StatusBadRequest,
				Message:    errMsg,
			})
			return
		}
	}

	err := s.paymentRepository.CreateManualPayment(userId, req)
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
		Message:    fmt.Sprintf("create manual payment from user id %s", userId),
	})
}

func (s *Payment) DeleteManualPaymentHandler(c *gin.Context) {
	paymentId := c.Param("paymentId")

	err := s.paymentRepository.DeleteManualPayment(paymentId)
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
		Message:    fmt.Sprintf("successfully delete manual payment from paymentId id %s", paymentId),
	})
}

func (s *Payment) GetAllPaymentByFieldIdHandler(c *gin.Context) {
	id := c.Param("id")
	field := c.Param("field")

	data, err := s.paymentRepository.GetAllPaymentByFieldId(id, field)
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
		Message:    fmt.Sprintf("get all payment from field id %s", id),
		Data:       data,
	})
}

func (s *Payment) CreatePaymentByPurchaseIdHandler(c *gin.Context) {
	var req models.CreatePaymentPurchaseRequest

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

	if err := s.paymentRepository.CreatePaymentByPurchaseId(req); err != nil {
		config.GetLogger().Error(err)
		c.JSON(http.StatusInternalServerError, models.HTTPResponseError{
			StatusCode: http.StatusInternalServerError,
			Message:    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.HTTPResponseSuccess{
		StatusCode: http.StatusOK,
		Message:    fmt.Sprintf("create payment from purchase id %s", req.PurchaseId),
	})
}

func (s *Payment) CreatePaymentBySaleIdHandler(c *gin.Context) {
	var req models.CreatePaymentSaleRequest

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

	if err := s.paymentRepository.CreatePaymentBySalesId(req); err != nil {
		config.GetLogger().Error(err)
		c.JSON(http.StatusInternalServerError, models.HTTPResponseError{
			StatusCode: http.StatusInternalServerError,
			Message:    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.HTTPResponseSuccess{
		StatusCode: http.StatusOK,
		Message:    fmt.Sprintf("create payment from purchase id %s", req.SalesId),
	})
}
