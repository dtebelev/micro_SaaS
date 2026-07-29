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
    const err = new Error(data?.error || `Ошибка сервера (${res.status})`)
    err.status = res.status
    throw err
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

/** Поправить только заголовок/хук карточки — старый фон, без нового вызова FLUX. */
export function regeneratePinText(pinId, { title, hook }) {
  return postJSON('/api/regenerate', { pin_id: pinId, mode: 'text', title, hook })
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

/** Мой доступ: план, остаток бесплатных генераций (null = безлимит), статус подписки. */
export async function getAccess() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('plan, credits_remaining, subscription_status, subscription_current_period_end')
    .eq('id', user.id)
    .single()
  if (error) throw error
  return data
}

/** Активировать купон (безлимит или N генераций) — атомарно, через функцию в БД. */
export async function redeemCoupon(code) {
  const { data, error } = await supabase.rpc('redeem_coupon', { p_code: code.trim() })
  if (error) throw error
  if (!data?.ok) throw new Error(data?.error || 'Не удалось активировать купон')
  return data
}

/** Подтвердить только что оформленную PayPal-подписку (после onApprove кнопки). */
export function confirmPaypalSubscription(subscriptionId) {
  return postJSON('/api/paypal-subscribe', { subscription_id: subscriptionId })
}

/** Мой email (для проверки видимости пункта меню «Купоны» — сама защита на сервере). */
export async function getMyEmail() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.email || null
}

/** [admin] Создать новый купон. Доступ проверяется на сервере по ADMIN_EMAIL. */
export function adminCreateCoupon({ code, kind, usesGranted, note }) {
  return postJSON('/api/admin-create-coupon', {
    code,
    kind,
    uses_granted: kind === 'uses' ? Number(usesGranted) : null,
    note: note || '',
  })
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
