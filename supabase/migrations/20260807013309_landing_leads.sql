-- Заявки с публичного лендинга (landing/index.html). Пишет только сервер
-- через service_role (см. api/lead.js) — клиенту прямой доступ не открыт,
-- по тому же паттерну, что и таблица coupons.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null,
  about text,
  source text not null default 'landing',
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;
-- Политик нет намеренно: anon/authenticated не имеют доступа вообще,
-- запись и чтение — только через service_role (серверный API-роут).
