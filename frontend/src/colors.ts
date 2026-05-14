// Tailwind v4 通过扫描源码识别 class 名，动态拼接的 class 会被丢弃。
// 这里把每种主题色对应的完整 class 字符串静态列出。

export interface ColorSet {
  dot: string // 侧栏圆点
  chip: string // 标题旁的数量小标签
  avatar: string // 卡片头像渐变背景
  border: string // 卡片左侧主题色边
  ring: string // 选中态高亮
}

export const colorMap: Record<string, ColorSet> = {
  slate: {
    dot: 'bg-slate-400',
    chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    avatar: 'bg-gradient-to-br from-slate-400 to-slate-600',
    border: 'border-l-slate-400',
    ring: 'ring-slate-300',
  },
  emerald: {
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    avatar: 'bg-gradient-to-br from-emerald-400 to-teal-600',
    border: 'border-l-emerald-500',
    ring: 'ring-emerald-300',
  },
  orange: {
    dot: 'bg-orange-500',
    chip: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
    avatar: 'bg-gradient-to-br from-orange-400 to-red-500',
    border: 'border-l-orange-500',
    ring: 'ring-orange-300',
  },
  sky: {
    dot: 'bg-sky-500',
    chip: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
    avatar: 'bg-gradient-to-br from-sky-400 to-blue-600',
    border: 'border-l-sky-500',
    ring: 'ring-sky-300',
  },
  amber: {
    dot: 'bg-amber-500',
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    avatar: 'bg-gradient-to-br from-amber-400 to-orange-500',
    border: 'border-l-amber-500',
    ring: 'ring-amber-300',
  },
  rose: {
    dot: 'bg-rose-500',
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    avatar: 'bg-gradient-to-br from-rose-400 to-pink-600',
    border: 'border-l-rose-500',
    ring: 'ring-rose-300',
  },
  violet: {
    dot: 'bg-violet-500',
    chip: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
    avatar: 'bg-gradient-to-br from-violet-400 to-fuchsia-600',
    border: 'border-l-violet-500',
    ring: 'ring-violet-300',
  },
}

// 基于字符串哈希挑选一个稳定的备用渐变（与表无关，仅头像用）
const avatarPalette = [
  'bg-gradient-to-br from-rose-400 to-pink-600',
  'bg-gradient-to-br from-amber-400 to-orange-500',
  'bg-gradient-to-br from-emerald-400 to-teal-600',
  'bg-gradient-to-br from-sky-400 to-blue-600',
  'bg-gradient-to-br from-violet-400 to-fuchsia-600',
  'bg-gradient-to-br from-cyan-400 to-blue-500',
  'bg-gradient-to-br from-fuchsia-400 to-pink-600',
  'bg-gradient-to-br from-lime-400 to-emerald-600',
  'bg-gradient-to-br from-indigo-400 to-violet-600',
  'bg-gradient-to-br from-teal-400 to-cyan-600',
]

export function avatarColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  return avatarPalette[h % avatarPalette.length]
}

export function getColorSet(color: string): ColorSet {
  return colorMap[color] ?? colorMap.slate
}
