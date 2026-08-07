// GET /api/admin-coupons — список купонов (кто активировал, отозван ли).
// Только для владельца (ADMIN_EMAIL). Таблица coupons закрыта RLS от клиента,
// читаем через service_role.
import { requireUser } from '../server/lib/supa.js'
import { supabaseAdmin } from '../server/supabaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' })
  try {
    const { user } = await requireUser(req)

    const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()
    const userEmail = String(user.email || '').trim().toLowerCase()
    if (!adminEmail || userEmail !== adminEmail) {
      const e = new Error('Доступ только у владельца')
      e.status = 403
      throw e
    }

    const { data: coupons, error } = await supabaseAdmin
      .from('coupons')
      .select('code, kind, uses_granted, note, redeemed_by, redeemed_at, revoked_at')
      .order('code')
    if (error) throw error

    // Email того, кто активировал — только для реально занятых купонов,
    // чтобы не дёргать auth.admin лишний раз на пустые слоты.
    const withEmail = await Promise.all(
      coupons.map(async (c) => {
        if (!c.redeemed_by) return { ...c, redeemed_by_email: null }
        const { data } = await supabaseAdmin.auth.admin.getUserById(c.redeemed_by)
        return { ...c, redeemed_by_email: data?.user?.email || null }
      })
    )

    res.status(200).json({ coupons: withEmail })
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Ошибка сервера' })
  }
}
