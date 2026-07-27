// ============================================================
//  Общие клиенты Supabase и авторизация. Используются и локальным
//  Express (server/index.js), и Vercel-функциями (api/*.js).
// ============================================================
import { createClient } from '@supabase/supabase-js'

const URL = process.env.SUPABASE_URL
const ANON = process.env.SUPABASE_ANON_KEY
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

export const authClient = createClient(URL, ANON)

/**
 * Клиент БД для запросов пользователя.
 * По умолчанию — от ИМЕНИ пользователя (его JWT + RLS): service_role не нужен.
 */
export function dbForUser(token) {
  if (SERVICE_ROLE) {
    return createClient(URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
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
