package router

import (
	"io/fs"
	"strings"

	"github.com/LemonZuo/account-vault/internal/buildinfo"
	"github.com/LemonZuo/account-vault/internal/handler"
	"github.com/LemonZuo/account-vault/internal/model"
	"github.com/LemonZuo/account-vault/internal/web"

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
	{Key: "claude", Label: "Claude 账号", Path: "claude"},
	{Key: "idc_flare", Label: "IDC Flare", Path: "idc-flare"},
	{Key: "linux_do", Label: "Linux.do", Path: "linux-do"},
	{Key: "network", Label: "宽带账户", Path: "network"},
	{Key: "soft_account", Label: "软件账号", Path: "soft-account"},
	{Key: "components_account", Label: "组件账号", Path: "components-account"},
	{Key: "middleware_account", Label: "中间件账号", Path: "middleware-account"},
}

func Setup(db *gorm.DB, frontend fs.FS) *gin.Engine {
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowAllOrigins: true,
		AllowMethods:    []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:    []string{"Origin", "Content-Type", "Accept", "Authorization"},
	}))

	r.GET("/healthz", handler.Health(db))

	api := r.Group("/api")

	api.GET("/tables", func(c *gin.Context) {
		c.JSON(200, gin.H{"data": Tables})
	})

	api.GET("/version", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"version":  buildinfo.Version,
			"commit":   buildinfo.Commit,
			"build_id": buildinfo.BuildID,
		})
	})

	handler.NewCRUD[model.Apple](db).Register(api, "/apple")
	handler.NewCRUD[model.Openai](db).Register(api, "/openai")
	handler.NewCRUD[model.Claude](db).Register(api, "/claude")
	handler.NewCRUD[model.IdcFlare](db).Register(api, "/idc-flare")
	handler.NewCRUD[model.LinuxDo](db).Register(api, "/linux-do")
	handler.NewCRUD[model.Network](db).Register(api, "/network")
	handler.NewCRUD[model.SoftAccount](db).Register(api, "/soft-account")
	handler.NewCRUD[model.ComponentsAccount](db).Register(api, "/components-account")
	handler.NewCRUD[model.MiddlewareAccount](db).Register(api, "/middleware-account")

	// 前端单页：未命中 /api/* 的请求都交给 embed 出来的 dist
	spa := web.SPAHandler(frontend)
	r.NoRoute(func(c *gin.Context) {
		if strings.HasPrefix(c.Request.URL.Path, "/api/") {
			c.JSON(404, gin.H{"error": "not found"})
			return
		}
		spa(c)
	})

	return r
}
