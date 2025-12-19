package service

import (
	"dashboard-app/pkg/apperror"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"dashboard-app/internal/config"
	"dashboard-app/internal/constants"
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"dashboard-app/pkg/jwt"
	"dashboard-app/util"
)

type UserService struct {
	paymentRepository repository.PaymentRepository
}

func NewUserService(paymentRepository repository.PaymentRepository) repository.UserRepository {
	return &UserService{paymentRepository: paymentRepository}
}

func (s *UserService) CreateUser(req models.UserRequest) (*models.CreateUserResponse, error) {
	// Validate input
	if err := s.validateUserRequest(req); err != nil {
		return nil, apperror.NewBadRequest(fmt.Sprintf("validation error: %v", err))
	}

	// Check for duplicate phone
	exists, err := s.phoneExists(req.Phone)
	if err != nil {
		return nil, apperror.NewBadRequest(fmt.Sprintf("failed to check phone: %v", err))
	}
	if exists {
		return nil, apperror.NewConflict("phone number already exists")
	}

	// Hash password
	hashedPassword, err := util.HashPassword(req.Password)
	if err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to hash password: ", err)
	}

	now := time.Now()
	user := models.User{
		Uuid:                         uuid.New().String(),
		Name:                         strings.TrimSpace(req.Name),
		Phone:                        strings.TrimSpace(req.Phone),
		Password:                     hashedPassword,
		Role:                         strings.ToUpper(req.Role),
		Status:                       true,
		Address:                      strings.TrimSpace(req.Address),
		ShippingAddress:              strings.TrimSpace(req.ShippingAddress),
		TaxPayerIdentificationNumber: strings.TrimSpace(req.TaxPayerIdentificationNumber),
		CreatedAt:                    now,
		UpdatedAt:                    now,
	}

	if err = config.GetDBConn().Create(&user).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to create user: ", err)
	}

	// Clear password before returning
	user.Password = ""

	return &models.CreateUserResponse{User: user}, nil
}

func (s *UserService) CheckUser(phone string) error {
	var exists bool
	if err := config.GetDBConn().
		Model(&models.User{}).
		Select("1").
		Where("phone = ? AND status = true", phone).
		Limit(1).
		Find(&exists).Error; err != nil {
		return apperror.NewUnprocessableEntity("failed to check user: ", err)
	}

	if !exists {
		return apperror.NewNotFound("user not found")
	}

	return nil
}

// Helper method for phone existence check
func (s *UserService) phoneExists(phone string) (bool, error) {
	var count int64
	if err := config.GetDBConn().
		Model(&models.User{}).
		Where("phone = ? AND status = true", phone).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (s *UserService) LoginUser(req models.LoginRequest) (*models.LoginResponse, error) {
	var user models.User
	if err := config.GetDBConn().
		Where("phone = ? AND status = true", req.Phone).
		First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Use generic message to avoid user enumeration
			return nil, apperror.NewBadRequest("invalid credentials")
		}
		return nil, apperror.NewUnprocessableEntity("something went wrong: ", err)
	}

	// Verify password
	if err := util.VerifyPassword(user.Password, req.Password); err != nil {
		return nil, apperror.NewBadRequest("invalid credentials")
	}

	// Generate token
	userToken := models.UserTokenModel{
		ID:   user.Uuid,
		Name: user.Name,
		Role: user.Role,
	}

	tokenExpired := time.Now().Add(24 * time.Hour).Unix()
	token, err := jwt.CreateToken(userToken, tokenExpired)
	if err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to create token: ", err)
	}

	// Clear password before returning
	user.Password = ""

	return &models.LoginResponse{
		Token: token,
		User:  user,
	}, nil
}

func (s *UserService) GetUserById(id string) (*models.User, error) {
	var user models.User
	if err := config.GetDBConn().
		Where("uuid = ? AND status = true", id).
		First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperror.NewNotFound("user not found")
		}
		return nil, apperror.NewUnprocessableEntity("something went wrong: ", err)
	}

	// Clear password
	user.Password = ""
	return &user, nil
}

func (s *UserService) GetUserByIdFromToken(token string) (*models.User, error) {
	userId, err := jwt.ValidateToken(token)
	if err != nil {
		return nil, apperror.NewBadRequest(fmt.Sprintf("invalid token: %v", err))
	}

	return s.GetUserById(userId)
}

