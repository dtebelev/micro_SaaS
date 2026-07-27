// ============================================================
//  Проверка связи с Supabase.
//  Запуск:  npm run check:supabase
//  Читает .env, проверяет публичный (anon) и, если задан,
//  серверный (service_role) доступ.
// ============================================================
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;

const line = () => console.log('─'.repeat(52));

function missing(name) {
  return !process.env[name] || process.env[name].trim() === '';
}

line();
console.log('Проверка подключения к Supabase');
line();

const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const notFilled = required.filter(missing);

if (notFilled.length) {
  console.log('⚠  Ключи ещё не заполнены в .env:');
  notFilled.forEach((n) => console.log('   • ' + n));
  console.log('\nВставьте значения из Supabase → Settings → API в файл .env');
  console.log('и снова запустите:  npm run check:supabase');
  process.exit(1);
}

// --- 1. Публичный (anon) клиент — как во фронтенде ---
try {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  // Лёгкий запрос к Auth — не требует таблиц, проверяет URL+ключ+сеть.
  const { error } = await supabase.auth.getSession();
  if (error) throw error;
  console.log('✅ anon (публичный) клиент: связь установлена');
} catch (err) {
  console.log('❌ anon клиент: ошибка связи');
  console.log('   ' + (err.message || err));
  process.exit(1);
}

// --- 2. Серверный (service_role) клиент — только если ключ задан ---
if (!missing('SUPABASE_SERVICE_ROLE_KEY')) {
  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    // Админ-эндпоинт доступен только с service_role — заодно проверяем ключ.
    const { error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) throw error;
    console.log('✅ service_role (серверный) клиент: доступ подтверждён');
  } catch (err) {
    console.log('❌ service_role клиент: ошибка');
    console.log('   ' + (err.message || err));
    process.exit(1);
  }
} else {
  console.log('ℹ  service_role не задан — серверную проверку пропустил');
}

line();
console.log('Готово. Подключение к Supabase работает. 🎉');
line();
