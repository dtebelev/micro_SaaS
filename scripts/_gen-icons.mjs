// Генерация ТОЛЬКО иконок установки (кнопка запуска на телефоне/PWA)
// из assets/brand/app-icon.png (во весь квадрат). → public/
// Логотип ВНУТРИ приложения (assets/brand/logo.png) здесь НЕ участвует.
import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

mkdirSync('public', { recursive: true })
const src = readFileSync(join('assets', 'brand', 'app-icon.png'))
const b64 = src.toString('base64')

// Иконка во весь квадрат (source уже квадратный, с кремовым фоном и полями).
function png(size) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <image href="data:image/png;base64,${b64}" x="0" y="0" width="${size}" height="${size}"/>
  </svg>`
  return new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()
}

writeFileSync(join('public', 'pwa-192x192.png'), png(192))
writeFileSync(join('public', 'pwa-512x512.png'), png(512))
writeFileSync(join('public', 'maskable-512x512.png'), png(512))
writeFileSync(join('public', 'apple-touch-icon.png'), png(180))
console.log('✅ Иконки установки обновлены из app-icon.png: pwa-192, pwa-512, maskable-512, apple-touch-icon')
