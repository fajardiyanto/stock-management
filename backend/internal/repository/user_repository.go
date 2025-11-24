package repository

import "dashboard-app/internal/models"

type UserRepository interface {
	CreateUser(models.UserRequest) (*models.CreateUserResponse, error)
	CheckUser(string) error
	LoginUser(models.LoginRequest) (*models.LoginResponse, error)
	GetUserById(string) (*models.User, error)
	GetUserByIdFromToken(string) (*models.User, error)
	GetAllUser(int, int, string, string, string) (*models.GetAllUserResponse, error)
	UpdateUser(string, models.UpdateUserRequest) error
	SoftDeleteUser(string) error
	GetAllUserByRole(string) ([]models.User, error)
}
