package handler

import (
	"dashboard-app/internal/models"
	"dashboard-app/internal/repository"
	"dashboard-app/pkg/base_handler"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"net/http"
)

type Payment struct {
	paymentRepository repository.PaymentRepository
	*base_handler.BaseHandler
}

func NewPaymentHandler(paymentRepository repository.PaymentRepository, validate *validator.Validate) *Payment {
	return &Payment{
		paymentRepository: paymentRepository,
		BaseHandler:       base_handler.NewBaseHandler(validate),
	}
}

// GetAllPaymentsByUserID godoc
// @Summary Get all payments by user ID
// @Description Retrieve all payments for a specific user
// @Tags payments
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Success 200 {object} models.HTTPResponseSuccess{data=[]models.PaymentResponse}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /payments/user/{userId} [get]
func (h *Payment) GetAllPaymentsByUserID(c *gin.Context) {
	// Get and validate UUID parameter
	userID, err := h.GetUUIDParam(c, "userId")
	if err != nil {
		return // Error already sent
	}

	// Fetch payments
	data, err := h.paymentRepository.GetAllPaymentFromUserId(userID)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch user payments")
		return
	}

	h.SendSuccess(c, http.StatusOK, fmt.Sprintf("Payments for user %s retrieved successfully", userID), data)
}

