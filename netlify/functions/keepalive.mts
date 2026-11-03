// Supabase を定期的に起こして、無料枠の自動停止（一時停止）を防ぐ Netlify Scheduled Function。
// 毎日1回だけデータベースへ軽いリクエストを送る＝「使っている」とみなされ、眠りにくくなる。
const SB_URL = process.env.VITE_SUPABASE_URL || 'https://gpmdywsgqyibxmwjxbor.supabase.co'
const SB_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwbWR5d3NncXlpYnhtd2p4Ym9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMjc5MjMsImV4cCI6MjA5OTgwMzkyM30.Qt8W1RJhKdJ6SGcgXPyZAet1pTjYBjlXxxdFyHtg8YY'

export default async () => {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/members?select=id&limit=1`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
    console.log('[keepalive] supabase ping status:', res.status)
  } catch (e) {
    console.log('[keepalive] error:', String(e))
  }
  return new Response('ok')
}

export const config = { schedule: '@daily' }
