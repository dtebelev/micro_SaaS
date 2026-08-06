# HANDOFF — NaturoPin 1.0 (передача агенту)

> Этот файл — точка входа для нового агента, который продолжает проект. Прочитай его целиком,
> затем `spec/ТЕХ-ПЛАН.md`, `spec/ПЛАН-ДВИЖОК.md` (план оплаты/купонов), `spec/FLUX-ПРОМПТ.md`,
> `spec/ПРОМПТ-1-ЗАГОЛОВОК.md`, `spec/НАСТРОЙКА.md`, `spec/АУДИТ-2026-07-31.md` (независимая
> проверка безопасности/работоспособности Этапа 2 — что нашли, что починили, что осталось).
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
- **Ключи — никогда в код и никогда в чат.** Заготовки — пустыми переменными в `.env.example`,
  реальные значения человек вставляет сам. См. навык `secrets-policy`.

## Автопилот, навыки, MCP (заведено 2026-07-29)
- **`.claude/settings.json`** — разрешено без переспроса: чтение/запись файлов, `git add/commit/push`
  (без `--force`), Supabase-миграции (`apply_migration`), деплой Edge Functions, тесты/линт.
  Всегда спрашивать явно: `DROP/TRUNCATE/DELETE` без `WHERE`, сброс/пересоздание БД, откат чужой
  миграции, вывод секретов, `git push --force`/`reset --hard`/`sudo`, платное сверх одного тестового вызова.
- **`CLAUDE.md`** — гейт на плане: перед изменением уже согласованного плана — остановиться,
  показать новый план, ждать «ок». Там же — список файлов «трубы Части 1» (менять — только с явным
  подтверждением): `server/pipeline/**`, `server/handlers/**`, `server/index.js`,
  `src/screens/{Source,Analysis,Workbench,Finish}.jsx`, `src/lib/api.js`, `src/components/layout/AppLayout.jsx`.
- **Supabase MCP** подключён в `.mcp.json`, скоуп строго на проект `lhalwyegtrlhimpnwpah`
  (через `project_ref` в URL — не на весь аккаунт), права на запись есть (`apply_migration`,
  `execute_sql`, `deploy_edge_function` и т.д.). Авторизация — OAuth в браузере, не токен в файле.
- **`.claude/skills/`** установлены и закоммичены: `engine-architect` (ведёт достройку Части 2 —
  брейншторм → `spec/ПЛАН-ДВИЖОК.md` → сборка), `rag-pgvector`, `secrets-policy` (из
  `Comandosai/m-make-skills`), `supabase` + `supabase-postgres-best-practices` (из
  `supabase/agent-skills`), полный набор `obra/superpowers` (TDD, systematic-debugging,
  writing-plans и т.д.), `frontend-design`/`stitch-shadcn-ui` (сборка UI).
- Когда нужно **достраивать следующую крупную фичу** — вызывай навык `engine-architect`
  («запусти движок» / «достроим приложение»): он читает проект, копает до конкретики вопросами,
  собирает план в `spec/ПЛАН-ДВИЖОК.md` и хэндофф-промпт, только потом строит.

## Как запустить
```
npm run dev        # web:5173 + api:8787 (concurrently)
```
- Фронт: Vite+React 19+Tailwind v4. Бэк трубы: Node/Express `server/index.js`.
- **Готча с портами:** dev-серверы прошлых сессий залипают на 5173/8787. Если новый `npm run dev`
  не занял 8787 (api молча выходит) — прогон пойдёт через СТАРЫЙ код. Лечение:
  `netstat -ano | grep 8787` → `taskkill //PID <pid> //F`, затем перезапуск. Запускай dev как
  **устойчивый фоновый процесс** (иначе падает между шагами).
- **Готча (2026-07-29):** `server/supabaseAdmin.js` теперь инициализируется **лениво** — раньше он
  падал при простом импорте, если `SUPABASE_SERVICE_ROLE_KEY` пуст, и ронял ВЕСЬ API (не только
  платёжные роуты). Если увидишь похожий краш при добавлении нового модуля — проверь, не создаёт
  ли он клиентов/подключения на верхнем уровне файла при импорте.

