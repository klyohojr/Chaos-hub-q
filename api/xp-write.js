export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({ error:'POST only' }); }

  const tokenHdr = (req.headers['x-write-token'] || '').trim();
  if (!process.env.WRITE_TOKEN || tokenHdr !== process.env.WRITE_TOKEN)
    return res.status(401).json({ error:'Invalid token' });

  const BASE = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!BASE || !TOKEN) return res.status(500).json({ error: 'KV env vars missing' });

  try {
    const body = await readJson(req);
    const user = (body.user || '').trim();
    if (!user) return res.status(400).json({ error:'Missing body.user' });

    const resp = await fetch(
      `${BASE}/hset/${encodeURIComponent('xp:'+user)}`,
      {
        method:'POST',
        headers:{ Authorization:`Bearer ${TOKEN}`, 'Content-Type':'application/json' },
        body: JSON.stringify([
          'xp', String(Number(body.xp) || 0),
          'mischief', String(Number(body.mischief) || 0),
          'level', String(Number(body.level) || 0),
          'timestamp', body.timestamp || new Date().toISOString(),
          'source', 'assistant'
        ])
      }
    );
    const data = await resp.json();
    if (data.error) return res.status(500).json(data);
    return res.status(200).json({ ok:true });
  } catch {
    return res.status(400).json({ error:'Invalid JSON' });
  }
}
function readJson(req){return new Promise((res,rej)=>{let s='';req.on('data',c=>s+=c);req.on('end',()=>{try{res(JSON.parse(s||'{}'))}catch(e){rej(e)}})})}
