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

type Fiber struct {
	fiberRepository repository.FiberRepository
	validator       *validator.Validate
}

func NewFiberHandler(fiberRepository repository.FiberRepository, validator *validator.Validate) *Fiber {
	return &Fiber{
		fiberRepository: fiberRepository,
		validator:       validator,
	}
}

func (s *Fiber) GetAllFibersHandler(c *gin.Context) {
	var filter models.FiberFilter

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

	data, err := s.fiberRepository.GetAllFibers(filter)
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
		Message:    "get all fibers",
		Data:       data,
	})
}

func (s *Fiber) GetFiberByIdHandler(c *gin.Context) {
	fiberId := c.Param("fiberId")

	data, err := s.fiberRepository.GetFiberById(fiberId)
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
		Message:    fmt.Sprintf("get fiber by id %s", fiberId),
		Data:       data,
	})
}

func (s *Fiber) CreateFiberHandler(c *gin.Context) {
	var req models.FiberRequest

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

	data, err := s.fiberRepository.CreateFiber(req)
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
		Message:    "successfully create fiber",
		Data:       data,
	})
}

func (s *Fiber) MarkFiberAvailableHandler(c *gin.Context) {
	fiberId := c.Param("fiberId")

	if err := s.fiberRepository.MarkFiberAvailable(fiberId); err != nil {
		config.GetLogger().Error(err)
		c.JSON(http.StatusInternalServerError, models.HTTPResponseError{
			StatusCode: http.StatusInternalServerError,
			Message:    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.HTTPResponseSuccess{
		StatusCode: http.StatusOK,
		Message:    fmt.Sprintf("successfully mark fiber available for id: %s", fiberId),
	})
}

func (s *Fiber) DeleteFiberHandler(c *gin.Context) {
	fiberId := c.Param("fiberId")

	if err := s.fiberRepository.DeleteFiber(fiberId); err != nil {
		config.GetLogger().Error(err)
		c.JSON(http.StatusInternalServerError, models.HTTPResponseError{
			StatusCode: http.StatusInternalServerError,
			Message:    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.HTTPResponseSuccess{
		StatusCode: http.StatusOK,
		Message:    fmt.Sprintf("successfully delete fiber for id: %s", fiberId),
	})
}

func (s *Fiber) UpdateFiberHandler(c *gin.Context) {
	fiberId := c.Param("fiberId")

	var req models.FiberRequest

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

	if err := s.fiberRepository.UpdateFiber(fiberId, req); err != nil {
		config.GetLogger().Error(err)
		c.JSON(http.StatusInternalServerError, models.HTTPResponseError{
			StatusCode: http.StatusInternalServerError,
			Message:    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.HTTPResponseSuccess{
		StatusCode: http.StatusOK,
		Message:    fmt.Sprintf("successfully update fiber for id: %s", fiberId),
	})
}
