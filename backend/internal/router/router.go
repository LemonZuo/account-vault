package router

import (
	"account-vault/internal/config"
	"account-vault/internal/handler"
	"account-vault/internal/model"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// TableMeta 描述前端展示和路由信息。
type TableMeta struct {
	Key   string `json:"key"`
	Label string `json:"label"`
	Path  string `json:"path"`
}

var Tables = []TableMeta{
	{Key: "apple", Label: "Apple 账号", Path: "apple"},
	{Key: "openai", Label: "OpenAI 账号", Path: "openai"},
	{Key: "idc_flare", Label: "IDC Flare", Path: "idc-flare"},
	{Key: "linux_do", Label: "Linux.do", Path: "linux-do"},
	{Key: "network", Label: "宽带账户", Path: "network"},
	{Key: "soft_account", Label: "软件账号", Path: "soft-account"},
	{Key: "middleware_account", Label: "中间件账号", Path: "middleware-account"},
}

func Setup(cfg *config.Config, db *gorm.DB) *gin.Engine {
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.CORSOrigin, "http://localhost:5173", "http://127.0.0.1:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}))

	api := r.Group("/api")

	api.GET("/tables", func(c *gin.Context) {
		c.JSON(200, gin.H{"data": Tables})
	})

	handler.NewCRUD[model.Apple](db).Register(api, "/apple")
	handler.NewCRUD[model.Openai](db).Register(api, "/openai")
	handler.NewCRUD[model.IdcFlare](db).Register(api, "/idc-flare")
	handler.NewCRUD[model.LinuxDo](db).Register(api, "/linux-do")
	handler.NewCRUD[model.Network](db).Register(api, "/network")
	handler.NewCRUD[model.SoftAccount](db).Register(api, "/soft-account")
	handler.NewMiddlewareAccountHandler(db).Register(api)

	return r
}
