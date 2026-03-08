import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, FieldValue, requireAuth, cors } from '../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { code } = req.body;
  const db = getDb();

  try {
    const points = await db.runTransaction(async (t) => {
      const promoRef = db.collection('promo_codes').doc(code);
      const promoDoc = await t.get(promoRef);
      if (!promoDoc.exists || promoDoc.data()?.isUsed) throw new Error('Invalid or used promo code');

      const pts = promoDoc.data()?.points;
      t.update(promoRef, { isUsed: true });
      t.update(db.collection('users').doc(user.uid), { points: FieldValue.increment(pts) });
      t.set(db.collection('transactions').doc(), {
        userId: user.uid, amount: pts, description: `Promo Code: ${code}`,
        createdAt: FieldValue.serverTimestamp()
      });
      return pts;
    });
    res.json({ success: true, points });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
}
