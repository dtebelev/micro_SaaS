# HANDOFF — NaturoPin 1.0 (передача агенту для Этапа 2)

> Этот файл — точка входа для нового агента, который продолжает проект. Прочитай его целиком,
> затем `spec/ТЕХ-ПЛАН.md`, `spec/FLUX-ПРОМПТ.md`, `spec/ПРОМПТ-1-ЗАГОЛОВОК.md`, `spec/НАСТРОЙКА.md`.
> В этом же проекте есть авто-память (`MEMORY.md` + файлы в `memory/`), она загружается автоматически —
> ключевые записи: `project-naturopin-stage1`, `card-rendering-hybrid`, `model-cost-discipline`,
> `design-system-digital-artisan`, `user-persona-natasha`.

## Что это за продукт
**NaturoPin 1.0** — микро-SaaS для эксперта **Наташи** (бренд **NATURONATA**): нутрициолог/натуропат,
мама ребёнка с РАС. Продукт превращает её экспертную статью (текст **или ссылку**) в **пак Pinterest-пинов**.

**Труба:** блог-пост → LLM-методист (JSON пинов) → FLUX-2/flash (войлочный фон без текста) →
Satori (заголовок + хук + кнопка + лого вторым слоем, кириллица всегда верная) → Supabase Storage + БД →
Верстак (перегенерация/скрытие) → ZIP-экспорт (PNG + `pinterest_metadata.txt`).

**Формат карточки — «story-пин»** (эталон: felted-wool диорама): один SEO-заголовок + короткий рассказ-хук +
большая войлочная 3D-сцена + объёмная кнопка **«Читать далее»** + `@naturonata` + логотип NATURONATA.

## Пользователь и правила работы (важно)
- Пользователь **не программист** — объясняй просто, терминал за него не гоняй, веди по шагам.
- **Экономь токены:** субагентов/модели подбирай по сложности (дёшево на рутину, дорого только где нужно) — см. `model-cost-discipline`.
- Голос бренда: бережно, экспертно, без «AI-восторгов», **без обещаний лечения** (этическая ниша РАС).

## Как запустить
```
npm run dev        # web:5173 + api:8787 (concurrently)
```
- Фронт: Vite+React 19+Tailwind v4. Бэк трубы: Node/Express `server/index.js`.
- **Готча с портами:** dev-серверы прошлых сессий залипают на 5173/8787. Если новый `npm run dev`
  не занял 8787 (api молча выходит) — прогон пойдёт через СТАРЫЙ код. Лечение:
  `netstat -ano | grep 8787` → `taskkill //PID <pid> //F`, затем перезапуск. Запускай dev как
  **устойчивый фоновый процесс** (иначе падает между шагами).

