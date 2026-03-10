// ─────────────────────────────────────────────────────────
// Musaic AI — Firebase Configuration
// ─── REFERENCE FILE ───
// Compare this with YOUR firebase.ts. If yours differs,
// update it to match this structure.
// ─────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ── Firebase config from environment variables ──
// These MUST be set in Vercel → Settings → Environment Variables
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// ── DEBUG: Log config status (remove in production) ──
console.log('[Firebase] Config check:', {
  apiKey:     firebaseConfig.apiKey ? '✅ set' : '❌ MISSING',
  authDomain: firebaseConfig.authDomain ? `✅ ${firebaseConfig.authDomain}` : '❌ MISSING',
  projectId:  firebaseConfig.projectId ? `✅ ${firebaseConfig.projectId}` : '❌ MISSING',
  storageBucket: firebaseConfig.storageBucket ? '✅ set' : '⚠️ missing (optional)',
  appId:      firebaseConfig.appId ? '✅ set' : '❌ MISSING',
});

// ── CRITICAL CHECK ──
// authDomain MUST be either:
//   1. "your-project.firebaseapp.com" (default)
//   2. Your custom domain (if configured)
// If it's wrong, Google Sign-In WILL fail silently
if (firebaseConfig.authDomain) {
  console.log('[Firebase] authDomain is:', firebaseConfig.authDomain);
  console.log('[Firebase] Current window.location.hostname is:', window.location.hostname);
} else {
  console.error('[Firebase] ❌ CRITICAL: No authDomain configured! Set VITE_FIREBASE_AUTH_DOMAIN in Vercel.');
}

// ── Initialize Firebase ──
const app = initializeApp(firebaseConfig);

// ── Auth ──
export const auth = getAuth(app);
console.log('[Firebase] Auth initialized:', !!auth);

// ── Google Provider ──
export const googleProvider = new GoogleAuthProvider();
// Force account selection every time (helps debug)
googleProvider.setCustomParameters({ prompt: 'select_account' });
console.log('[Firebase] Google provider ready');

// ── Firestore ──
export const db = getFirestore(app);

// ── Storage (for MediaLibrary file uploads) ──
export let storage: any = null;
try {
  storage = getStorage(app);
  console.log('[Firebase] Storage initialized');
} catch (err) {
  console.warn('[Firebase] Storage not available (optional):', err);
}

export default app;
