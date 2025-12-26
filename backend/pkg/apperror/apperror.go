package apperror

import (
	"fmt"
	"github.com/pkg/errors"
	"runtime"
)

type AppError struct {
	Code     int
	Message  string
	Err      error
	File     string
	Line     int
	Function string
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("[%s:%d] %s: %v", e.File, e.Line, e.Message, e.Err)
	}
	return fmt.Sprintf("[%s:%d] %s", e.File, e.Line, e.Message)
}

func (e *AppError) Unwrap() error {
	return e.Err
}

// Wrap wraps an error with caller information
func Wrap(code int, message string, err error) *AppError {
	file, line, function := getCaller(3)
	return &AppError{
		Code:     code,
		Message:  message,
		Err:      err,
		File:     file,
		Line:     line,
		Function: function,
	}
}

// getCaller returns file, line, and function name of the caller
func getCaller(skip int) (string, int, string) {
	pc, file, line, ok := runtime.Caller(skip)
	if !ok {
		return "unknown", 0, "unknown"
	}

	function := runtime.FuncForPC(pc).Name()

	// Shorten file path to be relative
	// You can customize this logic
	return shortenPath(file), line, function
}

// shortenPath removes the full path, keeping only the relevant part
func shortenPath(path string) string {
	// Find the last occurrence of your project name or "src/"
	// This keeps paths like "service/user_service.go" instead of full path
	idx := 0
	for i := len(path) - 1; i >= 0; i-- {
		if path[i] == '/' {
			// Keep the last two directories
			idx = i + 1
			break
		}
	}

	if idx > 0 && idx < len(path) {
		return path[idx:]
	}
	return path
}

// AsAppError safely converts an error to AppError
func AsAppError(err error) (*AppError, bool) {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr, true
	}
	return nil, false
}

func NewNotFound(msg string) *AppError {
	return &AppError{Code: 404, Message: msg}
}

func NewBadRequest(msg string) *AppError {
	return &AppError{Code: 400, Message: msg}
}

func NewUnauthorized(msg string, err error) *AppError {
	return Wrap(401, msg, err)
}

func NewForbidden(msg string) *AppError {
	return &AppError{Code: 403, Message: msg}
}

func NewConflict(msg string) *AppError {
	return &AppError{Code: 409, Message: msg}
}

func NewTooManyRequests(msg string) *AppError {
	return &AppError{Code: 429, Message: msg}
}

func NewUnprocessableEntity(msg string, err error) *AppError {
	return &AppError{Code: 422, Message: msg, Err: err}
}

func NewTimeout(msg string) *AppError {
	return &AppError{Code: 408, Message: msg}
}

func NewInternal(msg string, err error) *AppError {
	return &AppError{Code: 500, Message: msg, Err: err}
}
