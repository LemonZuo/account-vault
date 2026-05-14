import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { tables } from '../tables'
import { getColorSet } from '../colors'
import { KeyRound, ChevronDown, Check } from 'lucide-react'
import clsx from 'clsx'
import Modal from './Modal'

function useCurrentTable() {
  const loc = useLocation()
  const m = loc.pathname.match(/^\/t\/([^/]+)/)
  const key = m?.[1]
  return tables.find((t) => t.key === key) ?? tables[0]
}

export default function Layout() {
  const [pickerOpen, setPickerOpen] = useState(false)
  const current = useCurrentTable()
  const navigate = useNavigate()
  const currentCs = getColorSet(current.color)

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      {/* 桌面端侧栏 */}
      <aside className="hidden w-60 shrink-0 border-r border-zinc-200/70 bg-white/70 px-3 py-6 backdrop-blur sm:block dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/30">
            <KeyRound size={18} />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">Account Vault</div>
            <div className="text-[11px] text-zinc-500">凭证管理</div>
          </div>
        </div>

        <nav className="space-y-0.5">
          {tables.map((t) => {
            const cs = getColorSet(t.color)
            return (
              <NavLink
                key={t.key}
                to={`/t/${t.key}`}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900'
                      : 'text-zinc-600 hover:bg-zinc-100/70 dark:text-zinc-300 dark:hover:bg-zinc-800/60'
                  )
                }
              >
                <span className={clsx('h-2 w-2 rounded-full', cs.dot)} />
                <span>{t.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>

      {/* 移动端顶栏：点击切换表 */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-zinc-200/70 bg-white/80 px-4 py-3 backdrop-blur sm:hidden dark:border-zinc-800 dark:bg-zinc-900/70">
        <button
          onClick={() => setPickerOpen(true)}
          className="-mx-1.5 flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1 transition active:bg-zinc-100 dark:active:bg-zinc-800"
        >
          <span className={clsx('h-2.5 w-2.5 shrink-0 rounded-full', currentCs.dot)} />
          <span className="truncate text-base font-bold tracking-tight">
            {current.label}
          </span>
          <ChevronDown size={16} className="shrink-0 text-zinc-400" />
        </button>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <KeyRound size={13} />
          <span>Vault</span>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>

      {/* 移动端切换表 sheet */}
      <Modal open={pickerOpen} title="切换" onClose={() => setPickerOpen(false)}>
        <div className="-mx-1 space-y-0.5">
          {tables.map((t) => {
            const cs = getColorSet(t.color)
            const active = t.key === current.key
            return (
              <button
                key={t.key}
                onClick={() => {
                  navigate(`/t/${t.key}`)
                  setPickerOpen(false)
                }}
                className={clsx(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition',
                  active
                    ? 'bg-zinc-100 dark:bg-zinc-800'
                    : 'hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-800/50'
                )}
              >
                <span className={clsx('h-2.5 w-2.5 shrink-0 rounded-full', cs.dot)} />
                <span className="flex-1 text-sm font-medium">{t.label}</span>
                {active && <Check size={16} className="text-emerald-500" />}
              </button>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}
