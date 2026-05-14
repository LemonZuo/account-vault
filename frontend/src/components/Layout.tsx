import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { tables } from '../tables'
import { getColorSet } from '../colors'
import { ChevronDown, Check, Command as CmdIcon } from 'lucide-react'
import { cn } from '../lib/utils'
import { Kbd } from './ui/kbd'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from './ui/drawer'
import CommandPalette from './CommandPalette'

function useCurrentTable() {
  const loc = useLocation()
  const m = loc.pathname.match(/^\/t\/([^/]+)/)
  const key = m?.[1]
  return tables.find((t) => t.key === key) ?? tables[0]
}

export default function Layout() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const current = useCurrentTable()
  const navigate = useNavigate()
  const currentCs = getColorSet(current.color)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      {/* 桌面端侧栏 */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card/40 px-3 py-6 backdrop-blur-sm sm:flex">
        <div className="mb-6 flex items-center justify-between px-3">
          <div>
            <div className="text-[13px] font-semibold tracking-tight">Vault</div>
            <div className="text-[11px] text-muted-foreground">凭证管理</div>
          </div>
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
            V
          </span>
        </div>

        <nav className="flex-1 space-y-0.5">
          {tables.map((t) => {
            const cs = getColorSet(t.color)
            return (
              <NavLink
                key={t.key}
                to={`/t/${t.key}`}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                  )
                }
              >
                <span className={cn('h-1.5 w-1.5 rounded-full transition-transform group-hover:scale-125', cs.dot)} />
                <span>{t.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <button
          onClick={() => setPaletteOpen(true)}
          className="mt-3 flex items-center justify-between gap-2 rounded-md border border-border bg-background/50 px-3 py-1.5 text-[12px] text-muted-foreground transition hover:border-ring/50 hover:bg-accent hover:text-foreground"
        >
          <span className="flex items-center gap-1.5">
            <CmdIcon className="h-3 w-3" />
            快速切换
          </span>
          <Kbd>⌘K</Kbd>
        </button>
      </aside>

      {/* 移动端顶栏 */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md sm:hidden">
        <button
          onClick={() => setPickerOpen(true)}
          className="-mx-1.5 flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 outline-none transition active:bg-accent"
        >
          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', currentCs.dot)} />
          <span className="truncate text-[15px] font-semibold tracking-tight">
            {current.label}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
        <span className="text-[11px] text-muted-foreground">Vault</span>
      </header>

      {/* 移动端表切换：底部弹起 Drawer */}
      <Drawer open={pickerOpen} onOpenChange={setPickerOpen}>
        <DrawerContent className="sm:hidden overflow-hidden">
          <DrawerHeader className="pb-2">
            <DrawerTitle>切换表</DrawerTitle>
          </DrawerHeader>
          <div className="min-h-0 overflow-y-auto px-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] transition-colors',
                    active ? 'bg-accent font-medium' : 'active:bg-accent/60',
                  )}
                >
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', cs.dot)} />
                  <span className="flex-1">{t.label}</span>
                  {active && <Check className="h-4 w-4 text-foreground" />}
                </button>
              )
            })}
          </div>
        </DrawerContent>
      </Drawer>

      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onPick={(key) => {
          navigate(`/t/${key}`)
          setPaletteOpen(false)
        }}
        currentKey={current.key}
      />
    </div>
  )
}
