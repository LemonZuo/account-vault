import { NavLink, Outlet } from 'react-router-dom'
import { tables } from '../tables'
import { KeyRound } from 'lucide-react'
import clsx from 'clsx'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      {/* 桌面端侧栏 */}
      <aside className="hidden w-64 shrink-0 border-r border-zinc-200/70 bg-white/70 px-4 py-6 backdrop-blur sm:block dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md">
            <KeyRound size={18} />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">Account Vault</div>
            <div className="text-[11px] text-zinc-500">凭证管理</div>
          </div>
        </div>

        <nav className="space-y-0.5">
          {tables.map((t) => (
            <NavLink
              key={t.key}
              to={`/t/${t.key}`}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                )
              }
            >
              <span className="text-base">{t.icon}</span>
              <span>{t.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* 移动端顶栏 */}
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-zinc-200/70 bg-white/80 px-4 py-3 backdrop-blur sm:hidden dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
          <KeyRound size={16} />
        </div>
        <span className="text-sm font-bold tracking-tight">Account Vault</span>
      </header>

      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>

      {/* 移动端底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex overflow-x-auto border-t border-zinc-200/70 bg-white/90 px-2 py-1.5 backdrop-blur sm:hidden no-scrollbar dark:border-zinc-800 dark:bg-zinc-900/85">
        {tables.map((t) => (
          <NavLink
            key={t.key}
            to={`/t/${t.key}`}
            className={({ isActive }) =>
              clsx(
                'flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition',
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'text-zinc-500'
              )
            }
          >
            <span className="text-base leading-none">{t.icon}</span>
            <span className="whitespace-nowrap">{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
