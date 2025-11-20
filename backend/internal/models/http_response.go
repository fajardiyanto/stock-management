package models

type HTTPResponseSuccess struct {
	StatusCode int         `json:"status_code"`
	Message    string      `json:"message"`
	Data       interface{} `json:"data"`
}

type HTTPResponseError struct {
	StatusCode int    `json:"status_code"`
	Message    string `json:"message"`
}
