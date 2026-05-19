package main

import (
	"embed"
	"io/fs"

	"github.com/LemonZuo/account-vault/internal/buildinfo"
	"github.com/LemonZuo/account-vault/internal/config"
	"github.com/LemonZuo/account-vault/internal/db"
	"github.com/LemonZuo/account-vault/internal/logx"
	"github.com/LemonZuo/account-vault/internal/router"
)

//go:embed all:frontend/dist
var frontendFS embed.FS

func main() {
	cfg := config.Load()
	logx.Init(cfg.LogLevel)

	logx.Info("account-vault starting",
		"version", buildinfo.Version,
		"commit", buildinfo.Commit,
		"build", buildinfo.BuildID,
		"log_level", cfg.LogLevel,
	)

	gormDB, err := db.New(cfg)
	if err != nil {
		logx.Fatal("connect db", "err", err)
	}

	dist, err := fs.Sub(frontendFS, "frontend/dist")
	if err != nil {
		logx.Fatal("sub frontend/dist", "err", err)
	}

	r := router.Setup(gormDB, dist)
	logx.Info("server listening", "url", cfg.ListenURL())
	if err := r.Run(cfg.ListenAddr()); err != nil {
		logx.Fatal("run server", "err", err)
	}
}
