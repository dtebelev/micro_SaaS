// Полный пак story-пинов из блог-поста. npm run test:pack -- [путь_к_тексту]
import 'dotenv/config'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { analyzeArticle } from '../server/pipeline/llm.js'
import { generateBackground } from '../server/pipeline/flux.js'
import { renderCard } from '../server/pipeline/render.js'

const srcPath = process.argv[2] || join('output', '_blogpost.txt')
const src = await readFile(srcPath, 'utf8')
const n = Number(process.env.CARDS_COUNT || 6)

console.log(`⏳ методист разбирает пост на ${n} пинов…`)
const pins = await analyzeArticle(src, n)

const dir = join(process.cwd(), 'output', 'pack')
await mkdir(dir, { recursive: true })

for (let i = 0; i < pins.length; i++) {
  const p = pins[i]
  console.log(`(${i + 1}/${pins.length}) «${p.title}»`)
  const bg = await generateBackground({ scene: p.scene, seed: i })
  const png = await renderCard(p, bg.buffer)
  await writeFile(join(dir, `${String(i + 1).padStart(2, '0')}.png`), png)
}
console.log(`✅ готово → ${dir}`)
