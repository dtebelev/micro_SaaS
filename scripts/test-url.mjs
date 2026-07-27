// Проверка чтения по ССЫЛКЕ: register → /api/generate {url} → поллинг → пины.
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const API = `http://localhost:${process.env.API_PORT || 8787}`
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
const url = process.argv[2] || 'https://ru.wikipedia.org/wiki/Расстройство_аутистического_спектра'

const email = `natasha.${Date.now()}@gmail.com`
const password = 'test123456'
const j = (r) => r.json()

console.log('1) вход', email)
let { data, error } = await sb.auth.signUp({ email, password })
if (error) throw error
if (!data.session) {
  const r = await sb.auth.signInWithPassword({ email, password })
  if (r.error) throw r.error
  data = r.data
}
const token = data.session.access_token

console.log('2) /api/generate со ССЫЛКОЙ:', url)
const gen = await fetch(`${API}/api/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ source_text: url }),
}).then(j)
if (gen.error) throw new Error('generate: ' + gen.error)
console.log('   project_id', gen.project_id)

console.log('3) поллинг…')
let status = 'processing'
for (let i = 0; i < 90 && status === 'processing'; i++) {
  await new Promise((r) => setTimeout(r, 2000))
  const { data: p } = await sb.from('projects').select('status,error_message').eq('id', gen.project_id).single()
  status = p.status
  if (i % 5 === 0 || status !== 'processing') console.log(`   [${i}] ${status}${p.error_message ? ' — ' + p.error_message : ''}`)
  if (status === 'error') throw new Error('проект в ошибке: ' + p.error_message)
}
if (status !== 'ready') throw new Error('не дождались ready')

const { data: pins } = await sb.from('pins').select('title,hook,image_path').eq('project_id', gen.project_id).order('position')
console.log(`\n✅ Прочитано по ссылке и собрано ${pins.length} пинов:`)
for (const p of pins) console.log(`   • ${p.title}  — img=${p.image_path ? 'да' : 'нет'}`)
process.exit(0)
