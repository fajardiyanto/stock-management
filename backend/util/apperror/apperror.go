package apperror

import "errors"

type AppError struct {
	Code    int
	Message string
	Err     error
}

func (e *AppError) Error() string {
	return e.Message
}
func NewNotFound(msg string) *AppError {
	return &AppError{Code: 404, Message: msg}
}

func NewBadRequest(msg string) *AppError {
	return &AppError{Code: 400, Message: msg}
}

func NewUnauthorized(msg string) *AppError {
	return &AppError{Code: 401, Message: msg}
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

func NewUnprocessableEntity(msg string) *AppError {
	return &AppError{Code: 422, Message: msg}
}

func NewTimeout(msg string) *AppError {
	return &AppError{Code: 408, Message: msg}
}

func NewInternal(msg string, err error) *AppError {
	return &AppError{Code: 500, Message: msg, Err: err}
}

func AsAppError(err error) (*AppError, bool) {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr, true
	}
	return nil, false
}
