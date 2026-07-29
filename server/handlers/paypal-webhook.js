// POST /api/paypal-webhook — PayPal шлёт сюда события подписки.
// Нет пользовательской сессии (звонит PayPal, не браузер) — пишем через service_role.
import { supabaseAdmin } from '../supabaseAdmin.js'
import { verifyWebhookSignature, getSubscription } from '../lib/paypal.js'

const ACTIVE_EVENTS = new Set(['BILLING.SUBSCRIPTION.ACTIVATED', 'BILLING.SUBSCRIPTION.RE-ACTIVATED'])
const CANCELED_EVENTS = new Set(['BILLING.SUBSCRIPTION.CANCELLED', 'BILLING.SUBSCRIPTION.EXPIRED'])
const PAST_DUE_EVENTS = new Set([
  'BILLING.SUBSCRIPTION.SUSPENDED',
  'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
  'PAYMENT.SALE.DENIED',
])

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const event = req.body
    const verified = await verifyWebhookSignature(req.headers, event)
    if (!verified) return res.status(400).json({ error: 'Подпись вебхука не подтверждена' })

    const type = event?.event_type
    const resource = event?.resource || {}
    // У ресурса "подписка" id — сама подписка; у ресурса "платёж" (sale) —
    // ссылка на подписку лежит в billing_agreement_id.
    const subscriptionId = resource.billing_agreement_id || resource.id
    if (!subscriptionId) return res.status(200).json({ ok: true, skipped: true })

    if (ACTIVE_EVENTS.has(type)) {
      await supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_current_period_end: resource.billing_info?.next_billing_time || null,
        })
        .eq('paypal_subscription_id', subscriptionId)
    } else if (type === 'PAYMENT.SALE.COMPLETED') {
      // Успешное списание за очередной период — подтягиваем свежий next_billing_time.
      const sub = await getSubscription(subscriptionId).catch(() => null)
      if (sub) {
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_current_period_end: sub.billing_info?.next_billing_time || null,
          })
          .eq('paypal_subscription_id', subscriptionId)
      }
    } else if (CANCELED_EVENTS.has(type)) {
      // period_end не трогаем — доступ держится до конца уже оплаченного периода.
      await supabaseAdmin
        .from('profiles')
        .update({ subscription_status: 'canceled' })
        .eq('paypal_subscription_id', subscriptionId)
    } else if (PAST_DUE_EVENTS.has(type)) {
      await supabaseAdmin
        .from('profiles')
        .update({ subscription_status: 'past_due' })
        .eq('paypal_subscription_id', subscriptionId)
    }

    res.status(200).json({ ok: true })
  } catch (e) {
    // 200, чтобы PayPal не долбил ретраями по нашему багу — ошибка видна в логах Vercel.
    console.error('paypal-webhook error:', e.message)
    res.status(200).json({ ok: false })
  }
}
