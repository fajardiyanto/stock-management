package handler

import (
	"dashboard-app/internal/config"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"dashboard-app/pkg/jwt"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"net/http"
	"strconv"
	"strings"
)

type User struct {
	userRepo  repository.UserRepository
	validator *validator.Validate
}

func NewUserHandler(userRepo repository.UserRepository, validate *validator.Validate) *User {
	return &User{
		userRepo:  userRepo,
		validator: validate,
	}
}

func (s *User) CreateUserHandler(c *gin.Context) {
	var req models.UserRequest

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

	if err := s.userRepo.CheckUser(req.Phone); err == nil {
		config.GetLogger().Error("user already exist")
		c.JSON(http.StatusBadRequest, models.HTTPResponseError{
			StatusCode: http.StatusBadRequest,
			Message:    "user already exist",
		})
		return
	}

	data, err := s.userRepo.CreateUser(req)
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
		Message:    "user created",
		Data:       data,
	})
}

func (s *User) LoginHandler(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		config.GetLogger().Error(err)
		c.JSON(http.StatusBadRequest, models.HTTPResponseError{
			StatusCode: http.StatusBadRequest,
			Message:    err.Error(),
		})
		return
	}

	data, err := s.userRepo.LoginUser(req)
	if err != nil {
		config.GetLogger().Error(err)
		c.JSON(http.StatusBadRequest, models.HTTPResponseError{
			StatusCode: http.StatusBadRequest,
			Message:    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.HTTPResponseSuccess{
		StatusCode: http.StatusOK,
		Message:    "user login successfully",
		Data:       data,
	})
}

func (s *User) GetMeHandler(c *gin.Context) {
	token := jwt.GetHeader(c)
	user, err := s.userRepo.GetUserById(token)
	if err != nil {
		c.JSON(http.StatusNotFound, models.HTTPResponseError{
			StatusCode: http.StatusNotFound,
			Message:    err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, models.HTTPResponseSuccess{
		StatusCode: http.StatusOK,
		Message:    "Get User By Id Success",
		Data:       user,
	})
}

func (s *User) GetUserByIdHandler(c *gin.Context) {
	uuid := c.Param("uuid")
	user, err := s.userRepo.GetUserById(uuid)
	if err != nil {
		c.JSON(http.StatusNotFound, models.HTTPResponseError{
			StatusCode: http.StatusNotFound,
			Message:    err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, models.HTTPResponseSuccess{
		StatusCode: http.StatusOK,
		Message:    "Get User By Id Success",
		Data:       user,
	})
}

func (s *User) GetAllUserHandler(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))

	name := c.Query("name")
	phone := c.Query("phone")
	role := c.Query("role")

	user, err := s.userRepo.GetAllUser(page, size, name, phone, role)
	if err != nil {
		c.JSON(http.StatusNotFound, models.HTTPResponseError{
			StatusCode: http.StatusNotFound,
			Message:    err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, models.HTTPResponseSuccess{
		StatusCode: http.StatusOK,
		Message:    "Get All User Success",
		Data:       user,
	})
}

func (s *User) UpdateUserHandler(c *gin.Context) {
	uuid := c.Param("uuid")

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
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

	if err := s.userRepo.UpdateUser(uuid, req); err != nil {
		c.JSON(http.StatusInternalServerError, models.HTTPResponseError{
			StatusCode: http.StatusInternalServerError,
			Message:    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.HTTPResponseSuccess{
		StatusCode: http.StatusOK,
		Message:    "user updated",
		Data:       req,
	})
}

func (s *User) DeleteUserHandler(c *gin.Context) {
	uuid := c.Param("uuid")

	if err := s.userRepo.SoftDeleteUser(uuid); err != nil {
		c.JSON(http.StatusInternalServerError, models.HTTPResponseError{
			StatusCode: http.StatusInternalServerError,
			Message:    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.HTTPResponseSuccess{
		StatusCode: http.StatusOK,
		Message:    "user deleted",
	})
}

func (s *User) GetAllUserByRoleHandler(c *gin.Context) {
	role := c.Param("role")
	users, err := s.userRepo.GetAllUserByRole(role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.HTTPResponseError{
			StatusCode: http.StatusInternalServerError,
			Message:    err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.HTTPResponseSuccess{
		StatusCode: http.StatusOK,
		Message:    fmt.Sprintf("Get All User By Role %s Success", role),
		Data:       users,
	})
}
