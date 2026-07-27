// Скрины: новый экран «Источник» (два поля) + подсветка шага «Анализ» в меню.
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

const OUT = join(process.cwd(), 'output', 'shots')
await mkdir(OUT, { recursive: true })
const email = `natasha.${Date.now()}@gmail.com`
const password = 'test123456'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
try {
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
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
  await page.getByRole('button', { name: 'Выделить смыслы' }).waitFor({ timeout: 20000 })
  await page.screenshot({ path: join(OUT, 'ui-source.png'), fullPage: true })
  console.log('✓ ui-source.png')

  // вставляем ССЫЛКУ и уходим на Анализ, чтобы снять подсветку шага
  await page.getByPlaceholder(/https:\/\/naturonata/).fill('https://ru.wikipedia.org/wiki/Аутизм')
  await page.getByRole('button', { name: 'Выделить смыслы' }).click()
  await page.waitForURL('**/analysis/**', { timeout: 15000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: join(OUT, 'ui-analysis-nav.png'), fullPage: true })
  console.log('✓ ui-analysis-nav.png')
} catch (e) {
  console.error('✗', e.message)
  await page.screenshot({ path: join(OUT, 'ui-error.png'), fullPage: true }).catch(() => {})
  process.exitCode = 1
} finally {
  await browser.close()
}
