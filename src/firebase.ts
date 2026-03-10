// ─────────────────────────────────────────────────────────
// Musaic AI — Firebase Configuration (Production)
// ─────────────────────────────────────────────────────────
// INSTRUCTIONS:
// 1. Replace YOUR current firebase.ts with this file
// 2. Set ALL env vars in Vercel → Settings → Env Variables
// 3. Redeploy
// ─────────────────────────────────────────────────────────

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// ── Build config from env vars (Vite convention: VITE_ prefix) ──
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '',
};

// ── DEBUG: Show exactly what's configured ──
const hostname = typeof window !== 'undefined' ? window.location.hostname : 'ssr';
console.log('═══════════════════════════════════════════');
console.log('[Firebase] 🔧 Configuration Debug');
console.log('───────────────────────────────────────────');
console.log('[Firebase] Current hostname:', hostname);
console.log('[Firebase] authDomain:', firebaseConfig.authDomain || '❌ EMPTY — SET VITE_FIREBASE_AUTH_DOMAIN!');
console.log('[Firebase] projectId:', firebaseConfig.projectId || '❌ EMPTY');
console.log('[Firebase] apiKey:', firebaseConfig.apiKey ? `✅ ${firebaseConfig.apiKey.substring(0, 8)}...` : '❌ EMPTY');
console.log('[Firebase] appId:', firebaseConfig.appId ? '✅ set' : '❌ EMPTY');
console.log('[Firebase] storageBucket:', firebaseConfig.storageBucket || '⚠️ empty (optional)');
console.log('═══════════════════════════════════════════');

// ── Validate critical fields ──
const missingFields = [];
if (!firebaseConfig.apiKey) missingFields.push('VITE_FIREBASE_API_KEY');
if (!firebaseConfig.authDomain) missingFields.push('VITE_FIREBASE_AUTH_DOMAIN');
if (!firebaseConfig.projectId) missingFields.push('VITE_FIREBASE_PROJECT_ID');
if (!firebaseConfig.appId) missingFields.push('VITE_FIREBASE_APP_ID');

if (missingFields.length > 0) {
  console.error(`[Firebase] ❌ CRITICAL: Missing env vars: ${missingFields.join(', ')}`);
  console.error('[Firebase] → Go to Vercel → Settings → Environment Variables → add them');
  console.error('[Firebase] → Then redeploy (Vercel → Deployments → Redeploy)');
}

// ── Domain check — the #1 cause of Google Sign-In failures ──
if (firebaseConfig.authDomain && hostname !== 'localhost') {
  console.log(`[Firebase] 🌐 Domain check: You're on "${hostname}"`);
  console.log(`[Firebase]    authDomain is "${firebaseConfig.authDomain}"`);
  console.log(`[Firebase]    ℹ️ Make sure "${hostname}" is added in:`);
  console.log(`[Firebase]    Firebase Console → Authentication → Settings → Authorized domains`);
}

// ── Initialize Firebase ──
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let googleProvider: GoogleAuthProvider;
let storage: FirebaseStorage | null = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });

  console.log('[Firebase] ✅ App initialized successfully');

  // Storage (optional — for file uploads in MediaLibrary)
  try {
    if (firebaseConfig.storageBucket) {
      storage = getStorage(app);
      console.log('[Firebase] ✅ Storage ready');
    }
  } catch (storageErr) {
    console.warn('[Firebase] ⚠️ Storage init failed (non-blocking):', storageErr);
  }
} catch (err) {
  console.error('[Firebase] ❌ FATAL: App initialization failed:', err);
  // Create dummy objects so the app doesn't crash on import
  // The auth will simply fail gracefully
  throw err;
}

export { auth, db, googleProvider, storage };
export default app;
