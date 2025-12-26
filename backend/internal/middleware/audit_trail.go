package middleware

import (
	"bytes"
	"dashboard-app/internal/config"
	"dashboard-app/internal/models"
	"dashboard-app/pkg/jwt"
	"dashboard-app/util"
	"fmt"
	"github.com/gin-gonic/gin"
	"io"
	"strings"
	"time"
)

// AuditTrailLogger middleware for comprehensive audit logging
func AuditTrailLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()

		// Extract user information from token
		userID, username, userRole := extractUserInfo(c)

		// Read Request Body
		var requestBody string
		if c.Request.Body != nil {
			bodyBytes, _ := io.ReadAll(c.Request.Body)
			requestBody = util.MaskPII(string(bodyBytes))

			// Restore body for next handlers
			c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
		}

		// Capture Response Body
		blw := &BodyLogWriter{
			body:           bytes.NewBufferString(""),
			ResponseWriter: c.Writer,
		}
		c.Writer = blw

		// Process Request
		c.Next()

		// Calculate duration
		duration := time.Since(startTime).Milliseconds()

		// Capture error if any
		errorMessage := ""
		if len(c.Errors) > 0 {
			errorMessage = c.Errors.String()
		}

		// Mask response body
		responseBody := util.MaskPII(blw.body.String())

		responseBodyForLog := responseBody
		if c.Request.URL.Path == "/v1/api/audit-logs/export" {
			responseBodyForLog = ""
		}

		// Create audit log entry
		auditLog := models.AuditLog{
			UserID:       userID,
			Name:         username,
			UserRole:     userRole,
			Action:       formatAction(c.Request.Method, c.Request.URL.Path),
			Method:       c.Request.Method,
			Path:         c.Request.URL.Path,
			IPAddress:    getClientIP(c),
			UserAgent:    c.Request.UserAgent(),
			RequestBody:  requestBody,
			ResponseBody: responseBodyForLog,
			StatusCode:   c.Writer.Status(),
			Duration:     duration,
			ErrorMessage: errorMessage,
			Timestamp:    startTime,
		}

		// Save to database (async to not block response)
		go saveAuditLog(auditLog)
	}
}

// extractUserInfo extracts user information from JWT token
func extractUserInfo(c *gin.Context) (userID, username, userRole string) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return "anonymous", "anonymous", "guest"
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	if tokenString == "" {
		return "anonymous", "anonymous", "guest"
	}

	// Get user ID from token validation
	userID, err := jwt.ValidateToken(tokenString)
	if err != nil {
		return "invalid_token", "invalid_token", "unknown"
	}

	// Fetch additional user details from database
	var user models.User
	if err = config.GetDBConn().
		Select("uuid, name, role").
		Where("uuid = ?", userID).
		First(&user).Error; err == nil {
		return user.Uuid, user.Name, user.Role
	}

	return userID, "unknown", "unknown"
}

// getClientIP extracts the real client IP address
func getClientIP(c *gin.Context) string {
	// Check X-Forwarded-For header first (for proxy/load balancer)
	if xff := c.GetHeader("X-Forwarded-For"); xff != "" {
		ips := strings.Split(xff, ",")
		return strings.TrimSpace(ips[0])
	}

	// Check X-Real-IP header
	if xri := c.GetHeader("X-Real-IP"); xri != "" {
		return xri
	}

	// Fall back to RemoteAddr
	return c.ClientIP()
}

