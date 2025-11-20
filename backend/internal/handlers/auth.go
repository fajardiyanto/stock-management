package handlers

import (
	"dashboard-app/internal/models"
)

// In-memory user storage (replace with database in production)
var users = map[string]models.User{
	"admin@example.com": {
		ID:       1,
		Name:     "Admin User",
		Email:    "admin@example.com",
		Password: "$2a$10$8K1p/a0dL3LzLWtqhvpq1OmD.KqYqKqK3qKqKqKqKqKqKqKqKqKqK", // "password123" hashed
	},
	"user@example.com": {
		ID:       2,
		Name:     "John Doe",
		Email:    "user@example.com",
		Password: "$2a$10$8K1p/a0dL3LzLWtqhvpq1OmD.KqYqKqK3qKqKqKqKqKqKqKqKqKqK", // "password123" hashed
	},
}
