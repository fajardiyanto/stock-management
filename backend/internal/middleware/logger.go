package middleware

import (
	"bytes"
	"dashboard-app/internal/constants"
	"dashboard-app/pkg/apperror"
	"dashboard-app/util"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"io"
	"strings"
	"time"
)

func RequestResponseLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()

		var requestBody string
		if c.Request.Body != nil {
			bodyBytes, _ := io.ReadAll(c.Request.Body)
			requestBody = util.MaskPII(string(bodyBytes))
			c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
		}

		blw := &BodyLogWriter{
			body:           bytes.NewBufferString(""),
			ResponseWriter: c.Writer,
		}
		c.Writer = blw
		c.Next()

		duration := time.Since(startTime)
		responseBody := util.MaskPII(blw.body.String())
		statusCode := c.Writer.Status()

		if strings.Contains(c.Request.URL.Path, "/v1/api/audit-logs") {
			return
		}

		logFields := map[string]interface{}{
			"method":       c.Request.Method,
			"path":         c.Request.URL.Path,
			"status":       statusCode,
			"duration_ms":  duration.Milliseconds(),
			"client_ip":    c.ClientIP(),
			"request_body": requestBody,
			"response":     responseBody,
		}

		if len(c.Errors) > 0 {
			lastError := c.Errors.Last().Err

			var appErr *apperror.AppError
			if errors.As(lastError, &appErr) {
				logFields["error_code"] = appErr.Code
				logFields["error_message"] = appErr.Message
				logFields["error_file"] = appErr.File
				logFields["error_line"] = appErr.Line
				logFields["error_function"] = appErr.Function

				if appErr.Err != nil {
					logFields["underlying_error"] = appErr.Err.Error()
				}

				fmt.Printf("%s\n", formatLogMessage("ERROR", logFields))
			} else {
				fmt.Printf("%s\n", formatLogMessage("ERROR", logFields))
			}
		} else {
			fmt.Printf("%s\n", formatLogMessage("INFO", logFields))
		}
	}
}

type BodyLogWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w BodyLogWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func formatLogMessage(level string, fields map[string]interface{}) string {
	method := fields["method"]
	status := fields["status"]
	path := fields["path"]
	duration := fields["duration_ms"]
	requestBody := fields["request_body"]
	responseBody := fields["response"]
	underlyingError := fields["underlying_error"]

	baseMsg := fmt.Sprintf("[%s]", time.Now().In(constants.JakartaTz).Format("2006-01-02 15:04:05"))
	// Add error details if present
	if errMsg, ok := fields["error_message"].(string); ok {
		if file, okFile := fields["error_file"].(string); okFile {
			if line, okLine := fields["error_line"].(int); okLine {
				baseMsg += fmt.Sprintf("[%s][%s][%d]", errMsg, file, line)
			}
		}
	}

	baseMsg += fmt.Sprintf("[%s][%s][%d][%s][%dms][%s][%s]",
		level,
		method,
		status,
		path,
		duration,
		requestBody,
		responseBody,
	)

	if underlyingError != nil {
		baseMsg += fmt.Sprintf("[%s]", underlyingError)
	}

	return baseMsg
}
