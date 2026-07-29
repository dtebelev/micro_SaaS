// POST /api/admin-create-coupon — только для владельца (ADMIN_EMAIL).
// Тело: { code, kind: 'unlimited'|'uses', uses_granted, note }.
import { requireUser } from '../lib/supa.js'
import { supabaseAdmin } from '../supabaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  try {
    const { user } = await requireUser(req)

    const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()
    const userEmail = String(user.email || '').trim().toLowerCase()
    if (!adminEmail || userEmail !== adminEmail) {
      const e = new Error('Доступ только у владельца')
      e.status = 403
      throw e
    }

    const code = String(req.body?.code || '').trim().toUpperCase()
    const kind = req.body?.kind === 'unlimited' ? 'unlimited' : 'uses'
    const usesGranted = kind === 'uses' ? Number(req.body?.uses_granted) : null
    const note = String(req.body?.note || '').trim()

    if (!code) return res.status(400).json({ error: 'Нужен код купона' })
    if (kind === 'uses' && (!Number.isInteger(usesGranted) || usesGranted <= 0)) {
      return res.status(400).json({ error: 'Число использований должно быть положительным целым' })
    }

    const { error } = await supabaseAdmin
      .from('coupons')
      .insert({ code, kind, uses_granted: usesGranted, note })
    if (error) {
      if (error.code === '23505') {
        const e = new Error('Купон с таким кодом уже существует')
        e.status = 409
        throw e
      }
      throw error
    }

    res.status(200).json({ ok: true, code, kind, uses_granted: usesGranted })
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Ошибка сервера' })
  }
}
