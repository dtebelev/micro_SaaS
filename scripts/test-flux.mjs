// ============================================================
//  Тест генерации карточки через FLUX-2 / flash (fal.ai).
//  Запуск:  npm run test:flux
//  Читает .env (FLUX_API_KEY), делает ОДНУ карточку-пример
//  и сохраняет PNG в  output/flux-tests/ , чтобы глазами
//  проверить, как FLUX тянет русский текст (кириллицу).
// ============================================================
import 'dotenv/config';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

// Пустые поля в .env (напр. FLUX_PROVIDER=) считаем «не заданными» и берём дефолт.
const FLUX_PROVIDER = (process.env.FLUX_PROVIDER || 'fal').trim();
const FLUX_API_KEY = (process.env.FLUX_API_KEY || '').trim();
const FLUX_MODEL = (process.env.FLUX_MODEL || 'fal-ai/flux-2/flash').trim();

const line = () => console.log('─'.repeat(52));

// --- Промпт-пример (карточка «чек-лист» в стиле NATURONATA) ---
const PROMPT = `Editorial infographic poster for Pinterest, vertical 2:3 aspect ratio, high resolution, print quality.

BRAND & MOOD — NATURONATA: calm, sensory-friendly, "evidence-based softness", made by a caring health expert (NOT an AI):
warm pale cream-lime background (#f6f8dc) with a very soft radial glow;
deep forest green (#0e401c) for the headline and text; muted sage (#c9d2b0) soft containers;
a gentle olive-lime accent (#7a8500) used sparingly on ONE element only.
Generous whitespace, large soft rounded translucent cards (~40px radius) with one gentle soft shadow (light glassmorphism).
NO harsh/neon/saturated colors, NO clutter, NO photorealistic people, NO glossy plastic 3D, NO AI-looking render.
Elegant high-contrast serif display headline (Playfair Display style) + clean humanist sans-serif (Inter style) for smaller text.

LAYOUT for a "чек-лист" card:
- Headline: large bold serif, deep green, 2 lines, exact text: "Сенсорная диета дома"
- Body: a vertical list of 4 short lines, each in its own soft rounded card with a line-icon badge on the left, exact texts:
  "Тихий уголок для отдыха"
  "Утяжелённое одеяло"
  "Перерывы на движение"
  "Приглушённый свет вечером"
- One small thin-line pictogram per item (1.5-2px stroke, single deep-green color) inside a soft round sage badge, motif: home, comfort, calm senses, moon
- Keep top-left and bottom areas calm and uncluttered.
- Optional small olive pill label, exact text: "Сохрани, чтобы не потерять"

TEXT RULES (very important):
ALL visible text strictly in RUSSIAN, spelled EXACTLY as in the quotes, correct Cyrillic, no typos,
no invented or extra words, no English words anywhere. Text must be large, crisp, perfectly legible.

Style: clean modern editorial infographic, nurturing, expert, calm, premium, high quality, high resolution.
IMPORTANT: before rendering, verify every word is Russian and spelled correctly.`;

line();
console.log('Тест генерации карточки — FLUX-2/flash (fal.ai)');
line();

if (FLUX_PROVIDER !== 'fal') {
  console.log(`⚠  Пока реализован провайдер fal. В .env FLUX_PROVIDER=${FLUX_PROVIDER}`);
  console.log('   Поставь FLUX_PROVIDER=fal или скажи мне — добавлю другой.');
  process.exit(1);
}

if (!FLUX_API_KEY || FLUX_API_KEY.trim() === '') {
  console.log('⚠  Ключ ещё не заполнен в .env:');
  console.log('   • FLUX_API_KEY');
  console.log('\nВозьми ключ на fal.ai → Dashboard → API Keys,');
  console.log('вставь в .env в поле FLUX_API_KEY= и снова запусти:  npm run test:flux');
  process.exit(1);
}

// fal: синхронный вызов — ждём результат и получаем JSON с images[].url
const url = `https://fal.run/${FLUX_MODEL}`;

async function generate(imageSize) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Key ${FLUX_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: PROMPT,
      image_size: imageSize,
      num_images: 1,
      output_format: 'png',
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
    err.status = res.status;
    throw err;
  }
  return JSON.parse(text);
}

try {
  console.log('⏳ Отправляю запрос в FLUX-2/flash… (обычно 5–15 сек)');
  let data;
  try {
    // Сначала пробуем точный 2:3 (1024×1536)
    data = await generate({ width: 1024, height: 1536 });
  } catch (e) {
    if (e.status === 422 || e.status === 400) {
      console.log('ℹ  Точный размер не принят — пробую пресет portrait_4_3 (вертикаль).');
      data = await generate('portrait_4_3');
    } else {
      throw e;
    }
  }

  const imgUrl = data?.images?.[0]?.url;
  if (!imgUrl) throw new Error('В ответе нет images[].url. Ответ: ' + JSON.stringify(data).slice(0, 400));

  console.log('✅ Картинка сгенерирована. Скачиваю…');
  const bin = Buffer.from(await (await fetch(imgUrl)).arrayBuffer());

  const outDir = join(process.cwd(), 'output', 'flux-tests');
  await mkdir(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = join(outDir, `pin-${stamp}.png`);
  await writeFile(outPath, bin);

  line();
  console.log('🎉 Готово! Карточка сохранена:');
  console.log('   ' + outPath);
  console.log('\nОткрой файл и посмотри, чисто ли написан русский текст.');
  line();
} catch (err) {
  console.log('❌ Ошибка генерации:');
  console.log('   ' + (err.message || err));
  console.log('\nЕсли это про ключ/доступ — проверь FLUX_API_KEY в .env.');
  process.exit(1);
}
