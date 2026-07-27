// ============================================================
//  Слой доступа: вызовы Node API (/api/*) и запросы к Supabase.
//  К API всегда прикладываем Supabase access-token — сервер
//  по нему определяет пользователя и пишет через service_role.
// ============================================================
import { supabase } from './supabaseClient'

async function authHeader() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function postJSON(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { error: text }
  }
  if (!res.ok) {
    throw new Error(data?.error || `Ошибка сервера (${res.status})`)
  }
  return data
}

/** Спланировать пак из текста/ссылки. Возвращает { project_id, pins:[{id,position}] }. */
export function generatePack(sourceText) {
  return postJSON('/api/generate', { source_text: sourceText })
}

/** Нарисовать один пин (короткий вызов — serverless-friendly). */
export function renderPin(pinId) {
  return postJSON('/api/render-pin', { pin_id: pinId })
}

/** Перегенерировать один пин (с необязательной короткой правкой). */
export function regeneratePin(pinId, note) {
  return postJSON('/api/regenerate', { pin_id: pinId, note: note || '' })
}

/** Проект по id (RLS отдаст только свой). */
export async function getProject(projectId) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()
  if (error) throw error
  return data
}

/** Видимые пины проекта, по порядку. */
export async function getPins(projectId, { includeHidden = false } = {}) {
  let q = supabase
    .from('pins')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true })
  if (!includeHidden) q = q.neq('status', 'скрыт')
  const { data, error } = await q
  if (error) throw error
  return data
}

/** Скрыть пин (status = 'скрыт'). */
export async function hidePin(pinId) {
  const { error } = await supabase
    .from('pins')
    .update({ status: 'скрыт' })
    .eq('id', pinId)
  if (error) throw error
}

/** Подписанная ссылка на PNG в приватном бакете (RLS: только своё). */
export async function signedUrl(path, expiresIn = 3600) {
  if (!path) return null
  const { data, error } = await supabase.storage
    .from('pins')
    .createSignedUrl(path, expiresIn)
  if (error) throw error
  return data.signedUrl
}
