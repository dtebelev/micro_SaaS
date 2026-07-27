// POST /api/generate — планирование пака (быстро). Тело: { source_text }.
import { requireUser, dbForUser } from '../lib/supa.js'
import { planProject } from '../pipeline/run.js'
import { isUrl } from '../pipeline/fetchArticle.js'

export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  try {
    const { user, token } = await requireUser(req)
    const db = dbForUser(token)
    const src = String(req.body?.source_text || '').trim()
    if (!src) return res.status(400).json({ error: 'Добавь ссылку на статью или её текст.' })
    if (!isUrl(src) && src.length < 40) {
      return res.status(400).json({ error: 'Слишком короткий текст статьи. Вставь больше текста или дай ссылку.' })
    }
    const { projectId, pins } = await planProject(db, user.id, src)
    res.status(200).json({ project_id: projectId, pins })
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Ошибка сервера' })
  }
}
