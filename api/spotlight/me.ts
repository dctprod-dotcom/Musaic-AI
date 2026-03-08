import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, requireAuth, cors } from '../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const db = getDb();
  const snapshot = await db.collection('smartlinks').where('userId', '==', user.uid).limit(1).get();

  if (!snapshot.empty) {
    const linkDoc = snapshot.docs[0];
    const link = linkDoc.data();
    const clicksSnapshot = await db.collection('smart_link_clicks').where('smartLinkId', '==', linkDoc.id).get();
    const platformCounts: Record<string, number> = {};
    clicksSnapshot.forEach(d => { const p = d.data().platform; platformCounts[p] = (platformCounts[p] || 0) + 1; });
    const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    res.json({ id: linkDoc.id, ...link, topPlatform });
  } else {
    res.json(null);
  }
}
