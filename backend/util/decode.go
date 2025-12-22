package util

import "encoding/base64"

func DecodeBase64(value string) (string, error) {
	bytes, err := base64.StdEncoding.DecodeString(value)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}
