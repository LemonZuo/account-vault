package model

type Apple struct {
	ID       int    `gorm:"primaryKey;column:id" json:"id"`
	Mail     string `gorm:"column:mail" json:"mail"`
	SubMail  string `gorm:"column:sub_mail" json:"sub_mail"`
	Password string `gorm:"column:password" json:"password"`
	Phone    string `gorm:"column:phone" json:"phone"`
	Remark   string `gorm:"column:remark" json:"remark"`
}

func (Apple) TableName() string { return "tb_apple" }

type IdcFlare struct {
	ID       int    `gorm:"primaryKey;column:id" json:"id"`
	Mail     string `gorm:"column:mail" json:"mail"`
	UserName string `gorm:"column:user_name" json:"user_name"`
	Passwd   string `gorm:"column:passwd" json:"passwd"`
}

func (IdcFlare) TableName() string { return "tb_idc_flare" }

type LinuxDo struct {
	ID            int    `gorm:"primaryKey;column:id" json:"id"`
	Mail          string `gorm:"column:mail" json:"mail"`
	UserName      string `gorm:"column:user_name" json:"user_name"`
	Passwd        string `gorm:"column:passwd" json:"passwd"`
	ChromeProfile string `gorm:"column:chrome_profile" json:"chrome_profile"`
}

func (LinuxDo) TableName() string { return "tb_linux_do" }

type Network struct {
	ID            int    `gorm:"primaryKey;column:id" json:"id"`
	Account       string `gorm:"column:account" json:"account"`
	Password      string `gorm:"column:password" json:"password"`
	AdminPassword string `gorm:"column:admin_password" json:"admin_password"`
	Bandwidth     string `gorm:"column:bandwidth" json:"bandwidth"`
	Loid          string `gorm:"column:loid" json:"loid"`
	Tel           string `gorm:"column:tel" json:"tel"`
	Desc          string `gorm:"column:desc" json:"desc"`
}

func (Network) TableName() string { return "tb_network" }

type Openai struct {
	ID           int    `gorm:"primaryKey;column:id" json:"id"`
	Mail         string `gorm:"column:mail" json:"mail"`
	Password     string `gorm:"column:password" json:"password"`
	RefreshToken string `gorm:"column:refresh_token" json:"refresh_token"`
	Tag          string `gorm:"column:tag" json:"tag"`
}

func (Openai) TableName() string { return "tb_openai" }

type Claude struct {
	ID           int    `gorm:"primaryKey;column:id" json:"id"`
	Mail         string `gorm:"column:mail" json:"mail"`
	SessionKey   string `gorm:"column:session_key" json:"session_key"`
	Area         string `gorm:"column:area" json:"area"`
	AppleID      string `gorm:"column:apple_id" json:"apple_id"`
}

func (Claude) TableName() string { return "tb_claude" }

type SoftAccount struct {
	ID       int    `gorm:"primaryKey;column:id" json:"id"`
	Type     string `gorm:"column:type" json:"type"`
	User     string `gorm:"column:user" json:"user"`
	Password string `gorm:"column:password" json:"password"`
	Remark   string `gorm:"column:remark" json:"remark"`
}

func (SoftAccount) TableName() string { return "tb_soft_account" }

type MiddlewareAccount struct {
	ID       int    `gorm:"primaryKey;column:id" json:"id"`
	PublicIP string `gorm:"column:public_ip" json:"public_ip"`
	LoclaIP  string `gorm:"column:locla_ip" json:"locla_ip"`
	Port     string `gorm:"column:port" json:"port"`
	Type     string `gorm:"column:type" json:"type"`
	User     string `gorm:"column:user" json:"user"`
	Password string `gorm:"column:password" json:"password"`
	Remark   string `gorm:"column:remark" json:"remark"`
}

func (MiddlewareAccount) TableName() string { return "tb_middleware_account" }

type ComponentsAccount struct {
	ID       int    `gorm:"primaryKey;column:id" json:"id"`
	PublicIP string `gorm:"column:public_ip" json:"public_ip"`
	LoclaIP  string `gorm:"column:locla_ip" json:"locla_ip"`
	Port     string `gorm:"column:port" json:"port"`
	Type     string `gorm:"column:type" json:"type"`
	User     string `gorm:"column:user" json:"user"`
	Password string `gorm:"column:password" json:"password"`
	Remark   string `gorm:"column:remark" json:"remark"`
	LocalIP  string `gorm:"column:local_ip" json:"local_ip"`
}

func (ComponentsAccount) TableName() string { return "tb_components_account" }
