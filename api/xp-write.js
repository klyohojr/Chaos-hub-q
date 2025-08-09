// Secure writer for Chaos Hub XP (token required)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST only' });
  }

  const token = process.env.WRITE_TOKEN;           // set in Vercel
  const provided = (req.headers['x-write-token'] || '').trim();
  if (!token || provided !== token) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // --- same lightweight “DB” used by /api/xp for now ---
  globalThis._xpCache = globalThis._xpCache || new Map();

  try {
    const body = await readJson(req);
    const user = (body.user || '').trim();
    if (!user) return res.status(400).json({ error: 'Missing body.user' });

    globalThis._xpCache.set(user, {
      xp: Number(body.xp) || 0,
      mischief: Number(body.mischief) || 0,
      level: Number(body.level) || 0,
      timestamp: body.timestamp || new Date().toISOString(),
      source: 'assistant'
    });

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
}

// helper
function readJson(req){
  return new Promise((resolve, reject)=>{
    let s=''; req.on('data', c=> s+=c);
    req.on('end', ()=>{ try { resolve(JSON.parse(s||'{}')); } catch(e){ reject(e); } });
  });
}
