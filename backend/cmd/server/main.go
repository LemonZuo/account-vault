package main

import (
	"log"

	"account-vault/internal/config"
	"account-vault/internal/db"
	"account-vault/internal/router"
)

func main() {
	cfg := config.Load()

	gormDB, err := db.New(cfg)
	if err != nil {
		log.Fatalf("connect db: %v", err)
	}

	r := router.Setup(cfg, gormDB)
	log.Printf("server listening on %s", cfg.ServerAddr)
	if err := r.Run(cfg.ServerAddr); err != nil {
		log.Fatalf("run server: %v", err)
	}
}
