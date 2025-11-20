package middleware

import (
	"context"
	"net/http"
)

type Claims struct {
	UserID int    `json:"user_id"`
	Email  string `json:"email"`
	//jwt.RegisteredClaims
}

// JWTMiddleware validates JWT tokens
func JWTMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		//authHeader := r.Header.Get("Authorization")
		//if authHeader == "" {
		//	http.Error(w, `{"error": "Authorization header required"}`, http.StatusUnauthorized)
		//	return
		//}
		//
		//// Extract token from "Bearer TOKEN"
		//tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		//if tokenString == authHeader {
		//	http.Error(w, `{"error": "Invalid authorization format"}`, http.StatusUnauthorized)
		//	return
		//}
		//
		//// Parse and validate token
		//claims := &Claims{}
		//token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		//	return []byte(os.Getenv("JWT_SECRET")), nil
		//})
		//
		//if err != nil || !token.Valid {
		//	http.Error(w, `{"error": "Invalid or expired token"}`, http.StatusUnauthorized)
		//	return
		//}
		//
		//// Add claims to request context
		ctx := context.WithValue(r.Context(), "user_id", "")
		//ctx = context.WithValue(ctx, "email", claims.Email)

		next.ServeHTTP(w, r.WithContext(ctx))
	}
}
