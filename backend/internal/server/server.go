package server

import (
	"dashboard-app/internal/config"
	"dashboard-app/internal/handler"
	"dashboard-app/internal/middleware"
	"dashboard-app/internal/models"
	"dashboard-app/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

func Run() error {
	config.Config()
	validate := validator.New()

	app := gin.Default()
	app.Use(middleware.CORSMiddleware())

	paymentService := service.NewPaymentService()
	userService := service.NewUserService(paymentService)
	purchaseService := service.NewPurchaseService(userService)
	stockService := service.NewStockService()
	fiberService := service.NewFiberService()
	salesService := service.NewSalesService()

	userHandler := handler.NewUserHandler(userService, validate)
	purchaseHandler := handler.NewPurchaseHandler(purchaseService, validate)
	stockHandler := handler.NewStockHandler(stockService, validate)
	paymentHandler := handler.NewPaymentHandler(paymentService, validate)
	fiberHandler := handler.NewFiberHandler(fiberService, validate)
	salesHandler := handler.NewSalesHandler(salesService, validate)

	api := app.Group("/v1/api")
	api.POST("/login", userHandler.LoginHandler)
	api.POST("/register", userHandler.CreateUserHandler)

	api.Use(middleware.AuthMiddleware())
	{
		api.GET("/users", userHandler.GetAllUserHandler)
		api.PUT("/user/:uuid", userHandler.UpdateUserHandler)
		api.DELETE("/user/:uuid", userHandler.DeleteUserHandler)
		api.GET("/user/:uuid", userHandler.GetUserByIdHandler)
		api.GET("/user/role/:role", userHandler.GetAllUserByRoleHandler)

		api.POST("/purchase", purchaseHandler.CreatePurchaseHandler)
		api.GET("/purchases", purchaseHandler.GetAllPurchasesHandler)
		api.PUT("/purchase/:purchaseId", purchaseHandler.UpdatePurchaseHandler)

		api.GET("/stock-entries", stockHandler.GetAllStockEntriesHandler)
		api.GET("/stock-entry/:stockId", stockHandler.GetStockEntryByIdHandler)
		api.PUT("/stock-entry/:stockId", stockHandler.UpdateStockEntryHandler)
		api.DELETE("/stock-entry/:stockId", stockHandler.DeleteStockEntryByIdHandler)

		api.GET("/stock-item/:stockItemId", stockHandler.GetStockItemByIdHandler)

		api.POST("/stock-sort/:stockItemId", stockHandler.CreateStockSortHandler)
		api.PUT("/stock-sort/:stockItemId", stockHandler.UpdateStockSortHandler)
		api.GET("/stock-sorts", stockHandler.GetAllStockSortsHandler)

		api.GET("/payments/user/:userId", paymentHandler.GetAllPaymentFromUserIdHandler)
		api.POST("/payment/user/:userId/manual", paymentHandler.CreateManualPaymentHandler)
		api.DELETE("/payment/:paymentId/manual", paymentHandler.DeleteManualPaymentHandler)
		api.GET("/purchase/:id/payments/:field", paymentHandler.GetAllPaymentByFieldIdHandler)
		api.POST("/payment/purchase", paymentHandler.CreatePaymentByPurchaseIdHandler)
		api.POST("/payment/sale", paymentHandler.CreatePaymentBySaleIdHandler)

		api.GET("/fibers", fiberHandler.GetAllFibersHandler)
		api.GET("/fiber/:fiberId", fiberHandler.GetFiberByIdHandler)
		api.POST("/fiber", fiberHandler.CreateFiberHandler)
		api.PUT("/fiber/:fiberId/mark", fiberHandler.MarkFiberAvailableHandler)
		api.DELETE("/fiber/:fiberId", fiberHandler.DeleteFiberHandler)
		api.PUT("/fiber/:fiberId", fiberHandler.UpdateFiberHandler)
		api.GET("/fibers/used", fiberHandler.GetAllUsedFibersHandler)

		api.POST("/sales", salesHandler.CreateSalesHandler)
		api.GET("/sales", salesHandler.GetAllSalesHandler)
		api.DELETE("/sale/:saleId", salesHandler.DeleteSaleHandler)
	}

	return app.Run(":" + models.GetConfig().Port)
}
