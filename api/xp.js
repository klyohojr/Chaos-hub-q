export default async function handler(req, res) {
  const user = (req.query.user || '').trim();
  if (!user) return res.status(400).json({ error: 'Missing ?user=' });

  const BASE = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!BASE || !TOKEN) return res.status(500).json({ error: 'KV env vars missing' });

  if (req.method === 'POST') {
    try {
      const body = await readJson(req);
      // store as a hash (HSET) with path-style
      const resp = await fetch(
        `${BASE}/hset/${encodeURIComponent('xp:'+user)}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type':'application/json' },
          body: JSON.stringify([
            'xp', String(Number(body.xp) || 0),
            'mischief', String(Number(body.mischief) || 0),
            'level', String(Number(body.level) || 0),
            'timestamp', body.timestamp || new Date().toISOString(),
            'source', 'app'
          ])
        }
      );
      const data = await resp.json();
      if (data.error) return res.status(500).json(data);
      return res.status(200).json({ ok: true });
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }

  // GET: HGETALL path-style
  const r = await fetch(`${BASE}/hgetall/${encodeURIComponent('xp:'+user)}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  const j = await r.json();
  const data = j.result ? arrayToObject(j.result) : null;
  return res.status(200).json({ user, data });
}

function readJson(req){return new Promise((res,rej)=>{let s='';req.on('data',c=>s+=c);req.on('end',()=>{try{res(JSON.parse(s||'{}'))}catch(e){rej(e)}})})}
function arrayToObject(arr){const o={};for(let i=0;i<arr.length;i+=2){const k=arr[i],v=arr[i+1];o[k]=isFinite(v)?Number(v):v}return o}
