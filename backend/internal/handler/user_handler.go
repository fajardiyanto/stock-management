package handler

import (
	"dashboard-app/internal/constants"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"dashboard-app/pkg/baseHandler"
	"dashboard-app/pkg/jwt"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"net/http"
	"strconv"
	"strings"
)

type User struct {
	userRepo repository.UserRepository
	*baseHandler.BaseHandler
}

func NewUserHandler(userRepo repository.UserRepository, validate *validator.Validate) *User {
	return &User{
		userRepo:    userRepo,
		BaseHandler: baseHandler.NewBaseHandler(validate),
	}
}

// Register godoc
// @Summary Register new user
// @Description Create a new user account
// @Tags auth
// @Accept json
// @Produce json
// @Param user body models.UserRequest true "User registration data"
// @Success 201 {object} models.HTTPResponseSuccess{data=models.CreateUserResponse}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 409 {object} models.HTTPResponseError "User already exists"
// @Failure 500 {object} models.HTTPResponseError
// @Router /auth/register [post]
func (h *User) Register(c *gin.Context) {
	var req models.UserRequest

	// Bind and validate request
	if err := h.BindAndValidate(c, &req); err != nil {
		return // Error already sent
	}

	// Check if user already exists
	if exist := h.userRepo.CheckUser(req.Phone); exist {
		h.SendError(c, http.StatusConflict, "User with this phone number already exists", nil)
		return
	}

	// Create user
	data, err := h.userRepo.CreateUser(req)
	if err != nil {
		h.HandleError(c, err, "Failed to create user")
		return
	}

	h.SendSuccess(c, http.StatusCreated, "User registered successfully", data)
}

// Login godoc
// @Summary User login
// @Description Authenticate user and return JWT token
// @Tags auth
// @Accept json
// @Produce json
// @Param credentials body models.LoginRequest true "Login credentials"
// @Success 200 {object} models.HTTPResponseSuccess{data=models.LoginResponse}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 401 {object} models.HTTPResponseError "Invalid credentials"
// @Failure 500 {object} models.HTTPResponseError
// @Router /auth/login [post]
func (h *User) Login(c *gin.Context) {
	var req models.LoginRequest

	// Bind and validate request
	if err := h.BindAndValidate(c, &req); err != nil {
		return // Error already sent
	}

	// Authenticate user
	data, err := h.userRepo.LoginUser(req)
	if err != nil {
		h.HandleError(c, err, "Failed to login")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Login successful", data)
}

// GetCurrentUser godoc
// @Summary Get current user
// @Description Get currently authenticated user's information
// @Tags auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.HTTPResponseSuccess{data=models.User}
// @Failure 401 {object} models.HTTPResponseError
// @Failure 404 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /auth/me [get]
func (h *User) GetCurrentUser(c *gin.Context) {
	// Get user ID from JWT token
	userID := jwt.GetHeader(c)
	if userID == "" {
		h.SendError(c, http.StatusUnauthorized, "Invalid or missing authentication token", nil)
		return
	}

	// Fetch user
	user, err := h.userRepo.GetUserByIdFromToken(userID)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch user")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Current user retrieved successfully", user)
}

// =====================================================
// USER MANAGEMENT HANDLERS
// =====================================================

// GetAllUsers godoc
// @Summary Get all users
// @Description Retrieve paginated list of users with optional filters
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number" default(1)
// @Param size query int false "Page size" default(10)
// @Param name query string false "Filter by name"
// @Param phone query string false "Filter by phone"
// @Param role query string false "Filter by role"
// @Success 200 {object} models.HTTPResponseSuccess{data=models.GetAllUserResponse}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /users [get]
func (h *User) GetAllUsers(c *gin.Context) {
	// Parse pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if size < 1 {
		size = 10
	}
	if size > 100 {
		size = 100
	}

	// Get filter parameters
	filter := models.UserFilter{
		PageNo: page,
		Size:   size,
		Name:   c.Query("name"),
		Phone:  c.Query("phone"),
		Role:   c.Query("role"),
	}

	// Fetch users
	users, err := h.userRepo.GetAllUser(filter)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch users")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Users retrieved successfully", users)
}

// GetUserByID godoc
// @Summary Get user by ID
// @Description Retrieve detailed information about a specific user
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param userId path string true "User ID"
// @Success 200 {object} models.HTTPResponseSuccess{data=models.User}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 404 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /users/{userId} [get]
func (h *User) GetUserByID(c *gin.Context) {
	// Get and validate UUID parameter
	userID, err := h.GetUUIDParam(c, "userId")
	if err != nil {
		return // Error already sent
	}

	// Fetch user
	user, err := h.userRepo.GetUserById(userID)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch user")
		return
	}

	h.SendSuccess(c, http.StatusOK, fmt.Sprintf("User %s retrieved successfully", userID), user)
}

