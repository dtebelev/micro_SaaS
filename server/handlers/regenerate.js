// POST /api/regenerate — перерисовать один пин.
// Тело: { pin_id, note } — полная перегенерация (новый FLUX-фон).
// Тело: { pin_id, mode:'text', title, hook } — только текст, старый фон, без FLUX (дёшево и быстро).
import { requireUser, dbForUser } from '../lib/supa.js'
import { renderPinById, renderPinTextById } from '../pipeline/run.js'

export const config = { maxDuration: 60 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  try {
    const { user, token } = await requireUser(req)
    const db = dbForUser(token)
    const pinId = String(req.body?.pin_id || '')
    if (!pinId) return res.status(400).json({ error: 'Не указан pin_id' })

    if (req.body?.mode === 'text') {
      const title = req.body?.title != null ? String(req.body.title).trim() : undefined
      const hook = req.body?.hook != null ? String(req.body.hook).trim() : undefined
      const { imagePath } = await renderPinTextById(db, user.id, pinId, { title, hook })
      return res.status(200).json({ ok: true, image_path: imagePath })
    }

    const note = String(req.body?.note || '').trim()
    const { imagePath } = await renderPinById(db, user.id, pinId, { note })
    res.status(200).json({ ok: true, image_path: imagePath })
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Ошибка сервера' })
  }
}