## Переменные окружения (`.env`, частично заполнены, в `.gitignore`; шаблон — `.env.example`)
Базовые (заполнены): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`USE_REAL_AI=1`, `OPENROUTER_API_KEY`, `FLUX_API_KEY` (fal.ai), `CARDS_COUNT=6`.
Рабочая модель OpenRouter: **`openai/gpt-4o-mini`** (у этого ключа `anthropic/*` и `google/gemini-2.0-*` → 404).
Чтение по ссылке — **Jina Reader, без ключа**.

**`SUPABASE_SERVICE_ROLE_KEY` — теперь ОБЯЗАТЕЛЕН** (раньше был опционален): нужен вебхуку PayPal и
подтверждению подписки — там нет пользовательской JWT-сессии, писать в `profiles` можно только под
service_role. Взять: Supabase Dashboard → Settings → API → `service_role`.
**✅ Заполнен пользователем 2026-07-29.**

**Оплата/купоны — статус ключей на 2026-08-05: ВСЕ ЗАПОЛНЕНЫ.**
- ✅ `PAYPAL_ENV=sandbox`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `VITE_PAYPAL_CLIENT_ID` — заполнены пользователем.
- ✅ `PAYPAL_PLAN_ID` / `VITE_PAYPAL_PLAN_ID` — созданы напрямую через PayPal REST API (Catalog
  Products → Billing Plans, $15/мес, USD), не через кликанье по дашборду (интерфейс PayPal
  успел смениться и заготовленный путь по кликам не совпадал с реальным экраном). Product
  `PROD-1DC815724U662191Y`, Plan `P-7TU564480T816010BNJZ6B7Q`.
- ✅ `PAYPAL_WEBHOOK_ID` — создан тем же способом (API), указывает на
  `https://microsaasnaturopin10.vercel.app/api/paypal-webhook`, подписан на все события, которые
  реально обрабатывает `paypal-webhook.js` (ACTIVATED/RE-ACTIVATED/CANCELLED/EXPIRED/SUSPENDED/
  PAYMENT.FAILED/PAYMENT.SALE.DENIED/PAYMENT.SALE.COMPLETED). Webhook `4E536620AX709672U`.
  Значения не секретные (как и Plan ID) — можно смело смотреть в `.env` и в Vercel.
- Все три значения также добавлены в переменные окружения Vercel (через API, без клика по
  дашборду) и прод передеплоен — актуальны и локально, и на публичном сайте.
- ✅ `ADMIN_EMAIL`/`VITE_ADMIN_EMAIL` заполнены — `dtebelev@hotmail.com` (не секрет, просто адрес).
- **Осталось проверить руками:** живой клик по кнопке PayPal на публичном сайте с тестовым
  Sandbox-покупателем (developer.paypal.com/dashboard → Sandbox → Accounts) — сама кнопка теперь
  должна рендериться по-настоящему (не заглушка «скоро будет доступна»), т.к. `PLAN_ID` больше не пустой.

## Карта кода
- Фронт: `src/screens/{Auth,Source,Analysis,Workbench,Finish,Admin}.jsx`, лейаут
  `src/components/layout/AppLayout.jsx` (в меню активный шаг подсвечен lime, пройденные — с ✓;
  бейдж доступа внизу; пункт «Купоны» виден только владельцу), API-слой `src/lib/api.js`,
  бренд-токены `src/index.css`, `src/components/PayPalSubscribeButton.jsx` (кнопка подписки).
