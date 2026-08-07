import { useEffect, useState } from 'react'
import { Ticket, Loader2, Inbox, RefreshCw } from 'lucide-react'
import { adminCreateCoupon } from '@/lib/api'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

async function fetchLeads() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  const res = await fetch('/api/admin-leads', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || `Ошибка сервера (${res.status})`)
  return data.leads
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

      <LeadsSection />
    </div>
  )
}
