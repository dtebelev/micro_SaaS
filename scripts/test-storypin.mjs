// Тест story-пина: войлочный фон (FLUX) + слой текста (Satori). npm run test:storypin
import 'dotenv/config'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { generateBackground } from '../server/pipeline/flux.js'
import { renderCard } from '../server/pipeline/render.js'

const card = {
  title: 'Выгорание у родителей детей с РАС: 4 сигнала, которые нельзя игнорировать',
  hook: 'Поддержка возможна. Вы не одни.',
  scene:
    'a tender needle-felted wool diorama: a soft green felted brain and a bandaged felted heart resting on a mossy felted meadow, a tiny felted calendar with a check mark, a small felted cup of tea, a felted figure gently hugging its knees, and a soft path of stepping stones leading to a sunlit felted archway; hopeful warm morning light',
}

console.log('⏳ генерирую войлочный фон + накладываю текст…')
const bg = await generateBackground({ scene: card.scene, seed: 3 })
const png = await renderCard(card, bg.buffer)
const dir = join(process.cwd(), 'output', 'flux-tests')
await mkdir(dir, { recursive: true })
const p = join(dir, `storypin-${Date.now()}.png`)
await writeFile(p, png)
console.log(`✅ фон настоящий(FLUX)=${bg.real} → ${p}`)
