// Мобильный скрин экрана «Источник» (низ карточки текста).
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
const OUT = join(process.cwd(), 'output', 'shots')
await mkdir(OUT, { recursive: true })
const email = `natasha.${Date.now()}@gmail.com`, password = 'test123456'
const b = await chromium.launch()
const page = await b.newPage({ viewport: { width: 390, height: 844 } })
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
  await page.screenshot({ path: join(OUT, 'ui-source-mobile.png'), fullPage: true })
  console.log('✓ ui-source-mobile.png')
} catch (e) { console.error('✗', e.message); process.exitCode = 1 } finally { await b.close() }
