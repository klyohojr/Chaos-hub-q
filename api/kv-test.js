// /api/kv-test.js — path-style REST test for Upstash KV
export default async function handler(req, res) {
  const BASE  = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;   // URL
  const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN; // write-capable token

  if (!BASE || !TOKEN) {
    return res.status(500).json({ error: 'KV REST env vars missing', hasURL: !!BASE, hasTOKEN: !!TOKEN });
  }

  // Write "ok" under key chaos:test when ?set=1
  if (req.query.set === '1') {
    const setResp = await fetch(`${BASE}/set/${encodeURIComponent('chaos:test')}/${encodeURIComponent('ok')}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    const setJson = await setResp.json();
    if (setJson.error) return res.status(500).json({ step: 'set', ...setJson });
  }

  // Read it back
  const getResp = await fetch(`${BASE}/get/${encodeURIComponent('chaos:test')}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  const getJson = await getResp.json();

  return res.status(200).json({ kv_ok: getJson.result === 'ok', raw: getJson });
}
