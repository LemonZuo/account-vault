package handler

import (
	"net/http"

	"github.com/LemonZuo/account-vault/internal/model"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ComponentsAccountHandler struct {
	DB *gorm.DB
}

func NewComponentsAccountHandler(db *gorm.DB) *ComponentsAccountHandler {
	return &ComponentsAccountHandler{DB: db}
}

func (h *ComponentsAccountHandler) Register(rg *gin.RouterGroup) {
	g := rg.Group("/components-account")
	g.GET("", h.List)
	g.POST("", h.Create)
	g.PUT("", h.Update)
	g.DELETE("", h.Delete)
}

type componentsAccountKey struct {
	PublicIP string `form:"public_ip" json:"public_ip"`
	Port     string `form:"port" json:"port"`
	Type     string `form:"type" json:"type"`
}

func (h *ComponentsAccountHandler) List(ctx *gin.Context) {
	var items []model.ComponentsAccount
	if err := h.DB.Order("public_ip, port, type").Find(&items).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": items})
}

func (h *ComponentsAccountHandler) Create(ctx *gin.Context) {
	var item model.ComponentsAccount
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

type updateComponentsAccountPayload struct {
	OrigPublicIP string                  `json:"_orig_public_ip"`
	OrigPort     string                  `json:"_orig_port"`
	OrigType     string                  `json:"_orig_type"`
	Data         model.ComponentsAccount `json:"data"`
}

func (h *ComponentsAccountHandler) Update(ctx *gin.Context) {
	var p updateComponentsAccountPayload
	if err := ctx.ShouldBindJSON(&p); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if p.OrigPublicIP == "" || p.OrigPort == "" || p.OrigType == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "missing original key"})
		return
	}
	res := h.DB.Model(&model.ComponentsAccount{}).
		Where("public_ip = ? AND port = ? AND type = ?", p.OrigPublicIP, p.OrigPort, p.OrigType).
		Select("*").
		Updates(p.Data)
	if res.Error != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": res.Error.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"ok": true, "affected": res.RowsAffected})
}

func (h *ComponentsAccountHandler) Delete(ctx *gin.Context) {
	var k componentsAccountKey
	if err := ctx.ShouldBindQuery(&k); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if k.PublicIP == "" || k.Port == "" || k.Type == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "missing key"})
		return
	}
	res := h.DB.Where("public_ip = ? AND port = ? AND type = ?", k.PublicIP, k.Port, k.Type).
		Delete(&model.ComponentsAccount{})
	if res.Error != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": res.Error.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"ok": true, "affected": res.RowsAffected})
}
