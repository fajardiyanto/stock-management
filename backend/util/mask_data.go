package util

import (
	"regexp"
)

var piiPatterns = map[string]*regexp.Regexp{
	"email": regexp.MustCompile(`[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}`),
	//"phone":    regexp.MustCompile(`\b\d{10,15}\b`),
	"token":    regexp.MustCompile(`(?i)(bearer\s+)?[a-z0-9\-_]{20,}`),
	"password": regexp.MustCompile(`(?i)"password"\s*:\s*".*?"`),
}

func MaskPII(input string) string {
	out := input
	for key, re := range piiPatterns {
		out = re.ReplaceAllString(out, "***"+key+"***")
	}
	return out
}
