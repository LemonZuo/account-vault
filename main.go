package main

import (
	"embed"
	"io/fs"
	"log"

	"account-vault/internal/config"
	"account-vault/internal/db"
	"account-vault/internal/router"
)

//go:embed all:frontend/dist
var frontendFS embed.FS

func main() {
	cfg := config.Load()

	gormDB, err := db.New(cfg)
	if err != nil {
		log.Fatalf("connect db: %v", err)
	}

	dist, err := fs.Sub(frontendFS, "frontend/dist")
	if err != nil {
		log.Fatalf("sub frontend/dist: %v", err)
	}

	r := router.Setup(gormDB, dist)
	log.Printf("server listening on %s", cfg.ListenURL())
	if err := r.Run(cfg.ListenAddr()); err != nil {
		log.Fatalf("run server: %v", err)
	}
}
