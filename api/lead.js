// POST /api/lead — форма заявки на лендинге (landing/index.html).
// Публичный роут без авторизации: просто складывает контакт в таблицу leads
// через service_role (RLS не даёт anon-доступа напрямую к таблице).
import { supabaseAdmin } from '../server/supabaseAdmin.js'

const MAX_LEN = 2000

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  try {
    const body = req.body || {}

    // Honeypot: скрытое поле, которое видят только боты (человек его не заполнит).
    if (String(body.company || '').trim()) {
      return res.status(200).json({ ok: true }) // тихо проглатываем, не подсказываем боту
    }

    const name = String(body.name || '').trim().slice(0, MAX_LEN)
    const contact = String(body.contact || '').trim().slice(0, MAX_LEN)
    const about = String(body.about || '').trim().slice(0, MAX_LEN)

    if (!name) return res.status(400).json({ error: 'Укажи имя' })
    if (!contact) return res.status(400).json({ error: 'Укажи почту или Telegram' })

    const { error } = await supabaseAdmin
      .from('leads')
      .insert({ name, contact, about: about || null, source: 'landing' })
    if (error) throw error

    res.status(200).json({ ok: true })
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Ошибка сервера' })
  }
}