- Бэк: `server/index.js` (роуты `/api/generate`, `/api/regenerate`, `/api/paypal-subscribe`,
  `/api/paypal-webhook`, `/api/admin-create-coupon`), те же обработчики как serverless — `api/*.js`
  (тонкие ре-экспорты `server/handlers/*`). `server/pipeline/`:
  - `llm.js` — методист (SEO-заголовок по `spec/ПРОМПТ-1-ЗАГОЛОВОК.md` + hook/scene/description/hashtags). Экспортит `SAVE_CTA='Читать далее'`, `HANDLE='@naturonata'`.
  - `flux.js` — FLUX-2/flash (fal.ai, `fal-ai/flux-2/flash`), войлочный фон **без текста**.
  - `render.js` — Satori→PNG, story-пин, финал в **2×** (чёткий текст). Логотип: `assets/brand/logo.png`.
  - `storage.js` — Supabase Storage (bucket `pins`, приватный) + вставка пина + `getAccess`/`hasAccess`/
    `subscriptionCoversNow`/`consumeCredit` (доступ по купону/трайлу/подписке).
  - `fetchArticle.js` — `isUrl()` + `extractArticle()` (Jina Reader, фолбэк прямой fetch).
  - `server/lib/paypal.js` — PayPal REST: OAuth-токен, `getSubscription`, `verifyWebhookSignature`.
  - `server/supabaseAdmin.js` — ленивый service_role клиент (только сервер).
- Смоук-скрипты: `npm run test:flux | test:storypin | test:pack | test:url`, а также
  `scripts/_smoke-e2e.mjs`, `_e2e-zip.mjs` (браузер+ZIP), `_shots-ui.mjs`, `_shot-mobile.mjs`. Вывод в `output/` (gitignored).

## Данные (Supabase, ref `lhalwyegtrlhimpnwpah`)
`profiles / projects / pins / coupons` c RLS «вижу только своё». Таблица `pins` актуальные поля:
`title, hook, scene, description, hashtags, image_path, image_prompt, position, status`
(миграция `pins_add_story_fields` добавила `hook`,`scene`; старые `type/items/icon_keys/cta/hero_object/motif` не используются).

**`profiles`** (миграция `20260729_coupons_and_credits.sql`, применена 2026-07-29): `plan`
(`trial`/`coupon`/`subscription`), `credits_remaining` (int, `null`=безлимит), `subscription_status`
(`active`/`canceled`/`past_due`), `paypal_subscription_id` (уникален), `subscription_current_period_end`
(timestamptz — доступ по подписке действует, пока `now() < period_end`, даже если уже `canceled`).
**Эти 5 полей защищены триггером** `protect_profile_billing_columns_trigger` — обычный клиент
(`authenticated`/`anon`) их поменять не может, только `postgres` (security definer функции) или
`service_role` (сервер). Без этого пользователь мог бы через консоль браузера сам выставить себе
`plan='subscription'` — дыра была в исходной RLS-политике `profiles_update_own` (без ограничения по колонкам).

**`coupons`**: `code` (PK), `kind` (`unlimited`/`uses`), `uses_granted`, `redeemed_by`, `redeemed_at`.
RLS включён, но клиенту не открыт вообще — читать/писать можно только через функции:
`redeem_coupon(code)` (security definer, `authenticated`) — активация. Создание новых купонов — только
через `/api/admin-create-coupon` (проверка `ADMIN_EMAIL` на сервере, пишет через service_role) или
экран `/admin`. Тестовые коды уже в БД: `FRIEND-UNLIMITED`, `TRY15`, `TRY10`.

Триггеры: `handle_new_user`, `auto_confirm_email` (авто-подтверждение почты — **для локального демо; на проде заменить настройкой Auth/magic-link**), `protect_profile_billing_columns_trigger` (см. выше).

## Готчи (не наступать повторно)
- **FLUX впечатывает текст**: в фон лезут вотермарки/английские надписи на предметах. Держим:
  «ABSOLUTELY NO TEXT», «бумаги/книги/рамки ПУСТЫЕ», фигуры без лиц; сверху карточки — плотная кремовая вуаль.
- **Satori**: понимает только статические TTF (не woff2/variable). `render.js` тянет TTF из Google Fonts CSS API
  со старым UA и кеширует в `assets/fonts/`. Иконки/лого — инлайн.
- **Кириллица**: только код-рендер (Satori) даёт верные буквы — FLUX для текста НЕ используем.
- **RLS с `auth.uid() = id` без ограничения по колонкам — недостаточно** для полей, которые
  меняет только сервер/бизнес-правило (план, кредиты, статус подписки). Клиент технически может
  вызвать `.update()` на любое поле своей строки. Для таких полей — либо не давать прямой UPDATE
  вообще (как `coupons`), либо триггер, защищающий конкретные колонки (как `profiles`).
