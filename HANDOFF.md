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
  Этот email теперь ещё и обходит платный гейт целиком (см. «Безлимит для владельца» ниже).
- ✅ `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` заполнены (2026-08-07) — уведомление о новой заявке
  с `/landing` приходит владельцу в Telegram. Бот создан через `@BotFather`, chat_id — свой личный
  Telegram id. Пусто = уведомления просто не шлются, ничего не ломается (см. `.env.example`).
- **Осталось проверить руками:** живой клик по кнопке PayPal на публичном сайте с тестовым
  Sandbox-покупателем (developer.paypal.com/dashboard → Sandbox → Accounts) — сама кнопка теперь
  должна рендериться по-настоящему (не заглушка «скоро будет доступна»), т.к. `PLAN_ID` больше не пустой.

## Карта кода
- Фронт: `src/screens/{Auth,Source,Analysis,Workbench,Finish,Admin}.jsx`, лейаут
  `src/components/layout/AppLayout.jsx` (в меню активный шаг подсвечен lime, пройденные — с ✓;
  бейдж доступа внизу — у `ADMIN_EMAIL` показывает «Безлимит (владелец)»; пункт «Купоны» виден
  только владельцу), API-слой `src/lib/api.js`, бренд-токены `src/index.css`,
  `src/components/PayPalSubscribeButton.jsx` (кнопка подписки, сейчас скрыта флагом — см. ниже).
  `Admin.jsx` теперь три секции: выдача купонов, «Купоны-слоты» (список + кнопка «Отозвать»),
  «Заявки с лендинга».
- Бэк: `server/index.js` (роуты `/api/generate`, `/api/regenerate`, `/api/paypal-subscribe`,
  `/api/paypal-webhook`, `/api/admin-create-coupon`), те же обработчики как serverless — `api/*.js`
  (тонкие ре-экспорты `server/handlers/*`, кроме новых ниже — они не re-export, а самостоятельные
  файлы: `api/lead.js`, `api/admin-leads.js`, `api/admin-coupons.js`, `api/admin-revoke-coupon.js`).
  `server/lib/telegram.js` — `notifyTelegram(text)`, no-op если `TELEGRAM_BOT_TOKEN`/
  `TELEGRAM_CHAT_ID` не заданы. `server/pipeline/`:
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

**`coupons`**: `code` (PK), `kind` (`unlimited`/`uses`), `uses_granted`, `redeemed_by`, `redeemed_at`,
`revoked_at` (добавлено 2026-08-07). RLS включён, но клиенту не открыт вообще — читать/писать можно
только через функции: `redeem_coupon(code)` (security definer, `authenticated`) — активация.
**Важно: код одноразовый на ОДНОГО человека** — `redeem_coupon` берёт строку `where redeemed_by is
null`, после первой активации код закрыт для всех остальных навсегда (даже если `kind='unlimited'` —
это про безлимит генераций у ЭТОГО человека, не про число людей, кто может ввести код). Для нескольких
людей — заводить отдельный код на каждого.
Создание новых купонов — через `/api/admin-create-coupon` (проверка `ADMIN_EMAIL`, пишет через
service_role) или экран `/admin`. Тестовые коды в БД: `FRIEND-UNLIMITED-1` … `FRIEND-UNLIMITED-7`
(7 слотов для друзей, см. раздел «Купоны-слоты и отзыв доступа» ниже), `TRY15`, `TRY10`.

Триггеры: `handle_new_user`, `auto_confirm_email` (авто-подтверждение почты — **для локального демо; на проде заменить настройкой Auth/magic-link**), `protect_profile_billing_columns_trigger` (см. выше).

**`leads`** (миграция `20260807013309_landing_leads.sql`): заявки с публичной страницы `/landing`
(`name`, `contact`, `about`, `source`, `created_at`). RLS включён, клиенту недоступна вообще (как
`coupons`) — пишет только `api/lead.js` через `service_role`, читает только `/admin` через
`api/admin-leads.js` (проверка `ADMIN_EMAIL`).

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

