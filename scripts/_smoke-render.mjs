// Смоук-тест трубы БЕЗ Supabase: LLM(стаб) → FLUX(стаб-фон) → Satori → PNG на диск.
import 'dotenv/config'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { analyzeArticle } from '../server/pipeline/llm.js'
import { generateBackground } from '../server/pipeline/flux.js'
import { renderCard } from '../server/pipeline/render.js'

const article = `Сенсорная диета дома помогает ребёнку с аутизмом чувствовать себя спокойно.
Организуйте тихий уголок для отдыха, где приглушённый свет и мягкие текстуры.
Утяжелённое одеяло даёт чувство опоры и снижает тревогу вечером.
Делайте короткие перерывы на движение каждый час, чтобы разгрузить нервную систему.
Вечером приглушайте свет и убирайте лишние звуки — это готовит ко сну.
Важно соблюдать предсказуемый режим: ребёнок знает, что будет дальше, и меньше нервничает.`

console.time('smoke')
const cards = await analyzeArticle(article, 3)
console.log('карточек:', cards.length, '| первая:', cards[0].title, '| пунктов:', cards[0].items.length)

const outDir = join(process.cwd(), 'output', 'smoke')
await mkdir(outDir, { recursive: true })

for (let i = 0; i < cards.length; i++) {
  const bg = await generateBackground({ heroObject: cards[i].hero_object, motif: cards[i].motif, seed: i })
  const png = await renderCard(cards[i], bg.buffer, i, cards.length)
  const p = join(outDir, `card-${i + 1}.png`)
  await writeFile(p, png)
  console.log('✓', p, `(${(png.length / 1024).toFixed(0)} KB, real_bg=${bg.real})`)
}
console.timeEnd('smoke')
console.log('Готово. Открой output/smoke/card-1.png и проверь кириллицу.')
