import { useEffect, useState } from 'react'
import { Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom'
import {
  Leaf,
  FilePlus2,
  Sparkles,
  LayoutGrid,
  Download,
  LogOut,
  Menu,
  X,
  Check,
  Ticket,
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getAccess } from '@/lib/api'
import { Button } from '@/components/ui/button'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL

function accessLabel(access) {
  if (!access) return ''
  const periodEnd = access.subscription_current_period_end
    ? new Date(access.subscription_current_period_end)
    : null
  const subscriptionCoversNow = periodEnd && periodEnd > new Date()

  if (subscriptionCoversNow) {
    const dateStr = periodEnd.toLocaleDateString('ru-RU')
    if (access.subscription_status === 'canceled') return `Подписка отменена — доступ до ${dateStr}`
    if (access.subscription_status === 'past_due') return `Проблема с оплатой — доступ до ${dateStr}`
    return 'Подписка активна'
  }
  if (access.credits_remaining === null) return 'Купон: безлимит'
  if (access.credits_remaining > 0) return `Бесплатно: ${access.credits_remaining}`
  return 'Бесплатные генерации закончились'
}

const steps = [
  { label: 'Источник', icon: FilePlus2 },
  { label: 'Анализ', icon: Sparkles },
  { label: 'Верстак', icon: LayoutGrid },
  { label: 'Экспорт', icon: Download },
]

// Текущий шаг по адресу
function currentStep(pathname) {
  if (pathname.startsWith('/analysis')) return 1
  if (pathname.startsWith('/workbench')) return 2
  if (pathname.startsWith('/finish')) return 3
  return 0
}

function SidebarContent({ email, access, onNew, onClose, current }) {
  return (
    <div className="flex h-full flex-col py-8 text-on-primary-container">
      <div className="px-6 mb-10 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Leaf className="size-5 text-lime-accent" strokeWidth={2} />
            <h1 className="font-display text-xl font-bold text-white">NaturoPin 1.0</h1>
          </div>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-on-primary-container/60">
            Смыслы для Pinterest
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-white/70">
            <X className="size-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {steps.map(({ label, icon: Icon }, i) => {
          const isCurrent = i === current
          const isDone = i < current
          const base = 'flex items-center gap-3 rounded-full px-4 py-3 transition-all'
          const cls = isCurrent
            ? `${base} bg-lime-accent font-bold text-deep-forest shadow-cta`
            : isDone
              ? `${base} text-lime-accent/90`
              : `${base} text-on-primary-container/40 cursor-default`

          const inner = (
            <>
              {isDone ? <Check className="size-5" /> : <Icon className="size-5" />}
              <span>{label}</span>
              {isCurrent && (
                <span className="ml-auto size-2 animate-pulse rounded-full bg-deep-forest" />
              )}
            </>
          )

          // «Источник» — всегда кликабелен (начать заново); остальные шаги — индикаторы.
          return i === 0 ? (
            <NavLink key={label} to="/" end onClick={onClose} className={cls}>
              {inner}
            </NavLink>
          ) : (
            <span key={label} className={cls}>
              {inner}
            </span>
          )
        })}
      </nav>

      <div className="mt-auto space-y-4 px-6 pt-6">
        <Button className="w-full" onClick={onNew}>
          <FilePlus2 className="size-4" />
          Новый пак
        </Button>
        <div className="border-t border-white/10 pt-4">
          <p className="truncate text-xs text-on-primary-container/60">{email}</p>
          {ADMIN_EMAIL && email === ADMIN_EMAIL ? (
            <p className="mt-1 text-xs font-bold text-lime-accent">Безлимит (владелец)</p>
          ) : (
            access && <p className="mt-1 text-xs font-bold text-lime-accent">{accessLabel(access)}</p>
          )}
          {ADMIN_EMAIL && email === ADMIN_EMAIL && (
            <NavLink
              to="/admin"
              onClick={onClose}
              className="mt-2 flex items-center gap-2 text-sm text-on-primary-container/70 transition-colors hover:text-lime-accent"
            >
              <Ticket className="size-4" />
              Купоны
            </NavLink>
          )}
          <button
            onClick={() => supabase.auth.signOut()}
            className="mt-2 flex items-center gap-2 text-sm text-on-primary-container/70 transition-colors hover:text-lime-accent"
          >
            <LogOut className="size-4" />
            Выйти
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AppLayout({ session }) {
  const navigate = useNavigate()
  const location = useLocation()
  const current = currentStep(location.pathname)
  const [drawer, setDrawer] = useState(false)
  const [access, setAccess] = useState(null)
  const email = session?.user?.email || ''

  useEffect(() => {
    getAccess().then(setAccess).catch(() => {})
  }, [location.pathname])

  const goNew = () => {
    setDrawer(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 bg-primary-container shadow-md md:block">
        <SidebarContent email={email} access={access} onNew={goNew} current={current} />
      </aside>

      {/* Mobile top bar */}
      <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between px-4 md:hidden">
        <div className="flex items-center gap-2">
          <Leaf className="size-5 text-primary" strokeWidth={2} />
          <span className="font-display text-lg font-bold text-primary">NaturoPin 1.0</span>
        </div>
        <button onClick={() => setDrawer(true)} className="text-primary">
          <Menu className="size-6" />
        </button>
      </header>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawer(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-primary-container shadow-xl">
            <SidebarContent email={email} access={access} onNew={goNew} onClose={() => setDrawer(false)} current={current} />
          </div>
        </div>
      )}

      {/* Content */}
      <main className="md:ml-64">
        <div className="mx-auto w-full max-w-[1120px] px-4 py-8 sm:px-6 md:px-10 md:py-12">
          <Outlet context={{ session }} />
        </div>
      </main>
    </div>
  )
}
