// ============================================================
//  Чтение статьи по ссылке (Этап 2).
//  Если на входе URL — вытягиваем чистый текст статьи через
//  Jina Reader (r.jina.ai, без ключа). Фолбэк — прямой fetch
//  и грубая очистка HTML. Если это уже текст — возвращаем как есть.
// ============================================================

/** Похоже ли на одиночную ссылку (без внутренних пробелов). */
export function isUrl(s) {
  const t = String(s || '').trim()
  return /^https?:\/\/[^\s]+\.[^\s]+$/i.test(t)
}

async function withTimeout(promise, ms, label) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await promise(ctrl.signal)
  } finally {
    clearTimeout(timer)
  }
}

// Jina Reader: GET https://r.jina.ai/<url> → чистый текст статьи (keyless).
async function viaJina(url) {
  const res = await withTimeout(
    (signal) =>
      fetch(`https://r.jina.ai/${url}`, {
        signal,
        headers: {
          'X-Return-Format': 'text',
          'User-Agent': 'NaturoPin/1.0',
        },
      }),
    20000,
  )
  if (!res.ok) throw new Error(`Jina HTTP ${res.status}`)
  return (await res.text()).trim()
}

// Фолбэк: прямой fetch + грубая очистка тегов.
async function viaDirect(url) {
  const res = await withTimeout(
    (signal) =>
      fetch(url, { signal, headers: { 'User-Agent': 'Mozilla/5.0 NaturoPin/1.0' } }),
    20000,
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Вернуть текст статьи из входа. Если это URL — прочитать по ссылке.
 * @param {string} input текст статьи или ссылка
 * @returns {Promise<string>}
 */
export async function extractArticle(input) {
  const src = String(input || '').trim()
  if (!isUrl(src)) return src

  let text = ''
  try {
    text = await viaJina(src)
  } catch (e) {
    console.warn('[fetch] Jina не сработал, пробую прямой fetch:', e.message)
    try {
      text = await viaDirect(src)
    } catch (e2) {
      throw new Error('Не удалось прочитать статью по ссылке. Проверь ссылку или вставь текст вручную.')
    }
  }
  // обрезаем слишком длинные статьи, чтобы не раздувать промпт
  if (text.length > 12000) text = text.slice(0, 12000)
  return text
}
