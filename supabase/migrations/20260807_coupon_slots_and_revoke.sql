-- Именованные слоты купона FRIEND-UNLIMITED (1..7) + возможность отозвать
-- доступ конкретному человеку, не трогая остальных.

alter table coupons add column if not exists revoked_at timestamptz;

-- Старый одиночный код ещё никто не активировал (проверено) — безопасно убрать.
delete from coupons where code = 'FRIEND-UNLIMITED' and redeemed_by is null;

insert into coupons (code, kind, uses_granted, note)
select 'FRIEND-UNLIMITED-' || n, 'unlimited', null, 'Слот друга #' || n
from generate_series(1, 7) as n
on conflict (code) do nothing;
