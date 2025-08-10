// Read (GET) and app write (POST) via Upstash KV/Redis REST
export default async function handler(req, res) {
  const user = (req.query.user || '').trim();
  if (!user) return res.status(400).json({ error: 'Missing ?user=' });

  if (req.method === 'POST') {
    // App posts here without a token
    try {
      const body = await readJson(req);
      const doc = {
        xp: Number(body.xp) || 0,
        mischief: Number(body.mischief) || 0,
        level: Number(body.level) || 0,
        timestamp: body.timestamp || new Date().toISOString(),
        source: 'app'
      };
      await kv('HSET', [`xp:${user}`,
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

  // GET — return current values
  const r = await kv('HGETALL', [`xp:${user}`]);
  const data = hashToObject(r.result);
  return res.status(200).json({ user, data });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', c => s += c);
    req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch (e) { reject(e); }});
  });
}

// ---- Upstash/Vercel KV REST helper (supports both env var names) ----
async function kv(cmd, args) {
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error('KV credentials missing: add Upstash Redis to the project.');
  }
  const resp = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd, args })
  });
  return resp.json();
}

function hashToObject(arr) {
  if (!arr || arr.length === 0) return null;
  const obj = {};
  for (let i = 0; i < arr.length; i += 2) {
    const k = arr[i]; const v = arr[i + 1];
    obj[k] = isFinite(v) ? Number(v) : v;
  }
  return obj;
}