## Монетизация выключена (2026-08-06) — как включить обратно

**Почему:** проект сейчас работает для одного конкретного человека (Наташи), не продаётся и не
рекламируется. Vercel Hobby (бесплатный тариф) по своим Fair Use Guidelines разрешает только
**некоммерческое личное использование** — «any method of requesting or processing payment from
visitors of the site» прямо указано как коммерческое использование, которое требует платного Pro
($20/мес). Раз оплаты сейчас никто не делает и она никому не предлагается — сайт честно
некоммерческий, и это не обход правил, а действительное текущее состояние проекта.

**Что сделано:**
- Кнопка PayPal на `Source.jsx` скрыта за флагом `VITE_MONETIZATION_ENABLED` (по умолчанию
  `false`/не задан). Код PayPal/подписки не удалён — просто не рендерится.
- Доступ выдаётся только по купону (`redeemCoupon`) — для Наташи и до 6 друзей есть 7 безлимитных
  слотов `FRIEND-UNLIMITED-1`…`-7` в БД (см. «Купоны-слоты и отзыв доступа» ниже). Плюс владелец
  (`ADMIN_EMAIL`) вообще без купона — безлимит встроен в код.
- Флаг `VITE_MONETIZATION_ENABLED=false` записан в `.env`, `.env.example` и в переменные окружения
  Vercel (production/preview/development).

**Как включить обратно, когда решишь продавать продукт:**
1. Сначала перейти на Vercel Pro ($20/мес) — Dashboard → Settings → Billing → Upgrade
   (без этого коммерческое использование снова нарушает Fair Use Guidelines Hobby).
2. В Vercel → Settings → Environment Variables поменять `VITE_MONETIZATION_ENABLED` на `true`
   (все окружения), и то же самое в локальном `.env`.
3. Передеплоить (`git push` в `main`, если включена Git-интеграция, либо
   `vercel deploy --prod --token=...`).
4. Кнопка «Оформи подписку — $15/мес» на экране «Источник» появится сама — код не менялся, только
   флаг.

## Публичный лендинг `/landing` (2026-08-06/07)

Продающая страница отдельно от самого приложения — собрана навыками `landing-builder` +
`landing-designer` из проекта. Не React-компонент, а самостоятельный HTML.

- **Живой файл — `public/landing/index.html`** (не `landing/index.html`!). Vite копирует
  `public/` в сборку как есть — только оттуда файл попадает в `dist/` и на Vercel. В `landing/`
  остались только текстовые артефакты сборки для истории/пересборки: `landing-brief.md` (бриф по
  Rule of One, одобрен резидентом), `landing-skeleton.md` (9 канонических блоков + карусель),
  `landing-copy.txt` (копия без разметки).
- **Маршрут:** `vercel.json` — явные rewrite для `/landing` и `/landing/(.*)` ПЕРЕД общим SPA
  катч-оллом `/(.*) -> /index.html` (Vercel применяет первое совпадение по порядку массива).
  Публичный адрес: `https://microsaasnaturopin10.vercel.app/landing`.
- **Картинки:** `public/landing/assets/app-workbench.png` (реальный кроп «Верстака», без email
  тестового аккаунта — обрезка через `@resvg/resvg-js`, не CSS-маскировка) + 5 слайдов из
  NotebookLM-презентации резидента (`slide-{hook,design,anatomy,why-pinterest,cta}.jpg`) — водяной
  знак «Gemini Notebook» убран клон-штампом через Pillow, «NaturoPin»-вордмарк не задет.
  Осознанно НЕ включены 3 слайда презентации, заявляющие функции, которых в продукте нет
  (авто-фильтр медицинской безопасности, авто-адаптация под 3 аудитории, встроенная аналитика —
  подробности в `landing/landing-skeleton.md`).
- **Форма заявки → `/api/lead.js`** (POST, без авторизации, honeypot-поле от ботов) → пишет в
  таблицу `leads` через service_role → шлёт `notifyTelegram()`. Ключевая деталь: `fetch` шлёт JSON
  (не `FormData`/multipart — Vercel по умолчанию не парсит multipart-тело).
