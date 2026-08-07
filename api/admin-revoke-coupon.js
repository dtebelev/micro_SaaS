// POST /api/admin-revoke-coupon — отозвать доступ у конкретного человека
// по коду купона, не трогая остальных. Только для владельца (ADMIN_EMAIL).
import { requireUser } from '../server/lib/supa.js'
import { supabaseAdmin } from '../server/supabaseAdmin.js'

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
    if (!code) return res.status(400).json({ error: 'Нужен код купона' })

    const { data: coupon, error: findError } = await supabaseAdmin
      .from('coupons')
      .select('code, redeemed_by, revoked_at')
      .eq('code', code)
      .single()
    if (findError || !coupon) return res.status(404).json({ error: 'Купон не найден' })
    if (!coupon.redeemed_by) return res.status(400).json({ error: 'Купон ещё никто не активировал' })
    if (coupon.revoked_at) return res.status(400).json({ error: 'Уже отозван' })

    // Отзываем: доступ пользователю закрываем сразу (кредиты в 0, план — trial),
    // купон помечаем отозванным для истории. redeemed_by не трогаем — это факт,
    // кто им пользовался, а не текущий статус доступа.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ plan: 'trial', credits_remaining: 0 })
      .eq('id', coupon.redeemed_by)
    if (profileError) throw profileError

    const { error: couponError } = await supabaseAdmin
      .from('coupons')
      .update({ revoked_at: new Date().toISOString() })
      .eq('code', code)
    if (couponError) throw couponError

    res.status(200).json({ ok: true })
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Ошибка сервера' })
  }
}
