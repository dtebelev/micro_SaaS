// Полный прогон в БРАУЗЕРЕ: регистрация → вставка поста → генерация → Верстак → Финиш → скачивание ZIP.
import { chromium } from 'playwright'
import JSZip from 'jszip'
import { readFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const OUT = join(process.cwd(), 'output')
await mkdir(OUT, { recursive: true })
const article = await readFile(join(OUT, '_blogpost.txt'), 'utf8')

const email = `natasha.${Date.now()}@gmail.com`
const password = 'test123456'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
page.on('console', (m) => m.type() === 'error' && console.log('  [console.error]', m.text()))

try {
  console.log('→ логин-экран')
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })

  console.log('→ регистрация', email)
  await page.getByRole('button', { name: 'Создать' }).click()
  await page.getByPlaceholder('natasha@example.com').fill(email)
  await page.getByPlaceholder('••••••••').fill(password)
  await page.getByRole('button', { name: 'Создать аккаунт' }).click()
  await page.waitForTimeout(2500)
  if (await page.getByText('Войди с этой почтой').isVisible().catch(() => false)) {
    await page.getByPlaceholder('natasha@example.com').fill(email)
    await page.getByPlaceholder('••••••••').fill(password)
    await page.getByRole('button', { name: 'Войти' }).click()
  }

  console.log('→ экран Источник: вставляю блог-пост в поле текста')
  await page.getByRole('button', { name: 'Выделить смыслы' }).waitFor({ timeout: 20000 })
  await page.getByPlaceholder(/сам текст материала/).fill(article)
  await page.getByRole('button', { name: 'Выделить смыслы' }).click()

  console.log('→ Анализ → ждём Верстак (реальная генерация 6 пинов, до 3 мин)…')
  await page.waitForURL('**/workbench/**', { timeout: 210000 })
  await page.waitForTimeout(4000)
  await page.screenshot({ path: join(OUT, 'app-workbench.png'), fullPage: true })
  console.log('   Верстак готов, скрин app-workbench.png')

  console.log('→ Финиш')
  await page.getByRole('button', { name: 'Подготовить архив' }).click()
  await page.waitForURL('**/finish/**', { timeout: 20000 })
  await page.getByRole('button', { name: 'Скачать .zip' }).waitFor({ timeout: 20000 })

  console.log('→ скачиваю ZIP')
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 60000 }),
    page.getByRole('button', { name: 'Скачать .zip' }).click(),
  ])
  const zipPath = join(OUT, 'naturopin-pack.zip')
  await download.saveAs(zipPath)
  await page.waitForTimeout(500)
  await page.screenshot({ path: join(OUT, 'app-finish.png'), fullPage: true })

  console.log('→ проверяю состав архива')
  const zip = await JSZip.loadAsync(await readFile(zipPath))
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir)
  console.log(`\n✅ ZIP скачан: ${zipPath}`)
  console.log('   Состав:')
  for (const n of names) console.log('   •', n)
} catch (e) {
  console.error('✗ Ошибка:', e.message)
  await page.screenshot({ path: join(OUT, 'app-error.png'), fullPage: true }).catch(() => {})
  process.exitCode = 1
} finally {
  await browser.close()
}