- ⚠️ **PWA service worker перехватывал `/landing`**: у любого, кто уже открывал `/` раньше,
  в браузере стоит SW самого приложения; `navigateFallback` (workbox) подставлял `/index.html`
  на ЛЮБую непойманную навигацию, включая `/landing`. Починено в `vite.config.js`:
  `globIgnores: ['landing/**']` + `navigateFallbackDenylist: [/^\/landing(\/|$)/]`. Если заведёшь
  ещё одну самостоятельную статическую страницу вне SPA — не забудь так же исключить её здесь.
- Скрипт для локальной визуальной проверки: `node scripts/_shot-landing.mjs` (десктоп+375px,
  проверка переполнения, JS-ошибок, применения токенов `design/Design.md`).

## Заявки с лендинга + Telegram-уведомления (2026-08-07)

- `/admin` → секция «Заявки с лендинга»: `api/admin-leads.js` (GET, `ADMIN_EMAIL`-гейт,
  service_role) отдаёт до 200 последних заявок.
- `server/lib/telegram.js: notifyTelegram(text)` — шлёт сообщение через Bot API. Вызывается из
  `api/lead.js` **синхронно, до ответа** (не «после» — serverless-функция может «заморозиться»
  сразу за response, необождённый fetch рискует не успеть уйти). Ошибка Telegram не валит саму
  заявку (try/catch, только `console.error`).
- Настройка (нужны 2 минуты резидента, сам я это сделать не могу — требуется его Telegram):
  `@BotFather` → `/newbot` → токен; написать боту любое сообщение (иначе он не может писать первым);
  `https://api.telegram.org/bot<токен>/getUpdates` → найти `chat.id`. Подробности в `.env.example`.

## Купоны-слоты и отзыв доступа (2026-08-07)

Раньше `FRIEND-UNLIMITED` был рассчитан на ОДНОГО человека (см. пояснение в разделе «Данные» выше)
— для нескольких друзей просто не работал бы. Заменено на 7 кодов `FRIEND-UNLIMITED-1`…`-7`.
Отзыва доступа не было вообще — добавлен:
- `api/admin-revoke-coupon.js` (POST `{code}`, `ADMIN_EMAIL`-гейт) — находит `redeemed_by` по коду,
  сбрасывает `profiles.plan='trial'`, `credits_remaining=0` (доступ пропадает сразу — `getAccess()`
  в pipeline читает БД без кеша), помечает `coupons.revoked_at` (историю не стирает: `redeemed_by`
  не трогается — видно, кто им пользовался, даже после отзыва).
- `api/admin-coupons.js` (GET) — список всех купонов со статусом (свободен/активен/отозван) и email
  того, кто активировал (`supabaseAdmin.auth.admin.getUserById`).
- UI — `/admin` → секция «Купоны-слоты», кнопка «Отозвать» на каждом активном коде.
- Проверено сквозным прогоном на одноразовом тестовом пользователе (создан и удалён через
  `auth.admin`) — реальные 7 слотов не задеты.

## Безлимит для владельца (2026-08-07)

`server/handlers/generate.js` (труба Части 1 — правка была явно подтверждена резидентом): если
`user.email` совпадает с `ADMIN_EMAIL`, проверка `hasAccess()` и списание кредита (`consumeCredit`)
пропускаются целиком — купон вводить не нужно, счётчик генераций владельца не касается вообще.
Бейдж в `AppLayout.jsx` для этого email показывает «Безлимит (владелец)» вместо счётчика кредитов.
Остальных пользователей (Наташа, 7 друзей) правка не касается — код только добавляет обход, старая
ветка логики не менялась.

## Определение готовности Этапа 2
Каждая фича — сквозной живой путь на реальных данных, проверенный в приложении (смоук-скрипт или браузерный прогон),
без регрессий Этапа 1 (генерация пака + ZIP работают) и без регрессий уже сданных кусков Этапа 2.
