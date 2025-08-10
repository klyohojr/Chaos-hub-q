// /api/kv-test.js — sanity check that KV is wired
export default async function handler(req, res) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.KV_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN;
  if (!url || !token) return res.status(500).json({ error: 'KV env vars missing', url: !!url, token: !!token });

  if (req.query.set) { await kv(url, token, 'SET', ['chaos:test', 'ok']); }
  const get = await kv(url, token, 'GET', ['chaos:test']);
  res.status(200).json({ kv_ok: get.result === 'ok', raw: get });
}

async function kv(url, token, cmd, args) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd, args })
  });
  return r.json();
}
