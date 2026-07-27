import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Link2, FileText, Loader2 } from 'lucide-react'
import { generatePack } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const MIN_CHARS = 80
const isUrl = (s) => /^https?:\/\/[^\s]+\.[^\s]+$/i.test(String(s || '').trim())

export default function SourceScreen() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const clearErr = () => error && setError('')

  async function submit() {
    setError('')
    const link = url.trim()
    const body = link || text.trim()

    if (!body) {
      setError('Вставь ссылку на статью или её текст.')
      return
    }
    if (link) {
      if (!isUrl(link)) {
        setError('Похоже, это не ссылка. Ссылка начинается с http:// или https://')
        return
      }
    } else if (text.trim().length < MIN_CHARS) {
      setError(`Нужно чуть больше текста — хотя бы ${MIN_CHARS} символов, или вставь ссылку выше.`)
      return
    }

    setBusy(true)
    try {
      const { project_id } = await generatePack(body)
      navigate(`/analysis/${project_id}`)
    } catch (err) {
      setError(err.message || 'Не удалось запустить обработку. Попробуй ещё раз.')
      setBusy(false)
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="mb-10">
        <h1 className="font-display text-4xl font-bold leading-tight text-primary sm:text-5xl">
          Преврати экспертную статью
          <br className="hidden sm:block" /> в смыслы для Pinterest
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-on-surface-variant">
          Вставь ссылку на статью или её текст — система прочитает материал, выделит
          главное и подготовит пак чистых карточек, сохранив твою терминологию и экспертный тон.
        </p>
      </section>

      {/* Поле 1 — ССЫЛКА */}
      <div className="rounded-xl border border-on-surface/5 bg-white p-6 shadow-card sm:p-8">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex size-11 items-center justify-center rounded-full bg-lime-accent text-deep-forest">
            <Link2 className="size-5" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-primary">Ссылка на статью</h3>
            <p className="text-sm text-on-surface-variant">Вставь URL — прочитаем сами.</p>
          </div>
        </div>
        <input
          type="url"
          inputMode="url"
          className="w-full rounded-lg border border-muted-border bg-white px-5 py-4 text-base text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="https://naturonata.ru/blog/pitanie-rebenka"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            clearErr()
          }}
          aria-invalid={!!error}
        />
      </div>

      {/* Разделитель */}
      <div className="my-6 flex items-center gap-4 text-on-surface-variant/60">
        <div className="h-px flex-1 bg-muted-border/60" />
        <span className="text-sm font-bold uppercase tracking-widest">или</span>
        <div className="h-px flex-1 bg-muted-border/60" />
      </div>

      {/* Поле 2 — ТЕКСТ */}
      <div className="rounded-xl border border-on-surface/5 bg-white p-6 shadow-card sm:p-8">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex size-11 items-center justify-center rounded-full bg-light-sage text-primary">
            <FileText className="size-5" />
          </div>
          <h3 className="font-display text-xl font-bold text-primary">Вставить текст статьи</h3>
        </div>
        <Textarea
          className="h-60"
          placeholder="Или вставь сюда сам текст материала — про питание, сенсорику, режим, поведение… Система прочитает и разложит на смыслы."
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            clearErr()
          }}
          aria-invalid={!!error}
        />
        <div className="mt-3 flex flex-col items-center gap-1 text-center text-xs text-on-surface-variant/70 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:text-left">
          <span>{text.trim().length} симв.</span>
          <span>Кириллица на карточках всегда верная — текст кладём кодом.</span>
        </div>
      </div>

      {error && <p className="mt-4 text-sm font-medium text-destructive">{error}</p>}

      <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <Button size="lg" onClick={submit} disabled={busy}>
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
          {busy ? 'Запускаю…' : 'Выделить смыслы'}
        </Button>
        <span className="text-sm text-on-surface-variant">
          Сохраним твою терминологию и экспертный тон.
        </span>
      </div>
    </div>
  )
}
