import { useState } from 'react'
import { Copy, Pencil, Trash2, Check } from 'lucide-react'
import clsx from 'clsx'
import type { TableDef } from '../tables'

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

  const title = pickFirst(record, def.titleKeys) || '(无标题)'
  const subtitle = def.subtitleKeys
    .map((k) => record[k])
    .filter((v) => v !== undefined && v !== null && String(v).trim() !== '')
    .join(' · ')

  const copy = async (key: string, val: any) => {
    if (val === undefined || val === null) return
    try {
      await navigator.clipboard.writeText(String(val))
      setCopied(key)
      setTimeout(() => setCopied(''), 1200)
    } catch {}
  }

  // 取首字母作为头像
  const avatar = title.charAt(0).toUpperCase()

  return (
    <div className="group rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 text-sm font-semibold text-zinc-700 dark:from-zinc-800 dark:to-zinc-700 dark:text-zinc-200">
          {avatar}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold tracking-tight">
            {title}
          </div>
          {subtitle && (
            <div className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100 sm:opacity-100">
          <button
            onClick={onEdit}
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
            title="编辑"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
            title="删除"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        {def.fields.map((f) => {
          const v = record[f.key]
          if (v === undefined || v === null || String(v).trim() === '') return null
          return (
            <div key={f.key} className="flex items-start gap-2 text-xs">
              <span className="w-20 shrink-0 text-zinc-500 dark:text-zinc-400">
                {f.label}
              </span>
              <span className="flex-1 break-all font-mono text-zinc-800 dark:text-zinc-200">
                {String(v)}
              </span>
              <button
                onClick={() => copy(f.key, v)}
                className={clsx(
                  'rounded p-0.5 transition',
                  copied === f.key
                    ? 'text-emerald-500'
                    : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                )}
                title="复制"
              >
                {copied === f.key ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
