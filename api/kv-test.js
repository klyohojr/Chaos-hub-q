export default async function handler(req, res) {
  const URL  = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL; // do NOT use KV_URL
  const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN; // write-capable

  if (!URL || !TOKEN) {
    return res.status(500).json({ error: 'KV REST env vars missing', URL: !!URL, TOKEN: !!TOKEN });
  }

  // SET (only when ?set=1)
  if (req.query.set === '1') {
    const setResp = await fetch(`${URL}/set/${encodeURIComponent('chaos:test')}/${encodeURIComponent('ok')}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    const setJson = await setResp.json();
    if (setJson.error) return res.status(500).json({ step: 'set', ...setJson });
  }

  // GET
  const getResp = await fetch(`${URL}/get/${encodeURIComponent('chaos:test')}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  const getJson = await getResp.json();

  res.status(200).json({ kv_ok: getJson.result === 'ok', raw: getJson });
}
