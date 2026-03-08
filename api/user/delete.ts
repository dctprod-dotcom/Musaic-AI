import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, requireAuth, cors } from '../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const db = getDb();
  await db.collection('users').doc(user.uid).delete();
  res.json({ success: true });
}
