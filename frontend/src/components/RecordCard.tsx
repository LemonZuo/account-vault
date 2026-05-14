import { useState } from 'react'
import { Copy, Pencil, Trash2, Check, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import type { TableDef } from '../tables'
import { avatarColor, getColorSet } from '../colors'

interface Props {
  record: Record<string, any>
  def: TableDef
  onEdit: () => void
  onDelete: () => void
}

function pickFirst(r: Record<string, any>, keys: string[]): string {
  for (const k of keys) {
    const v = r[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v)
  }
  return ''
}

export default function RecordCard({ record, def, onEdit, onDelete }: Props) {
  const [copied, setCopied] = useState<string>('')
  const [expand, setExpand] = useState<Record<string, boolean>>({})

  const title = pickFirst(record, def.titleKeys) || '(无标题)'
  const subtitle = def.subtitleKeys
    .map((k) => record[k])
    .filter((v) => v !== undefined && v !== null && String(v).trim() !== '')
    .join(' · ')

  const colorSet = getColorSet(def.color)
  const avatarBg = avatarColor(title)
  const avatar = title.charAt(0).toUpperCase()

  const copy = async (key: string, val: any) => {
    if (val === undefined || val === null) return
    try {
      await navigator.clipboard.writeText(String(val))
      setCopied(key)
      setTimeout(() => setCopied(''), 1200)
    } catch {}
  }

  const toggle = (k: string) => setExpand((p) => ({ ...p, [k]: !p[k] }))

  return (
    <div
      className={clsx(
        'group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-200/60',
        'dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:hover:shadow-black/40',
        'border-l-4',
        colorSet.border,
      )}
    >
      <div className="flex items-start gap-3 px-4 pt-4">
        <div
          className={clsx(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white shadow-sm',
            avatarBg,
          )}
        >
          {avatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {title}
          </div>
          {subtitle && (
            <div className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100 sm:opacity-60 sm:group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
            title="编辑"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
            title="删除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-1 border-t border-zinc-100 px-4 pb-3 pt-3 dark:border-zinc-800/60">
        {def.fields.map((f) => {
          const v = record[f.key]
          const empty = v === undefined || v === null || String(v).trim() === ''
          const s = empty ? '' : String(v)
          const isLong = !empty && (def.longFields?.includes(f.key) || s.length > 60)
          const expanded = expand[f.key]
          return (
            <div key={f.key} className="group/row flex items-start gap-2 rounded-lg px-1.5 py-1 text-xs transition hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
              <span className="w-16 shrink-0 pt-0.5 text-[11px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {f.label}
              </span>
              {empty ? (
                <span className="flex-1 min-w-0 font-mono text-[12.5px] leading-relaxed text-zinc-300 dark:text-zinc-600">
                  —
                </span>
              ) : (
                <span
                  className={clsx(
                    'flex-1 min-w-0 font-mono text-[12.5px] leading-relaxed text-zinc-800 dark:text-zinc-200',
                    isLong && !expanded ? 'truncate' : 'break-all',
                  )}
                >
                  {s}
                </span>
              )}
              {isLong && (
                <button
                  onClick={() => toggle(f.key)}
                  className="shrink-0 rounded p-0.5 text-zinc-400 transition hover:text-zinc-700 dark:hover:text-zinc-200"
                  title={expanded ? '收起' : '展开'}
                >
                  <ChevronDown
                    size={13}
                    className={clsx('transition', expanded && 'rotate-180')}
                  />
                </button>
              )}
              {!empty && (
                <button
                  onClick={() => copy(f.key, v)}
                  className={clsx(
                    'shrink-0 rounded p-0.5 transition',
                    copied === f.key
                      ? 'text-emerald-500'
                      : 'text-zinc-400 opacity-60 hover:text-zinc-700 group-hover/row:opacity-100 dark:hover:text-zinc-200',
                  )}
                  title="复制"
                >
                  {copied === f.key ? <Check size={13} /> : <Copy size={13} />}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
