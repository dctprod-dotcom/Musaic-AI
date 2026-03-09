import React, { useState, useEffect, lazy, Suspense } from 'react';
import './index.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Music, Shield, Lock, Mail, AlertCircle, Loader2,
  Menu, X, User, HelpCircle, Trash2, LayoutGrid, Video,
  FileText, Target, LogOut, Globe, BookOpen, Image as ImageIcon,
  Sparkles, Coins
} from 'lucide-react';
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
  signInWithPopup, sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { AIPreferences, DEFAULT_AI_PREFERENCES } from './types';
import { AIPreferencesModal } from './components/AIPreferencesModal';
import { useTranslation, LanguageCode } from './lib/i18n';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

// ─── Lazy-loaded modules ─────────────────────────────────
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const SpotlightEditor = lazy(() => import('./components/SpotlightEditor').then(m => ({ default: m.SpotlightEditor })));
const VideoGenerator = lazy(() => import('./components/VideoGenerator').then(m => ({ default: m.VideoGenerator })));
const PressKitModule = lazy(() => import('./components/PressKitModule').then(m => ({ default: m.PressKitModule })));
const ReleaseStrategy = lazy(() => import('./components/ReleaseStrategy').then(m => ({ default: m.ReleaseStrategy })));
const SpotlightPublic = lazy(() => import('./components/SpotlightPublic').then(m => ({ default: m.SpotlightPublic })));
const Tutorials = lazy(() => import('./components/Tutorials').then(m => ({ default: m.Tutorials })));
const ArtworkGenerator = lazy(() => import('./components/ArtworkGenerator').then(m => ({ default: m.ArtworkGenerator })));
const Membership = lazy(() => import('./components/Membership').then(m => ({ default: m.Membership })));
const InfoPages = lazy(() => import('./components/InfoPages').then(m => ({ default: m.InfoPages })));

const ADMIN_EMAIL = "contact.musaicai@gmail.com";

type ModuleId = 'landing' | 'dashboard' | 'smart-link' | 'bio' | 'epk' | 'video' | 'artwork' | 'strategy' | 'tutorials' | 'membership' | 'about' | 'faq' | 'privacy' | 'terms' | 'contact';

const NAV_ITEMS = [
  { id: 'dashboard' as ModuleId, icon: LayoutGrid, label: 'nav.dashboard' },
  { id: 'smart-link' as ModuleId, icon: Globe, label: 'nav.smartLink' },
  { id: 'epk' as ModuleId, icon: FileText, label: 'nav.epk' },
  { id: 'artwork' as ModuleId, icon: ImageIcon, label: 'nav.artwork' },
  { id: 'video' as ModuleId, icon: Video, label: 'nav.video' },
  { id: 'strategy' as ModuleId, icon: Target, label: 'nav.strategy' },
];

const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 5);

function ModuleLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-turquoise animate-spin" />
    </div>
  );
}

