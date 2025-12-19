package middleware

import (
	"bytes"
	"dashboard-app/internal/config"
	"dashboard-app/util"
	"github.com/gin-gonic/gin"
	"io"
	"strings"
)

func RequestResponseLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		// ----- Read Request Body -----
		var requestBody string
		if c.Request.Body != nil {
			bodyBytes, _ := io.ReadAll(c.Request.Body)
			requestBody = util.MaskPII(string(bodyBytes))

			// Restore body for next handlers
			c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
		}

		// ----- Capture Response Body -----
		blw := &BodyLogWriter{
			body:           bytes.NewBufferString(""),
			ResponseWriter: c.Writer,
		}
		c.Writer = blw

		// ----- Process Request -----
		c.Next()

		// ----- After Request -----
		responseBody := util.MaskPII(blw.body.String())

		if !strings.Contains(c.Request.URL.Path, "/v1/api/audit-logs") {
			config.GetLogger().Info(
				`[%s][%d][%s][REQUEST=%s][RESPONSE=%s]`,
				c.Request.Method,
				c.Writer.Status(),
				c.Request.URL.Path,
				requestBody,
				responseBody,
			)
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
