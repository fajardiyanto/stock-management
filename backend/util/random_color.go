package util

import (
	"fmt"
	"math/rand"
	"time"
)

func RandomHexColor() string {
	rand.Seed(time.Now().UnixNano())
	return fmt.Sprintf("#%06X", rand.Intn(0xFFFFFF))
}
