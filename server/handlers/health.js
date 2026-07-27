// GET /api/health — проверка живости.
export default async function handler(_req, res) {
  res.status(200).json({ ok: true, real_ai: String(process.env.USE_REAL_AI) === '1' })
}
