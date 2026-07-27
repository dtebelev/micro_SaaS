// Генерация PWA-иконок из assets/brand/logo.png на кремовом фоне. → public/
import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

mkdirSync('public', { recursive: true })
const logo = readFileSync(join('assets', 'brand', 'logo.png'))
const lw = logo.readUInt32BE(16)
const lh = logo.readUInt32BE(20)
const b64 = logo.toString('base64')

function png(size, scale, rounded) {
  const w = Math.round(size * scale)
  const h = Math.round((w * lh) / lw)
  const x = Math.round((size - w) / 2)
  const y = Math.round((size - h) / 2)
  const rx = rounded ? Math.round(size * 0.18) : 0
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${rx}" fill="#fafcd5"/>
    <image href="data:image/png;base64,${b64}" x="${x}" y="${y}" width="${w}" height="${h}"/>
  </svg>`
  return new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()
}

writeFileSync(join('public', 'pwa-192x192.png'), png(192, 0.82, true))
writeFileSync(join('public', 'pwa-512x512.png'), png(512, 0.82, true))
// maskable — полный квадрат без скругления (платформа сама применит маску), логотип с запасом
writeFileSync(join('public', 'maskable-512x512.png'), png(512, 0.6, false))
writeFileSync(join('public', 'apple-touch-icon.png'), png(180, 0.82, false))
console.log('✅ Иконки готовы в public/: pwa-192, pwa-512, maskable-512, apple-touch-icon')
