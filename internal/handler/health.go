package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Health 轻量健康检查：探活 DB 连接。
// 挂在根路径 /healthz（不经 /api，便于反代/探针直连）。
// DB 不通返回 503，其余 200。
func Health(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		resp := gin.H{"status": "ok", "db": "ok"}
		code := http.StatusOK

		if sqlDB, err := db.DB(); err != nil {
			resp["status"], resp["db"], code = "degraded", err.Error(), http.StatusServiceUnavailable
		} else {
			ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
			defer cancel()
			if err := sqlDB.PingContext(ctx); err != nil {
				resp["status"], resp["db"], code = "degraded", err.Error(), http.StatusServiceUnavailable
			}
		}

		c.JSON(code, resp)
	}
}
