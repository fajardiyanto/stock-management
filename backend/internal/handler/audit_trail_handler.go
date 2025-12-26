package handler

import (
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"dashboard-app/pkg/base_handler"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/xuri/excelize/v2"
	"net/http"
	"time"
)

type AuditLog struct {
	auditTrailRepository repository.AuditTrailRepository
	*base_handler.BaseHandler
}

func NewAuditLogHandler(auditTrailRepository repository.AuditTrailRepository, validate *validator.Validate) *AuditLog {
	return &AuditLog{
		auditTrailRepository: auditTrailRepository,
		BaseHandler:          base_handler.NewBaseHandler(validate),
	}
}

// GetAuditLogs godoc
// @Summary Get audit logs
// @Description Retrieve paginated audit logs with optional filters
// @Tags audit-logs
// @Accept json
// @Produce json
// @Param user_id query string false "Filter by user ID"
// @Param username query string false "Filter by username"
// @Param action query string false "Filter by action"
// @Param method query string false "Filter by HTTP method"
// @Param path query string false "Filter by path"
// @Param start_date query string false "Filter by start date (RFC3339 format)"
// @Param end_date query string false "Filter by end date (RFC3339 format)"
// @Param status_code query int false "Filter by status code"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Success 200 {object} models.HTTPResponseSuccess{data=middleware.AuditLogResponse}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /audit-logs [get]
func (h *AuditLog) GetAuditLogs(c *gin.Context) {
	var filter models.AuditLogFilter

	// Bind query parameters
	if err := h.BindQuery(c, &filter); err != nil {
		return // Error already sent
	}

	// Normalize pagination
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 {
		filter.PageSize = 20
	}
	if filter.PageSize > 100 {
		filter.PageSize = 100
	}

	// Fetch audit logs
	data, err := h.auditTrailRepository.GetAuditLogs(filter)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch audit logs")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Audit logs retrieved successfully", data)
}

// GetAuditLogByID godoc
// @Summary Get audit log by ID
// @Description Retrieve detailed information about a specific audit log entry
// @Tags audit-logs
// @Accept json
// @Produce json
// @Param logId path int true "Audit Log ID"
// @Success 200 {object} models.HTTPResponseSuccess{data=middleware.AuditLog}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 404 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /audit-logs/{logId} [get]
func (h *AuditLog) GetAuditLogByID(c *gin.Context) {
	// Get and validate ID parameter
	logID, err := h.GetIntParam(c, "logId")
	if err != nil {
		return // Error already sent
	}

	// Fetch audit log
	var filter models.AuditLogFilter
	filter.ID = logID

	// Bind query parameters
	if err = h.BindQuery(c, &filter); err != nil {
		return // Error already sent
	}

	// Normalize pagination
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 {
		filter.PageSize = 20
	}
	if filter.PageSize > 100 {
		filter.PageSize = 100
	}

	// Fetch audit logs
	data, err := h.auditTrailRepository.GetAuditLogs(filter)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch audit logs")
		return
	}

	h.SendSuccess(c, http.StatusOK, fmt.Sprintf("Audit log %d retrieved successfully", logID), data)
}

// GetUserAuditLogs godoc
// @Summary Get audit logs for a specific user
// @Description Retrieve all audit logs for a specific user with pagination
// @Tags audit-logs
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Param start_date query string false "Filter by start date (RFC3339 format)"
// @Param end_date query string false "Filter by end date (RFC3339 format)"
// @Success 200 {object} models.HTTPResponseSuccess{data=middleware.AuditLogResponse}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /audit-logs/user/{userId} [get]
func (h *AuditLog) GetUserAuditLogs(c *gin.Context) {
	// Get and validate UUID parameter
	userID, err := h.GetUUIDParam(c, "userId")
	if err != nil {
		return // Error already sent
	}

	var filter models.AuditLogFilter
	filter.UserID = userID

	// Bind query parameters for pagination and date range
	if err = h.BindQuery(c, &filter); err != nil {
		return // Error already sent
	}

	// Normalize pagination
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 {
		filter.PageSize = 20
	}
	if filter.PageSize > 100 {
		filter.PageSize = 100
	}

	// Fetch audit logs
	data, err := h.auditTrailRepository.GetAuditLogs(filter)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch user audit logs")
		return
	}

	h.SendSuccess(c, http.StatusOK, fmt.Sprintf("Audit logs for user %s retrieved successfully", userID), data)
}

