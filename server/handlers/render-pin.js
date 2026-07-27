// POST /api/render-pin — нарисовать один пин. Тело: { pin_id }.
import { requireUser, dbForUser } from '../lib/supa.js'
import { renderPinById } from '../pipeline/run.js'

export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  try {
    const { user, token } = await requireUser(req)
    const db = dbForUser(token)
    const pinId = String(req.body?.pin_id || '')
    if (!pinId) return res.status(400).json({ error: 'Не указан pin_id' })
    const { imagePath } = await renderPinById(db, user.id, pinId)
    res.status(200).json({ ok: true, image_path: imagePath })
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Ошибка сервера' })
  }
}