- **Ленивая инициализация серверных клиентов**: не создавай подключения (Supabase admin, внешние
  API) на верхнем уровне модуля — если ключа ещё нет, это уронит импорт и всё, что его подключает,
  даже несвязанные роуты. Инициализируй по первому реальному использованию.

---

# ЭТАП 2 — что делать дальше (по приоритету)

### 1. Правка отдельного пина (per-pin editor) — ✅ СДЕЛАНО И ЗАКОММИЧЕНО (коммит `f13af46`)
`/api/regenerate` принимает `{ pin_id, mode:'text', title, hook }`: качает сохранённый
`{...}_bg.png` из Storage (`storage.js: downloadBg`), ре-рендерит `renderCard()` и перезаписывает
только финальный PNG + `title/hook` в БД (`run.js: renderPinTextById`, `storage.js: updatePinText`),
без нового вызова FLUX. UI: кнопка-карандаш на карточке Верстака (`src/screens/Workbench.jsx`) —
инлайн title/hook, «Сохранить текст» → `api.js: regeneratePinText`. Проверено сквозным прогоном.

### 2. Оплата (PayPal Subscriptions) + купоны — ✅ КОД ГОТОВ И ЗАКОММИЧЕН (2026-07-29, коммит `a538694`), ЖДЁТ КЛЮЧЕЙ
Подробный план и почему именно так — `spec/ПЛАН-ДВИЖОК.md`. **2026-07-31: независимый аудит
безопасности/работоспособности** — подробности в `spec/АУДИТ-2026-07-31.md`. Нашли и в тот же
день починили одну реальную дыру: `dbForUser()` из-за обязательного `SUPABASE_SERVICE_ROLE_KEY`
тихо обходил RLS для всех пользовательских запросов (`/api/generate`, `/api/regenerate`,
`/api/render-pin`) — единственной защитой от чтения чужих данных оставались ручные проверки
`user_id` в хендлерах. Исправлено и проверено вживую (коммит `438f91d`): `dbForUser()` снова
работает от имени пользователя (RLS реально включён), `consumeCredit()` явно и точечно пишет
через `supabaseAdmin` (это единственная легитимная запись в защищённую триггером колонку
`profiles.credits_remaining`). Остальное по итогам аудита — либо уже было ОК, либо не баг
(нюансы формулировки чек-листа), либо честно не проверено из-за отсутствующих ключей PayPal
(см. файл аудита). Коротко, что сделано (Этап 2 в целом):
- Купоны — миграция применена, RPC `redeem_coupon`, UI, гейтинг — всё живое, проверено прогоном.
- Подписка: кнопка PayPal на `Source.jsx` (`src/components/PayPalSubscribeButton.jsx`), подтверждение
  через `server/handlers/paypal-subscribe.js` (сервер сам спрашивает статус у PayPal, не доверяет
  клиенту), продление/отмена — вебхук `server/handlers/paypal-webhook.js` (проверяет подпись PayPal).
  Доступ по подписке — по дате `subscription_current_period_end`: держится до конца оплаченного
  периода, даже если уже отменена в кабинете PayPal (отмена — только там, кнопки «отменить» в
  приложении нет специально, решение принято в этом заходе).
- Экран `/admin` (`src/screens/Admin.jsx`) — выдача новых купонов, доступ по `ADMIN_EMAIL`.
- **Где в приложении кнопка PayPal:** экран «Источник» (`Source.jsx`), карточка сразу под блоком
  купона («Или оформи подписку — $15/мес»). Рендерится компонентом `PayPalSubscribeButton.jsx`,
  показывается автоматически, когда `paywall=true` (сервер вернул 402 — бесплатные генерации
  кончились). Теперь `PAYPAL_PLAN_ID`/`VITE_PAYPAL_PLAN_ID` заполнены — компонент должен
  рендерить настоящую кнопку PayPal, а не заглушку (живой клик пользователем ещё не проверялся).
  Блок в том же белом карточном стиле, что и купон, прямо под ним.

