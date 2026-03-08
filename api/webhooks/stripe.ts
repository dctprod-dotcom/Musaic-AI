import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, getStripe, FieldValue } from '../_shared.js';

// Vercel: disable body parsing for webhook signature verification
export const config = { api: { bodyParser: false } };

async function buffer(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = getStripe();
  const db = getDb();
  const sig = req.headers['stripe-signature'] as string;
  const body = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const session = event.data.object as any;

  switch (event.type) {
    case 'checkout.session.completed': {
      const userId = session.metadata.userId;
      const customerId = session.customer;
      const userRef = db.collection('users').doc(userId);

      if (session.mode === 'subscription') {
        await userRef.update({ isPro: true, stripeCustomerId: customerId });
      } else {
        const pointsToAdd = parseInt(session.metadata.points);
        await db.runTransaction(async (t) => {
          const userDoc = await t.get(userRef);
          if (!userDoc.exists) return;
          const currentPoints = userDoc.data()?.points || 0;
          t.update(userRef, { points: currentPoints + pointsToAdd, stripeCustomerId: customerId });
          t.set(db.collection('transactions').doc(), {
            userId, amount: pointsToAdd, description: 'Points Purchase',
            createdAt: FieldValue.serverTimestamp()
          });
        });
      }
      break;
    }
    case 'invoice.payment_failed':
    case 'customer.subscription.deleted': {
      const customer = session.customer as string;
      const snapshot = await db.collection('users').where('stripeCustomerId', '==', customer).get();
      snapshot.forEach(doc => doc.ref.update({ isPro: false }));
      break;
    }
  }

  res.json({ received: true });
}
