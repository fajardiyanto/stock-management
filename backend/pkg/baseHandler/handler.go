package baseHandler

import (
	"dashboard-app/internal/models"
	"dashboard-app/pkg/apperror"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"net/http"
	"strconv"
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
		_ = c.Error(err)
		h.SendError(c, http.StatusBadRequest, "Invalid request body", err)
		return err
	}

	if err := h.Validator.Struct(req); err != nil {
		validationErr := h.FormatValidationErrors(err)
		_ = c.Error(validationErr)
		h.SendError(c, http.StatusBadRequest, "Validation failed", validationErr)
		return err
	}

	return nil
}

// BindQuery binds query parameters
func (h *BaseHandler) BindQuery(c *gin.Context, req interface{}) error {
	if err := c.ShouldBindQuery(req); err != nil {
		_ = c.Error(err)
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
	// Safe type assertion using errors.As
	var appErr *apperror.AppError
	if errors.As(err, &appErr) {
		_ = c.Error(appErr)
		c.JSON(appErr.Code, models.HTTPResponseError{
			StatusCode: appErr.Code,
			Message:    appErr.Message,
		})
		return
	}

	// Default error response
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
		_ = c.Error(err)
		c.JSON(statusCode, models.HTTPResponseError{
			StatusCode: statusCode,
			Message:    fmt.Sprintf("%s: %v", message, err),
		})
	} else {
		_ = c.Error(errors.New(message))
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

// ChangeDate ChaneDate change date to format YYYY-MM-DD
func (h *BaseHandler) ChangeDate(dateStr string) string {
	if dateStr == "" {
		return ""
	}

	// Try parsing common datetime formats
	layouts := []string{
		time.RFC3339, // 2026-01-22T12:51:37Z
		"2006-01-02T15:04:05.000Z07:00",
		"2006-01-02 15:04:05",
		"2006-01-02",
	}

	for _, layout := range layouts {
		if t, err := time.Parse(layout, dateStr); err == nil {
			return t.Format("2006-01-02")
		}
	}

	// fallback if parsing fails
	return ""
}

func (h *BaseHandler) ParseMonth(month string) (int, error) {
	// numeric month: "12"
	if m, err := strconv.Atoi(month); err == nil {
		if m < 1 || m > 12 {
			return 0, apperror.NewBadRequest("invalid month")
		}
		return m, nil
	}

	// full month name: "January"
	if t, err := time.Parse("January", month); err == nil {
		return int(t.Month()), nil
	}

	// short month name: "Jan"
	if t, err := time.Parse("Jan", month); err == nil {
		return int(t.Month()), nil
	}

	return 0, apperror.NewBadRequest("invalid month")
}
