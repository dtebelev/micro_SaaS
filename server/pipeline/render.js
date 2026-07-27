// ============================================================
//  Satori-рендер story-пина: войлочный фон (FLUX) + текст ВТОРЫМ СЛОЕМ.
//  Слои: лого (сверху-слева) + заголовок (Playfair) + рассказ-хук (Inter)
//  + объёмная кнопка «Сохранить, чтобы не потерять» + @naturonata.
//  Текст кладём кодом — кириллица всегда верная. Затем resvg → PNG.
// ============================================================
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { SAVE_CTA, HANDLE } from './llm.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ASSETS = join(__dirname, '..', '..', 'assets')
const FONTS_DIR = join(ASSETS, 'fonts') // закоммиченный кэш (read-only на Vercel)
const WRITE_DIR = join(tmpdir(), 'naturopin-fonts') // куда пишем, если шрифта нет (ФС Vercel только tmp)
const LOGO_PATH = join(ASSETS, 'brand', 'logo.png') // положи сюда PNG-логотип NATURONATA (прозрачный фон)

const CARD_W = 1024
const CARD_H = 1536

// Палитра NATURONATA
const C = {
  forest: '#0e401c',
  deepForest: '#285831',
  olive: '#586400',
  oliveDark: '#454f00',
  lime: '#c4d84a',
  sage: '#e0e4c9',
  cream: '#fafcd5',
  onSurface: '#1a1d06',
  variant: '#414940',
  white: '#ffffff',
}

// Satori понимает только СТАТИЧЕСКИЕ ttf/otf (не вариативные, не woff2).
const OLD_UA = 'Mozilla/5.0 (Linux; U; Android 2.2)'
const FONT_SPECS = [
  ['Inter', 'Inter:400', 400],
  ['Inter', 'Inter:700', 700],
  ['Playfair Display', 'Playfair+Display:700', 700],
]
let _fontsCache = null

function cacheName(family, weight, idx) {
  return `${family.replace(/\s+/g, '')}-${weight}-${idx}.ttf`
}
async function fetchTtfUrls(familyParam) {
  const url = `https://fonts.googleapis.com/css?family=${familyParam}&subset=cyrillic,latin`
  const res = await fetch(url, { headers: { 'User-Agent': OLD_UA } })
  if (!res.ok) throw new Error(`Google Fonts CSS HTTP ${res.status} для ${familyParam}`)
  const css = await res.text()
  const urls = [...css.matchAll(/url\((https:[^)]+\.ttf)\)/g)].map((m) => m[1])
  if (urls.length === 0) throw new Error(`Не нашёл ttf для ${familyParam}`)
  return urls
}
async function loadOneFamily(family, familyParam, weight) {
  const entries = []
  // 1) закоммиченный кэш assets/fonts, затем 2) временный кэш /tmp
  for (const dir of [FONTS_DIR, WRITE_DIR]) {
    let idx = 0
    while (existsSync(join(dir, cacheName(family, weight, idx)))) {
      entries.push({ name: family, data: await readFile(join(dir, cacheName(family, weight, idx))), weight, style: 'normal' })
      idx++
    }
    if (entries.length) return entries
  }
  // 3) нет кэша — качаем и пишем во ВРЕМЕННУЮ папку (ФС Vercel только tmp пишется)
  await mkdir(WRITE_DIR, { recursive: true })
  const urls = await fetchTtfUrls(familyParam)
  for (let i = 0; i < urls.length; i++) {
    const buf = Buffer.from(await (await fetch(urls[i])).arrayBuffer())
    await writeFile(join(WRITE_DIR, cacheName(family, weight, i)), buf)
    entries.push({ name: family, data: buf, weight, style: 'normal' })
  }
  return entries
}
async function loadFonts() {
  if (_fontsCache) return _fontsCache
  const groups = await Promise.all(FONT_SPECS.map(([f, p, w]) => loadOneFamily(f, p, w)))
  _fontsCache = groups.flat()
  return _fontsCache
}

// маленький hyperscript для Satori
function h(type, props = {}, children) {
  return { type, props: { ...props, children } }
}

// --- Логотип: настоящий PNG из assets/brand/logo.png, иначе словесный fallback ---
function pngSize(buf) {
  // PNG IHDR: ширина/высота — big-endian uint32 на смещениях 16 и 20
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}
let _logoCache = null
function logoNode() {
  if (_logoCache === null) {
    _logoCache = existsSync(LOGO_PATH) ? readFileSync(LOGO_PATH) : false
  }
  if (_logoCache) {
    const { width, height } = pngSize(_logoCache)
    const hh = 264 // ×2
    const ww = Math.round(width * (hh / height))
    const uri = `data:image/png;base64,${_logoCache.toString('base64')}`
    return h('img', { src: uri, width: ww, height: hh })
  }
  // fallback — словесный логотип
  const leaf =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#285831" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19 C5 10 12 5 19 5 C19 12 14 19 5 19 Z M5 19 C9 15 12 12 19 5"/></svg>'
  return h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } }, [
    h('img', { src: `data:image/svg+xml;base64,${Buffer.from(leaf).toString('base64')}`, width: 72, height: 72 }),
    h('div', { style: { display: 'flex', fontSize: '56px', fontWeight: 700, color: C.forest, fontFamily: 'Playfair Display', letterSpacing: '1px' } }, 'NATURONATA'),
  ])
}