// CreateManualPayment godoc
// @Summary Create manual payment(s)
// @Description Create one or more manual payments for a user
// @Tags payments
// @Accept json
// @Produce json
// @Param userId path string true "User ID"
// @Param payments body []models.CreateManualPaymentRequest true "Payment data"
// @Success 201 {object} models.HTTPResponseSuccess
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /payment/user/{userId}/manual [post]
func (h *Payment) CreateManualPayment(c *gin.Context) {
	// Get and validate UUID parameter
	userID, err := h.GetUUIDParam(c, "userId")
	if err != nil {
		return // Error already sent
	}

	var req []models.CreateManualPaymentRequest

	// Bind JSON
	if err = c.ShouldBindJSON(&req); err != nil {
		h.SendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Validate empty array
	if len(req) == 0 {
		h.SendError(c, http.StatusBadRequest, "At least one payment is required", nil)
		return
	}

	// Validate each payment
	if err = h.validatePaymentArray(req); err != nil {
		h.SendError(c, http.StatusBadRequest, "Validation failed", err)
		return
	}

	// Create payments
	if err = h.paymentRepository.CreateManualPayment(userID, req); err != nil {
		h.HandleError(c, err, "Failed to create manual payments")
		return
	}

	h.SendSuccess(c, http.StatusCreated, fmt.Sprintf("Created %d manual payment(s) for user %s", len(req), userID), nil)
}

// DeleteManualPayment godoc
// @Summary Delete manual payment
// @Description Soft delete a manual payment
// @Tags payments
// @Accept json
// @Produce json
// @Param paymentId path string true "Payment ID"
// @Success 200 {object} models.HTTPResponseSuccess
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /payment/{paymentId}/manual [delete]
func (h *Payment) DeleteManualPayment(c *gin.Context) {
	// Get and validate UUID parameter
	paymentID, err := h.GetUUIDParam(c, "paymentId")
	if err != nil {
		return // Error already sent
	}

	// Delete payment
	if err = h.paymentRepository.DeleteManualPayment(paymentID); err != nil {
		h.HandleError(c, err, "Failed to delete manual payment")
		return
	}

	h.SendSuccess(c, http.StatusOK, "Manual payment deleted successfully", nil)
}

// GetPaymentsByFieldID godoc
// @Summary Get payments by field ID
// @Description Retrieve payments filtered by a specific field (purchase or sale)
// @Tags payments
// @Accept json
// @Produce json
// @Param id path string true "Purchase/Sale ID"
// @Param field path string true "Field type (purchase or sale)"
// @Success 200 {object} models.HTTPResponseSuccess{data=[]models.PaymentResponse}
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /purchase/{id}/payments/{field} [get]
func (h *Payment) GetPaymentsByFieldID(c *gin.Context) {
	id := c.Param("id")
	field := c.Param("field")

	// Validate field type
	if !h.isValidField(field) {
		h.SendError(c, http.StatusBadRequest, "Invalid field type. Must be 'purchase' or 'sale'", nil)
		return
	}

	// Validate ID format
	if err := h.ValidateUUID(id); err != nil {
		h.SendError(c, http.StatusBadRequest, "Invalid ID format", err)
		return
	}

	// Fetch payments
	data, err := h.paymentRepository.GetAllPaymentByFieldId(id, field)
	if err != nil {
		h.HandleError(c, err, "Failed to fetch payments")
		return
	}

	h.SendSuccess(c, http.StatusOK, fmt.Sprintf("Payments for %s %s retrieved successfully", field, id), data)
}

// CreatePaymentByPurchaseID godoc
// @Summary Create payment for purchase
// @Description Create a payment record for a purchase transaction
// @Tags payments
// @Accept json
// @Produce json
// @Param payment body models.CreatePaymentPurchaseRequest true "Payment data"
// @Success 201 {object} models.HTTPResponseSuccess
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /payment/purchase [post]
func (h *Payment) CreatePaymentByPurchaseID(c *gin.Context) {
	var req models.CreatePaymentPurchaseRequest

	// Bind and validate request
	if err := h.BindAndValidate(c, &req); err != nil {
		return // Error already sent
	}

	// Create payment
	if err := h.paymentRepository.CreatePaymentByPurchaseId(req); err != nil {
		h.HandleError(c, err, "Failed to create purchase payment")
		return
	}

	h.SendSuccess(c, http.StatusCreated, fmt.Sprintf("Payment created for purchase %s", req.PurchaseId), nil)
}

// CreatePaymentBySaleID godoc
// @Summary Create payment for sale
// @Description Create a payment record for a sale transaction
// @Tags payments
// @Accept json
// @Produce json
// @Param payment body models.CreatePaymentSaleRequest true "Payment data"
// @Success 201 {object} models.HTTPResponseSuccess
// @Failure 400 {object} models.HTTPResponseError
// @Failure 500 {object} models.HTTPResponseError
// @Router /payment/sale [post]
func (h *Payment) CreatePaymentBySaleID(c *gin.Context) {
	var req models.CreatePaymentSaleRequest

	// Bind and validate request
	if err := h.BindAndValidate(c, &req); err != nil {
		return // Error already sent
	}

	// Create payment
	if err := h.paymentRepository.CreatePaymentBySalesId(req); err != nil {
		h.HandleError(c, err, "Failed to create sale payment")
		return
	}

	h.SendSuccess(c, http.StatusCreated, fmt.Sprintf("Payment created for sale %s", req.SalesId), nil)
}

// =====================================================
// HELPER METHODS
// =====================================================

// validatePaymentArray validates an array of payment requests
func (h *Payment) validatePaymentArray(payments []models.CreateManualPaymentRequest) error {
	var errorMessages []string

	for i, payment := range payments {
		if err := h.Validator.Struct(payment); err != nil {
			var validationErrs validator.ValidationErrors
			if errors.As(err, &validationErrs) {
				for _, e := range validationErrs {
					errorMessages = append(errorMessages,
						fmt.Sprintf("Payment[%d].%s: %s", i, e.Field(), base_handler.FormatFieldError(e)))
				}
			}
		}
	}

	if len(errorMessages) > 0 {
		return fmt.Errorf("%s", errorMessages[0]) // Return first error for simplicity
	}

	return nil
}

// isValidField checks if the field type is valid
func (h *Payment) isValidField(field string) bool {
	validFields := map[string]bool{
		"purchase": true,
		"sale":     true,
	}
	return validFields[field]
}

func (h *Payment) RegisterRoutes(router *gin.RouterGroup) {
	payment := router.Group("/payment")
	{
		payment.GET("/user/:userId", h.GetAllPaymentsByUserID)
		payment.POST("/user/:userId/manual", h.CreateManualPayment)
		payment.DELETE("/:paymentId/manual", h.DeleteManualPayment)
		payment.GET("/purchase/:id/:field", h.GetPaymentsByFieldID)
		payment.POST("/purchase", h.CreatePaymentByPurchaseID)
		payment.POST("/sale", h.CreatePaymentBySaleID)
	}
}
