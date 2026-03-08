import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, FieldValue, requireAuth, cors } from '../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  const user = await requireAuth(req, res);
  if (!user) return;
  const db = getDb();

  // GET /api/library/save → shouldn't happen, but handle gracefully
  // POST /api/library/save → save asset
  if (req.method === 'POST') {
    const { type, title, artist, data: assetData, cost = 0 } = req.body;
    const userRef = db.collection('users').doc(user.uid);

    try {
      const result = await db.runTransaction(async (t) => {
        const userDoc = await t.get(userRef);
        const userData = userDoc.data() || {};

        if (type === 'video' && !userData.isPro) throw new Error('Video generation is a Pro feature');
        if ((userData.points || 0) < cost && !userData.isPro) throw new Error('Insufficient points');

        const assetRef = db.collection('library').doc();
        t.set(assetRef, {
          userId: user.uid, type, title, artist, data: assetData,
          createdAt: FieldValue.serverTimestamp()
        });

        if (cost > 0 && !userData.isPro) {
          t.update(userRef, { points: FieldValue.increment(-cost) });
          t.set(db.collection('transactions').doc(), {
            userId: user.uid, amount: -cost, description: `Generation: ${type}`,
            createdAt: FieldValue.serverTimestamp()
          });
        }
        return { id: assetRef.id };
      });
      res.json({ success: true, asset: result });
    } catch (e: any) {
      res.status(403).json({ error: e.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
