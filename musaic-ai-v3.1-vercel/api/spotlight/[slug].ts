import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, FieldValue, cors } from '../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  const { slug, action } = req.query;
  const db = getDb();

  // POST /api/spotlight/[slug]?action=view
  if (req.method === 'POST' && action === 'view') {
    await db.collection('smartlinks').doc(slug as string).update({ views: FieldValue.increment(1) });
    return res.json({ success: true });
  }

  // POST /api/spotlight/[slug]?action=click
  if (req.method === 'POST' && action === 'click') {
    const { platform } = req.body;
    await db.collection('smart_link_clicks').add({
      smartLinkId: slug, platform, createdAt: FieldValue.serverTimestamp()
    });
    return res.json({ success: true });
  }

  // GET /api/spotlight/[slug] — public fetch
  if (req.method === 'GET') {
    const linkDoc = await db.collection('smartlinks').doc(slug as string).get();
    if (!linkDoc.exists || !linkDoc.data()?.isActive) {
      return res.status(404).json({ error: 'Spotlight not found' });
    }

    const link = linkDoc.data()!;
    let assets: any[] = [];
    try {
      const assetIds = typeof link.selectedAssets === 'string' ? JSON.parse(link.selectedAssets) : (link.selectedAssets || []);
      if (assetIds.length > 0) {
        const assetDocs = await Promise.all(assetIds.map((id: string) => db.collection('library').doc(id).get()));
        assets = assetDocs.filter(d => d.exists).map(d => ({ id: d.id, ...d.data() }));
      }
    } catch {}

    return res.json({ ...link, assets });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
