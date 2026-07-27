// ============================================================
//  Клиент Supabase для СЕРВЕРА (админ-доступ).
//  Использует service_role — он ОБХОДИТ Row Level Security.
//  Импортируйте этот модуль ТОЛЬКО в серверном коде
//  (Edge Functions, API-роуты). НИКОГДА — в браузере/фронтенде.
// ============================================================
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    'Не заданы SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (только сервер).'
  );
}

// autoRefreshToken/persistSession выключены — на сервере сессия не нужна.
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
