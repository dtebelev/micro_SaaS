// ============================================================
//  PayPal Subscriptions REST API — только сервер.
//  PAYPAL_CLIENT_SECRET и токены сюда, во фронт не идут.
// ============================================================

const BASE =
  process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !secret) {
    throw new Error('PayPal не настроен: нет PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET на сервере')
  }
  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64')
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error(`PayPal OAuth ошибка (${res.status})`)
  const data = await res.json()
  return data.access_token
}

/** Данные подписки из PayPal (статус, план, дата следующего списания). */
export async function getSubscription(subscriptionId) {
  const token = await getAccessToken()
  const res = await fetch(`${BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`PayPal: подписка не найдена (${res.status})`)
  return res.json()
}

/** Проверка подлинности вебхука — обязательна перед тем, как доверять событию. */
export async function verifyWebhookSignature(headers, event) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) throw new Error('PayPal не настроен: нет PAYPAL_WEBHOOK_ID на сервере')
  const token = await getAccessToken()
  const res = await fetch(`${BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transmission_id: headers['paypal-transmission-id'],
      transmission_time: headers['paypal-transmission-time'],
      cert_url: headers['paypal-cert-url'],
      auth_algo: headers['paypal-auth-algo'],
      transmission_sig: headers['paypal-transmission-sig'],
      webhook_id: webhookId,
      webhook_event: event,
    }),
  })
  if (!res.ok) throw new Error(`PayPal: не удалось проверить подпись вебхука (${res.status})`)
  const data = await res.json()
  return data.verification_status === 'SUCCESS'
}
