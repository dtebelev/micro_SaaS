import { useState } from 'react'
import { Leaf, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AuthScreen() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const isSignup = mode === 'signup'

  async function submit(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    if (!email.trim() || !password) {
      setError('Введи почту и пароль.')
      return
    }
    if (isSignup && password.length < 6) {
      setError('Пароль — минимум 6 символов.')
      return
    }
    setBusy(true)
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // Если подтверждение почты выключено — сессия придёт сразу.
        if (!data.session) {
          setNotice('Аккаунт создан. Войди с этой почтой и паролем.')
          setMode('signin')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setError(translate(err.message))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      {/* мягкое сияние-фон */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 0%, #f4f7d0 0%, #fafcd5 60%, #fafcd5 100%)',
        }}
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2">
            <Leaf className="size-7 text-deep-forest" strokeWidth={2} />
            <span className="font-display text-3xl font-bold text-primary">NaturoPin 1.0</span>
          </div>
          <p className="text-on-surface-variant">
            {isSignup
              ? 'Заведём аккаунт эксперта'
              : 'Твоя экспертиза — в смыслы для Pinterest'}
          </p>
        </div>

        <div className="rounded-xl border border-on-surface/5 bg-white p-8 shadow-card">
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Почта
              </label>
              <Input
                type="email"
                autoComplete="email"
                placeholder="natasha@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!error}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Пароль
              </label>
              <Input
                type="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!error}
              />
            </div>

            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            {notice && <p className="text-sm font-medium text-secondary">{notice}</p>}

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {isSignup ? 'Создать аккаунт' : 'Войти'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            {isSignup ? 'Уже есть аккаунт?' : 'Впервые здесь?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(isSignup ? 'signin' : 'signup')
                setError('')
                setNotice('')
              }}
              className="font-bold text-primary underline-offset-4 hover:underline"
            >
              {isSignup ? 'Войти' : 'Создать'}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-on-surface-variant/70">
          Бережно к твоему времени. Данные видит только владелец аккаунта.
        </p>
      </div>
    </div>
  )
}

function translate(msg = '') {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'Неверная почта или пароль.'
  if (m.includes('already registered')) return 'Такая почта уже зарегистрирована — войди.'
  if (m.includes('email') && m.includes('confirm'))
    return 'Нужно подтвердить почту (проверь письмо).'
  if (m.includes('rate limit')) return 'Слишком много попыток. Попробуй чуть позже.'
  return msg || 'Что-то пошло не так. Попробуй ещё раз.'
}
