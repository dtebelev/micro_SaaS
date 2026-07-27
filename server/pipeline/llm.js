// ============================================================
//  Методист (LLM через OpenRouter): блог-пост → пак story-пинов.
//  Формат карточки: ЗАГОЛОВОК (SEO) + короткий РАССКАЗ-хук + войлочная
//  сцена (для FLUX) + описание/хэштеги для Pinterest.
//  Заголовки — по правилам присланного SEO-промпта (эксперт-нутрициолог
//  и натуропат, мама ребёнка с РАС; бережно, этично, без обещаний лечения).
//  Без ключа / USE_REAL_AI!=1 → детерминированный стаб.
// ============================================================

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

function useReal() {
  return (
    String(process.env.USE_REAL_AI || '').trim() === '1' &&
    !!(process.env.OPENROUTER_API_KEY || '').trim()
  )
}

// Фиксированная подпись-кнопка и хэндл (в рендере), не от LLM.
export const SAVE_CTA = 'Читать далее'
export const HANDLE = '@naturonata'

const SYSTEM_PROMPT = `Ты — специалист по SEO-продвижению в Pinterest и созданию тёплых, цепляющих пинов для экспертного блога о поддержке детей с РАС и другими особенностями развития.

Ты работаешь от лица эксперта:
— роль: нутрициолог и натуропат, работает с семьями детей с особенностями развития;
— личный опыт: мама 11-летнего мальчика с РАС;
— профессиональный опыт: 9,5 лет;
— экспертиза: питание, пищевое поведение, поддержка организма, улучшение повседневного состояния ребёнка;
— аудитория: родители детей с РАС и другими особенностями, ищущие понятную, бережную и практически применимую помощь.

ЗАДАЧА: прочитать блог-пост клиента и сделать ПАК из нескольких пинов — каждый раскрывает СВОЙ угол/подтему поста. Для каждого пина верни объект:

{
  "title": "SEO-заголовок для Pinterest",
  "hook": "1–2 короткие поддерживающие фразы под заголовком (рассказ-крючок из темы поста)",
  "scene": "ENGLISH description of a needle-felted wool 3D diorama illustrating THIS pin's theme (для генератора картинки)",
  "description": "описание пина для Pinterest на русском (1–2 предложения)",
  "hashtags": ["#…", 4–7 тегов на русском без пробелов]
}

ПРАВИЛА ЗАГОЛОВКА (title):
— строго одна строка, максимум 100 символов;
— соответствует содержанию поста; не выдумывай факты, цифры, диагнозы, сроки;
— содержит поисковые слова, которые родители реально вводят (питание ребёнка с РАС, избирательность в еде, сенсорная чувствительность, сон, ЖКТ, дефициты, отказ от еды и т.п.);
— сразу показывает узнаваемую проблему, пользу или результат; вызывает «это про моего ребёнка»;
— цифры — только если они есть в тексте; конкретные слова (признаки, причины, шаги, чек-лист, рацион) вместо пустых («полезные советы», «эффективные методы»);
— бережно, профессионально, этично; без запугивания, вины, ярлыков; ребёнка не называть «капризным/проблемным»;
— НИКАКИХ обещаний вылечить/убрать РАС/гарантированно восстановить; допустимо: «поддержать», «помочь», «улучшить повседневное самочувствие», «разобраться в возможных причинах», «без давления».

ПРАВИЛА ХУКА (hook): тёплый, короткий, поддерживающий, без кликбейта и без обещаний лечения (пример тона: «Поддержка возможна. Вы не одни.»).

ПРАВИЛА СЦЕНЫ (scene): ТОЛЬКО на английском, опиши уютную войлочную (needle-felted wool) 3D-сцену в приглушённых зелёно-оливковых тонах на тёплом кремовом фоне по теме пина. БЕЗ текста на картинке. НЕ добавляй в сцену предметы с надписями или фотографии (списки, бумаги, вывески, книги с текстом, рамки с фото, экраны) — только образы и объекты. Фигуры — без черт лица.

ВЕРНИ СТРОГО валидный JSON — массив таких объектов, без markdown и пояснений.`