// GetUserActivity godoc
// @Summary Get user activity summary
// @Description Retrieve activity statistics for a specific user over a period
// @Tags audit-logs
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Param days query int false "Number of days to look back" default(30)
// @Success 200 {object} models.HTTPResponseSuccess{data=map[string]interface{}}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /audit-logs/user/{userId}/activity [get]
func (h *AuditLog) GetUserActivity(c *gin.Context) {
	// Get and validate UUID parameter
	userID, err := h.GetUUIDParam(c, "userId")
	if err != nil {
		return // Error already sent
	}

	// Get days parameter
	days := c.DefaultQuery("days", "30")
	var daysInt int
	if _, err = fmt.Sscanf(days, "%d", &daysInt); err != nil || daysInt < 1 {
		daysInt = 30
	}
	if daysInt > 365 {
		daysInt = 365 // Max 1 year
	}

	// Fetch user activity
	data, err := h.auditTrailRepository.GetUserActivity(userID, daysInt)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch user activity")
		return
	}

	h.SendSuccess(c, http.StatusOK, "User activity retrieved successfully", data)
}

// ExportAuditLogs godoc
// @Summary Export audit logs
// @Description Export audit logs as CSV for a specific date range
// @Tags audit-logs
// @Accept json
// @Produce text/csv
// @Param start_date query string true "Start date (RFC3339 format)"
// @Param end_date query string true "End date (RFC3339 format)"
// @Param user_id query string false "Filter by user ID"
// @Success 200 {file} file "CSV file"
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /audit-logs/export [get]
func (h *AuditLog) ExportAuditLogs(c *gin.Context) {
	// Parse date parameters
	var filter models.AuditLogFilter

	// Normalize pagination
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 {
		filter.PageSize = 20
	}
	if filter.PageSize > 100 {
		filter.PageSize = 100
	}

	// Bind query parameters for pagination and date range
	if err := h.BindQuery(c, &filter); err != nil {
		return // Error already sent
	}

	// Fetch audit logs
	data, err := h.auditTrailRepository.GetAuditLogs(filter)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch user audit logs")
		return
	}

	f := excelize.NewFile()
	sheet := "Audit Logs"
	_ = f.SetSheetName("Sheet1", sheet)

	// Header row
	headers := []string{
		"ID",
		"Timestamp",
		"User ID",
		"Name",
		"Role",
		"Action",
		"Method",
		"Path",
		"IP Address",
		"Status Code",
		"Duration (ms)",
	}

	for col, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(col+1, 1)
		_ = f.SetCellValue(sheet, cell, header)
	}

	// Data rows
	for row, log := range data.Data {
		values := []any{
			log.ID,
			log.Timestamp.Format(time.RFC3339),
			log.UserID,
			log.Name,
			log.UserRole,
			log.Action,
			log.Method,
			log.Path,
			log.IPAddress,
			log.StatusCode,
			log.Duration,
		}

		for col, value := range values {
			cell, _ := excelize.CoordinatesToCellName(col+1, row+2)
			_ = f.SetCellValue(sheet, cell, value)
		}
	}

	// Auto width (nice UX)
	for i := 1; i <= len(headers); i++ {
		col, _ := excelize.ColumnNumberToName(i)
		_ = f.SetColWidth(sheet, col, col, 20)
	}

	var startDate = filter.StartDate
	var endDate = filter.EndDate

	if startDate == "" {
		startDate = time.Now().Format("2006-01-02")
	}

	if endDate == "" {
		endDate = time.Now().Format("2006-01-02")
	}

	// Filename uses selected date range
	filename := fmt.Sprintf(
		"audit_logs_%s_to_%s.xlsx",
		startDate,
		endDate,
	)
	fmt.Println(filename)

	c.Header(
		"Content-Type",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	)
	c.Header(
		"Content-Disposition",
		`attachment; filename="`+filename+`"`,
	)

	_ = f.Write(c.Writer)
}

// GetIntParam extracts and validates an integer parameter from URL
func (h *AuditLog) GetIntParam(c *gin.Context, paramName string) (int, error) {
	paramStr := c.Param(paramName)
	var paramInt int
	if _, err := fmt.Sscanf(paramStr, "%d", &paramInt); err != nil {
		h.SendError(c, http.StatusBadRequest, fmt.Sprintf("Invalid %s format", paramName), err)
		return 0, err
	}
	return paramInt, nil
}

// RegisterRoutes registers all audit log routes
func (h *AuditLog) RegisterRoutes(router *gin.RouterGroup) {
	auditLogs := router.Group("/audit-logs")
	{
		// Main endpoints
		auditLogs.GET("", h.GetAuditLogs)
		auditLogs.GET("/:logId", h.GetAuditLogByID)

		// User-specific endpoints
		auditLogs.GET("/user/:userId", h.GetUserAuditLogs)
		auditLogs.GET("/user/:userId/activity", h.GetUserActivity)

		// Export endpoint
		auditLogs.GET("/export", h.ExportAuditLogs)
	}
}
