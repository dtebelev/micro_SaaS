import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Sparkles, AlertTriangle, RefreshCw } from 'lucide-react'
import { getProject, getPins, renderPin } from '@/lib/api'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

const flavor = [
  'Ищем смыслы в статье…',
  'Формируем заголовки…',
  'Рисуем войлочные сцены…',
  'Накладываем текст, проверяем читаемость…',
  'Собираем карточки…',
]

export default function AnalysisScreen() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [flavorIdx, setFlavorIdx] = useState(0)
  const [done, setDone] = useState(0)
  const [total, setTotal] = useState(0)
  const [failed, setFailed] = useState('')
  const started = useRef(false)

  // Живой текст статуса
  useEffect(() => {
    const t = setInterval(() => setFlavorIdx((i) => (i + 1) % flavor.length), 2200)
    return () => clearInterval(t)
  }, [])

  // Оркестрация: планируем → рисуем каждый пин → на Верстак.
  // Запускаем РОВНО один раз (ref-гард переживает двойной маунт StrictMode);
  // работу НЕ отменяем на unmount — пусть пак дособерётся.
  useEffect(() => {
    if (started.current) return
    started.current = true

    ;(async () => {
      try {
        const project = await getProject(projectId)
        if (project.status === 'error') {
          setFailed(project.error_message || 'Что-то пошло не так при сборке смыслов.')
          return
        }

        const pins = await getPins(projectId, { includeHidden: true })
        setTotal(pins.length)
        const pending = pins.filter((p) => !p.image_path)
        const base = pins.length - pending.length
        setDone(base)

        for (let i = 0; i < pending.length; i++) {
          await renderPin(pending[i].id)
          setDone(base + i + 1)
        }

        await supabase.from('projects').update({ status: 'ready' }).eq('id', projectId)
        navigate(`/workbench/${projectId}`, { replace: true })
      } catch (e) {
        setFailed(e.message || 'Что-то пошло не так при сборке карточек.')
      }
    })()
  }, [projectId, navigate])

  if (failed) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center">
        <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-8" />
        </div>
        <h2 className="font-display text-2xl font-bold text-primary">Не получилось собрать пак</h2>
        <p className="mt-3 text-on-surface-variant">{failed}</p>
        <Button className="mt-6" onClick={() => navigate('/')}>
          <RefreshCw className="size-4" />
          Попробовать ещё раз
        </Button>
      </div>
    )
  }

  const pct = total ? Math.round((done / total) * 100) : 8

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center sm:py-24">
      <div className="relative mb-8">
        <div className="absolute inset-0 animate-ping rounded-full bg-lime-accent/30" />
        <div className="relative flex size-20 items-center justify-center rounded-full bg-lime-accent text-deep-forest shadow-cta">
          <Sparkles className="size-9" />
        </div>
      </div>

      <h2 className="font-display text-3xl font-bold text-primary">Методист собирает пак</h2>
      <p className="mt-3 text-on-surface-variant">
        Формируем смысловое ядро, рисуем войлочные сцены и аккуратно кладём текст.
      </p>

      {/* Прогресс */}
      <div className="mt-8 h-2.5 w-full overflow-hidden rounded-full bg-light-sage">
        <div
          className="h-full rounded-full bg-lime-accent transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-4 text-sm font-bold text-secondary">
        {total ? `Готовим карточку ${Math.min(done + 1, total)} из ${total}` : 'Читаем материал…'}
      </p>
      <p className="mt-1 min-h-5 text-sm text-on-surface-variant/70">{flavor[flavorIdx]}</p>
    </div>
  )
}