func (s *UserService) GetAllUser(filter models.UserFilter) (*models.GetAllUserResponse, error) {
	db := config.GetDBConn()

	// Normalize pagination
	if filter.PageNo < 1 {
		filter.PageNo = 1
	}
	if filter.Size < 1 {
		filter.Size = 10
	}
	if filter.Size > 100 {
		filter.Size = 100 // Limit max page size
	}

	offset := (filter.PageNo - 1) * filter.Size

	// Build query
	query := db.Model(&models.User{}).
		Where("role != ? AND status = true", constants.SuperAdminRole)

	if filter.Name != "" {
		query = query.Where("name ILIKE ?", "%"+strings.TrimSpace(filter.Name)+"%")
	}

	if filter.Phone != "" {
		query = query.Where("phone LIKE ?", "%"+strings.TrimSpace(filter.Phone)+"%")
	}

	if filter.Role != "" {
		query = query.Where("role = ?", strings.ToUpper(filter.Role))
	}

	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to count users: ", err)
	}

	// Early return if no results
	if total == 0 {
		return &models.GetAllUserResponse{
			Size:   filter.Size,
			PageNo: filter.PageNo,
			Data:   []models.UserResponse{},
			Total:  0,
		}, nil
	}

	// Fetch users
	var users []models.User
	if err := query.
		Select("id, uuid, name, phone, role, status, address, shipping_address, tax_payer_identification_number, created_at, updated_at").
		Order("created_at DESC").
		Limit(filter.Size).
		Offset(offset).
		Find(&users).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch users: ", err)
	}

	// Extract user IDs for batch balance fetch
	userIDs := make([]string, len(users))
	for i, user := range users {
		userIDs[i] = user.Uuid
	}

	// Batch fetch balances
	balanceMap, err := s.getBatchBalances(userIDs)
	if err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch balances: ", err)
	}

	// Build response
	usersResponse := make([]models.UserResponse, 0, len(users))
	for _, user := range users {
		balance := balanceMap[user.Uuid]
		usersResponse = append(usersResponse, models.UserResponse{
			ID:                           user.ID,
			Uuid:                         user.Uuid,
			Name:                         user.Name,
			Phone:                        user.Phone,
			Role:                         user.Role,
			Status:                       user.Status,
			Address:                      user.Address,
			ShippingAddress:              user.ShippingAddress,
			TaxPayerIdentificationNumber: user.TaxPayerIdentificationNumber,
			Balance:                      balance,
			CreatedAt:                    user.CreatedAt,
			UpdatedAt:                    user.UpdatedAt,
		})
	}

	return &models.GetAllUserResponse{
		Size:   filter.Size,
		PageNo: filter.PageNo,
		Data:   usersResponse,
		Total:  int(total),
	}, nil
}

func (s *UserService) getBatchBalances(userIDs []string) (map[string]int, error) {
	if len(userIDs) == 0 {
		return make(map[string]int), nil
	}

	db := config.GetDBConn()

	// Single query to get all balances
	type UserBalance struct {
		UserID  string `gorm:"column:user_id"`
		Balance int    `gorm:"column:balance"`
	}

	var balances []UserBalance
	err := db.
		Model(&models.Payment{}).
		Select(`
			user_id,
			COALESCE(SUM(
				CASE
					WHEN type = 'INCOME' THEN total
					WHEN type = 'EXPENSE' THEN -total
					ELSE 0
				END
			), 0) AS balance
		`).
		Where("user_id IN ? AND deleted = false", userIDs).
		Group("user_id").
		Scan(&balances).Error

	if err != nil {
		return nil, err
	}

	// Build result map
	balanceMap := make(map[string]int, len(userIDs))

	// Default 0 for all users
	for _, userID := range userIDs {
		balanceMap[userID] = 0
	}

	// Fill actual balances
	for _, r := range balances {
		balanceMap[r.UserID] = r.Balance
	}

	return balanceMap, nil
}

func (s *UserService) UpdateUser(userId string, data models.UpdateUserRequest) error {
	// Validate UUID format
	if _, err := uuid.Parse(userId); err != nil {
		return apperror.NewBadRequest("invalid user ID format")
	}

	// Check if phone is being changed and if it's already taken
	if data.Phone != "" {
		var existingUser models.User
		err := config.GetDBConn().
			Where("phone = ? AND uuid != ? AND status = true", data.Phone, userId).
			First(&existingUser).Error

		if err == nil {
			return apperror.NewConflict("phone number already exists")
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return apperror.NewUnprocessableEntity("failed to check phone: ", err)
		}
	}

	updates := map[string]interface{}{
		"updated_at": time.Now(),
	}

	// Only update non-empty fields
	if data.Name != "" {
		updates["name"] = strings.TrimSpace(data.Name)
	}
	if data.Phone != "" {
		updates["phone"] = strings.TrimSpace(data.Phone)
	}
	if data.Role != "" {
		updates["role"] = strings.ToUpper(data.Role)
	}
	if data.Address != "" {
		updates["address"] = strings.TrimSpace(data.Address)
	}
	if data.ShippingAddress != "" {
		updates["shipping_address"] = strings.TrimSpace(data.ShippingAddress)
	}
	if data.TaxPayerIdentificationNumber != "" {
		updates["tax_payer_identification_number"] = strings.TrimSpace(data.TaxPayerIdentificationNumber)
	}

	result := config.GetDBConn().
		Model(&models.User{}).
		Where("uuid = ? AND status = true", userId).
		Updates(updates)

	if result.Error != nil {
		return apperror.NewUnprocessableEntity("failed to update user: ", result.Error)
	}

	if result.RowsAffected == 0 {
		return apperror.NewNotFound("user not found or already deleted")
	}

	return nil
}

