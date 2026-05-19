package config

import (
	"testing"
)

func clearEnv(t *testing.T) {
	t.Helper()
	for _, k := range []string{"DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME", "DB_CHARSET", "SERVER_PORT", "LOG_LEVEL"} {
		t.Setenv(k, "")
	}
}

func TestLoad_Defaults(t *testing.T) {
	clearEnv(t)
	cfg := Load()
	if cfg.DBHost != "127.0.0.1" {
		t.Errorf("DBHost default = %q, want 127.0.0.1", cfg.DBHost)
	}
	if cfg.DBPort != "3306" {
		t.Errorf("DBPort default = %q, want 3306", cfg.DBPort)
	}
	if cfg.DBUser != "root" {
		t.Errorf("DBUser default = %q, want root", cfg.DBUser)
	}
	if cfg.DBPassword != "" {
		t.Errorf("DBPassword default = %q, want empty", cfg.DBPassword)
	}
	if cfg.DBCharset != "utf8mb4" {
		t.Errorf("DBCharset default = %q, want utf8mb4", cfg.DBCharset)
	}
	if cfg.ServerPort != "8080" {
		t.Errorf("ServerPort default = %q, want 8080", cfg.ServerPort)
	}
	if cfg.LogLevel != "info" {
		t.Errorf("LogLevel default = %q, want info", cfg.LogLevel)
	}
}

func TestLoad_FromEnv(t *testing.T) {
	clearEnv(t)
	t.Setenv("DB_HOST", "db.example.com")
	t.Setenv("DB_PORT", "3307")
	t.Setenv("DB_USER", "vault")
	t.Setenv("DB_PASSWORD", "s3cret")
	t.Setenv("DB_NAME", "accounts")
	t.Setenv("DB_CHARSET", "utf8")
	t.Setenv("SERVER_PORT", ":9000")
	t.Setenv("LOG_LEVEL", "debug")
	cfg := Load()
	if cfg.DBHost != "db.example.com" || cfg.DBPort != "3307" || cfg.DBUser != "vault" ||
		cfg.DBPassword != "s3cret" || cfg.DBName != "accounts" || cfg.DBCharset != "utf8" {
		t.Errorf("env not applied: %+v", cfg)
	}
	if cfg.ServerPort != "9000" {
		t.Errorf("ServerPort should strip leading colon, got %q", cfg.ServerPort)
	}
	if cfg.LogLevel != "debug" {
		t.Errorf("LogLevel = %q, want debug", cfg.LogLevel)
	}
}

func TestDSN(t *testing.T) {
	c := &Config{
		DBHost: "h", DBPort: "3306", DBUser: "u", DBPassword: "p",
		DBName: "n", DBCharset: "utf8mb4",
	}
	got := c.DSN()
	want := "u:p@tcp(h:3306)/n?charset=utf8mb4&parseTime=True&loc=Local"
	if got != want {
		t.Errorf("DSN = %q\nwant %q", got, want)
	}
}

func TestListenAddr(t *testing.T) {
	cases := []struct{ port, want string }{
		{"9000", ":9000"},
		{":9000", ":9000"},
		{"", ":8080"},
	}
	for _, tc := range cases {
		c := &Config{ServerPort: tc.port}
		if got := c.ListenAddr(); got != tc.want {
			t.Errorf("ListenAddr(%q) = %q, want %q", tc.port, got, tc.want)
		}
	}
}

func TestListenURL(t *testing.T) {
	c := &Config{ServerPort: ":9000"}
	if got, want := c.ListenURL(), "http://0.0.0.0:9000"; got != want {
		t.Errorf("ListenURL = %q, want %q", got, want)
	}
}

func TestNormalizePort(t *testing.T) {
	cases := []struct{ in, want string }{
		{"8080", "8080"},
		{":8080", "8080"},
		{" 9000 ", "9000"},
		{"", "8080"},
		{":", "8080"},
	}
	for _, tc := range cases {
		if got := normalizePort(tc.in); got != tc.want {
			t.Errorf("normalizePort(%q) = %q, want %q", tc.in, got, tc.want)
		}
	}
}
