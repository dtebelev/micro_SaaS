// Уведомления в Telegram (например, о новой заявке с лендинга).
// Не настроено (нет TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID) — тихо ничего не делает,
// вызывающий код не должен падать из-за этого (уведомление — не критичная часть).
export async function notifyTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Telegram API ${res.status}: ${body}`)
  }
}
