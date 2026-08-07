import { useEffect, useState } from 'react'
import { Ticket, Loader2, Inbox, RefreshCw, Ban } from 'lucide-react'
import { adminCreateCoupon } from '@/lib/api'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

async function authedFetch(path, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  const res = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || `Ошибка сервера (${res.status})`)
  return data
}

async function fetchLeads() {
  const data = await authedFetch('/api/admin-leads')
  return data.leads
}

async function fetchCoupons() {
  const data = await authedFetch('/api/admin-coupons')
  return data.coupons
}

async function revokeCoupon(code) {
  return authedFetch('/api/admin-revoke-coupon', { method: 'POST', body: JSON.stringify({ code }) })
}

function LeadsSection() {
  const [leads, setLeads] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function load() {
    setBusy(true)
    setErr('')
    try {
      setLeads(await fetchLeads())
    } catch (e) {
      setErr(e.message || 'Не удалось загрузить заявки.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-11 items-center justify-center rounded-full bg-lime-accent text-deep-forest">
            <Inbox className="size-5" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-primary">Заявки с лендинга</h3>
            <p className="text-sm text-on-surface-variant">
              {leads ? `Всего: ${leads.length}` : 'Загрузка…'}
            </p>
          </div>
        </div>
        <Button variant="ghost" onClick={load} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Обновить
        </Button>
      </div>

      {err && <p className="mb-3 text-sm font-medium text-destructive">{err}</p>}

      {leads && leads.length === 0 && (
        <p className="rounded-xl border border-on-surface/5 bg-white p-6 text-sm text-on-surface-variant shadow-card">
          Заявок пока нет.
        </p>
      )}

      {leads && leads.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-on-surface/5 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-light-sage/40 text-xs uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 font-semibold">Когда</th>
                <th className="px-4 py-3 font-semibold">Имя</th>
                <th className="px-4 py-3 font-semibold">Контакт</th>
                <th className="px-4 py-3 font-semibold">О статьях</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-muted-border/60">
                  <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
                    {new Date(l.created_at).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-4 py-3 font-medium text-primary">{l.name}</td>
                  <td className="px-4 py-3">{l.contact}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{l.about || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function statusLabel(c) {
  if (c.revoked_at) return { text: 'Отозван', className: 'text-destructive' }
  if (c.redeemed_by) return { text: 'Активен', className: 'text-primary' }
  return { text: 'Свободен', className: 'text-on-surface-variant' }
}

function CouponsSection() {
  const [coupons, setCoupons] = useState(null)
  const [busy, setBusy] = useState(false)
  const [revoking, setRevoking] = useState(null)
  const [err, setErr] = useState('')

  async function load() {
    setBusy(true)
    setErr('')
    try {
      setCoupons(await fetchCoupons())
    } catch (e) {
      setErr(e.message || 'Не удалось загрузить купоны.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleRevoke(code) {
    if (!window.confirm(`Отозвать доступ по купону «${code}»? Человек сразу потеряет безлимит.`)) return
    setRevoking(code)
    setErr('')
    try {
      await revokeCoupon(code)
      await load()
    } catch (e) {
      setErr(e.message || 'Не удалось отозвать купон.')
    } finally {
      setRevoking(null)
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-11 items-center justify-center rounded-full bg-lime-accent text-deep-forest">
            <Ban className="size-5" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-primary">Купоны-слоты</h3>
            <p className="text-sm text-on-surface-variant">
              {coupons ? `Всего: ${coupons.length}` : 'Загрузка…'}
            </p>
          </div>
        </div>
        <Button variant="ghost" onClick={load} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Обновить
        </Button>
      </div>

      {err && <p className="mb-3 text-sm font-medium text-destructive">{err}</p>}

      {coupons && (
        <div className="overflow-hidden rounded-xl border border-on-surface/5 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-light-sage/40 text-xs uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 font-semibold">Код</th>
                <th className="px-4 py-3 font-semibold">Статус</th>
                <th className="px-4 py-3 font-semibold">Кем активирован</th>
                <th className="px-4 py-3 font-semibold">Когда</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const status = statusLabel(c)
                return (
                  <tr key={c.code} className="border-t border-muted-border/60">
                    <td className="px-4 py-3 font-medium text-primary">{c.code}</td>
                    <td className={`px-4 py-3 font-medium ${status.className}`}>{status.text}</td>
                    <td className="px-4 py-3">{c.redeemed_by_email || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
                      {c.redeemed_at ? new Date(c.redeemed_at).toLocaleString('ru-RU') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.redeemed_by && !c.revoked_at && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRevoke(c.code)}
                          disabled={revoking === c.code}
                        >
                          {revoking === c.code ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
                          Отозвать
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default function AdminScreen() {
  const [code, setCode] = useState('')
  const [kind, setKind] = useState('uses')
  const [usesGranted, setUsesGranted] = useState(10)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function submit() {
    setBusy(true)
    setMsg('')
    try {
      const res = await adminCreateCoupon({ code, kind, usesGranted, note })
      setMsg(
        res.kind === 'unlimited'
          ? `Готово: купон «${res.code}» — безлимит.`
          : `Готово: купон «${res.code}» — на ${res.uses_granted} использований.`
      )
      setCode('')
      setNote('')
    } catch (e) {
      setMsg(e.message || 'Не удалось создать купон.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <section className="mb-8">
        <h1 className="font-display text-3xl font-bold text-primary">Купоны</h1>
        <p className="mt-2 text-on-surface-variant">Выдай новый код — безлимит или на N генераций.</p>
      </section>

      <div className="max-w-md rounded-xl border border-on-surface/5 bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex size-11 items-center justify-center rounded-full bg-lime-accent text-deep-forest">
            <Ticket className="size-5" />
          </div>
          <h3 className="font-display text-xl font-bold text-primary">Новый купон</h3>
        </div>

        <label className="mb-1 block text-sm font-medium text-on-surface-variant">Код купона</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="MYFRIEND20"
          className="mb-4 w-full rounded-lg border border-muted-border bg-white px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-deep-forest"
        />

        <label className="mb-1 block text-sm font-medium text-on-surface-variant">Вид</label>
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setKind('uses')}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              kind === 'uses' ? 'border-primary bg-light-sage text-primary' : 'border-muted-border text-on-surface-variant'
            }`}
          >
            На N раз
          </button>
          <button
            type="button"
            onClick={() => setKind('unlimited')}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              kind === 'unlimited' ? 'border-primary bg-light-sage text-primary' : 'border-muted-border text-on-surface-variant'
            }`}
          >
            Безлимит
          </button>
        </div>

        {kind === 'uses' && (
          <>
            <label className="mb-1 block text-sm font-medium text-on-surface-variant">Сколько раз</label>
            <input
              type="number"
              min={1}
              value={usesGranted}
              onChange={(e) => setUsesGranted(e.target.value)}
              className="mb-4 w-full rounded-lg border border-muted-border bg-white px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-deep-forest"
            />
          </>
        )}

        <label className="mb-1 block text-sm font-medium text-on-surface-variant">Заметка (для себя)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Подруга Оля"
          className="mb-4 w-full rounded-lg border border-muted-border bg-white px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-deep-forest"
        />

        <Button onClick={submit} disabled={busy || !code.trim()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Ticket className="size-4" />}
          Создать купон
        </Button>

        {msg && <p className="mt-3 text-sm font-medium text-on-surface-variant">{msg}</p>}
      </div>

      <CouponsSection />
      <LeadsSection />
    </div>
  )
}
