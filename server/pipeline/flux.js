// ============================================================
//  FLUX-2/flash (fal.ai): фон-иллюстрация БЕЗ текста (стиль NATURONATA).
//  Промпт-шаблон — из spec/FLUX-ПРОМПТ.md со слотами HERO_OBJECT / MOTIF.
//  Без ключа / USE_REAL_AI!=1 → детерминированный брендовый стаб-фон.
// ============================================================
import { svgToPng } from './render.js'

const CARD_W = 1024
const CARD_H = 1536

function useReal() {
  return (
    String(process.env.USE_REAL_AI || '').trim() === '1' &&
    !!(process.env.FLUX_API_KEY || '').trim()
  )
}

function buildPrompt(scene, note) {
  const s = scene || 'a cozy needle-felted wool scene with soft rounded shapes, calm and hopeful'
  const extra = note ? ` Adjust per note: ${note}.` : ''
  return `Needle-felted wool 3D diorama, handmade storybook craft style, as a Pinterest card background, vertical 2:3, high resolution, print quality.
NATURONATA brand: calm, sensory-friendly, warm, nurturing, tender and hopeful.
Everything looks handcrafted from soft felted wool and merino roving: fuzzy tactile matte texture, soft rounded forms, gentle soft studio light, soft natural shadows.
Muted sage, olive and forest-green palette on a warm pale cream background (#f6f8dc), with one gentle golden-lime accent.
Keep EVERY object within this muted sage/olive/forest-green + cream palette; AVOID strong red, bright or saturated colors.
Scene: ${s}.${extra}
Premium and artisanal, NOT plastic, NOT glossy, NOT AI-looking, NOT cluttered.
All figures are simple felted wool dolls with plain, featureless faces (no detailed facial features); NO photorealistic humans.
Any paper, note, list, label, sign, book, screen, calendar or framed picture in the scene must be COMPLETELY BLANK — no writing, no letters, no numbers, no realistic photos.
Place the diorama in the LOWER TWO THIRDS; keep the TOP THIRD calm, empty and soft cream for text overlay.
ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS, NO LOGOS, NO WATERMARKS, NO BRAND NAMES,
NO SIGNAGE, NO CAPTIONS anywhere in the image — a purely wordless felted illustration.`
}

async function falGenerate(prompt, imageSize) {
  const model = (process.env.FLUX_MODEL || 'fal-ai/flux-2/flash').trim()
  const res = await fetch(`https://fal.run/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${process.env.FLUX_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_size: imageSize,
      num_images: 1,
      output_format: 'png',
    }),
  })
  const text = await res.text()
  if (!res.ok) {
    const err = new Error(`fal HTTP ${res.status}: ${text.slice(0, 300)}`)
    err.status = res.status
    throw err
  }
  return JSON.parse(text)
}

// Детерминированный стаб-фон: мягкий кремово-шалфейный градиент + блоб
function stubBackground(seed = 0) {
  const cx = 30 + (seed * 23) % 45
  const cy = 20 + (seed * 17) % 40
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}">
    <defs>
      <radialGradient id="glow" cx="50%" cy="18%" r="75%">
        <stop offset="0%" stop-color="#f4f7d0"/>
        <stop offset="55%" stop-color="#fafcd5"/>
        <stop offset="100%" stop-color="#eef1ca"/>
      </radialGradient>
      <radialGradient id="blob" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#d6ea5a" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#e0e4c9" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${CARD_W}" height="${CARD_H}" fill="url(#glow)"/>
    <circle cx="${(cx / 100) * CARD_W}" cy="${(cy / 100) * CARD_H}" r="420" fill="url(#blob)"/>
    <circle cx="${CARD_W * 0.8}" cy="${CARD_H * 0.82}" r="320" fill="#c9d2b0" opacity="0.30"/>
    <circle cx="${CARD_W * 0.18}" cy="${CARD_H * 0.9}" r="180" fill="#98cd9b" opacity="0.22"/>
  </svg>`
  return svgToPng(svg, CARD_W)
}

/**
 * Сгенерировать фон карточки (PNG-буфер, 2:3).
 * @param {object} opts { heroObject, motif, note, seed }
 * @returns {Promise<{buffer: Buffer, prompt: string, real: boolean}>}
 */
export async function generateBackground({ scene, note, seed = 0 } = {}) {
  const prompt = buildPrompt(scene, note)
  if (!useReal()) {
    return { buffer: await stubBackground(seed), prompt, real: false }
  }
  try {
    let data
    try {
      data = await falGenerate(prompt, { width: CARD_W, height: CARD_H })
    } catch (e) {
      if (e.status === 400 || e.status === 422) {
        data = await falGenerate(prompt, 'portrait_4_3')
      } else {
        throw e
      }
    }
    const url = data?.images?.[0]?.url
    if (!url) throw new Error('fal: нет images[].url')
    const buffer = Buffer.from(await (await fetch(url)).arrayBuffer())
    return { buffer, prompt, real: true }
  } catch (e) {
    console.warn('[flux] fal не сработал, беру стаб-фон:', e.message)
    return { buffer: await stubBackground(seed), prompt, real: false }
  }
}
