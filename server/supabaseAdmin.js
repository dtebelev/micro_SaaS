// ============================================================
//  Клиент Supabase для СЕРВЕРА (админ-доступ).
//  Использует service_role — он ОБХОДИТ Row Level Security.
//  Импортируйте этот модуль ТОЛЬКО в серверном коде
//  (Edge Functions, API-роуты). НИКОГДА — в браузере/фронтенде.
// ============================================================
import { createClient } from '@supabase/supabase-js';

// Ленивая инициализация: импорт модуля не должен падать, если ключ ещё не
// вставлен (иначе весь сервер не стартует из-за одного неготового маршрута).
// Падаем громко только в момент, когда админ-клиент реально понадобился.
let client = null;

function getClient() {
  if (client) return client;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      'Не заданы SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (только сервер) — нужны для оплаты/вебхука/админки.'
    );
  }
  // autoRefreshToken/persistSession выключены — на сервере сессия не нужна.
  client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}

// Прокси: обращение к любому свойству (.from(...), .auth и т.п.) создаёт
// клиента лениво — снаружи выглядит как обычный supabase-js клиент.
export const supabaseAdmin = new Proxy(
  {},
  {
    get(_target, prop) {
      return getClient()[prop];
    },
  }
);
