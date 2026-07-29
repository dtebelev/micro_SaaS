// ============================================================
//  Запись в Supabase: Storage + БД.
//  Клиент `db` передаётся из index.js. По умолчанию сервер пишет
//  ОТ ИМЕНИ пользователя (его JWT + RLS) — service_role не нужен.
//  Путь файла: {user_id}/{project_id}/{pin_id}.png (+ _bg.png)
// ============================================================
import { randomUUID } from 'node:crypto'

const BUCKET = 'pins'

export async function createProject(db, userId, sourceText, title) {
  const { data, error } = await db
    .from('projects')
    .insert({ user_id: userId, source_text: sourceText, title, status: 'processing' })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function setProjectStatus(db, projectId, status, errorMessage = null) {
  const { error } = await db
    .from('projects')
    .update({ status, error_message: errorMessage })
    .eq('id', projectId)
  if (error) throw error
}

export async function updateProjectTitle(db, projectId, title) {
  await db.from('projects').update({ title }).eq('id', projectId)
}

export async function uploadPng(db, path, buffer) {
  const { error } = await db.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: 'image/png', upsert: true })
  if (error) throw error
  return path
}

/** Скачать существующий фон (для правки текста без нового вызова FLUX). */
export async function downloadBg(db, path) {
  const { data, error } = await db.storage.from(BUCKET).download(path)
  if (error) throw error
  return Buffer.from(await data.arrayBuffer())
}

export async function updatePinText(db, pinId, { title, hook }) {
  const { error } = await db.from('pins').update({ title, hook }).eq('id', pinId)
  if (error) throw error
}

/** Залить фон и финальную карточку, вернуть пути. */
export async function uploadCardImages(db, { userId, projectId, pinId, bgPng, finalPng }) {
  const base = `${userId}/${projectId}/${pinId}`
  await uploadPng(db, `${base}_bg.png`, bgPng)
  await uploadPng(db, `${base}.png`, finalPng)
  return { imagePath: `${base}.png`, bgPath: `${base}_bg.png` }
}

/** Генерим pinId заранее, чтобы знать путь файла до вставки. */
export function newPinId() {
  return randomUUID()
}

export async function insertPin(db, row) {
  const { error } = await db.from('pins').insert(row)
  if (error) throw error
  return row.id
}

/** Пин + владелец проекта (RLS уже ограничит своим). */
export async function getPinForUser(db, pinId, userId) {
  const { data, error } = await db
    .from('pins')
    .select('*, projects!inner(user_id)')
    .eq('id', pinId)
    .single()
  if (error) throw error
  if (data.projects.user_id !== userId) {
    const e = new Error('Нет доступа к этой карточке')
    e.status = 403
    throw e
  }
  return data
}

/** Доступ пользователя: план, остаток бесплатных генераций (null = безлимит), статус подписки. */
export async function getAccess(db, userId) {
  const { data, error } = await db
    .from('profiles')
    .select('plan, credits_remaining, subscription_status, subscription_current_period_end')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

/** Подписка даёт доступ, пока не прошла дата конца ОПЛАЧЕННОГО периода —
 *  даже если она уже отменена (canceled), доступ держится до этой даты. */
export function subscriptionCoversNow(access) {
  return !!access.subscription_current_period_end && new Date(access.subscription_current_period_end) > new Date()
}

export function hasAccess(access) {
  if (subscriptionCoversNow(access)) return true
  if (access.credits_remaining === null) return true
  return (access.credits_remaining ?? 0) > 0
}

/** Списать одну бесплатную генерацию (вызывать только если !hasAccess-безлимит). */
export async function consumeCredit(db, userId, creditsRemaining) {
  const { error } = await db
    .from('profiles')
    .update({ credits_remaining: creditsRemaining - 1 })
    .eq('id', userId)
  if (error) throw error
}

export async function updatePinImage(db, pinId, imagePath) {
  const { error } = await db
    .from('pins')
    .update({ image_path: imagePath, status: 'ok' })
    .eq('id', pinId)
  if (error) throw error
}
