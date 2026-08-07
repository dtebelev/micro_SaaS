// GET /api/admin-leads — список заявок с лендинга, только для владельца (ADMIN_EMAIL).
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

    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('id, name, contact, about, created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw error

    res.status(200).json({ leads: data })
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || 'Ошибка сервера' })
  }
}
