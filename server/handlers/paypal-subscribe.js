// POST /api/paypal-subscribe — подтверждение только что оформленной подписки.
// Вызывается фронтом сразу после onApprove от PayPal Buttons. Тело: { subscription_id }.
import { requireUser } from '../lib/supa.js'
import { supabaseAdmin } from '../supabaseAdmin.js'
import { getSubscription } from '../lib/paypal.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  try {
    const { user } = await requireUser(req)
    const subscriptionId = String(req.body?.subscription_id || '').trim()
    if (!subscriptionId) return res.status(400).json({ error: 'Не передан subscription_id' })

    const sub = await getSubscription(subscriptionId)

    if (sub.plan_id !== process.env.PAYPAL_PLAN_ID) {
      const e = new Error('Подписка на другой тарифный план')
      e.status = 400
      throw e
    }
    if (!['ACTIVE', 'APPROVED'].includes(sub.status)) {
      const e = new Error(`Подписка ещё не активна (статус PayPal: ${sub.status})`)
      e.status = 409
      throw e
    }

    const periodEnd = sub.billing_info?.next_billing_time || null

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        plan: 'subscription',
        subscription_status: 'active',
        paypal_subscription_id: subscriptionId,
        subscription_current_period_end: periodEnd,
      })
      .eq('id', user.id)
    if (error) {
      // Уникальный индекс не даст привязать чужую/уже занятую подписку к двум профилям.
      if (error.code === '23505') {
        const e = new Error('Эта подписка уже привязана к другому аккаунту')
        e.status = 409
        throw e
      }
      throw error
    }

    res.status(200).json({ ok: true, status: sub.status, period_end: periodEnd })
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Ошибка сервера' })
  }
}
