package base_handler

import (
	"context"
	"dashboard-app/internal/config"
	"dashboard-app/internal/models"
	"dashboard-app/pkg/apperror"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"net/http"
	"strings"
	"time"
)

type BaseHandler struct {
	Validator *validator.Validate
}

func NewBaseHandler(validator *validator.Validate) *BaseHandler {
	return &BaseHandler{
		Validator: validator,
	}
}

func (h *BaseHandler) BindAndValidate(c *gin.Context, req interface{}) error {
	if err := c.ShouldBindJSON(req); err != nil {
		h.SendError(c, http.StatusBadRequest, "Invalid request body", err)
		return err
	}

	if err := h.Validator.Struct(req); err != nil {
		validationErr := h.FormatValidationErrors(err)
		h.SendError(c, http.StatusBadRequest, "Validation failed", validationErr)
		return err
	}

	return nil
}

// BindQuery binds query parameters
func (h *BaseHandler) BindQuery(c *gin.Context, req interface{}) error {
	if err := c.ShouldBindQuery(req); err != nil {
		h.SendError(c, http.StatusBadRequest, "Invalid query parameters", err)
		return err
	}
	return nil
}

// FormatValidationErrors formats validation errors
func (h *BaseHandler) FormatValidationErrors(err error) error {
	var errMessages []string

	var validationErrs validator.ValidationErrors
	if errors.As(err, &validationErrs) {
		for _, e := range validationErrs {
			errMessages = append(errMessages, FormatFieldError(e))
		}
	}

	return errors.New(strings.Join(errMessages, "; "))
}

// HandleError handles different error types
func (h *BaseHandler) HandleError(c *gin.Context, err error, message string) {
	if appErr, ok := apperror.AsAppError(err); ok {
		config.GetLogger().Error("%s: %v", message, err)
		c.JSON(appErr.Code, models.HTTPResponseError{
			StatusCode: appErr.Code,
			Message:    appErr.Message,
		})
		return
	}

	config.GetLogger().Error("%s: %v", message, err)
	c.JSON(http.StatusInternalServerError, models.HTTPResponseError{
		StatusCode: http.StatusInternalServerError,
		Message:    message,
	})
}

// SendSuccess sends success response
func (h *BaseHandler) SendSuccess(c *gin.Context, statusCode int, message string, data interface{}) {
	response := models.HTTPResponseSuccess{
		StatusCode: statusCode,
		Message:    message,
	}

	if data != nil {
		response.Data = data
	}

	c.JSON(statusCode, response)
}

// SendError sends error response
func (h *BaseHandler) SendError(c *gin.Context, statusCode int, message string, err error) {
	if err != nil {
		config.GetLogger().Error("%s: %v", message, err)
		c.JSON(statusCode, models.HTTPResponseError{
			StatusCode: statusCode,
			Message:    fmt.Sprintf("%s: %v", message, err),
		})
	} else {
		config.GetLogger().Error(message)
		c.JSON(statusCode, models.HTTPResponseError{
			StatusCode: statusCode,
			Message:    message,
		})
	}
}

// ValidateUUID validates UUID format
func (h *BaseHandler) ValidateUUID(id string) error {
	if _, err := uuid.Parse(id); err != nil {
		return errors.New("invalid UUID format")
	}
	return nil
}

// GetUUIDParam gets and validates UUID from URL parameter
func (h *BaseHandler) GetUUIDParam(c *gin.Context, paramName string) (string, error) {
	id := c.Param(paramName)
	if err := h.ValidateUUID(id); err != nil {
		h.SendError(c, http.StatusBadRequest, fmt.Sprintf("Invalid %s format", paramName), err)
		return "", err
	}
	return id, nil
}

// FormatFieldError =====================================================
// VALIDATION HELPERS
// =====================================================
func FormatFieldError(e validator.FieldError) string {
	field := e.Field()

	switch e.Tag() {
	case "required":
		return fmt.Sprintf("%s is required", field)
	case "min":
		return fmt.Sprintf("%s must be at least %s", field, e.Param())
	case "max":
		return fmt.Sprintf("%s must be at most %s", field, e.Param())
	case "email":
		return fmt.Sprintf("%s must be a valid email", field)
	case "uuid":
		return fmt.Sprintf("%s must be a valid UUID", field)
	case "url":
		return fmt.Sprintf("%s must be a valid URL", field)
	case "numeric":
		return fmt.Sprintf("%s must be numeric", field)
	case "alpha":
		return fmt.Sprintf("%s must contain only letters", field)
	case "alphanum":
		return fmt.Sprintf("%s must contain only letters and numbers", field)
	default:
		return fmt.Sprintf("%s failed validation on '%s'", field, e.Tag())
	}
}

// =====================================================
// MIDDLEWARE
// =====================================================

