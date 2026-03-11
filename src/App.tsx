// ─────────────────────────────────────────────────────────
// Musaic AI — App.tsx (Version mise à jour avec User Profile)
// ─────────────────────────────────────────────────────────
import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import './index.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Lock, Mail, AlertCircle, Loader2, Home,
  Menu, X, User, HelpCircle, Trash2, LayoutGrid, Video,
  FileText, LogOut, Globe, BookOpen, Image as ImageIcon,
  Sparkles, Coins, ArrowRight, CreditCard, MessageSquare,
  Send, ChevronDown, Check, Crown, Clock, ArrowLeft,
  Play
} from 'lucide-react';
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, increment, serverTimestamp
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { AIPreferences, DEFAULT_AI_PREFERENCES } from './types';
import { AIPreferencesModal } from './components/AIPreferencesModal';
import { useTranslation, LanguageCode } from './lib/i18n';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

// ── Module Imports ────────────────────────────────────────
import { SmartLinkPro } from './components/SmartLinkPro';
import { ArtworkStudio } from './components/ArtworkStudio';
import { EPKAssistant } from './components/EPKAssistant';
import { MediaLibrary } from './components/MediaLibrary';
import { callVeo3 } from './components/ai-service';

// ── Lazy Imports ──────────────────────────────────────────
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const SpotlightPublic = lazy(() => import('./components/SpotlightPublic').then(m => ({ default: m.SpotlightPublic })));
const InfoPages = lazy(() => import('./components/InfoPages').then(m => ({ default: m.InfoPages })));
const ReleaseHub = lazy(() => import('./components/ReleaseHub').then(m => ({ default: m.default })));

// ── Constants ─────────────────────────────────────────────
const ADMIN_EMAIL = "contact.musaicai@gmail.com";
const TOKEN_COSTS: Record<string, number> = { 'smart-link': 5, 'epk': 5, 'bio': 5, 'artwork': 10, 'video': 0, 'dashboard': 0, 'release-hub': 0 };

type ModuleId = 'landing' | 'dashboard' | 'smart-link' | 'bio' | 'epk' | 'video' | 'artwork' | 'tutorials' | 'membership' | 'release-hub' | 'pricing' | 'my-account' | 'media-library' | 'about' | 'faq' | 'privacy' | 'terms' | 'contact';

// ═══════════════════════════════════════════════════════════
// ─── MAIN APP COMPONENT ───────────────────────────────────
// ═══════════════════════════════════════════════════════════
function App() {
  // States
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // NOUVEAUX STATES POUR PROFIL
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [country, setCountry] = useState('');

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleId>('landing');
  const [currentLang, setCurrentLang] = useState<LanguageCode>('en');
  const [aiPreferences, setAIPreferences] = useState<AIPreferences>(DEFAULT_AI_PREFERENCES);
  const [showAIModal, setShowAIModal] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation(currentLang);

  // ── Auth Handling ────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthError(null);
    if (!email || !password) { setAuthError(t('auth.allFieldsRequired')); return; }
    
    // Validation spécifique inscription
    if (isSignUp && (!firstName || !lastName || !artistName || !country)) {
      setAuthError("All fields are required for sign up.");
      return;
    }

    setIsLoggingIn(true);
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          email, firstName, lastName, artistName, country,
          credits: 50, points: 50, isPro: false, plan: 'guest', createdAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setShowAuthModal(false);
    } catch (error: any) {
      setAuthError(error.message);
    } finally { setIsLoggingIn(false); }
  };

  // Note: Copiez le reste de vos fonctions existantes (onAuthStateChanged, renderModule, etc.)
  // ici, mais j'ai déjà modifié le handleLogin et ajouté les states. 
  
  // ... (Je vous laisse coller le reste de votre logique d'affichage ici pour garder vos modules intacts)
  
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Insérez ici votre structure de rendu habituelle */}
    </div>
  );
}

export default App;