import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStripe, requireAuth, cors } from '../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { type, currency = 'usd' } = req.body;
  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const lineItems = type === 'subscription'
    ? [{ price: process.env.STRIPE_PRICE_ID_PRO, quantity: 1 }]
    : [{
      price_data: {
        currency,
        product_data: { name: '100 MUSAIC Points' },
        unit_amount: currency === 'ils' ? 3500 : 1000,
      },
      quantity: 1,
    }];

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: type === 'subscription' ? 'subscription' : 'payment',
    success_url: `${appUrl}?success=true`,
    cancel_url: `${appUrl}?canceled=true`,
    customer_email: user.email,
    metadata: { userId: user.uid, points: type === 'points' ? '100' : '0' }
  });

  res.json({ url: session.url });
}
