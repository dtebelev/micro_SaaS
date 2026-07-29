// ============================================================
//  NaturoPin — ЛОКАЛЬНЫЙ Node API (Express) для разработки.
//  На Vercel те же обработчики работают как serverless-функции (api/*.js).
//  Секреты (service_role, AI-ключи) живут ТОЛЬКО на сервере.
// ============================================================
import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import generate from './handlers/generate.js'
import renderPin from './handlers/render-pin.js'
import regenerate from './handlers/regenerate.js'
import health from './handlers/health.js'
import paypalSubscribe from './handlers/paypal-subscribe.js'
import paypalWebhook from './handlers/paypal-webhook.js'
import adminCreateCoupon from './handlers/admin-create-coupon.js'

const PORT = Number(process.env.API_PORT || 8787)

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('✗ Не заданы SUPABASE_URL / SUPABASE_ANON_KEY в .env — сервер не сможет писать в БД.')
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', health)
app.post('/api/generate', generate)
app.post('/api/render-pin', renderPin)
app.post('/api/regenerate', regenerate)
app.post('/api/paypal-subscribe', paypalSubscribe)
app.post('/api/paypal-webhook', paypalWebhook)
app.post('/api/admin-create-coupon', adminCreateCoupon)

app.listen(PORT, () => {
  console.log(`NaturoPin API → http://localhost:${PORT}  (USE_REAL_AI=${process.env.USE_REAL_AI || '0'})`)
})