// UpdateUser godoc
// @Summary Update user
// @Description Update user information
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param userId path string true "User ID"
// @Param user body models.UpdateUserRequest true "Updated user data"
// @Success 200 {object} models.HTTPResponseSuccess
// @Failure 400 {object} models.HTTPResponseError
// @Failure 404 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /users/{userId} [put]
func (h *User) UpdateUser(c *gin.Context) {
	// Get and validate UUID parameter
	userID, err := h.GetUUIDParam(c, "userId")
	if err != nil {
		return // Error already sent
	}

	var req models.UpdateUserRequest

	// Bind and validate request
	if err = h.BindAndValidate(c, &req); err != nil {
		return // Error already sent
	}

	// Update user
	if err = h.userRepo.UpdateUser(userID, req); err != nil {
		h.HandleError(c, err, "Failed to update user")
		return
	}

	h.SendSuccess(c, http.StatusOK, "User updated successfully", nil)
}

// DeleteUser godoc
// @Summary Delete user
// @Description Soft delete a user account
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param userId path string true "User ID"
// @Success 200 {object} models.HTTPResponseSuccess
// @Failure 400 {object} models.HTTPResponseError
// @Failure 404 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /users/{userId} [delete]
func (h *User) DeleteUser(c *gin.Context) {
	// Get and validate UUID parameter
	userID, err := h.GetUUIDParam(c, "userId")
	if err != nil {
		return // Error already sent
	}

	// Delete user
	if err = h.userRepo.SoftDeleteUser(userID); err != nil {
		h.HandleError(c, err, "Failed to delete user")
		return
	}

	h.SendSuccess(c, http.StatusOK, "User deleted successfully", nil)
}

// GetUsersByRole godoc
// @Summary Get users by role
// @Description Retrieve all users with a specific role
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param role path string true "User role (ADMIN, CUSTOMER, SUPPLIER)"
// @Success 200 {object} models.HTTPResponseSuccess{data=[]models.User}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /users/role/{role} [get]
func (h *User) GetUsersByRole(c *gin.Context) {
	role := c.Param("role")

	// Validate role
	if !h.isValidRole(role) {
		h.SendError(c, http.StatusBadRequest,
			"Invalid role. Must be one of: ADMIN, CUSTOMER, SUPPLIER, SUPER_ADMIN", nil)
		return
	}

	// Fetch users by role
	users, err := h.userRepo.GetAllUserByRole(role)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch users by role")
		return
	}

	h.SendSuccess(c, http.StatusOK,
		fmt.Sprintf("Users with role %s retrieved successfully", role), users)
}

// ChangePassword godoc
// @Summary Change user password
// @Description Change password for the current user
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param password body models.ChangePasswordRequest true "Password change data"
// @Success 200 {object} models.HTTPResponseSuccess
// @Failure 400 {object} models.HTTPResponseError
// @Failure 401 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /users/change-password [put]
func (h *User) ChangePassword(c *gin.Context) {
	token := jwt.GetHeader(c)
	if token == "" {
		h.SendError(c, http.StatusUnauthorized, "Invalid or missing authentication token", nil)
		return
	}

	userId, err := jwt.ValidateToken(token)
	if err != nil {
		h.SendError(c, http.StatusUnauthorized, "Invalid authentication token", err)
		return
	}

	var req models.ChangePasswordRequest

	// Bind and validate request
	if err = h.BindAndValidate(c, &req); err != nil {
		return // Error already sent
	}

	// Change password (implement in repository)
	if err = h.userRepo.ChangePassword(userId, req); err != nil {
		h.HandleError(c, err, "Failed to change password")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Password changed successfully", nil)
}

// ResetPassword godoc
// @Summary Change user password
// @Description Change password for the current user
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.HTTPResponseSuccess
// @Failure 400 {object} models.HTTPResponseError
// @Failure 401 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /users/{userId}/reset-password [put]
func (h *User) ResetPassword(c *gin.Context) {
	// Get and validate UUID parameter
	userID, err := h.GetUUIDParam(c, "userId")
	if err != nil {
		return // Error already sent
	}

	// Change password (implement in repository)
	data, err := h.userRepo.ResetPassword(userID)
	if err != nil {
		h.HandleError(c, err, "Failed to change password")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Password changed successfully", data)
}

// isValidRole checks if the role is valid
func (h *User) isValidRole(role string) bool {
	validRoles := map[string]bool{
		constants.AdminRole:      true,
		constants.BuyerRole:      true,
		constants.SupplierRole:   true,
		constants.SuperAdminRole: true,
	}
	return validRoles[strings.ToUpper(role)]
}

// RegisterPublicRoutes registers routes with backward compatibility
func (h *User) RegisterPublicRoutes(router *gin.RouterGroup) {
	// Public routes
	router.POST("/login", h.Login)
	router.POST("/register", h.Register)
}

// RegisterRoutes registers routes with backward compatibility
func (h *User) RegisterRoutes(router *gin.RouterGroup) {
	// Note: Add authMiddleware in main.go before these routes
	users := router.Group("/users")
	{
		users.GET("", h.GetAllUsers)
		users.PUT("/:userId", h.UpdateUser)
		users.DELETE("/:userId", h.DeleteUser)
		users.GET("/:userId", h.GetUserByID)
		users.GET("/role/:role", h.GetUsersByRole)
		users.GET("/me", h.GetCurrentUser)
		users.PUT("/change-password", h.ChangePassword)
		users.PUT("/:userId/reset-password", h.ResetPassword)
	}
}
