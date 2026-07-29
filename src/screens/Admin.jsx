import { useState } from 'react'
import { Ticket, Loader2 } from 'lucide-react'
import { adminCreateCoupon } from '@/lib/api'
import { Button } from '@/components/ui/button'

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
    </div>
  )
}
