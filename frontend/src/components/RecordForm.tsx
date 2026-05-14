import { useState, useEffect } from 'react'
import type { Field } from '../tables'

interface Props {
  fields: Field[]
  initial?: Record<string, any>
  onSubmit: (data: Record<string, any>) => Promise<void> | void
  onCancel: () => void
}

export default function RecordForm({ fields, initial, onSubmit, onCancel }: Props) {
  const [data, setData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    setData(initial ?? {})
  }, [initial])

  const set = (k: string, v: any) => setData((prev) => ({ ...prev, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErr('')
    try {
      await onSubmit(data)
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || '提交失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {fields.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {f.label}
          </label>
          {f.type === 'textarea' ? (
            <textarea
              value={data[f.key] ?? ''}
              placeholder={f.placeholder}
              onChange={(e) => set(f.key, e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none transition focus:border-zinc-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:focus:bg-zinc-900"
            />
          ) : (
            <input
              type="text"
              value={data[f.key] ?? ''}
              placeholder={f.placeholder}
              onChange={(e) => set(f.key, e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none transition focus:border-zinc-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:focus:bg-zinc-900"
            />
          )}
        </div>
      ))}
      {err && <p className="text-sm text-red-500">{err}</p>}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          {loading ? '保存中…' : '保存'}
        </button>
      </div>
    </form>
  )
}
