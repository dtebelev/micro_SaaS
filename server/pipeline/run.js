// ============================================================
//  Ядро трубы, пригодное и для Vercel (serverless), и для локали.
//  planProject — быстро: (ссылка→текст) → LLM → создать проект+пины
//  (без картинок). renderPinById — нарисовать ОДИН пин (короткий вызов).
//  Так укладываемся в лимиты времени serverless-функций.
// ============================================================
import { analyzeArticle, deriveProjectTitle } from './llm.js'
import { extractArticle, isUrl } from './fetchArticle.js'
import { generateBackground } from './flux.js'
import { renderCard } from './render.js'
import {
  createProject,
  setProjectStatus,
  updateProjectTitle,
  uploadCardImages,
  insertPin,
  newPinId,
  getPinForUser,
  updatePinImage,
} from './storage.js'

const CARDS_COUNT = Number(process.env.CARDS_COUNT || 6)

/** Спланировать пак: создать проект и строки пинов (status 'processing', без картинок). */
export async function planProject(db, userId, sourceText) {
  const projectId = await createProject(db, userId, sourceText, null)
  try {
    let text = sourceText
    if (isUrl(sourceText)) {
      text = await extractArticle(sourceText)
      if (!text || text.trim().length < 200) {
        throw new Error('Не удалось прочитать статью по ссылке. Проверь ссылку или вставь текст вручную.')
      }
    }
    const cards = await analyzeArticle(text, CARDS_COUNT)
    const title = deriveProjectTitle(text, cards)
    await updateProjectTitle(db, projectId, title)

    const pins = []
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i]
      const id = newPinId()
      await insertPin(db, {
        id,
        project_id: projectId,
        title: c.title,
        hook: c.hook,
        scene: c.scene,
        description: c.description,
        hashtags: c.hashtags,
        position: i,
        status: 'processing',
      })
      pins.push({ id, position: i })
    }
    return { projectId, pins }
  } catch (e) {
    await setProjectStatus(db, projectId, 'error', e.message?.slice(0, 300) || 'Ошибка обработки')
    throw e
  }
}

/** Нарисовать один пин: FLUX-фон → Satori → Storage → БД. */
export async function renderPinById(db, userId, pinId, { note } = {}) {
  const pin = await getPinForUser(db, pinId, userId)
  const bg = await generateBackground({ scene: pin.scene, note, seed: pin.position || 0 })
  const finalPng = await renderCard({ title: pin.title, hook: pin.hook }, bg.buffer)
  const { imagePath } = await uploadCardImages(db, {
    userId,
    projectId: pin.project_id,
    pinId,
    bgPng: bg.buffer,
    finalPng,
  })
  await updatePinImage(db, pinId, imagePath)
  return { imagePath }
}