func (s *UserService) SoftDeleteUser(userId string) error {
	// Validate UUID format
	if _, err := uuid.Parse(userId); err != nil {
		return apperror.NewBadRequest("invalid user ID format")
	}

	// Check if user is super admin (prevent deletion)
	var user models.User
	if err := config.GetDBConn().
		Select("role").
		Where("uuid = ? AND status = true", userId).
		First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperror.NewNotFound("user not found")
		}
		return apperror.NewUnprocessableEntity("something went wrong: ", err)
	}

	if user.Role == constants.SuperAdminRole {
		return apperror.NewBadRequest("cannot delete super admin user")
	}

	result := config.GetDBConn().
		Model(&models.User{}).
		Where("uuid = ? AND status = true", userId).
		Updates(map[string]interface{}{
			"status":     false,
			"updated_at": time.Now(),
		})

	if result.Error != nil {
		return apperror.NewUnprocessableEntity("failed to delete user: ", result.Error)
	}

	if result.RowsAffected == 0 {
		return apperror.NewNotFound("user not found or already deleted")
	}

	return nil
}

func (s *UserService) GetAllUserByRole(role string) ([]models.User, error) {
	var users []models.User
	if err := config.GetDBConn().
		Select("id, uuid, name, phone, role, status, address, shipping_address, tax_payer_identification_number, created_at, updated_at").
		Where("role = ? AND status = true", strings.ToUpper(role)).
		Order("name ASC").
		Find(&users).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch users by role: ", err)
	}

	return users, nil
}

// Validate user request
func (s *UserService) validateUserRequest(req models.UserRequest) error {
	if strings.TrimSpace(req.Name) == "" {
		return apperror.NewBadRequest("name is required")
	}
	if strings.TrimSpace(req.Phone) == "" {
		return apperror.NewBadRequest("phone is required")
	}
	if len(req.Password) < 6 {
		return apperror.NewBadRequest("password must be at least 6 characters")
	}
	if strings.TrimSpace(req.Role) == "" {
		return apperror.NewBadRequest("role is required")
	}

	// Validate role
	validRoles := []string{constants.AdminRole, constants.BuyerRole, constants.SupplierRole}
	role := strings.ToUpper(req.Role)
	isValidRole := false
	for _, validRole := range validRoles {
		if role == validRole {
			isValidRole = true
			break
		}
	}
	if !isValidRole {
		return apperror.NewBadRequest(fmt.Sprintf("invalid role: %s", req.Role))
	}

	return nil
}

// GetUsersByIDs Batch get users by IDs (useful for other services)
func (s *UserService) GetUsersByIDs(userIDs []string) (map[string]models.User, error) {
	if len(userIDs) == 0 {
		return make(map[string]models.User), nil
	}

	var users []models.User
	if err := config.GetDBConn().
		Select("id, uuid, name, phone, role, status, address, shipping_address, created_at, updated_at").
		Where("uuid IN ? AND status = true", userIDs).
		Find(&users).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to fetch users: ", err)
	}

	userMap := make(map[string]models.User, len(users))
	for _, user := range users {
		user.Password = ""
		userMap[user.Uuid] = user
	}

	return userMap, nil
}

// SearchUsers Search users with advanced filtering
func (s *UserService) SearchUsers(filters models.UserFilter) ([]models.User, error) {
	query := config.GetDBConn().
		Model(&models.User{}).
		Where("status = true")

	if filters.Name != "" {
		query = query.Where("name ILIKE ?", "%"+filters.Name+"%")
	}
	if filters.Phone != "" {
		query = query.Where("phone LIKE ?", "%"+filters.Phone+"%")
	}
	if filters.Role != "" {
		query = query.Where("role = ?", strings.ToUpper(filters.Role))
	}

	var users []models.User
	if err := query.
		Select("id, uuid, name, phone, role, status, address, created_at, updated_at").
		Order("name ASC").
		Limit(filters.Size). // Prevent excessive results
		Find(&users).Error; err != nil {
		return nil, apperror.NewUnprocessableEntity("failed to search users: ", err)
	}

	return users, nil
}
