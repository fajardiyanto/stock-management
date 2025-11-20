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

	userService := service.NewUserService()
	purchaseService := service.NewPurchaseService(userService)

	userHandler := handler.NewUserHandler(userService, validate)
	purchaseHandler := handler.NewPurchaseHandler(purchaseService, validate)

	api := app.Group("/v1/api")
	api.POST("/login", userHandler.LoginHandler)
	api.POST("/register", userHandler.CreateUserHandler)

	api.Use(middleware.AuthMiddleware())
	{
		api.GET("/users", userHandler.GetAllUserHandler)
		api.PUT("/user/:uuid", userHandler.UpdateUserHandler)
		api.DELETE("/user/:uuid", userHandler.DeleteUserHandler)
		api.GET("/user/:uuid", userHandler.GetUserByIdHandler)
		api.POST("/purchase", purchaseHandler.CreatePurchaseHandler)
		api.GET("/purchases", purchaseHandler.GetAllPurchasesHandler)
	}

	return app.Run(":" + models.GetConfig().Port)
}
