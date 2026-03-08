import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, requireAuth, cors } from '../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: 'Slug is required' });

  const db = getDb();
  const doc = await db.collection('smartlinks').doc(slug as string).get();
  res.json({ available: !doc.exists });
}
