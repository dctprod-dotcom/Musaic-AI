import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, requireAuth, cors, ADMIN_EMAIL } from '../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const db = getDb();
  const userDoc = await db.collection('users').doc(user.uid).get();
  const isAdmin = user.email === ADMIN_EMAIL;

  if (!userDoc.exists) {
    return res.json({ uid: user.uid, email: user.email, points: 50, isPro: false, isAdmin });
  }

  const data = userDoc.data()!;
  res.json({
    uid: user.uid,
    email: user.email,
    displayName: data.displayName || '',
    avatar: data.avatar || '',
    points: isAdmin ? 999999 : (data.points ?? 50),
    isPro: isAdmin || !!data.isPro,
    isAdmin,
  });
}
