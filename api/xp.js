export default async function handler(req, res) {
  globalThis._xpCache = globalThis._xpCache || new Map();
  const user = (req.query.user || '').trim();
  if (!user) return res.status(400).json({ error: 'Missing ?user=' });
  if (req.method === 'POST') {
    try {
      const body = await readJson(req);
      globalThis._xpCache.set(user, {
        xp: Number(body.xp) || 0,
        mischief: Number(body.mischief) || 0,
        level: Number(body.level) || 0,
        timestamp: body.timestamp || new Date().toISOString()
      });
      return res.status(200).json({ ok: true });
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }
  if (req.method === 'GET') {
    const data = globalThis._xpCache.get(user) || null;
    return res.status(200).json({ user, data });
  }
  res.setHeader('Allow','GET, POST'); res.status(405).end();
}
function readJson(req){return new Promise((resolve,reject)=>{let s='';req.on('data',c=>s+=c);req.on('end',()=>{try{resolve(JSON.parse(s||'{}'))}catch(e){reject(e)}})})}
