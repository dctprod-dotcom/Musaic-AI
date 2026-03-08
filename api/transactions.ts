import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, requireAuth, cors } from './_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const db = getDb();
  const snapshot = await db.collection('transactions')
    .where('userId', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .get();

  res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
}