// RequestLogger logs incoming requests
func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		duration := time.Since(start)
		statusCode := c.Writer.Status()

		if query != "" {
			path = path + "?" + query
		}

		config.GetLogger().Info("[%s] %s %s - %d (%v)",
			c.Request.Method,
			path,
			c.ClientIP(),
			statusCode,
			duration,
		)
	}
}

// ErrorHandler middleware to catch panics
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				config.GetLogger().Error("Panic recovered: %v", err)
				c.JSON(http.StatusInternalServerError, models.HTTPResponseError{
					StatusCode: http.StatusInternalServerError,
					Message:    "Internal server error",
				})
				c.Abort()
			}
		}()
		c.Next()
	}
}

// RateLimiter creates a simple rate limiter middleware
func RateLimiter(maxRequests int, duration time.Duration) gin.HandlerFunc {
	type client struct {
		count     int
		resetTime time.Time
	}

	clients := make(map[string]*client)

	return func(c *gin.Context) {
		ip := c.ClientIP()
		now := time.Now()

		// Get or create client
		cl, exists := clients[ip]
		if !exists || now.After(cl.resetTime) {
			clients[ip] = &client{
				count:     1,
				resetTime: now.Add(duration),
			}
			c.Next()
			return
		}

		// Check rate limit
		if cl.count >= maxRequests {
			c.JSON(http.StatusTooManyRequests, models.HTTPResponseError{
				StatusCode: http.StatusTooManyRequests,
				Message:    "Rate limit exceeded",
			})
			c.Abort()
			return
		}

		cl.count++
		c.Next()
	}
}

// CORS middleware
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// ValidateContentType ensures correct content type
func ValidateContentType(contentType string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method != "GET" && c.Request.Method != "DELETE" {
			ct := c.GetHeader("Content-Type")
			if !strings.Contains(ct, contentType) {
				c.JSON(http.StatusUnsupportedMediaType, models.HTTPResponseError{
					StatusCode: http.StatusUnsupportedMediaType,
					Message:    fmt.Sprintf("Content-Type must be %s", contentType),
				})
				c.Abort()
				return
			}
		}
		c.Next()
	}
}

// Timeout middleware adds request timeout
func Timeout(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), timeout)
		defer cancel()

		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

// =====================================================
// PAGINATION HELPERS
// =====================================================

type PaginationParams struct {
	Page int `form:"page_no" binding:"min=0"`
	Size int `form:"size" binding:"min=0,max=100"`
}

func (p *PaginationParams) Normalize() {
	if p.Page < 1 {
		p.Page = 1
	}
	if p.Size < 1 {
		p.Size = 10
	}
	if p.Size > 100 {
		p.Size = 100
	}
}

func (p *PaginationParams) GetOffset() int {
	return (p.Page - 1) * p.Size
}

// =====================================================
// RESPONSE HELPERS
// =====================================================

// PaginatedResponse wraps paginated data
type PaginatedResponse struct {
	Page       int         `json:"page"`
	Size       int         `json:"size"`
	Total      int         `json:"total"`
	TotalPages int         `json:"total_pages"`
	Data       interface{} `json:"data"`
}

func NewPaginatedResponse(page, size, total int, data interface{}) *PaginatedResponse {
	totalPages := (total + size - 1) / size
	if totalPages < 1 {
		totalPages = 1
	}

	return &PaginatedResponse{
		Page:       page,
		Size:       size,
		Total:      total,
		TotalPages: totalPages,
		Data:       data,
	}
}

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

// IsValidUUID checks if string is valid UUID
func IsValidUUID(s string) bool {
	_, err := uuid.Parse(s)
	return err == nil
}

// IsValidDate checks if string is valid date
func (h *BaseHandler) IsValidDate(dateStr string) bool {
	_, err := time.Parse("2006-01-02", dateStr)
	return err == nil
}

// IsValidDateRange checks if date range is valid
func (h *BaseHandler) IsValidDateRange(startDate, endDate string) bool {
	start, err1 := time.Parse("2006-01-02", startDate)
	end, err2 := time.Parse("2006-01-02", endDate)

	if err1 != nil || err2 != nil {
		return false
	}

	return !start.After(end)
}

// IsValidYear validates year format (YYYY)
func (h *BaseHandler) IsValidYear(yearStr string) bool {
	if len(yearStr) != 4 {
		return false
	}
	year, err := h.parseInt(yearStr)
	if err != nil {
		return false
	}
	currentYear := time.Now().Year()
	return year >= 2000 && year <= currentYear+10 // Allow up to 10 years in future
}

// parseInt safely parses string to int
func (h *BaseHandler) parseInt(s string) (int, error) {
	var result int
	_, err := fmt.Sscanf(s, "%d", &result)
	return result, err
}
