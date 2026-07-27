import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const OUT = join(process.cwd(), 'output', 'shots')
await mkdir(OUT, { recursive: true })
const shot = (page, name) => page.screenshot({ path: join(OUT, name), fullPage: true })

const email = `natasha.${Date.now()}@gmail.com`
const password = 'test123456'
const article = `Сенсорная перегрузка у ребёнка с аутизмом случается, когда вокруг слишком много стимулов сразу.
Признаки перегрузки: ребёнок закрывает уши, убегает, кричит или наоборот замирает.
Первый шаг помощи — снизить нагрузку: увести в тихое место, приглушить свет, убрать лишние звуки.
Помогает утяжелённое одеяло и медленное глубокое дыхание вместе с ребёнком.
Планируйте день предсказуемо: визуальное расписание заметно снижает тревогу.
Делайте сенсорные перерывы заранее, не дожидаясь срыва — это лучшая профилактика.`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
page.on('console', (m) => m.type() === 'error' && console.log('  [console.error]', m.text()))

try {
  console.log('→ login screen')
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await shot(page, '1-login.png')

  console.log('→ signup')
  await page.getByRole('button', { name: 'Создать' }).click()
  await page.getByPlaceholder('natasha@example.com').fill(email)
  await page.getByPlaceholder('••••••••').fill(password)
  await page.getByRole('button', { name: 'Создать аккаунт' }).click()

  // Может потребоваться повторный вход, если сессия не пришла сразу
  await page.waitForTimeout(2500)
  if (await page.getByText('Войди с этой почтой').isVisible().catch(() => false)) {
    await page.getByPlaceholder('natasha@example.com').fill(email)
    await page.getByPlaceholder('••••••••').fill(password)
    await page.getByRole('button', { name: 'Войти' }).click()
  }

  console.log('→ source screen')
  await page.getByRole('button', { name: 'Выделить смыслы' }).waitFor({ timeout: 15000 })
  await shot(page, '2-source.png')

  console.log('→ generate')
  await page.getByRole('textbox').first().fill(article)
  await page.getByRole('button', { name: 'Выделить смыслы' }).click()

  console.log('→ analysis screen')
  await page.waitForURL('**/analysis/**', { timeout: 15000 })
  await page.waitForTimeout(800)
  await shot(page, '3-analysis.png')

  console.log('→ workbench (ждём карточки)')
  await page.waitForURL('**/workbench/**', { timeout: 60000 })
  // ждём, пока прогрузятся картинки пинов
  await page.waitForTimeout(4000)
  await shot(page, '4-workbench.png')

  console.log('→ finish screen')
  await page.getByRole('button', { name: 'Подготовить архив' }).click()
  await page.waitForURL('**/finish/**', { timeout: 15000 })
  await page.waitForTimeout(800)
  await shot(page, '5-finish.png')

  // мобильный вид логина для проверки адаптива
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await m.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await m.screenshot({ path: join(OUT, '6-mobile-login.png'), fullPage: true })

  console.log('\n✅ Скриншоты готовы в output/shots/  (аккаунт:', email + ')')
} catch (e) {
  console.error('✗ Ошибка сценария:', e.message)
  await shot(page, 'error.png').catch(() => {})
  process.exitCode = 1
} finally {
  await browser.close()
}
