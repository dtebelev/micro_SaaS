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

async function uploadPng(db, path, buffer) {
  const { error } = await db.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: 'image/png', upsert: true })
  if (error) throw error
  return path
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

export async function updatePinImage(db, pinId, imagePath) {
  const { error } = await db
    .from('pins')
    .update({ image_path: imagePath, status: 'ok' })
    .eq('id', pinId)
  if (error) throw error
}
