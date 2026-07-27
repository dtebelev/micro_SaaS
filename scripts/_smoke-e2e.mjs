// Сквозной серверный тест: регистрация → вход → /api/generate → поллинг → пины.
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const API = `http://localhost:${process.env.API_PORT || 8787}`
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

const email = `natasha.${Date.now()}@gmail.com`
const password = 'test123456'

const article = `Сенсорная перегрузка у ребёнка с аутизмом случается, когда вокруг слишком много стимулов.
Признаки перегрузки: ребёнок закрывает уши, убегает, кричит или замирает.
Первый шаг — снизить нагрузку: увести в тихое место, приглушить свет, убрать лишние звуки.
Помогает утяжелённое одеяло и медленное глубокое дыхание вместе с ребёнком.
Планируйте день предсказуемо: визуальное расписание снижает тревогу.
Делайте сенсорные перерывы заранее, не дожидаясь срыва — это профилактика.`

const j = (r) => r.json()

console.log('1) регистрация', email)
let { data, error } = await sb.auth.signUp({ email, password })
if (error) throw error
if (!data.session) {
  const r = await sb.auth.signInWithPassword({ email, password })
  if (r.error) throw r.error
  data = r.data
}
const token = data.session.access_token
console.log('   вошли, user', data.user.id.slice(0, 8))

console.log('2) POST /api/generate')
const gen = await fetch(`${API}/api/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ source_text: article }),
}).then(j)
if (gen.error) throw new Error('generate: ' + gen.error)
console.log('   project_id', gen.project_id)

console.log('3) поллинг статуса…')
let status = 'processing'
for (let i = 0; i < 60 && status === 'processing'; i++) {
  await new Promise((r) => setTimeout(r, 2000))
  const { data: p } = await sb.from('projects').select('status,error_message,title').eq('id', gen.project_id).single()
  status = p.status
  process.stdout.write(`   [${i}] ${status}${p.error_message ? ' — ' + p.error_message : ''}\n`)
  if (status === 'error') throw new Error('проект в ошибке: ' + p.error_message)
}
if (status !== 'ready') throw new Error('не дождались ready')

console.log('4) читаем пины (RLS: только свои)')
const { data: pins, error: pErr } = await sb
  .from('pins').select('*').eq('project_id', gen.project_id).order('position')
if (pErr) throw pErr
console.log(`   пинов: ${pins.length}`)
for (const p of pins) console.log(`   • [${p.position}] ${p.type} — "${p.title}" (${p.items?.length} п.) img=${p.image_path ? 'да' : 'нет'}`)

console.log('5) подписанная ссылка на первый PNG')
const { data: signed, error: sErr } = await sb.storage.from('pins').createSignedUrl(pins[0].image_path, 600)
if (sErr) throw sErr
const head = await fetch(signed.signedUrl)
console.log('   PNG доступен:', head.status, head.headers.get('content-type'), head.headers.get('content-length') + 'B')

console.log('\n✅ Сквозной путь работает: вход → генерация → сохранение → RLS-чтение → Storage.')
process.exit(0)
