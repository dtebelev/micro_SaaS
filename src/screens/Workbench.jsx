import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Download,
  RefreshCw,
  EyeOff,
  Loader2,
  Package,
  AlertTriangle,
  Pencil,
} from 'lucide-react'
import { getPins, hidePin, regeneratePin, regeneratePinText, signedUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'

function PinCard({ pin, onHide, onRegenerated }) {
  const [url, setUrl] = useState(null)
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [imgErr, setImgErr] = useState(false)
  const [textEdit, setTextEdit] = useState(false)
  const [titleDraft, setTitleDraft] = useState(pin.title || '')
  const [hookDraft, setHookDraft] = useState(pin.hook || '')
  const [savingText, setSavingText] = useState(false)

  const loadUrl = useCallback(async () => {
    setImgErr(false)
    try {
      setUrl(await signedUrl(pin.image_path))
    } catch {
      setImgErr(true)
    }
  }, [pin.image_path])

  useEffect(() => {
    loadUrl()
  }, [loadUrl])

  async function regen() {
    setBusy(true)
    try {
      await regeneratePin(pin.id, note)
      setOpen(false)
      setNote('')
      await onRegenerated()
      await loadUrl() // тот же путь файла — форсим новую подписанную ссылку, чтобы сбить кэш картинки
    } catch (e) {
      alert(e.message || 'Не удалось перегенерировать')
    } finally {
      setBusy(false)
    }
  }

  function startTextEdit() {
    setTitleDraft(pin.title || '')
    setHookDraft(pin.hook || '')
    setOpen(false)
    setTextEdit(true)
  }

  async function saveText() {
    setSavingText(true)
    try {
      await regeneratePinText(pin.id, { title: titleDraft, hook: hookDraft })
      setTextEdit(false)
      await onRegenerated()
      await loadUrl()
    } catch (e) {
      alert(e.message || 'Не удалось сохранить текст')
    } finally {
      setSavingText(false)
    }
  }

  return (
    <div className="group overflow-hidden rounded-xl border border-muted-border/30 bg-white shadow-card">
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-light-sage/40">
        {url && !imgErr ? (
          // eslint-disable-next-line
          <img
            src={url}
            alt={pin.title || 'Карточка'}
            className="h-full w-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-outline-variant">
            {imgErr ? 'нет превью' : <Loader2 className="size-6 animate-spin" />}
          </div>
        )}
        {/* Панель действий — при наведении/на мобиле всегда */}
        <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/50 to-transparent p-3 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 bg-white/90"
            onClick={() => {
              setTextEdit(false)
              setOpen((v) => !v)
            }}
          >
            <RefreshCw className="size-4" />
            Перегенерировать
          </Button>
          <Button
            size="icon-sm"
            variant="secondary"
            className="bg-white/90"
            title="Править текст"
            onClick={startTextEdit}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="secondary"
            className="bg-white/90"
            title="Скрыть"
            onClick={() => onHide(pin.id)}
          >
            <EyeOff className="size-4" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 font-display text-base font-bold text-primary">
          {pin.title || 'Без названия'}
        </h3>
        {pin.description && (
          <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">
            {pin.description}
          </p>
        )}

        {textEdit && (
          <div className="mt-3 space-y-2 rounded-lg bg-surface-container-low p-3">
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              placeholder="Заголовок"
              className="w-full rounded-lg border border-muted-border bg-white px-3 py-2 text-sm font-bold outline-none focus:border-transparent focus:ring-2 focus:ring-deep-forest"
            />
            <textarea
              value={hookDraft}
              onChange={(e) => setHookDraft(e.target.value)}
              placeholder="Хук (короткий рассказ)"
              rows={3}
              className="w-full resize-none rounded-lg border border-muted-border bg-white px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-deep-forest"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveText} disabled={savingText} className="flex-1">
                {savingText ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
                {savingText ? 'Сохраняю…' : 'Сохранить текст'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setTextEdit(false)}>
                Отмена
              </Button>
            </div>
          </div>
        )}

        {open && (
          <div className="mt-3 space-y-2 rounded-lg bg-surface-container-low p-3">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Короткая правка (необязательно): напр. «сделай спокойнее»"
              className="w-full rounded-lg border border-muted-border bg-white px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-deep-forest"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={regen} disabled={busy} className="flex-1">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                {busy ? 'Рисую…' : 'Обновить карточку'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function WorkbenchScreen() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [pins, setPins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const data = await getPins(projectId)
    setPins(data)
  }, [projectId])

  useEffect(() => {
    ;(async () => {
      try {
        await refresh()
      } catch (e) {
        setError(e.message || 'Не удалось загрузить карточки.')
      } finally {
        setLoading(false)
      }
    })()
  }, [refresh])

  async function onHide(id) {
    setPins((prev) => prev.filter((p) => p.id !== id)) // оптимистично
    try {
      await hidePin(id)
    } catch {
      await refresh() // откат к серверному состоянию
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-24 text-on-surface-variant">
        <Loader2 className="size-5 animate-spin" /> Загружаю Верстак…
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center">
        <AlertTriangle className="mb-4 size-10 text-destructive" />
        <p className="text-on-surface-variant">{error}</p>
        <Button className="mt-6" onClick={() => navigate('/')}>Новый пак</Button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-primary">Верстак</h1>
          <p className="mt-2 max-w-xl text-on-surface-variant">
            Готово {pins.length}{' '}
            {declOfNum(pins.length, ['карточка', 'карточки', 'карточек'])}. Наведи на карточку,
            чтобы перегенерировать или скрыть.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => navigate(`/finish/${projectId}`)}
          disabled={pins.length === 0}
        >
          <Package className="size-5" />
          Подготовить архив
        </Button>
      </div>

      {pins.length === 0 ? (
        <div className="rounded-xl border border-dashed border-muted-border bg-white/50 p-12 text-center text-on-surface-variant">
          Все карточки скрыты. Создай{' '}
          <button onClick={() => navigate('/')} className="font-bold text-primary underline">
            новый пак
          </button>
          .
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pins.map((pin) => (
            <PinCard
              key={pin.id}
              pin={pin}
              onHide={onHide}
              onRegenerated={refresh}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function declOfNum(n, forms) {
  const n100 = n % 100
  const n10 = n % 10
  if (n100 > 10 && n100 < 20) return forms[2]
  if (n10 > 1 && n10 < 5) return forms[1]
  if (n10 === 1) return forms[0]
  return forms[2]
}
