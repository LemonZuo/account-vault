package handler

import (
	"net/http"

	"github.com/LemonZuo/account-vault/internal/model"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// MiddlewareAccount 表没有自增 ID。
// 通过 query 参数 public_ip / port / type 定位记录。
type MiddlewareAccountHandler struct {
	DB *gorm.DB
}

func NewMiddlewareAccountHandler(db *gorm.DB) *MiddlewareAccountHandler {
	return &MiddlewareAccountHandler{DB: db}
}

func (h *MiddlewareAccountHandler) Register(rg *gin.RouterGroup) {
	g := rg.Group("/middleware-account")
	g.GET("", h.List)
	g.POST("", h.Create)
	g.PUT("", h.Update)
	g.DELETE("", h.Delete)
}

type middlewareKey struct {
	PublicIP string `form:"public_ip" json:"public_ip"`
	Port     string `form:"port" json:"port"`
	Type     string `form:"type" json:"type"`
}

func (h *MiddlewareAccountHandler) List(ctx *gin.Context) {
	var items []model.MiddlewareAccount
	if err := h.DB.Order("public_ip, port").Find(&items).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": items})
}

func (h *MiddlewareAccountHandler) Create(ctx *gin.Context) {
	var item model.MiddlewareAccount
	if err := ctx.ShouldBindJSON(&item); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.DB.Create(&item).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": item})
}

// Update 需要前端提交原 key（_orig_public_ip / _orig_port / _orig_type）与新数据
type updateMiddlewarePayload struct {
	OrigPublicIP string                  `json:"_orig_public_ip"`
	OrigPort     string                  `json:"_orig_port"`
	OrigType     string                  `json:"_orig_type"`
	Data         model.MiddlewareAccount `json:"data"`
}

func (h *MiddlewareAccountHandler) Update(ctx *gin.Context) {
	var p updateMiddlewarePayload
	if err := ctx.ShouldBindJSON(&p); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if p.OrigPublicIP == "" || p.OrigPort == "" || p.OrigType == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "missing original key"})
		return
	}
	res := h.DB.Model(&model.MiddlewareAccount{}).
		Where("public_ip = ? AND port = ? AND type = ?", p.OrigPublicIP, p.OrigPort, p.OrigType).
		Select("*").
		Updates(p.Data)
	if res.Error != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": res.Error.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"ok": true, "affected": res.RowsAffected})
}

func (h *MiddlewareAccountHandler) Delete(ctx *gin.Context) {
	var k middlewareKey
	if err := ctx.ShouldBindQuery(&k); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if k.PublicIP == "" || k.Port == "" || k.Type == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "missing key"})
		return
	}
	res := h.DB.Where("public_ip = ? AND port = ? AND type = ?", k.PublicIP, k.Port, k.Type).
		Delete(&model.MiddlewareAccount{})
	if res.Error != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": res.Error.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"ok": true, "affected": res.RowsAffected})
}
