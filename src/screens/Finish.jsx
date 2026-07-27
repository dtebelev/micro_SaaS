import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Download, Loader2, CheckCircle2, FilePlus2, PartyPopper } from 'lucide-react'
import JSZip from 'jszip'
import { getPins, getProject, signedUrl } from '@/lib/api'
import { Button } from '@/components/ui/button'

function slugify(str, fallback) {
  const s = (str || '')
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return s || fallback
}

function buildMetadata(pins) {
  const blocks = pins.map((p, i) => {
    const n = String(i + 1).padStart(2, '0')
    const tags = (p.hashtags || []).join(' ')
    return [
      `## Пин ${n} — ${p.title || ''}`,
      `Файл: pins/${n}-${slugify(p.title, 'pin')}.png`,
      '',
      'Заголовок:',
      p.title || '',
      '',
      'Подзаголовок:',
      p.hook || '—',
      '',
      'Описание:',
      p.description || '',
      '',
      'Хэштеги:',
      tags,
    ].join('\n')
  })
  return (
    `NaturoPin 1.0 — пак карточек для Pinterest\n` +
    `Всего пинов: ${pins.length}\n` +
    `${'='.repeat(48)}\n\n` +
    blocks.join(`\n\n${'-'.repeat(48)}\n\n`) +
    '\n'
  )
}

export default function FinishScreen() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [pins, setPins] = useState([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState('idle') // idle | zipping | done
  const [err, setErr] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const [p] = await Promise.all([getPins(projectId)])
        setPins(p)
      } catch (e) {
        setErr(e.message || 'Не удалось загрузить карточки.')
      } finally {
        setLoading(false)
      }
    })()
  }, [projectId])

  async function downloadZip() {
    setPhase('zipping')
    setErr('')
    try {
      const zip = new JSZip()
      const folder = zip.folder('pins')

      for (let i = 0; i < pins.length; i++) {
        const p = pins[i]
        const n = String(i + 1).padStart(2, '0')
        const url = await signedUrl(p.image_path)
        if (!url) continue
        const blob = await (await fetch(url)).blob()
        folder.file(`${n}-${slugify(p.title, 'pin')}.png`, blob)
      }

      zip.file('pinterest_metadata.txt', buildMetadata(pins))

      let project = null
      try {
        project = await getProject(projectId)
      } catch {
        /* необязательно */
      }
      const name = `naturopin-${slugify(project?.title, projectId.slice(0, 8))}.zip`

      const out = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(out)
      link.download = name
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(link.href), 4000)
      setPhase('done')
    } catch (e) {
      setErr(e.message || 'Не получилось собрать архив.')
      setPhase('idle')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-24 text-on-surface-variant">
        <Loader2 className="size-5 animate-spin" /> Готовлю финиш…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl py-10 text-center">
      <div className="mb-6 inline-flex size-16 items-center justify-center rounded-full bg-lime-accent text-deep-forest shadow-cta">
        {phase === 'done' ? <PartyPopper className="size-8" /> : <CheckCircle2 className="size-8" />}
      </div>

      <h1 className="font-display text-4xl font-bold text-primary">
        {phase === 'done' ? 'Архив скачан. Удачи с публикацией!' : 'Готово к загрузке'}
      </h1>
      <p className="mt-4 text-lg text-on-surface-variant">
        В архиве {pins.length}{' '}
        {declOfNum(pins.length, ['карточка', 'карточки', 'карточек'])} в PNG и файл{' '}
        <span className="font-mono text-sm">pinterest_metadata.txt</span> с заголовками,
        описаниями и хэштегами для Pinterest.
      </p>

      {err && <p className="mt-4 text-sm font-medium text-destructive">{err}</p>}

      <div className="mt-8 flex flex-col items-center gap-4">
        <Button size="lg" onClick={downloadZip} disabled={phase === 'zipping' || pins.length === 0}>
          {phase === 'zipping' ? (
            <>
              <Loader2 className="size-5 animate-spin" /> Собираем файлы…
            </>
          ) : (
            <>
              <Download className="size-5" /> Скачать .zip
            </>
          )}
        </Button>

        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-sm font-bold text-primary underline-offset-4 hover:underline"
        >
          <FilePlus2 className="size-4" />
          Создать новый пак из другой статьи
        </button>
      </div>

      <p className="mt-10 text-sm text-on-surface-variant/70">
        Твоя экспертиза упакована. Бережно к твоему времени.
      </p>
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
