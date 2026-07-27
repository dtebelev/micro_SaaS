// ============================================================
//  Пример Supabase Edge Function (Deno).
//  service_role берётся из СЕКРЕТОВ окружения функции, а не из кода
//  и не из фронтенда. Задать секрет:
//    supabase secrets set SERVICE_ROLE_KEY="ваш_service_role_key"
//  Развернуть:
//    supabase functions deploy secure-example
// ============================================================
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (_req) => {
  // SUPABASE_URL и SERVICE_ROLE_KEY доступны только внутри функции (сервер).
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Пример: серверная операция с полным доступом (обходит RLS).
  const { error } = await supabaseAdmin.auth.getUser().catch(() => ({ error: null }));

  return new Response(
    JSON.stringify({ ok: !error, message: 'service_role работает только на сервере' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
