// /api/xp-write.js — secure writer (requires X-Write-Token), stores in KV
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'POST only' }); }

  const token = process.env.WRITE_TOKEN;
  const provided = (req.headers['x-write-token'] || '').trim();
  if (!token || provided !== token) return res.status(401).json({ error: 'Invalid token' });

  try {
    const body = await readJson(req);
    const user = (body.user || '').trim();
    if (!user) return res.status(400).json({ error: 'Missing body.user' });

    const doc = {
      xp: Number(body.xp) || 0,
      mischief: Number(body.mischief) || 0,
      level: Number(body.level) || 0,
      timestamp: body.timestamp || new Date().toISOString(),
      source: 'assistant'
    };

    await kv('HSET', [
      `xp:${user}`,
      'xp', String(doc.xp),
      'mischief', String(doc.mischief),
      'level', String(doc.level),
      'timestamp', doc.timestamp,
      'source', doc.source
    ]);

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', c => (s += c));
    req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch (e) { reject(e); } });
  });
}

async function kv(cmd, args) {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_URL;

  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_READ_ONLY_TOKEN; // token with write perms is best

  if (!url || !token) throw new Error('KV credentials missing');

  const resp = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd, args })
  });
  return resp.json();
}