function extractJsonArray(text) {
  if (!text) throw new Error('Пустой ответ LLM')
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const raw = fenced ? fenced[1] : text
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start === -1 || end === -1) throw new Error('В ответе LLM нет JSON-массива')
  return JSON.parse(raw.slice(start, end + 1))
}

function clampTitle(s) {
  const t = String(s || '').replace(/\s+/g, ' ').trim().replace(/^["'«»]+|["'«»]+$/g, '')
  return t.length > 100 ? t.slice(0, 99).trimEnd() + '…' : t
}

function sanitizePin(c, i) {
  return {
    title: clampTitle(c?.title) || `Идея ${i + 1}`,
    hook: String(c?.hook || '').replace(/\s+/g, ' ').trim().slice(0, 160),
    scene: String(c?.scene || 'a cozy needle-felted wool scene with soft rounded shapes, calm and hopeful').trim(),
    description: String(c?.description || '').trim(),
    hashtags: Array.isArray(c?.hashtags)
      ? c.hashtags.map((s) => String(s).trim()).filter(Boolean).slice(0, 7)
      : ['#аутизм', '#особыедети', '#питаниедетей'],
  }
}

async function callOpenRouter(sourceText, count) {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://naturopin.local',
      'X-Title': 'NaturoPin',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      temperature: 0.7,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Сделай ровно ${count} пинов (каждый — свой угол темы) из этого блог-поста. Только JSON-массив.\n\nBlogPost:\n${sourceText}`,
        },
      ],
    }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}: ${text.slice(0, 300)}`)
  const data = JSON.parse(text)
  const content = data?.choices?.[0]?.message?.content
  return extractJsonArray(content)
}

// --- Стаб: раскладываем текст на N story-пинов без нейросети ---
const STUB_SCENES = [
  'a cozy needle-felted wool diorama: a soft green heart and a small hugging figure on a felted meadow, hopeful morning light',
  'a felted wool scene: a warm plate with a few soft food shapes and a gentle spoon, calm kitchen mood',
  'a felted wool diorama: a soft moon, stars and a tiny bed, quiet bedtime calm',
  'a felted wool scene: a small path of stepping stones leading to a soft archway with sunlight, journey of small steps',
  'a felted wool diorama: a soft brain and a heart side by side with gentle leaves, tender care',
  'a felted wool scene: a calm child figure and a caring hand, soft rounded shapes, reassurance',
]

function stubPins(sourceText, count) {
  const sentences = sourceText
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8)
  const chunk = Math.max(1, Math.ceil(sentences.length / count))
  const pins = []
  for (let i = 0; i < count; i++) {
    const part = sentences.slice(i * chunk, i * chunk + chunk)
    const base = part[0] || `Идея ${i + 1}`
    const title = clampTitle(base.split(' ').slice(0, 9).join(' '))
    pins.push({
      title: title || `Идея ${i + 1}`,
      hook: (part[1] || 'Поддержка возможна. Вы не одни.').slice(0, 120),
      scene: STUB_SCENES[i % STUB_SCENES.length],
      description: (part[0] || base).slice(0, 160) + ' — бережно к особому ребёнку.',
      hashtags: ['#аутизм', '#особыедети', '#питаниедетей', '#сенсорнаяинтеграция', '#мамаособого'],
    })
  }
  return pins
}

/**
 * Разобрать блог-пост на пак story-пинов.
 * @returns {Promise<Array>} массив пинов (см. sanitizePin)
 */
export async function analyzeArticle(sourceText, count) {
  const n = Math.max(1, Math.min(12, Number(count) || 6))
  let pins
  if (useReal()) {
    try {
      pins = await callOpenRouter(sourceText, n)
    } catch (e) {
      console.warn('[llm] OpenRouter не сработал, беру стаб:', e.message)
      pins = stubPins(sourceText, n)
    }
  } else {
    pins = stubPins(sourceText, n)
  }
  if (!Array.isArray(pins) || pins.length === 0) pins = stubPins(sourceText, n)
  return pins.slice(0, n).map(sanitizePin)
}

/** Заголовок проекта — из первого пина/первых слов поста. */
export function deriveProjectTitle(sourceText, pins) {
  if (pins?.[0]?.title) return pins[0].title
  return sourceText.trim().split(/\s+/).slice(0, 6).join(' ')
}