// ─── Error Boundary ──────────────────────────────────────
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
          <div className="space-y-6 max-w-md">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto ring-1 ring-red-500/40">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white">System Error</h1>
            <p className="text-gray-400 text-sm">{this.state.error?.message || "Something went wrong."}</p>
            <button onClick={() => window.location.reload()} className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest rounded-xl hover:bg-turquoise transition-all">
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Dashboard ───────────────────────────────────────────
function Dashboard({ t, onNavigate, user, onSignUp }: { t: (k: string) => string; onNavigate: (id: ModuleId) => void; user: any; onSignUp: () => void }) {
  const modules = [
    { id: 'smart-link' as ModuleId, title: 'SMART LINK', icon: Globe, color: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20' },
    { id: 'epk' as ModuleId, title: 'PRESS KIT', icon: FileText, color: 'text-pink-500', bg: 'bg-pink-500/10', ring: 'ring-pink-500/20' },
    { id: 'artwork' as ModuleId, title: 'ARTWORK', icon: ImageIcon, color: 'text-turquoise', bg: 'bg-turquoise/10', ring: 'ring-turquoise/20' },
    { id: 'video' as ModuleId, title: 'VIDEO', icon: Video, color: 'text-purple-neon', bg: 'bg-purple-neon/10', ring: 'ring-purple-neon/20' },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tight text-white">
          {user ? `Welcome back` : 'Studio'}
        </h2>
        <p className="text-white/40 text-xs font-semibold uppercase tracking-[0.3em] mt-1">
          {user ? 'Choose your module' : 'Sign up to start creating'}
        </p>
      </div>

      {/* Guest banner */}
      {!user && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl bg-turquoise/5 border border-turquoise/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-turquoise flex-shrink-0" />
            <p className="text-sm text-white/70">Sign up now and get <span className="text-turquoise font-bold">50 free tokens</span> to start creating.</p>
          </div>
          <button onClick={onSignUp} className="px-5 py-2 bg-turquoise text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition-all flex-shrink-0">
            Sign Up Free
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:gap-6">
        {modules.map((mod, idx) => (
          <motion.button key={mod.id}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.08 }}
            onClick={() => {
              if (!user) { onSignUp(); return; }
              onNavigate(mod.id);
            }}
            className="group relative flex flex-col items-center justify-center aspect-square glass-card glass-card-hover rounded-3xl overflow-hidden"
          >
            <div className={`p-5 lg:p-8 rounded-full ${mod.bg} ring-1 ${mod.ring} ${mod.color} group-hover:scale-110 transition-transform duration-500`}>
              <mod.icon className="w-8 h-8 lg:w-12 lg:h-12 drop-shadow-[0_0_15px_currentColor]" />
            </div>
            <h3 className="mt-4 text-sm lg:text-xl font-black uppercase tracking-tight text-white group-hover:text-turquoise transition-colors text-center px-2">
              {mod.title}
            </h3>
            {!user && (
              <span className="mt-2 text-[10px] text-white/30 font-semibold uppercase tracking-wider">Sign in to access</span>
            )}
          </motion.button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <button onClick={() => user ? onNavigate('strategy') : onSignUp()}
          className="flex items-center gap-3 p-4 glass-card rounded-2xl hover:bg-white/5 transition-all group">
          <Target className="w-5 h-5 text-orange-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white">Release Strategy</span>
        </button>
        <button onClick={() => onNavigate('tutorials')}
          className="flex items-center gap-3 p-4 glass-card rounded-2xl hover:bg-white/5 transition-all group">
          <BookOpen className="w-5 h-5 text-white/40" />
          <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white">Tutorials</span>
        </button>
      </div>
    </div>
  );
}

// ─── Pro Gate ────────────────────────────────────────────
function ProGate({ icon: Icon, t, color, onSignUp }: { icon: any; t: (k: string) => string; color: string; onSignUp: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
      <div className={`w-20 h-20 bg-purple-neon/10 rounded-full flex items-center justify-center ring-1 ring-purple-neon/20`}>
        <Icon className="w-10 h-10 text-purple-neon" />
      </div>
      <h2 className="text-3xl font-black uppercase tracking-tighter text-white">{t('pro.feature')}</h2>
      <p className="text-gray-400 text-sm font-medium max-w-md">{t('pro.videoMessage')}</p>
      <button onClick={onSignUp} className="px-8 py-4 bg-white text-black font-bold uppercase tracking-widest rounded-xl hover:bg-turquoise transition-all">
        {t('pro.unlock')}
      </button>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────
function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleId>('landing');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<LanguageCode>('en');
  const [aiPreferences, setAIPreferences] = useState<AIPreferences>(DEFAULT_AI_PREFERENCES);
  const [showAIModal, setShowAIModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(currentLang);

  // ─── Auth (runs ONCE) ──────────────────────────────────
  useEffect(() => {
    if (!auth || !db) { setLoading(false); return; }
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          const userDocRef = doc(db, 'users', u.uid);
          const userDocSnap = await getDoc(userDocRef);
          let userData: any;
          if (userDocSnap.exists()) {
            userData = userDocSnap.data();
          } else {
            // New user → 50 free tokens
            userData = {
              email: u.email,
              displayName: u.displayName || '',
              avatar: u.photoURL || '',
              points: 50,
              isPro: false,
              createdAt: serverTimestamp()
            };
            await setDoc(userDocRef, userData);
          }
          const isSuperAdmin = u.email === ADMIN_EMAIL;
          setUser({
            ...u, ...userData, uid: u.uid,
            isPro: isSuperAdmin || userData.isPro,
            points: isSuperAdmin ? 999999 : (userData.points || 50)
          });
          setIsAdmin(isSuperAdmin);
          // Auto-navigate to dashboard after login
          if (activeModule === 'landing') setActiveModule('dashboard');
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(u);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ─── Auth handlers ─────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!email || !password) { setAuthError('All fields are required.'); return; }
    setIsLoggingIn(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setShowAuthModal(false);
      setEmail(''); setPassword('');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') setAuthError('Account already exists. Please sign in.');
      else if (['auth/wrong-password', 'auth/user-not-found', 'auth/invalid-credential'].includes(error.code)) setAuthError('Invalid credentials. Check your email and password.');
      else if (error.code === 'auth/weak-password') setAuthError('Password too weak. Use 6+ characters.');
      else setAuthError(error.message);
    } finally { setIsLoggingIn(false); }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null); setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setShowAuthModal(false);
    } catch (error: any) {
      if (!['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(error.code)) {
        setAuthError(error.message);
      }
    } finally { setIsLoggingIn(false); }
  };

  const handleForgotPassword = async () => {
    if (!email) { setAuthError('Enter your email first.'); return; }
    try { await sendPasswordResetEmail(auth, email); setResetSent(true); setAuthError(null); }
    catch (error: any) { setAuthError(error.message); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAdmin(false);
    setActiveModule('landing');
    setIsMenuOpen(false);
    navigate('/');
  };

  const openAuth = (signUp: boolean) => {
    setShowAuthModal(true); setIsSignUp(signUp);
    setAuthError(null); setResetSent(false);
    setIsMenuOpen(false);
  };

  // ─── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-turquoise animate-spin" />
      </div>
    );
  }

  // ─── Public Smart Link ─────────────────────────────────
  if (location.pathname.startsWith('/s/')) {
    return <Suspense fallback={<ModuleLoader />}><SpotlightPublic /></Suspense>;
  }

  // ─── Module renderer ───────────────────────────────────
  function renderModule() {
    // Landing page (guest or logged out)
    if (activeModule === 'landing' && !user) {
      return <LandingPage t={t} onGetStarted={() => openAuth(true)} />;
    }

    // Dashboard (accessible by everyone — guest sees "sign in to access")
    if (activeModule === 'landing' || activeModule === 'dashboard') {
      return <Dashboard t={t} onNavigate={setActiveModule} user={user} onSignUp={() => openAuth(true)} />;
    }

    // Modules that require auth
    if (!user && !['tutorials', 'about', 'faq', 'privacy', 'terms', 'contact'].includes(activeModule)) {
      openAuth(true);
      return <Dashboard t={t} onNavigate={setActiveModule} user={user} onSignUp={() => openAuth(true)} />;
    }

    switch (activeModule) {
      case 'smart-link':
        return <SpotlightEditor user={user} t={t} onBack={() => setActiveModule('dashboard')} generatedAssets={{}} />;
      case 'epk': case 'bio':
        return <PressKitModule lang={currentLang} aiPreferences={aiPreferences} />;
      case 'artwork':
        return <ArtworkGenerator aiPreferences={aiPreferences} />;
      case 'video':
        return user?.isPro
          ? <VideoGenerator aiPreferences={aiPreferences} />
          : <ProGate icon={Video} t={t} color="text-purple-neon" onSignUp={() => openAuth(true)} />;
      case 'strategy':
        return <ReleaseStrategy user={user} lang={currentLang} />;
      case 'tutorials':
        return <Tutorials />;
      case 'membership':
        return <Membership user={user} lang={currentLang} />;
      default:
        if (['about', 'faq', 'privacy', 'terms', 'contact'].includes(activeModule)) {
          return <InfoPages page={activeModule as any} lang={currentLang} />;
        }
        return <Dashboard t={t} onNavigate={setActiveModule} user={user} onSignUp={() => openAuth(true)} />;
    }
  }

  // ─── Show sidebar only when not on landing ─────────────
  const showAppShell = activeModule !== 'landing' || user;

  // ─── Auth Modal ────────────────────────────────────────
  function renderAuthModal() {
    return (
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0B0E14] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-turquoise to-purple-neon" />

              <div className="text-center mb-8">
                <img src="/logo-musaic.jpeg" alt="Musaic AI" className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-lg" />
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-1">
                  {isSignUp ? t('auth.joinClub') : t('auth.accessStudio')}
                </h2>
                <p className="text-white/40 text-xs font-medium tracking-wider uppercase">
                  {isSignUp ? '50 free tokens on signup' : t('auth.signIn')}
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {authError && (
                  <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-400/80 text-xs">{authError}</p>
                  </div>
                )}
                {resetSent && (
                  <div className="bg-turquoise/10 border border-turquoise/30 p-3 rounded-xl text-turquoise text-xs">
                    Check your inbox to reset your password.
                  </div>
                )}

                <div className="space-y-4">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-turquoise transition-colors" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-turquoise/40 transition-all text-sm placeholder:text-white/15"
                      placeholder="Email address" />
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-turquoise transition-colors" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-turquoise/40 transition-all text-sm placeholder:text-white/15"
                      placeholder="Password" />
                  </div>
                  {!isSignUp && (
                    <button type="button" onClick={handleForgotPassword}
                      className="text-[10px] text-white/30 hover:text-turquoise transition-colors ml-1">
                      {t('auth.forgotPassword')}
                    </button>
                  )}
                </div>

                <button type="submit" disabled={isLoggingIn}
                  className="w-full bg-turquoise text-black font-bold uppercase tracking-widest py-3.5 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isLoggingIn ? <><Loader2 className="w-4 h-4 animate-spin" />Processing...</> : (isSignUp ? t('auth.createAccount') : t('auth.signIn'))}
                </button>

                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-white/10" />
                  <span className="mx-4 text-white/20 text-[10px] font-bold uppercase tracking-widest">{t('auth.orContinueWith')}</span>
                  <div className="flex-grow border-t border-white/10" />
                </div>

                <button type="button" onClick={handleGoogleLogin} disabled={isLoggingIn}
                  className="w-full bg-white/5 text-white border border-white/10 font-bold uppercase tracking-widest py-3.5 rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>

                <div className="text-center">
                  <button type="button" onClick={() => { setIsSignUp(!isSignUp); setAuthError(null); setResetSent(false); }}
                    className="text-xs text-white/40 hover:text-turquoise transition-colors">
                    {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.newHere')}
                  </button>
                </div>
              </form>

              <button onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 p-2 text-white/20 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // ─── Render ────────────────────────────────────────────
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#050505] text-white font-sans antialiased overflow-x-hidden">
        <Header
          user={user} isAdmin={isAdmin} isStarted={!!showAppShell}
          onLogin={() => openAuth(false)}
          onSignUp={() => openAuth(true)}
          onMenuOpen={() => setIsMenuOpen(true)}
          currentLang={currentLang}
          onLangChange={setCurrentLang}
          tokenBalance={user?.points}
        />

        {/* Landing (no sidebar) */}
        {!showAppShell ? (
          <div className="pt-[80px]">
            <Suspense fallback={<ModuleLoader />}>
              <LandingPage t={t} onGetStarted={() => openAuth(true)} />
            </Suspense>
          </div>
        ) : (
          /* App Shell with sidebar */
          <div className="h-screen flex flex-col pt-[80px]">
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

              {/* Desktop Sidebar */}
              <aside className="hidden lg:flex flex-col w-20 xl:w-72 border-r border-white/5 bg-[#050505]/50 backdrop-blur-xl z-30">
                <div className="flex-1 py-8 px-4 space-y-3">
                  {NAV_ITEMS.map((item) => (
                    <button key={item.id} onClick={() => setActiveModule(item.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                        activeModule === item.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'
                      }`}>
                      <item.icon className={`w-6 h-6 ${activeModule === item.id ? 'text-turquoise' : 'group-hover:text-turquoise transition-colors'}`} />
                      <span className="hidden xl:block text-xs font-bold uppercase tracking-widest">{t(item.label)}</span>
                      {activeModule === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-turquoise shadow-[0_0_10px_rgba(0,255,221,0.8)] hidden xl:block" />}
                    </button>
                  ))}

                  <div className="h-px bg-white/5 my-4" />

                  <button onClick={() => setActiveModule('tutorials')}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${activeModule === 'tutorials' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                    <BookOpen className={`w-6 h-6 ${activeModule === 'tutorials' ? 'text-turquoise' : 'group-hover:text-turquoise transition-colors'}`} />
                    <span className="hidden xl:block text-xs font-bold uppercase tracking-widest">{t('nav.tutorials')}</span>
                  </button>

                  <button onClick={() => setShowAIModal(true)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all group text-white/40 hover:text-white hover:bg-white/5">
                    <Sparkles className="w-6 h-6 group-hover:text-purple-500 transition-colors" />
                    <span className="hidden xl:block text-xs font-bold uppercase tracking-widest">{t('nav.aiPersona')}</span>
                  </button>
                </div>

                {user && (
                  <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] rounded-2xl">
                      <Coins className="w-5 h-5 text-gold" />
                      <div className="hidden xl:block">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Tokens</p>
                        <p className="text-lg font-black text-white">{user.points >= 999999 ? '∞' : user.points?.toLocaleString()}</p>
                      </div>
                      <span className="xl:hidden text-xs font-black text-gold">{user.points >= 999999 ? '∞' : user.points}</span>
                    </div>
                  </div>
                )}
              </aside>

              {/* Content */}
              <main className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-br from-[#050505] to-[#0B0E14] relative pb-20 lg:pb-0">
                <Suspense fallback={<ModuleLoader />}>
                  <AnimatePresence mode="wait">
                    <motion.div key={activeModule}
                      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.2 }}
                      className="relative z-10 min-h-full">
                      {renderModule()}
                    </motion.div>
                  </AnimatePresence>
                </Suspense>

                {!['smart-link', 'dashboard', 'landing'].includes(activeModule) && (
                  <Footer lang={currentLang} onNavigate={(page) => { setActiveModule(page as ModuleId); window.scrollTo(0, 0); }} />
                )}
              </main>
            </div>

            {/* Mobile Bottom Nav */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#050505]/95 backdrop-blur-xl border-t border-white/10 safe-area-pb">
              <div className="flex items-center justify-around px-2 py-2">
                {BOTTOM_NAV_ITEMS.map((item) => (
                  <button key={item.id} onClick={() => setActiveModule(item.id)}
                    className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${
                      activeModule === item.id ? 'text-turquoise' : 'text-white/30'
                    }`}>
                    <item.icon className="w-5 h-5" />
                    <span className="text-[8px] font-bold uppercase tracking-wider">
                      {item.id === 'dashboard' ? 'Home' : item.id === 'smart-link' ? 'Link' : item.id === 'epk' ? 'EPK' : item.id === 'artwork' ? 'Art' : 'Video'}
                    </span>
                  </button>
                ))}
              </div>
            </nav>
          </div>
        )}

        {/* Hamburger Menu — z-[150] so it's above everything except auth modal */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150]" />
              <motion.div
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed top-0 left-0 h-full w-80 bg-[#0B0E14] border-r border-white/10 z-[151] p-8 shadow-2xl overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <img src="/logo-musaic.jpeg" alt="Musaic AI" className="w-9 h-9 rounded-xl" />
                    <span className="text-lg font-black uppercase tracking-tight text-white">Menu</span>
                  </div>
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>

                <div className="space-y-1">
                  {user && (
                    <button onClick={() => { setActiveModule('membership'); setIsMenuOpen(false); }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group text-left">
                      <User className="w-5 h-5 text-white/40 group-hover:text-turquoise transition-colors" />
                      <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white">{t('nav.myAccount')}</span>
                    </button>
                  )}

                  {[
                    { icon: BookOpen, label: t('nav.tutorials'), module: 'tutorials' as ModuleId },
                    { icon: HelpCircle, label: t('nav.faq'), module: 'faq' as ModuleId },
                    { icon: Mail, label: t('nav.contact'), module: 'contact' as ModuleId },
                    { icon: Shield, label: t('nav.privacy'), module: 'privacy' as ModuleId },
                    { icon: FileText, label: t('nav.terms'), module: 'terms' as ModuleId },
                  ].map(({ icon: Icon, label, module }) => (
                    <button key={module} onClick={() => { setActiveModule(module); setIsMenuOpen(false); }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group text-left">
                      <Icon className="w-5 h-5 text-white/40 group-hover:text-turquoise transition-colors" />
                      <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white">{label}</span>
                    </button>
                  ))}

                  {user ? (
                    <>
                      <div className="h-px bg-white/5 my-4" />
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group text-left">
                        <LogOut className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                        <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white">{t('nav.signOut')}</span>
                      </button>
                      <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-500/10 transition-all group text-left mt-4">
                        <Trash2 className="w-5 h-5 text-red-500/60 group-hover:text-red-500 transition-colors" />
                        <span className="text-xs font-bold uppercase tracking-widest text-red-500/60 group-hover:text-red-500">{t('nav.deleteAccount')}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="h-px bg-white/5 my-4" />
                      <button onClick={() => openAuth(false)}
                        className="w-full py-3 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white/10 transition-all">
                        {t('auth.signIn')}
                      </button>
                      <button onClick={() => openAuth(true)}
                        className="w-full py-3 bg-turquoise text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:brightness-110 transition-all mt-2">
                        {t('auth.createAccount')}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {renderAuthModal()}
      </div>

      <AIPreferencesModal
        isOpen={showAIModal} onClose={() => setShowAIModal(false)}
        preferences={aiPreferences} onUpdate={setAIPreferences}
      />
    </ErrorBoundary>
  );
}

export default App;
