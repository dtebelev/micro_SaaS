import { chromium } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const file = pathToFileURL(path.resolve('landing/index.html')).href;
const b = await chromium.launch();

/* прокручиваем страницу до низа, чтобы отработали scroll-reveal анимации,
   иначе fullPage-скриншот снимет секции невидимыми (IO не срабатывает вне вьюпорта) */
async function scrollThrough(page) {
  await page.evaluate(async () => {
    /* behavior:'instant' обязателен: в CSS у страницы scroll-behavior:smooth,
       и обычный scrollTo анимируется — прокрутка не успевает дойти до низа */
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 120));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    await new Promise(r => setTimeout(r, 900)); /* дольше, чем transition .6s */
  });
}

const errs = [];
const desk = await b.newPage({ viewport: { width: 1280, height: 900 } });
desk.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
desk.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
await desk.goto(file, { waitUntil: 'networkidle' });
await desk.waitForTimeout(1200);
await scrollThrough(desk);
await desk.screenshot({ path: 'output/landing-desktop.png', fullPage: true });

const mob = await b.newPage({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 });
await mob.goto(file, { waitUntil: 'networkidle' });
await mob.waitForTimeout(1200);
await scrollThrough(mob);
await mob.screenshot({ path: 'output/landing-mobile.png', fullPage: true });

/* проверка страховки: секции реально видимы (opacity 1) */
const vis = await desk.evaluate(() =>
  [...document.querySelectorAll('main > section')]
    .map(s => (s.id || '·') + ':' + getComputedStyle(s).opacity));
console.log('видимость секций (desktop):', vis.join('  '));

const overflow = await mob.evaluate(() => {
  const de = document.documentElement;
  const bad = [];
  document.querySelectorAll('*').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1)) {
      bad.push(el.tagName + '.' + String(el.className).slice(0, 50) + ' right=' + Math.round(r.right));
    }
  });
  return { scrollW: de.scrollWidth, innerW: window.innerWidth, bad: bad.slice(0, 8) };
});

// проверка, что шрифты Design.md реально применились
const fonts = await desk.evaluate(() => ({
  h1: getComputedStyle(document.querySelector('h1')).fontFamily,
  body: getComputedStyle(document.body).fontFamily,
  bodyBg: getComputedStyle(document.body).backgroundColor,
  ctaBg: getComputedStyle(document.querySelector('a[href="#apply"]')).backgroundColor
}));

console.log('MOBILE scrollWidth', overflow.scrollW, 'viewport', overflow.innerW);
console.log('overflow:', overflow.bad.length ? overflow.bad : 'none');
console.log('fonts/colors:', JSON.stringify(fonts, null, 1));
console.log('JS errors:', errs.length ? errs : 'none');
await b.close();
