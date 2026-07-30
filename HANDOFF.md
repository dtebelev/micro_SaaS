# HANDOFF — NaturoPin 1.0 (передача агенту)

> Этот файл — точка входа для нового агента, который продолжает проект. Прочитай его целиком,
> затем `spec/ТЕХ-ПЛАН.md`, `spec/ПЛАН-ДВИЖОК.md` (план оплаты/купонов), `spec/FLUX-ПРОМПТ.md`,
> `spec/ПРОМПТ-1-ЗАГОЛОВОК.md`, `spec/НАСТРОЙКА.md`.
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

**Оплата/купоны — статус ключей на 2026-07-29** (см. подробный чек-лист в разделе
«ЭТАП 2 → Оплата» ниже, там же — что делать в первую очередь):
- ✅ **Заполнены** (пользователь вставил сам, Sandbox): `PAYPAL_ENV=sandbox`, `PAYPAL_CLIENT_ID`,
  `PAYPAL_CLIENT_SECRET`, `VITE_PAYPAL_CLIENT_ID`.
- ⬜ **Пока пусто**: `PAYPAL_PLAN_ID`, `VITE_PAYPAL_PLAN_ID` (нужно создать Product + Billing Plan
  $15/мес в PayPal Dashboard), `PAYPAL_WEBHOOK_ID` (осознанно отложено — вебхук привязывается к
  реальному адресу, а его пока нет, см. ниже).
- ✅ `ADMIN_EMAIL`/`VITE_ADMIN_EMAIL` заполнены — `dtebelev@hotmail.com` (не секрет, просто адрес).

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

### 1. Правка отдельного пина (per-pin editor) — ✅ СДЕЛАНО, но НЕ ЗАКОММИЧЕНО
`/api/regenerate` принимает `{ pin_id, mode:'text', title, hook }`: качает сохранённый
`{...}_bg.png` из Storage (`storage.js: downloadBg`), ре-рендерит `renderCard()` и перезаписывает
только финальный PNG + `title/hook` в БД (`run.js: renderPinTextById`, `storage.js: updatePinText`),
без нового вызова FLUX. UI: кнопка-карандаш на карточке Верстака (`src/screens/Workbench.jsx`) —
инлайн title/hook, «Сохранить текст» → `api.js: regeneratePinText`. Проверено сквозным прогоном.
**Важно:** изменения в `server/handlers/regenerate.js`, `server/pipeline/run.js`, `src/screens/Workbench.jsx`
до сих пор лежат в рабочей копии некоммиченными (`git status` их покажет) — это отдельный, не
связанный с оплатой кусок работы, коммитить или нет — решает пользователь.

### 2. Оплата (PayPal Subscriptions) + купоны — ✅ КОД ГОТОВ И ЗАКОММИЧЕН (2026-07-29, коммит `a538694`), ЖДЁТ КЛЮЧЕЙ
Подробный план и почему именно так — `spec/ПЛАН-ДВИЖОК.md`. Коротко, что сделано:
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
  кончились). Пока `PAYPAL_PLAN_ID`/`VITE_PAYPAL_PLAN_ID` пустые — компонент вместо кнопки тихо
  показывает текст-заглушку «Оплата подпиской скоро будет доступна» (это специально, не баг).
  Скриншот расположения снят 2026-07-29 (не в репозитории, был показан пользователю в чате) —
  блок в том же белом карточном стиле, что и купон, прямо под ним.

- **Статус ключей на 2026-07-29** (кто что уже вставил в `.env` — подробности в разделе
  «Переменные окружения» выше):
  - ✅ `SUPABASE_SERVICE_ROLE_KEY` — заполнен.
  - ✅ `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `VITE_PAYPAL_CLIENT_ID` — заполнены
    (Sandbox-приложение в developer.paypal.com уже создано пользователем).
  - ⬜ `PAYPAL_PLAN_ID` / `VITE_PAYPAL_PLAN_ID` — **следующий шаг**, когда вернётся пользователь:
    developer.paypal.com/dashboard → Sandbox → Product & Plans → создать Product + Billing Plan
    (Monthly, $15.00 USD, без setup fee) → скопировать Plan ID (начинается на `P-...`) → вписать
    в обе переменные (значение одно и то же).
  - ⬜ `PAYPAL_WEBHOOK_ID` — **осознанно отложено до деплоя на Vercel** (см. пункт 4 ниже): вебхук
    указывает на реальный `https://ТВОЙ-ДОМЕН/api/paypal-webhook`, а домена пока нет. Без него
    кнопка подписки и подтверждение всё равно работают — не отработает только автопродление/отмена
    по вебхуку. Когда появится Vercel-домен: developer.paypal.com/dashboard → Sandbox app →
    Webhooks → Add Webhook → тот адрес, события «All events» → получить `PAYPAL_WEBHOOK_ID`.
  - После вставки `PAYPAL_PLAN_ID` — перезапустить dev-сервер (`.env` читается только при старте),
    затем можно проверить кнопку живьём: тестовый Sandbox-покупатель — в
    developer.paypal.com/dashboard → Sandbox → Accounts (аккаунт с пометкой Personal).
- **Гео-нюанс (от пользователя, не менялось):** PayPal (как и Stripe) не принимает платежи из РФ.

### 3. Английский язык (мультиязык) — не начато
- Флаг языка (в UI + профиль). Методист выдаёт заголовки/хуки на выбранном языке (в `llm.js` — параметр `lang`).
- FLUX-сцена уже языконезависима (текст на картинке не рисуем). UI-строки — вынести в словарь (i18n).
- RTL не требуется.

### 4. Деплой на Vercel — бэкенд перенесён, деплой не выполнен
- **Сделано (2026-07-26):** PWA (`vite-plugin-pwa`, иконки в `public/`), serverless-архитектура:
  общие обработчики `server/handlers/*` + точки входа `api/*.js`; **пофункциональный рендер**
  (`/api/generate` планирует пак и создаёт строки пинов со статусом `processing`; `/api/render-pin`
  рисует ОДИН пин — влезает в лимит времени). Фронт `Analysis.jsx` оркеструет рендер по пину с прогрессом.
  `vercel.json` (SPA-rewrite). Шрифты — из `assets/fonts` (закоммичены) или `/tmp`. `pins.status` теперь
  допускает `processing` (миграция `pins_status_allow_processing`). Проверено локально end-to-end + ZIP.
- **Осталось (внешние действия, требуют аккаунта пользователя):**
  1. `git push` — уже разрешено автопилотом (`.claude/settings.json`), можно без переспроса.
  2. Vercel → Add New → Project → Import `dtebelev/micro_SaaS` (Framework: Vite, авто). Включает авто-деплой при каждом push.
  3. Env Variables в Vercel: все переменные из `.env` — включая **новые** из раздела «Оплата» выше
     (`SUPABASE_SERVICE_ROLE_KEY` теперь обязателен, плюс `PAYPAL_*`/`VITE_PAYPAL_*`/`ADMIN_EMAIL`/`VITE_ADMIN_EMAIL`).
  4. Deploy → получить URL. `VERCEL_TOKEN` для CLI-деплоя лежит в `.env`.
- Storage/БД — Supabase уже облачные, менять не нужно.

## Определение готовности Этапа 2
Каждая фича — сквозной живой путь на реальных данных, проверенный в приложении (смоук-скрипт или браузерный прогон),
без регрессий Этапа 1 (генерация пака + ZIP работают) и без регрессий уже сданных кусков Этапа 2.
