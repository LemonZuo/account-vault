export type FieldType = 'text' | 'password' | 'textarea'

export interface Field {
  key: string
  label: string
  type?: FieldType
  placeholder?: string
}

export interface TableDef {
  key: string
  label: string
  path: string // API 路径，不含 /api/
  icon: string // emoji 占位
  // 主题色（tailwind 色名 + 用于 dot 与高亮）
  color: string
  // 卡片标题字段（取第一个非空）
  titleKeys: string[]
  // 卡片副标题字段
  subtitleKeys: string[]
  // 表单字段
  fields: Field[]
  // 是否有自增 ID
  hasId: boolean
  // 长文本字段：默认折叠
  longFields?: string[]
}

export const tables: TableDef[] = [
  {
    key: 'apple',
    label: 'Apple',
    path: 'apple',
    icon: '',
    color: 'blue',
    titleKeys: ['mail'],
    subtitleKeys: ['phone', 'remark'],
    hasId: true,
    fields: [
      { key: 'mail', label: '邮箱', placeholder: 'xxx@icloud.com' },
      { key: 'sub_mail', label: '备用邮箱' },
      { key: 'password', label: '密码', type: 'password' },
      { key: 'phone', label: '号码' },
      { key: 'remark', label: '备注', type: 'textarea' },
    ],
  },
  {
    key: 'openai',
    label: 'OpenAI',
    path: 'openai',
    icon: '',
    color: 'emerald',
    longFields: ['refresh_token'],
    titleKeys: ['mail'],
    subtitleKeys: ['tag'],
    hasId: true,
    fields: [
      { key: 'mail', label: '邮箱' },
      { key: 'password', label: '密码', type: 'password' },
      { key: 'refresh_token', label: '刷新令牌', type: 'textarea' },
      { key: 'tag', label: '标签' },
    ],
  },
  {
    key: 'idc_flare',
    label: 'IDC Flare',
    path: 'idc-flare',
    icon: '',
    color: 'orange',
    titleKeys: ['user_name', 'mail'],
    subtitleKeys: ['mail'],
    hasId: true,
    fields: [
      { key: 'mail', label: '邮箱' },
      { key: 'user_name', label: '用户名' },
      { key: 'passwd', label: '密码', type: 'password' },
    ],
  },
  {
    key: 'linux_do',
    label: 'Linux.do',
    path: 'linux-do',
    icon: '',
    color: 'sky',
    titleKeys: ['user_name', 'mail'],
    subtitleKeys: ['mail', 'chrome_profile'],
    hasId: true,
    fields: [
      { key: 'mail', label: '邮箱' },
      { key: 'user_name', label: '用户名' },
      { key: 'passwd', label: '密码', type: 'password' },
      { key: 'chrome_profile', label: '个人资料' },
    ],
  },
  {
    key: 'network',
    label: '宽带账户',
    path: 'network',
    icon: '',
    color: 'amber',
    titleKeys: ['account'],
    subtitleKeys: ['bandwidth', 'desc'],
    hasId: true,
    fields: [
      { key: 'account', label: '账户' },
      { key: 'password', label: '密码', type: 'password' },
      { key: 'admin_password', label: '管理密码', type: 'password' },
      { key: 'bandwidth', label: '带宽' },
      { key: 'loid', label: 'LOID' },
      { key: 'tel', label: '联系电话' },
      { key: 'desc', label: '描述', type: 'textarea' },
    ],
  },
  {
    key: 'soft_account',
    label: '软件账号',
    path: 'soft-account',
    icon: '',
    color: 'rose',
    titleKeys: ['user', 'type'],
    subtitleKeys: ['type', 'remark'],
    hasId: true,
    fields: [
      { key: 'type', label: '类型', placeholder: 'GitHub / Adobe ...' },
      { key: 'user', label: '用户' },
      { key: 'password', label: '密码', type: 'password' },
      { key: 'remark', label: '备注', type: 'textarea' },
    ],
  },
  {
    key: 'middleware_account',
    label: '中间件账号',
    path: 'middleware-account',
    icon: '',
    color: 'violet',
    titleKeys: ['type', 'public_ip'],
    subtitleKeys: ['public_ip', 'port', 'user'],
    hasId: false,
    fields: [
      { key: 'public_ip', label: '公网 IP' },
      { key: 'locla_ip', label: '内网 IP' },
      { key: 'port', label: '端口' },
      { key: 'type', label: '类型', placeholder: 'redis / mysql ...' },
      { key: 'user', label: '用户' },
      { key: 'password', label: '密码', type: 'password' },
      { key: 'remark', label: '备注', type: 'textarea' },
    ],
  },
]

export function getTable(key: string): TableDef | undefined {
  return tables.find((t) => t.key === key)
}
