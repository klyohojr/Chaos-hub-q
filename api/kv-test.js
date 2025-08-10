export default async function handler(req, res) {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.KV_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN;

  if (!url || !token) return res.status(500).json({ error: 'KV env vars missing', url: !!url, token: !!token });

  const usePipeline = req.query.pipeline === '1'; // ?pipeline=1 forces pipeline format

  // set a test value if ?set=1
  if (req.query.set) {
    const setResp = await kv(url, token, 'SET', ['chaos:test', 'ok'], usePipeline);
    if (setResp.error) return res.status(500).json({ step: 'set', error: setResp.error, raw: setResp });
  }

  const getResp = await kv(url, token, 'GET', ['chaos:test'], usePipeline);
  return res.status(200).json({
    kv_ok: getResp.result === 'ok',
    format: usePipeline ? 'pipeline' : 'single',
    raw: getResp
  });
}

async function kv(url, token, cmd, args, pipeline) {
  const body = pipeline
    ? { commands: [[cmd, ...args]] }   // pipeline style
    : { cmd, args };                   // single-command style

  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return r.json();
}
