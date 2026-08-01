# Автопилот — правила работы агента в этом проекте

## Онбординг
В начале любой новой сессии (новый агент, новое окно) — сначала прочитай `HANDOFF.md` в корне
репозитория целиком. Там полная карта проекта, текущий статус Этапа 2 и что делать дальше.

## Гейт на плане
Прежде чем менять уже согласованный с пользователем план работы — остановись, покажи новый план и жди явного «ок». Не подменяй согласованный план молча на ходу.

## Разрешено без переспроса
(технически закреплено в `.claude/settings.json` → `permissions.allow`)
- Чтение и запись файлов проекта
- `git add` / `git commit` / `git push` (без `--force`)
- Создание и применение Supabase-миграций (`mcp__supabase__apply_migration`)
- Деплой Edge Functions (`mcp__supabase__deploy_edge_function`)
- Запуск тестов и линтеров

## Всегда спрашивать явно, не автоматизировать
(закреплено в `.claude/settings.json` → `permissions.ask` и `autoMode.soft_deny`)
- `DROP`/`TRUNCATE`/`DELETE` без `WHERE` — на любой таблице
- Сброс или пересоздание базы/ветки Supabase (`reset_branch`, `delete_branch`)
- Откат или замена уже применённой чужой миграции
- Вывод, логирование или пересылка значений секретов/API-ключей (ключ никогда не появляется в чате)
- Изменение файлов рабочей трубы Части 1: `server/pipeline/**`, `server/handlers/**`, `server/index.js`, `src/screens/{Source,Analysis,Workbench,Finish}.jsx`, `src/lib/api.js`, `src/components/layout/AppLayout.jsx`
- `git push --force`, `git reset --hard`, `sudo`
- Любое платное обращение к внешнему API сверх одного тестового вызова
