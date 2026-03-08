import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, FieldValue, requireAuth, cors, ADMIN_EMAIL } from '../_shared.js';

function slugify(text: string): string {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const db = getDb();
  const userRef = db.collection('users').doc(user.uid);
  const userDoc = await userRef.get();
  const userData = userDoc.data() || {};
  const isAdmin = user.email === ADMIN_EMAIL;

  if (!userData.isPro && !isAdmin) {
    return res.status(403).json({ error: 'Smart Link Studio is a Pro feature' });
  }

  const { profileName, bio, socialMedia, selectedAssets, theme, buttonStyle, buttonColor, backgroundMotion, slug: requestedSlug, profileImage } = req.body;

  const snapshot = await db.collection('smartlinks').where('userId', '==', user.uid).limit(1).get();
  let currentLinkDoc = snapshot.empty ? null : snapshot.docs[0];
  let slug = requestedSlug || currentLinkDoc?.id;

  if (!slug) {
    slug = slugify(profileName);
    let counter = 0;
    const original = slug;
    while ((await db.collection('smartlinks').doc(slug).get()).exists) { counter++; slug = `${original}-${counter}`; }
  } else {
    const existing = await db.collection('smartlinks').doc(slug).get();
    if (existing.exists && existing.data()?.userId !== user.uid) {
      return res.status(400).json({ error: 'Slug is already taken' });
    }
  }

  const COST = 15;
  const linkPayload = {
    userId: user.uid, slug, profileName, bio,
    socialMedia: JSON.stringify(socialMedia), selectedAssets: JSON.stringify(selectedAssets),
    theme, buttonStyle, buttonColor, backgroundMotion: !!backgroundMotion, profileImage,
  };

  try {
    await db.runTransaction(async (t) => {
      const tUserDoc = await t.get(userRef);
      const tUserData = tUserDoc.data() || {};

      if (!currentLinkDoc) {
        if ((tUserData.points || 0) < COST && !isAdmin) throw new Error('Insufficient tokens');
        if (!isAdmin) {
          t.update(userRef, { points: FieldValue.increment(-COST) });
          t.set(db.collection('transactions').doc(), {
            userId: user.uid, amount: -COST, description: 'Smart Link Publication',
            createdAt: FieldValue.serverTimestamp()
          });
        }
        t.set(db.collection('smartlinks').doc(slug), { ...linkPayload, isActive: true, views: 0, createdAt: FieldValue.serverTimestamp() });
      } else {
        if (slug !== currentLinkDoc.id) {
          t.set(db.collection('smartlinks').doc(slug), { ...currentLinkDoc.data(), ...linkPayload });
          t.delete(currentLinkDoc.ref);
        } else {
          t.update(currentLinkDoc.ref, linkPayload);
        }
      }
    });
    res.json({ success: true, slug });
  } catch (e: any) {
    if (e.message === 'Insufficient tokens') return res.status(402).json({ error: e.message, required: COST });
    res.status(500).json({ error: e.message });
  }
}
