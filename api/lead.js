// POST /api/lead — форма заявки на лендинге (landing/index.html).
// Публичный роут без авторизации: просто складывает контакт в таблицу leads
// через service_role (RLS не даёт anon-доступа напрямую к таблице).
import { supabaseAdmin } from '../server/supabaseAdmin.js'
import { notifyTelegram } from '../server/lib/telegram.js'

const MAX_LEN = 2000
const escapeHtml = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

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

    // Уведомление — best-effort, ждём здесь (не после ответа): serverless-функция
    // может «заморозиться» сразу после отправки ответа, необождённый fetch к Telegram
    // рискует просто не успеть уйти. Ошибка Telegram не должна ломать саму заявку.
    try {
      await notifyTelegram(
        `🌿 <b>Новая заявка с лендинга NaturoPin</b>\n` +
        `Имя: ${escapeHtml(name)}\n` +
        `Контакт: ${escapeHtml(contact)}` +
        (about ? `\nО статьях: ${escapeHtml(about)}` : '')
      )
    } catch (e) {
      console.error('notifyTelegram failed:', e.message)
    }

    res.status(200).json({ ok: true })
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Ошибка сервера' })
  }
}
