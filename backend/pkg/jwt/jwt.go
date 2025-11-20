package jwt

import (
	"dashboard-app/internal/models"
	"errors"
	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"strings"
	"time"
)

var (
	ErrInvalidToken = errors.New("invalid token")
)

type Claims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.StandardClaims
}

func CreateToken(user models.UserTokenModel, expired int64) (string, error) {
	claims := &Claims{
		UserID: user.ID,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expired,
			IssuedAt:  time.Now().Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(models.GetConfig().ApiSecret))

}

func CreateNewTokenFromRefresh(tokenString string, expired int64) (string, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(models.GetConfig().ApiSecret), nil
	})
	if err != nil || !token.Valid {
		return "", err
	}

	user := models.UserTokenModel{
		ID: claims.UserID,
	}
	return CreateToken(user, expired)
}

func ValidateToken(tokenString string) (string, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return []byte(models.GetConfig().ApiSecret), nil
	})

	if err != nil {
		return "", err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return "", ErrInvalidToken
	}

	return claims.UserID, nil
}

func GetHeader(c *gin.Context) string {
	authHeader := c.GetHeader("Authorization")
	return strings.TrimPrefix(authHeader, "Bearer ")
}
