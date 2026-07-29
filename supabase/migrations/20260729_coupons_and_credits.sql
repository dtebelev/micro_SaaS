-- Купоны + пробные генерации + место под подписку.
-- Применить один раз в Supabase Dashboard → SQL Editor → New query → Run.
-- Идемпотентно (можно запускать повторно без ошибок).

alter table profiles
  add column if not exists plan text not null default 'trial'
    check (plan in ('trial', 'coupon', 'subscription')),
  add column if not exists credits_remaining int default 2, -- null = безлимит
  add column if not exists subscription_status text
    check (subscription_status in ('active', 'canceled', 'past_due')),
  add column if not exists paypal_subscription_id text,
  -- До какой даты доступ по подписке действует (в т.ч. если уже отменена,
  -- но оплаченный период не кончился). Ставит только сервер (вебхук/подтверждение PayPal).
  add column if not exists subscription_current_period_end timestamptz;

-- Одна и та же PayPal-подписка не может быть привязана к двум разным профилям.
create unique index if not exists profiles_paypal_subscription_id_key
  on profiles (paypal_subscription_id) where paypal_subscription_id is not null;

create table if not exists coupons (
  code text primary key,
  kind text not null check (kind in ('unlimited', 'uses')),
  uses_granted int, -- null для kind='unlimited'
  note text,
  redeemed_by uuid references auth.users(id),
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS включён, но никаких policy для клиента не даём — таблицу купонов
-- нельзя ни прочитать, ни перебрать напрямую. Работа с ней — только через
-- функцию ниже (security definer), которая обходит RLS изнутри.
alter table coupons enable row level security;

create or replace function redeem_coupon(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  c coupons%rowtype;
begin
  select * into c from coupons where code = p_code and redeemed_by is null for update;
  if not found then
    return json_build_object('ok', false, 'error', 'Купон не найден или уже использован');
  end if;

  update coupons set redeemed_by = auth.uid(), redeemed_at = now() where code = p_code;

  if c.kind = 'unlimited' then
    update profiles set plan = 'coupon', credits_remaining = null where id = auth.uid();
  else
    update profiles set plan = 'coupon', credits_remaining = coalesce(credits_remaining, 0) + c.uses_granted
      where id = auth.uid();
  end if;

  return json_build_object('ok', true, 'kind', c.kind, 'uses_granted', c.uses_granted);
end;
$$;

grant execute on function redeem_coupon(text) to authenticated;

-- Защита биллинговых полей profiles от прямой правки с клиента (браузер пишет
-- профиль от своего имени через RLS-политику profiles_update_own, у которой
-- нет ограничения по колонкам). Пользователь не должен суметь сам выставить
-- себе plan='subscription' через supabase.from('profiles').update(...).
-- Разрешено только: security definer функциям (выполняются как postgres,
-- напр. redeem_coupon) и серверу под service_role (вебхук/подтверждение PayPal).
create or replace function protect_profile_billing_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user not in ('postgres', 'service_role') then
    new.plan := old.plan;
    new.credits_remaining := old.credits_remaining;
    new.subscription_status := old.subscription_status;
    new.paypal_subscription_id := old.paypal_subscription_id;
    new.subscription_current_period_end := old.subscription_current_period_end;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_billing_columns_trigger on profiles;
create trigger protect_profile_billing_columns_trigger
  before update on profiles
  for each row
  execute function protect_profile_billing_columns();

-- Примеры купонов — поменяй code на свои и удали ненужные строки перед запуском:
insert into coupons (code, kind, uses_granted, note) values
  ('FRIEND-UNLIMITED', 'unlimited', null, 'Подруга — безлимит навсегда'),
  ('TRY15', 'uses', 15, 'Пробный купон на 15 генераций'),
  ('TRY10', 'uses', 10, 'Пробный купон на 10 генераций')
on conflict (code) do nothing;
