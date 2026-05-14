import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Search, Loader2 } from 'lucide-react'
import { api } from '../api'
import { getTable } from '../tables'
import RecordCard from './RecordCard'
import RecordForm from './RecordForm'
import Modal from './Modal'

export default function TableView() {
  const { tableKey } = useParams<{ tableKey: string }>()
  const def = useMemo(() => (tableKey ? getTable(tableKey) : undefined), [tableKey])

  const [records, setRecords] = useState<Record<string, any>[]>([])
  const [loading, setLoading] = useState(false)
  const [kw, setKw] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Record<string, any> | null>(null)

  const load = async () => {
    if (!def) return
    setLoading(true)
    try {
      const { data } = await api.get(`/${def.path}`)
      setRecords(data.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setRecords([])
    setKw('')
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableKey])

  if (!def) return <div className="p-6 text-zinc-500">未找到该表</div>

  const filtered = records.filter((r) => {
    if (!kw) return true
    const s = kw.toLowerCase()
    return Object.values(r).some((v) =>
      v !== null && v !== undefined && String(v).toLowerCase().includes(s)
    )
  })

  const onAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const onEdit = (r: Record<string, any>) => {
    setEditing(r)
    setModalOpen(true)
  }

  const onSubmit = async (data: Record<string, any>) => {
    if (def.hasId) {
      if (editing && editing.id) {
        await api.put(`/${def.path}/${editing.id}`, data)
      } else {
        await api.post(`/${def.path}`, data)
      }
    } else {
      // middleware_account：复合主键
      if (editing) {
        await api.put(`/${def.path}`, {
          _orig_public_ip: editing.public_ip,
          _orig_port: editing.port,
          _orig_type: editing.type,
          data,
        })
      } else {
        await api.post(`/${def.path}`, data)
      }
    }
    setModalOpen(false)
    await load()
  }

  const onDelete = async (r: Record<string, any>) => {
    if (!confirm('确认删除？')) return
    if (def.hasId) {
      await api.delete(`/${def.path}/${r.id}`)
    } else {
      await api.delete(`/${def.path}`, {
        params: { public_ip: r.public_ip, port: r.port, type: r.type },
      })
    }
    await load()
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-32 pt-6 sm:pt-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {def.label}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            共 {filtered.length} 条记录
          </p>
        </div>
        <button
          onClick={onAdd}
          className="hidden items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 sm:flex dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          <Plus size={16} />
          新增
        </button>
      </div>

      <div className="mb-5 relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
        />
        <input
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          placeholder="搜索…"
          className="w-full rounded-2xl border border-zinc-200 bg-white/80 py-3 pl-10 pr-4 text-sm shadow-sm outline-none backdrop-blur transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/60"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-zinc-400">
          <Loader2 className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 py-16 text-center text-sm text-zinc-400 dark:border-zinc-800">
          {kw ? '没有匹配的记录' : '暂无数据，点击右下角 + 添加'}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r, i) => (
            <RecordCard
              key={def.hasId ? r.id : `${r.public_ip}-${r.port}-${r.type}-${i}`}
              record={r}
              def={def}
              onEdit={() => onEdit(r)}
              onDelete={() => onDelete(r)}
            />
          ))}
        </div>
      )}

      {/* 移动端浮动按钮 */}
      <button
        onClick={onAdd}
        className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition hover:scale-105 active:scale-95 sm:hidden dark:bg-white dark:text-zinc-900"
      >
        <Plus size={22} />
      </button>

      <Modal
        open={modalOpen}
        title={editing ? `编辑 ${def.label}` : `新增 ${def.label}`}
        onClose={() => setModalOpen(false)}
      >
        <RecordForm
          fields={def.fields}
          initial={editing ?? {}}
          onSubmit={onSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