function buildTree(card) {
  const title = String(card.title || '')
  const hook = String(card.hook || '')
  // Заголовок крупнее для коротких строк
  const titleSize = title.length > 64 ? 58 : title.length > 40 ? 66 : 74

  const top = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '26px' } }, [
    h('div', { style: { display: 'flex' } }, logoNode()),
    h('div', {
      style: {
        display: 'flex',
        fontFamily: 'Playfair Display',
        fontWeight: 700,
        color: C.forest,
        fontSize: `${titleSize}px`,
        lineHeight: 1.06,
        letterSpacing: '-0.5px',
      },
    }, title),
    hook
      ? h('div', {
          style: {
            display: 'flex',
            fontFamily: 'Inter',
            fontWeight: 700,
            color: '#2c3a0e',
            fontSize: '34px',
            lineHeight: 1.32,
            maxWidth: '800px',
          },
        }, hook)
      : h('div', { style: { display: 'flex' } }, ''),
  ])

  // Объёмная 3D-кнопка «Сохранить, чтобы не потерять»
  // светлый блик сверху + толстый нижний «борт» + глубокая тень = явная кнопка
  const button = h('div', {
    style: {
      display: 'flex',
      alignSelf: 'flex-start',
      background: 'linear-gradient(180deg, #a6b830 0%, #7c8a1e 48%, #5c6900 100%)',
      color: C.white,
      borderRadius: '9999px',
      padding: '30px 54px',
      fontFamily: 'Inter',
      fontWeight: 700,
      fontSize: '36px',
      letterSpacing: '0.3px',
      border: '2px solid rgba(255,255,255,0.30)',
      boxShadow:
        '0 16px 0 #3d4600, 0 30px 40px rgba(20,30,0,0.38), inset 0 4px 0 rgba(255,255,255,0.45), inset 0 -6px 12px rgba(20,30,0,0.30)',
    },
  }, SAVE_CTA)

  const handle = h('div', {
    style: {
      display: 'flex',
      alignSelf: 'flex-start',
      background: 'rgba(250,252,213,0.82)',
      borderRadius: '9999px',
      padding: '8px 22px',
      fontFamily: 'Inter',
      fontWeight: 700,
      fontSize: '30px',
      color: C.olive,
    },
  }, HANDLE)

  const bottom = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '48px' } }, [button, handle])

  return h('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      width: `${CARD_W}px`,
      height: `${CARD_H}px`,
      padding: '68px',
      justifyContent: 'space-between',
      fontFamily: 'Inter',
    },
  }, [top, bottom])
}

/** Общий помощник: SVG-строка → PNG-буфер (ширина CARD_W). */
export function svgToPng(svg, width = CARD_W) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } })
  return resvg.render().asPng()
}

/**
 * Отрендерить story-пин поверх войлочного фона.
 * @param {object} card  — пин от методиста (title, hook, ...)
 * @param {Buffer} bgPng — PNG-фон (FLUX или стаб), 2:3
 * @returns {Promise<Buffer>} финальный PNG
 */
export async function renderCard(card, bgPng /*, index, total */) {
  const fonts = await loadFonts()
  const bgUri = `data:image/png;base64,${bgPng.toString('base64')}`

  const root = h('div', {
    style: {
      display: 'flex',
      position: 'relative',
      width: `${CARD_W}px`,
      height: `${CARD_H}px`,
      backgroundColor: C.cream,
      backgroundImage: `url(${bgUri})`,
      backgroundSize: `${CARD_W}px ${CARD_H}px`,
    },
  }, [
    // Кремовая вуаль: плотная в ВЕРХНЕЙ трети (под заголовком, прячет возможный
    // вотермарк FLUX), прозрачная в середине/низу — там видно войлочную сцену.
    h('div', {
      style: {
        display: 'flex',
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${CARD_W}px`,
        height: `${CARD_H}px`,
        background:
          'linear-gradient(180deg, rgba(250,252,213,1.0) 0%, rgba(250,252,213,1.0) 40%, rgba(250,252,213,0.82) 47%, rgba(250,252,213,0.30) 55%, rgba(250,252,213,0.0) 63%, rgba(250,252,213,0.0) 100%)',
      },
    }),
    h('div', { style: { display: 'flex', position: 'absolute', top: 0, left: 0 } }, buildTree(card)),
  ])

  const svg = await satori(root, { width: CARD_W, height: CARD_H, fonts })
  // Финал в 2× — векторный текст остаётся идеально чётким и контрастным.
  return svgToPng(svg, CARD_W * 2)
}
