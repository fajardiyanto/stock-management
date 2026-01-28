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

	app := gin.New()
	app.Use(middleware.CORSMiddleware())

	if models.GetConfig().Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	paymentService := service.NewPaymentService()
	userService := service.NewUserService(paymentService)
	purchaseService := service.NewPurchaseService(userService)
	stockService := service.NewStockService()
	fiberService := service.NewFiberService()
	salesService := service.NewSalesService()
	analyticService := service.NewAnalyticService()
	auditLogService := service.NewAuditLogService()

	userHandler := handler.NewUserHandler(userService, validate)
	purchaseHandler := handler.NewPurchaseHandler(purchaseService, validate)
	stockHandler := handler.NewStockHandler(stockService, validate)
	paymentHandler := handler.NewPaymentHandler(paymentService, validate)
	fiberHandler := handler.NewFiberHandler(fiberService, validate)
	salesHandler := handler.NewSalesHandler(salesService, validate)
	analyticsHandler := handler.NewAnalyticsHandler(analyticService, validate)
	auditLogHandler := handler.NewAuditLogHandler(auditLogService, validate)

	api := app.Group("/v1/api")
	api.Use(middleware.RequestResponseLogger())
	api.Use(middleware.AuditTrailLogger())

	userHandler.RegisterPublicRoutes(api)

	api.Use(middleware.AuthMiddleware())
	{
		salesHandler.RegisterRoutes(api)
		paymentHandler.RegisterRoutes(api)
		stockHandler.RegisterRoutes(api)
		analyticsHandler.RegisterRoutes(api)
		fiberHandler.RegisterRoutes(api)
		userHandler.RegisterRoutes(api)
		purchaseHandler.RegisterRoutes(api)
		auditLogHandler.RegisterRoutes(api)
	}

	return app.Run(":" + models.GetConfig().Port)
}
