// ============================================================
//  Клиент Supabase для ФРОНТЕНДА (браузер).
//  Использует ТОЛЬКО публичные ключи: URL + anon.
//  service_role сюда попадать НЕ должен — он живёт на сервере.
//  Значения берутся из Vite: import.meta.env.VITE_*.
// ============================================================
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Не заданы VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Заполните .env (см. .env.example).'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
