package service

import (
	"dashboard-app/internal/config"
	"dashboard-app/internal/constatnts"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"dashboard-app/pkg/jwt"
	"dashboard-app/util"
	"errors"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"strings"
	"time"
)

type UserService struct{}

func NewUserService() repository.UserRepository {
	return &UserService{}
}

func (s *UserService) CreateUser(req models.UserRequest) (*models.CreateUserResponse, error) {
	pass, err := util.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	user := models.User{
		Uuid:            uuid.New().String(),
		Name:            req.Name,
		Phone:           req.Phone,
		Password:        pass,
		Role:            req.Role,
		Status:          true,
		Address:         req.Address,
		ShippingAddress: req.ShippingAddress,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if err = config.GetDBConn().Orm().Debug().Model(&models.User{}).Create(&user).Error; err != nil {
		return nil, err
	}

	loginResponse := models.CreateUserResponse{
		User: user,
	}

	return &loginResponse, nil
}

func (s *UserService) CheckUser(phone string) error {
	var res models.User
	if err := config.GetDBConn().Orm().Debug().Model(&models.User{}).Where("phone = ? AND status = true", phone).First(&res).Error; err != nil {
		return err
	}
	return nil
}

func (s *UserService) LoginUser(req models.LoginRequest) (*models.LoginResponse, error) {
	var user models.User
	if err := config.GetDBConn().Orm().Debug().Model(&models.User{}).Where("phone = ? AND status = true", req.Phone).First(&user).Error; err != nil {
		return nil, err
	}

	if err := util.VerifyPassword(user.Password, req.Password); err != nil {
		return nil, errors.New("invalid user/password")
	}

	userToken := models.UserTokenModel{
		ID:   user.Uuid,
		Name: user.Name,
		Role: user.Role,
	}

	tokenExpired := time.Now().Add(time.Hour * 24).Unix()
	token, err := jwt.CreateToken(userToken, tokenExpired)
	if err != nil {
		return nil, err
	}

	loginResponse := models.LoginResponse{
		Token: token,
		User:  user,
	}

	return &loginResponse, nil
}

func (s *UserService) GetUserById(id string) (*models.User, error) {
	var user models.User
	if err := config.GetDBConn().Orm().Debug().Model(&models.User{}).Where("uuid = ? AND status = true", id).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return &user, nil
}

func (s *UserService) GetUserByIdFromToken(token string) (*models.User, error) {
	userId, err := jwt.ValidateToken(token)
	if err != nil {
		return nil, err
	}

	var user models.User
	if err = config.GetDBConn().Orm().Debug().Model(&models.User{}).Where("uuid = ? AND status = true", userId).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	return &user, nil
}

func (s *UserService) GetAllUser(page, size int, name, phone, role string) (*models.GetAllUserResponse, error) {
	db := config.GetDBConn().Orm().Debug()

	if page < 1 {
		page = 1
	}
	if size < 1 {
		size = 10
	}

	offset := (page - 1) * size

	var users []models.User
	var total int64

	query := db.Model(&models.User{}).
		Where("role != ? AND status = true", constatnts.SuperAdminRole)

	if name != "" {
		query = query.Where("name ILIKE ?", "%"+name+"%") // postgres
	}

	if phone != "" {
		query = query.Where("phone LIKE ?", "%"+phone+"%")
	}

	if role != "" {
		query = query.Where("role = ?", role)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}

	if err := query.
		Limit(size).
		Offset(offset).
		Find(&users).Error; err != nil {
		return nil, err
	}

	res := models.GetAllUserResponse{
		Size:   size,
		PageNo: page,
		Data:   users,
		Total:  int(total),
	}

	return &res, nil
}

func (s *UserService) UpdateUser(uuid string, data models.UpdateUserRequest) error {
	updates := map[string]interface{}{
		"name":             data.Name,
		"phone":            data.Phone,
		"role":             data.Role,
		"address":          data.Address,
		"shipping_address": data.ShippingAddress,
		"updated_at":       time.Now(),
	}

	return config.GetDBConn().Orm().Debug().
		Model(&models.User{}).
		Where("uuid = ? AND status = true", uuid).
		Updates(updates).Error
}

func (s *UserService) SoftDeleteUser(uuid string) error {
	return config.GetDBConn().Orm().
		Model(&models.User{}).
		Where("uuid = ? AND status = true", uuid).
		Update("status", false).Error
}

func (s *UserService) GetAllUserByRole(role string) ([]models.User, error) {
	var users []models.User
	if err := config.GetDBConn().Orm().Debug().Model(&models.User{}).Where("role = ?", strings.ToUpper(role)).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}