## Переменные окружения (`.env`, уже заполнены, в `.gitignore`)
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` (опционально; сервер по умолчанию пишет от имени пользователя, JWT+RLS),
`USE_REAL_AI=1`, `OPENROUTER_API_KEY`, `FLUX_API_KEY` (fal.ai), `CARDS_COUNT=6`.
Рабочая модель OpenRouter: **`openai/gpt-4o-mini`** (у этого ключа `anthropic/*` и `google/gemini-2.0-*` → 404).
Чтение по ссылке — **Jina Reader, без ключа**.

## Карта кода
- Фронт: `src/screens/{Auth,Source,Analysis,Workbench,Finish}.jsx`, лейаут `src/components/layout/AppLayout.jsx`
  (в меню активный шаг подсвечен lime, пройденные — с ✓), API-слой `src/lib/api.js`, бренд-токены `src/index.css`.
- Бэк: `server/index.js` (роуты `/api/generate`, `/api/regenerate`), `server/pipeline/`:
  - `llm.js` — методист (SEO-заголовок по `spec/ПРОМПТ-1-ЗАГОЛОВОК.md` + hook/scene/description/hashtags). Экспортит `SAVE_CTA='Читать далее'`, `HANDLE='@naturonata'`.
  - `flux.js` — FLUX-2/flash (fal.ai, `fal-ai/flux-2/flash`), войлочный фон **без текста**.
  - `render.js` — Satori→PNG, story-пин, финал в **2×** (чёткий текст). Логотип: `assets/brand/logo.png`.
  - `storage.js` — Supabase Storage (bucket `pins`, приватный) + вставка пина.
  - `fetchArticle.js` — `isUrl()` + `extractArticle()` (Jina Reader, фолбэк прямой fetch).
- Смоук-скрипты: `npm run test:flux | test:storypin | test:pack | test:url`, а также
  `scripts/_smoke-e2e.mjs`, `_e2e-zip.mjs` (браузер+ZIP), `_shots-ui.mjs`, `_shot-mobile.mjs`. Вывод в `output/` (gitignored).

## Данные (Supabase, ref `lhalwyegtrlhimpnwpah`)
`profiles / projects / pins` c RLS «вижу только своё». Таблица `pins` актуальные поля:
`title, hook, scene, description, hashtags, image_path, image_prompt, position, status`
(миграция `pins_add_story_fields` добавила `hook`,`scene`; старые `type/items/icon_keys/cta/hero_object/motif` не используются).
Триггеры: `handle_new_user`, `auto_confirm_email` (авто-подтверждение почты — **для локального демо; на проде заменить настройкой Auth/magic-link**).

## Готчи (не наступать повторно)
- **FLUX впечатывает текст**: в фон лезут вотермарки/английские надписи на предметах. Держим:
  «ABSOLUTELY NO TEXT», «бумаги/книги/рамки ПУСТЫЕ», фигуры без лиц; сверху карточки — плотная кремовая вуаль.
- **Satori**: понимает только статические TTF (не woff2/variable). `render.js` тянет TTF из Google Fonts CSS API
  со старым UA и кеширует в `assets/fonts/`. Иконки/лого — инлайн.
- **Кириллица**: только код-рендер (Satori) даёт верные буквы — FLUX для текста НЕ используем.

---

# ЭТАП 2 — что делать дальше (по приоритету)

### 1. Правка отдельного пина (per-pin editor)
Сейчас на Верстаке есть «Перегенерировать» (`/api/regenerate` — заново рисует фон+текст) и «Скрыть».
Нужно: **править заголовок/хук прямо на карточке** и **менять только текст без нового вызова FLUX**
(гибрид это позволяет — фон уже лежит в Storage как `{...}_bg.png`).
- План: новый роут/режим `/api/regenerate` c `mode:'text'` — берёт сохранённый `_bg.png` из Storage,
  обновляет `title/hook` в БД, ре-рендерит `renderCard(card, bgPng)` и перезаписывает финальный PNG. Дёшево и быстро.
- UI: инлайн-редактор title/hook на карточке Верстака (`src/screens/Workbench.jsx`), сохранение → вызов API → обновить превью.

### 2. Оплата / подписка (~$15/мес) — **PayPal** (решение пользователя)
- Провайдер: **PayPal Subscriptions API** (не Stripe). Кнопка PayPal (JS SDK) на фронте → сервер создаёт/активирует подписку → **вебхук PayPal** обновляет статус.
- Настройка: PayPal Developer Dashboard → создать `Product` + `Billing Plan` ($15/мес). Ключи (client_id/secret) — только на сервере (`.env`/Vercel env), НЕ во фронт (в браузер идёт только public client_id).
- Ограничение доступа: после N бесплатных паков — подписка. Статус хранить в `profiles` (напр. `plan`, `subscription_status`, `paypal_subscription_id`).
- **Гео-нюанс:** PayPal (как и Stripe) не принимает платежи из РФ. Для глобального запуска — ок; на этапе теста в России оплату не включаем. Приём именно из РФ (если понадобится) — отдельный российский провайдер (ЮKassa и т.п.), не в этом объёме.

### 3. Английский язык (мультиязык)
- Флаг языка (в UI + профиль). Методист выдаёт заголовки/хуки на выбранном языке (в `llm.js` — параметр `lang`).
- FLUX-сцена уже языконезависима (текст на картинке не рисуем). UI-строки — вынести в словарь (i18n).
- RTL не требуется.

### 4. Деплой на Vercel — ✅ БЭКЕНД ПЕРЕНЕСЁН (осталось задеплоить)
- **Сделано (2026-07-26):** PWA (`vite-plugin-pwa`, иконки в `public/`), serverless-архитектура:
  общие обработчики `server/handlers/*` + точки входа `api/*.js`; **пофункциональный рендер**
  (`/api/generate` планирует пак и создаёт строки пинов со статусом `processing`; `/api/render-pin`
  рисует ОДИН пин — влезает в лимит времени). Фронт `Analysis.jsx` оркеструет рендер по пину с прогрессом.
  `vercel.json` (SPA-rewrite). Шрифты — из `assets/fonts` (закоммичены) или `/tmp`. `pins.status` теперь
  допускает `processing` (миграция `pins_status_allow_processing`). Проверено локально end-to-end + ZIP.
- **Осталось (внешние действия, требуют аккаунта пользователя):**
  1. `git push` нового коммита в `github.com/dtebelev/micro_SaaS` (в среде агента пуш блокируется — делает пользователь или с его разрешения).
  2. Vercel → Add New → Project → Import `dtebelev/micro_SaaS` (Framework: Vite, авто). Включает авто-деплой при каждом push.
  3. Env Variables в Vercel (значения из `.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`,
     `SUPABASE_ANON_KEY`, `USE_REAL_AI=1`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `FLUX_PROVIDER`, `FLUX_API_KEY`,
     `FLUX_MODEL`, `CARDS_COUNT`. (service_role не обязателен.)
  4. Deploy → получить URL. `VERCEL_TOKEN` для CLI-деплоя лежит в `.env` (если среда позволит `npx vercel`).
- Storage/БД — Supabase уже облачные, менять не нужно.

## Определение готовности Этапа 2
Каждая фича — сквозной живой путь на реальных данных, проверенный в приложении (смоук-скрипт или браузерный прогон),
без регрессий Этапа 1 (генерация пака + ZIP работают).