- **Статус ключей на 2026-08-05: всё заполнено** (подробности — в разделе «Переменные окружения»
  выше). `PAYPAL_PLAN_ID`/`VITE_PAYPAL_PLAN_ID`/`PAYPAL_WEBHOOK_ID` заведены не кликами по
  дашборду (интерфейс PayPal успел смениться, старый маршрут по кликам не совпал с реальным
  экраном), а напрямую через PayPal REST API (Catalog Products → Billing Plans → Webhooks) —
  тем же Sandbox-ключом `PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET`, который пользователь уже
  вставил раньше. Значения перенесены и в Vercel, прод передеплоен.
  - После вставки `PAYPAL_PLAN_ID` — перезапустить dev-сервер (`.env` читается только при старте),
    затем можно проверить кнопку живьём: тестовый Sandbox-покупатель — в
    developer.paypal.com/dashboard → Sandbox → Accounts (аккаунт с пометкой Personal).
- **Гео-нюанс (от пользователя, не менялось):** PayPal (как и Stripe) не принимает платежи из РФ.

### 3. Английский язык (мультиязык) — не начато
- Флаг языка (в UI + профиль). Методист выдаёт заголовки/хуки на выбранном языке (в `llm.js` — параметр `lang`).
- FLUX-сцена уже языконезависима (текст на картинке не рисуем). UI-строки — вынести в словарь (i18n).
- RTL не требуется.

### 4. Деплой на Vercel — ✅ СДЕЛАНО (2026-08-01), публичный URL живой
- **Сделано (2026-07-26):** PWA (`vite-plugin-pwa`, иконки в `public/`), serverless-архитектура:
  общие обработчики `server/handlers/*` + точки входа `api/*.js`; **пофункциональный рендер**
  (`/api/generate` планирует пак и создаёт строки пинов со статусом `processing`; `/api/render-pin`
  рисует ОДИН пин — влезает в лимит времени). Фронт `Analysis.jsx` оркеструет рендер по пину с прогрессом.
  `vercel.json` (SPA-rewrite). Шрифты — из `assets/fonts` (закоммичены) или `/tmp`. `pins.status` теперь
  допускает `processing` (миграция `pins_status_allow_processing`). Проверено локально end-to-end + ZIP.
- **Деплой (2026-08-01):** проект связан через CLI (`vercel link --project=naturopin`,
  токен из `VERCEL_TOKEN` в `.env`), org `my-infinity-gift`. Все непустые переменные из `.env`
  перенесены в Vercel через API (значения нигде не печатались, только имена/статус). Пустыми
  остались `PAYPAL_WEBHOOK_ID`/`PAYPAL_PLAN_ID`/`VITE_PAYPAL_PLAN_ID` — как и в `.env` (см. раздел
  «Оплата» выше, ждут ручного шага в PayPal Dashboard). Прод-деплой (`vercel deploy --prod`) прошёл
  успешно.
- **Публичный URL: `https://microsaasnaturopin10.vercel.app`** — проверен живьём: главная
  страница `HTTP 200`, `/api/health` → `{ok:true, real_ai:true}`. Открой на телефоне для
  финальной визуальной проверки (PWA/мобильная вёрстка) — этот шаг руками не делал.
- Storage/БД — Supabase уже облачные, не менялись.
- **Следующий шаг для PayPal-live-тестов:** когда заведёшь `PAYPAL_PLAN_ID`/`PAYPAL_WEBHOOK_ID`
  (см. раздел «Оплата» выше) — добавить их так же через Vercel API или дашборд и передеплоить
  (`vercel deploy --prod --token=...`), либо просто `git push` — теперь, когда проект связан,
  Vercel по умолчанию деплоит автоматически при пуше в `main` (если Git Integration включена в
  дашборде проекта; если деплоится только через CLI — так и оставить, тоже нормально).

## Определение готовности Этапа 2
Каждая фича — сквозной живой путь на реальных данных, проверенный в приложении (смоук-скрипт или браузерный прогон),
без регрессий Этапа 1 (генерация пака + ZIP работают) и без регрессий уже сданных кусков Этапа 2.
