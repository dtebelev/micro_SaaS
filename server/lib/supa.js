// ============================================================
//  Общие клиенты Supabase и авторизация. Используются и локальным
//  Express (server/index.js), и Vercel-функциями (api/*.js).
// ============================================================
import { createClient } from '@supabase/supabase-js'

const URL = process.env.SUPABASE_URL
const ANON = process.env.SUPABASE_ANON_KEY

export const authClient = createClient(URL, ANON)

/**
 * Клиент БД для запросов пользователя — ВСЕГДА от его ИМЕНИ (anon-key + его JWT),
 * чтобы реально работал RLS. service_role здесь намеренно не используется:
 * иначе RLS-политики (которые ограничивают доступ к чужим projects/pins) просто
 * обходятся, и единственной защитой остаются ручные проверки в коде хендлеров.
 * Для операций, которым по design нужен обход RLS (запись защищённых колонок
 * profiles, вебхук без пользовательской сессии, admin) — использовать
 * `supabaseAdmin` из `server/supabaseAdmin.js` явно и точечно.
 */
export function dbForUser(token) {
  return createClient(URL, ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

/** Достать пользователя из Bearer-токена. Бросает {status:401} если нет. */
export async function requireUser(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) {
    const e = new Error('Нужен вход')
    e.status = 401
    throw e
  }
  const { data, error } = await authClient.auth.getUser(token)
  if (error || !data?.user) {
    const e = new Error('Сессия недействительна')
    e.status = 401
    throw e
  }
  return { user: data.user, token }
}