// formatAction creates a human-readable action description
func formatAction(method, path string) string {
	method = strings.ToUpper(method)

	switch {
	// ===== AUTH =====
	case path == "/v1/api/login":
		return "Login"
	case path == "/v1/api/register":
		return "Register"

	// ===== SALES =====
	case method == "POST" && path == "/v1/api/sales":
		return "Create Sale"
	case method == "GET" && path == "/v1/api/sales":
		return "View Sales"
	case method == "GET" && strings.Contains(path, "/v1/api/sales/"):
		return "View Sale Detail"
	case method == "PUT" && strings.Contains(path, "/v1/api/sales/"):
		return "Update Sale"
	case method == "DELETE" && strings.Contains(path, "/v1/api/sales/"):
		return "Delete Sale"

	// ===== PAYMENTS =====
	case method == "GET" && strings.Contains(path, "/payment/user/"):
		return "View User Payments"
	case method == "POST" && strings.Contains(path, "/payment/user/") && strings.Contains(path, "manual"):
		return "Create Manual Payment"
	case method == "DELETE" && strings.Contains(path, "/payment/") && strings.Contains(path, "manual"):
		return "Delete Manual Payment"
	case method == "POST" && strings.Contains(path, "/payment/purchase"):
		return "Create Purchase Payment"
	case method == "POST" && strings.Contains(path, "/payment/sale"):
		return "Create Sale Payment"
	case method == "GET" && strings.Contains(path, "/payment/purchase/"):
		return "View Payments by Reference"

	// ===== PURCHASE =====
	case method == "POST" && path == "/v1/api/purchases":
		return "Create Purchase"
	case method == "GET" && path == "/v1/api/purchases":
		return "View Purchases"
	case method == "PUT" && strings.Contains(path, "/v1/api/purchases/"):
		return "Update Purchase"

	// ===== STOCK =====
	case method == "GET" && path == "/v1/api/stocks":
		return "View Stock Entries"
	case method == "GET" && strings.Contains(path, "/v1/api/stocks/") && !strings.Contains(path, "items"):
		return "View Stock Entry Detail"
	case method == "PUT" && strings.Contains(path, "/v1/api/stocks/"):
		return "Update Stock Entry"
	case method == "DELETE" && strings.Contains(path, "/v1/api/stocks/"):
		return "Delete Stock Entry"

	// ===== STOCK ITEMS / SORTS =====
	case method == "GET" && strings.Contains(path, "/stocks/items/"):
		return "View Stock Item"
	case method == "GET" && path == "/v1/api/stocks/sorts":
		return "View Stock Sorts"
	case method == "POST" && strings.Contains(path, "/stocks/sorts/"):
		return "Create Stock Sort"
	case method == "PUT" && strings.Contains(path, "/stocks/sorts/"):
		return "Update Stock Sort"

	// ===== FIBER =====
	case method == "GET" && path == "/v1/api/fibers":
		return "View Fibers"
	case method == "POST" && path == "/v1/api/fibers":
		return "Create Fiber"
	case method == "GET" && strings.Contains(path, "/v1/api/fibers/") && !strings.Contains(path, "used") && !strings.Contains(path, "available"):
		return "View Fiber Detail"
	case method == "PUT" && strings.Contains(path, "/v1/api/fibers/"):
		return "Update Fiber"
	case method == "DELETE" && strings.Contains(path, "/v1/api/fibers/"):
		return "Delete Fiber"
	case method == "GET" && strings.Contains(path, "/fibers/used"):
		return "View Used Fibers"
	case method == "GET" && strings.Contains(path, "/fibers/available"):
		return "View Available Fibers"
	case method == "PATCH" && strings.Contains(path, "/mark"):
		return "Mark Fiber Availability"
	case method == "PATCH" && strings.Contains(path, "/bulk/mark-available"):
		return "Bulk Mark Fiber Available"

	// ===== USERS =====
	case method == "GET" && path == "/v1/api/users":
		return "View Users"
	case method == "GET" && path == "/v1/api/users/me":
		return "View Current User"
	case method == "GET" && strings.Contains(path, "/v1/api/users/role/"):
		return "View Users by Role"
	case method == "GET" && strings.Contains(path, "/v1/api/users/"):
		return "View User Detail"
	case method == "PUT" && strings.Contains(path, "/v1/api/users/"):
		return "Update User"

	// ===== ANALYTICS =====
	case method == "GET" && strings.Contains(path, "/analytics/stats"):
		return "View Analytics Overview"
	case method == "GET" && strings.Contains(path, "/analytics/daily"):
		return "View Daily Analytics"
	case method == "GET" && strings.Contains(path, "/analytics/sales/trend"):
		return "View Sales Trend"
	case method == "GET" && strings.Contains(path, "/analytics/stock/distribution"):
		return "View Stock Distribution"
	case method == "GET" && strings.Contains(path, "/analytics/supplier/performance"):
		return "View Supplier Performance"
	case method == "GET" && strings.Contains(path, "/analytics/customer/performance"):
		return "View Customer Performance"

	// ===== AUDIT TRAIL =====
	case method == "GET" && path == "/v1/api/audit-logs/export":
		return "Download Audit Trail"
	}

	// ===== FALLBACK =====
	return fmt.Sprintf("%s %s", method, path)
}

// saveAuditLog saves audit log to database
func saveAuditLog(log models.AuditLog) {
	if log.Method == "GET" && log.Path == "/v1/api/audit-logs" {
		return
	}

	db := config.GetDBConnAuditTrail()
	if err := db.Create(&log).Error; err != nil {
		config.GetLogger().Error("Failed to save audit log: %v", err)
	}
}

// truncateString truncates string for console logging
func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
