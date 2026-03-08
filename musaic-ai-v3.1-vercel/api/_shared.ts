/**
 * Shared utilities for all Vercel API routes.
 * Firebase Admin (singleton), auth verification, Stripe.
 */
import * as admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Firebase Admin Singleton ────────────────────────────
let _db: admin.firestore.Firestore | null = null;

export function getDb() {
  if (!_db) {
    if (admin.apps.length === 0) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(serviceAccount)),
          projectId: process.env.FIREBASE_PROJECT_ID || 'utility-destiny-389408',
        });
      } else {
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'utility-destiny-389408',
        });
      }
    }
    _db = getFirestore();
  }
  return _db;
}

export { FieldValue };

// ─── Stripe Singleton ────────────────────────────────────
let _stripe: Stripe | null = null;
export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
  }
  return _stripe;
}

// ─── Auth Middleware for Vercel ───────────────────────────
export interface AuthUser {
  uid: string;
  email?: string;
}

export async function verifyAuth(req: VercelRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split('Bearer ')[1];
  try {
    // Ensure Firebase is initialized
    getDb();
    const decoded = await admin.auth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}

export async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<AuthUser | null> {
  const user = await verifyAuth(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return user;
}

// ─── CORS helper ─────────────────────────────────────────
export function cors(req: VercelRequest, res: VercelResponse): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

export const ADMIN_EMAIL = 'contact.musaicai@gmail.com';
