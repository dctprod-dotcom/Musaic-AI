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
  Play, Wand2, Camera
} from 'lucide-react';
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, collection
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, googleProvider, storage } from './firebase';
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

// ── Lazy (heavy/rare pages) ──────────────────────────────
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const SpotlightPublic = lazy(() => import('./components/SpotlightPublic').then(m => ({ default: m.SpotlightPublic })));
const InfoPages = lazy(() => import('./components/InfoPages').then(m => ({ default: m.InfoPages })));
const ReleaseHub = lazy(() => import('./components/ReleaseHub').then(m => ({ default: m.default })));

// ── Constants ─────────────────────────────────────────────
const ADMIN_EMAIL = "contact.musaicai@gmail.com";

const TOKEN_COSTS: Record<string, number> = {
  'smart-link': 5, 'epk': 5, 'bio': 5, 'artwork': 10,
  'video': 0, 'dashboard': 0, 'release-hub': 0,
};

type ModuleId = 'landing' | 'dashboard' | 'smart-link' | 'bio' | 'epk' | 'video' | 'artwork'
  | 'tutorials' | 'membership' | 'release-hub' | 'pricing' | 'my-account' | 'media-library'
  | 'about' | 'faq' | 'privacy' | 'terms' | 'contact';

const NAV_ITEMS = [
  { id: 'dashboard' as ModuleId, icon: LayoutGrid, label: 'nav.dashboard' },
  { id: 'smart-link' as ModuleId, icon: Globe, label: 'nav.smartLink' },
  { id: 'epk' as ModuleId, icon: FileText, label: 'nav.epk' },
  { id: 'artwork' as ModuleId, icon: ImageIcon, label: 'nav.artwork' },
  { id: 'video' as ModuleId, icon: Video, label: 'nav.video' },
];

const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 5);

// ── Crisp Chat ────────────────────────────────────────────
function useCrisp() {
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).$crisp) {
      (window as any).$crisp = [];
      (window as any).CRISP_WEBSITE_ID = "5b5625ec-57f4-4fee-b118-fa32c27cf91a";
      const s = document.createElement("script");
      s.src = "https://client.crisp.chat/l.js";
      s.async = true;
      document.head.appendChild(s);
    }
  }, []);
}

// ── Token deduction ───────────────────────────────────────
async function deductTokens(uid: string, cost: number, isAdmin: boolean): Promise<boolean> {
  if (isAdmin || cost <= 0) return true;
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists() || (snap.data().points || 0) < cost) return false;
    await updateDoc(ref, { points: increment(-cost) });
    return true;
  } catch (err) { console.error('[Tokens]', err); return false; }
}

// ── Loader & Error Boundary ──────────────────────────────
function ModuleLoader() {
  return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-turquoise animate-spin" /></div>;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode; t: (k: string) => string }, { hasError: boolean; error: any }> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
        <div className="space-y-6 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-black uppercase text-white">{this.props.t('error.title')}</h1>
          <p className="text-gray-400 text-sm">{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-turquoise text-black font-bold uppercase rounded-xl">{this.props.t('error.reload')}</button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

// ═══════════════════════════════════════════════════════════
// ─── DASHBOARD ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
function Dashboard({ t, onNavigate, user, onSignUp }: { t: (k: string) => string; onNavigate: (id: ModuleId) => void; user: any; onSignUp: () => void }) {
  const modules = [
    { id: 'smart-link' as ModuleId, title: t('mod.smartLink'), desc: t('mod.smartLink.desc'), cost: t('mod.cost.smartLink'), icon: Globe, color: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20' },
    { id: 'epk' as ModuleId, title: t('mod.pressKit'), desc: t('mod.pressKit.desc'), cost: t('mod.cost.pressKit'), icon: FileText, color: 'text-pink-500', bg: 'bg-pink-500/10', ring: 'ring-pink-500/20' },
    { id: 'artwork' as ModuleId, title: t('mod.artwork'), desc: t('mod.artwork.desc'), cost: t('mod.cost.artwork'), icon: ImageIcon, color: 'text-turquoise', bg: 'bg-turquoise/10', ring: 'ring-turquoise/20' },
    { id: 'video' as ModuleId, title: t('mod.video'), desc: t('mod.video.desc'), cost: t('mod.cost.video'), icon: Video, color: 'text-purple-neon', bg: 'bg-purple-neon/10', ring: 'ring-purple-neon/20' },
  ];

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 max-w-5xl mx-auto">
      <div className="mb-3 lg:mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-white">{user ? t('dash.welcomeBack') : t('dash.studio')}</h2>
          <p className="text-white/40 text-[10px] font-semibold uppercase tracking-[0.3em] mt-0.5">{user ? t('dash.chooseModule') : t('dash.exploreGuest')}</p>
        </div>
        {user && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gold/10 border border-gold/20">
            <Coins className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs font-black text-gold">{user.points >= 999999 ? '∞' : user.points}</span>
            <span className="text-[9px] text-gold/60 font-semibold">{t('dash.tokens')}</span>
          </div>
        )}
      </div>
      {!user && (
        <div className="mb-3 p-3 rounded-2xl bg-turquoise/5 border border-turquoise/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-turquoise flex-shrink-0" /><p className="text-xs text-white/70">{t('dash.signupBanner')} <span className="text-turquoise font-bold">{t('dash.freeTokens')}</span></p></div>
          <button onClick={onSignUp} className="px-4 py-1.5 bg-turquoise text-black font-bold text-[10px] uppercase tracking-wider rounded-lg hover:brightness-110 transition-all flex-shrink-0">{t('dash.signUp')}</button>
        </div>
      )}
      <div className="flex-1 grid grid-cols-2 gap-3 lg:gap-4 min-h-0">
        {modules.map((mod, idx) => (
          <motion.button key={mod.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.06 }}
            onClick={() => onNavigate(mod.id)} className="group relative flex flex-col items-center justify-center glass-card glass-card-hover rounded-2xl lg:rounded-3xl overflow-hidden">
            <div className={`p-4 lg:p-6 rounded-full ${mod.bg} ring-1 ${mod.ring} ${mod.color} group-hover:scale-110 transition-transform duration-500`}>
              <mod.icon className="w-6 h-6 lg:w-10 lg:h-10 drop-shadow-[0_0_15px_currentColor]" />
            </div>
            <h3 className="mt-3 text-xs lg:text-lg font-black uppercase tracking-tight text-white group-hover:text-turquoise transition-colors">{mod.title}</h3>
            <p className="text-[9px] lg:text-[11px] text-white/30 font-medium mt-0.5 hidden sm:block">{mod.desc}</p>
            <span className={`mt-2 text-[8px] lg:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${mod.id === 'video' ? 'bg-purple-neon/10 text-purple-neon' : 'bg-white/5 text-white/40'}`}>{mod.cost}</span>
          </motion.button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {[
          { id: 'release-hub', icon: Sparkles, label: t('quick.hub'), color: 'text-turquoise' },
          { id: 'tutorials', icon: BookOpen, label: t('quick.tutorials'), color: 'text-white/40' },
          { id: user ? 'my-account' : 'membership', icon: User, label: t('quick.account'), color: 'text-white/40' },
        ].map(q => (
          <button key={q.id} onClick={() => onNavigate(q.id as ModuleId)} className="flex items-center gap-2 p-3 glass-card rounded-xl hover:bg-white/5 transition-all group">
            <q.icon className={`w-4 h-4 ${q.color}`} /><span className="text-[10px] font-bold uppercase tracking-widest text-white/50 group-hover:text-white hidden sm:block">{q.label}</span><ArrowRight className="w-3 h-3 text-white/20 ml-auto" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Gates ─────────────────────────────────────────────────
function AuthGate({ t, onSignUp }: { t: (k: string) => string; onSignUp: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6">
      <div className="w-16 h-16 bg-turquoise/10 rounded-full flex items-center justify-center ring-1 ring-turquoise/20"><Lock className="w-8 h-8 text-turquoise" /></div>
      <h2 className="text-2xl font-black uppercase tracking-tight text-white">{t('wall.signInToCreate')}</h2>
      <p className="text-white/40 text-sm max-w-md">{t('wall.exploreFreely')}</p>
      <button onClick={onSignUp} className="px-8 py-4 bg-turquoise text-black font-bold uppercase tracking-widest rounded-xl hover:brightness-110 transition-all">{t('wall.signUpFree')}</button>
    </div>
  );
}

function ProGate({ t, onUpgrade }: { t: (k: string) => string; onUpgrade: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6">
      <div className="w-16 h-16 bg-purple-neon/10 rounded-full flex items-center justify-center ring-1 ring-purple-neon/20"><Video className="w-8 h-8 text-purple-neon" /></div>
      <h2 className="text-2xl font-black uppercase tracking-tight text-white">{t('pro.feature')}</h2>
      <p className="text-white/40 text-sm max-w-md">{t('pro.videoMessage')}</p>
      <button onClick={onUpgrade} className="px-8 py-4 bg-white text-black font-bold uppercase tracking-widest rounded-xl hover:bg-turquoise transition-all">{t('pro.unlock')}</button>
    </div>
  );
}

// ── Video Module (Veo 3) ──────────────────────────────────
function VideoModule({ t, onBack }: { t: (k: string) => string; onBack: () => void }) {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ status: string; message?: string; url?: string } | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const res = await callVeo3(prompt, duration);
      setResult(res);
    } catch (err) {
      setResult({ status: 'error', message: 'Generation failed.' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between sticky top-0 z-20 bg-gradient-to-b from-[#050505] via-[#050505]/95 to-transparent pt-4 pb-2 px-4 lg:px-8">
        <button onClick={onBack} className="inline-flex items-center gap-2 px-3 py-2 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest hover:bg-white/5 rounded-xl transition-all"><ArrowLeft className="w-4 h-4" /> {t('action.back')}</button>
        <h1 className="text-lg font-black uppercase tracking-tight text-white hidden sm:block">{t('mod.video')}</h1>
        <button onClick={onBack} className="p-2.5 text-white/30 hover:text-white hover:bg-white/10 rounded-xl transition-all"><X className="w-5 h-5" /></button>
      </div>
      <div className="max-w-3xl mx-auto p-4 lg:p-8 pt-0 space-y-6">
        {result ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-3xl p-10 text-center space-y-4">
            <div className="w-20 h-20 bg-purple-neon/10 rounded-full flex items-center justify-center ring-1 ring-purple-neon/20 mx-auto">
              <Video className="w-10 h-10 text-purple-neon" />
            </div>
            <h2 className="text-xl font-black uppercase text-white">
              {result.status === 'ready' ? t('video.ready') : result.status === 'pending' ? t('video.comingSoon') : t('error.title')}
            </h2>
            <p className="text-white/40 text-sm max-w-md mx-auto">{result.message || t('video.veoMessage')}</p>
            {result.url && (
              <a href={result.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-neon text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:brightness-110 transition-all">
                <Play className="w-4 h-4" /> {t('video.watchNow')}
              </a>
            )}
            <button onClick={() => setResult(null)} className="block mx-auto text-turquoise text-xs font-bold uppercase tracking-wider hover:underline">{t('video.tryAgain')}</button>
          </motion.div>
        ) : (
          <>
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest block">{t('video.prompt')}</label>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4}
                className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-purple-neon/40 text-sm placeholder:text-white/15 resize-none transition-all"
                placeholder={t('video.promptPlaceholder')} />
              <div>
                <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest block mb-2">{t('video.duration')}</label>
                <div className="flex gap-2">
                  {[5, 10, 15].map(d => (
                    <button key={d} onClick={() => setDuration(d)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${duration === d ? 'bg-purple-neon text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                      {d}s
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleGenerate} disabled={generating || !prompt.trim()}
              className="w-full py-4 bg-purple-neon text-white font-bold uppercase tracking-widest rounded-xl hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
              {generating ? <><Loader2 className="w-5 h-5 animate-spin" /> {t('video.generating')}</> : <><Play className="w-5 h-5" /> {t('video.generate')} — Veo 3</>}
            </button>
            <div className="glass-card rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-purple-neon/60 mt-0.5 flex-shrink-0" />
              <p className="text-white/30 text-xs">{t('video.betaNotice')}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── My Account ────────────────────────────────────────────
function MyAccountPage({
  t,
  user,
  isAdmin,
  onNavigate,
  onAvatarUpdated
}: {
  t: (k: string) => string;
  user: any;
  isAdmin: boolean;
  onNavigate: (id: ModuleId) => void;
  onAvatarUpdated: (avatarUrl: string) => void;
}) {
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  if (!user) return null;

   const handleAvatarUpload = async (file?: File | null) => {
    if (!file || !user?.uid) return;
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      if (!file.type.startsWith('image/')) throw new Error('Please select an image file.');
      if (file.size > 5 * 1024 * 1024) throw new Error('Image must be under 5MB.');
      if (!storage) throw new Error('Storage is not configured.');

      const avatarRef = ref(storage, `avatars/${user.uid}/profile.jpg`);
      await uploadBytes(avatarRef, file);
      const avatarUrl = await getDownloadURL(avatarRef);
      await updateDoc(doc(db, 'users', user.uid), { avatar: avatarUrl, updatedAt: serverTimestamp() });
      onAvatarUpdated(avatarUrl);
    } catch (err: any) {
      setAvatarError(err?.message || 'Avatar upload failed.');
    } finally {
      setAvatarUploading(false);
    }
  };
  
  const planLabel = isAdmin
    ? t('account.admin')
    : user.isPro
      ? t('account.planPro')
      : user.plan === 'artist'
        ? t('account.planArtist')
        : t('account.planGuest');

  const accountItems = [
    { label: t('account.email'), value: user.email || '—', icon: Mail },
    { label: 'First name', value: user.firstName || '—', icon: User },
    { label: 'Last name', value: user.lastName || '—', icon: User },
    { label: 'Artist name', value: user.artistName || '—', icon: Sparkles },
    { label: 'Country', value: user.country || '—', icon: Globe },
    { label: t('account.currentPlan'), value: planLabel, icon: CreditCard },
    { label: t('account.role'), value: isAdmin ? t('account.admin') : t('account.user'), icon: Shield },
    {
      label: t('account.memberSince'),
      value: user.createdAt?.toDate?.()?.toLocaleDateString?.() || '—',
      icon: Clock
    }
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 lg:p-10 space-y-8 overflow-y-auto">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">
          {t('account.title')}
        </h1>
        {isAdmin && (
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-[10px] font-bold uppercase tracking-widest">
            <Shield className="w-3 h-3" /> {t('account.admin')}
          </span>
        )}
      </div>

       <div className="glass-card rounded-3xl p-6 lg:p-8">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt="Profile avatar"
              className="w-24 h-24 rounded-full object-cover border border-white/20 shadow-[0_0_20px_rgba(0,255,221,0.15)]"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border border-white/20 bg-white/5 shadow-[0_0_20px_rgba(0,255,221,0.1)] flex items-center justify-center">
              <User className="w-10 h-10 text-white/35" />
            </div>
          )}
          <div className="space-y-2">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-widest cursor-pointer">
              <Camera className="w-4 h-4 text-turquoise" />
              {avatarUploading ? 'Uploading...' : 'Upload Photo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={avatarUploading}
                onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
              />
            </label>
            <p className="text-[10px] text-white/40">JPG/PNG, max 5MB • stored in /avatars/{'{uid}'}/profile.jpg</p>
            {avatarError && <p className="text-[11px] text-red-400">{avatarError}</p>}
          </div>
        </div>
      </div>
      
      <div className="glass-card rounded-3xl p-8 lg:p-10 text-center">
        <Coins className="w-8 h-8 text-gold mx-auto mb-3" />
        <p className="text-6xl lg:text-7xl font-black text-gold">
          {isAdmin ? '∞' : user.points}
        </p>
        <p className="text-white/30 text-sm font-bold uppercase tracking-widest mt-2">
          {t('account.tokensRemaining')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {accountItems.map((item, i) => (
          <div
            key={i}
            className="glass-card rounded-2xl p-5 flex items-start gap-4"
          >
            <div className="p-2 rounded-xl bg-white/5">
              <item.icon className="w-4 h-4 text-white/30" />
            </div>
            <div>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                {item.label}
              </p>
              <p className="text-sm text-white font-semibold mt-0.5 break-all">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-3xl p-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-white/60 mb-4">
          {t('account.history')}
        </h3>
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-white/10 mx-auto mb-3" />
          <p className="text-white/20 text-xs">{t('account.historyEmpty')}</p>
        </div>
      </div>

      {!isAdmin && (
        <button
          onClick={() => onNavigate('membership')}
          className="w-full py-4 bg-turquoise text-black font-bold uppercase tracking-widest rounded-xl hover:brightness-110 transition-all"
        >
          {t('account.managePlan')}
        </button>
      )}
    </div>
  );
}

// ── Membership ────────────────────────────────────────────
function MembershipPage({ t, user, isAdmin }: { t: (k: string) => string; user: any; isAdmin: boolean }) {
  const cp = isAdmin ? 'admin' : user?.isPro ? 'pro' : user?.plan === 'artist' ? 'artist' : 'guest';
  const plans = [
    { id: 'guest', name: t('pricing.guest'), price: t('pricing.guestPrice'), tokens: t('pricing.guestTokens'), features: [t('pricing.guest.f1'), t('pricing.guest.f2'), t('pricing.guest.f3'), t('pricing.guest.f4')], color: 'border-white/10', badge: null },
    { id: 'artist', name: t('pricing.artist'), price: t('pricing.artistPrice'), tokens: t('pricing.artistTokens'), features: [t('pricing.artist.f1'), t('pricing.artist.f2'), t('pricing.artist.f3'), t('pricing.artist.f4')], color: 'border-turquoise/30', badge: t('pricing.popular') },
    { id: 'pro', name: t('pricing.pro'), price: t('pricing.proPrice'), tokens: t('pricing.proTokens'), features: [t('pricing.pro.f1'), t('pricing.pro.f2'), t('pricing.pro.f3'), t('pricing.pro.f4')], color: 'border-purple-neon/30', badge: null },
  ];
  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-10 overflow-y-auto">
      <div className="text-center mb-10"><h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tight text-white">{t('pricing.title')}</h1><p className="text-white/40 text-sm mt-2">{t('pricing.subtitle')}</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => { const cur = cp === plan.id; return (
          <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`relative glass-card rounded-3xl p-6 lg:p-8 border ${plan.color} ${plan.id === 'artist' ? 'ring-1 ring-turquoise/20' : ''}`}>
            {plan.badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-turquoise text-black text-[10px] font-black uppercase tracking-widest rounded-full">{plan.badge}</div>}
            <div className="text-center mb-6"><h3 className="text-lg font-black uppercase tracking-tight text-white">{plan.name}</h3><p className="text-3xl font-black text-white mt-2">{plan.price}</p><p className="text-white/40 text-xs mt-1">{plan.tokens}</p></div>
            <div className="space-y-3 mb-8">{plan.features.map((f, i) => (<div key={i} className="flex items-center gap-2"><Check className={`w-4 h-4 flex-shrink-0 ${i === plan.features.length - 1 && plan.id !== 'pro' ? 'text-white/20' : 'text-turquoise'}`} /><span className={`text-xs ${i === plan.features.length - 1 && plan.id !== 'pro' ? 'text-white/20 line-through' : 'text-white/60'}`}>{f}</span></div>))}</div>
            <button disabled={cur} className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${cur ? 'bg-white/5 text-white/30 cursor-default' : plan.id === 'artist' ? 'bg-turquoise text-black hover:brightness-110' : plan.id === 'pro' ? 'bg-purple-neon text-white hover:brightness-110' : 'bg-white/5 text-white hover:bg-white/10'}`}>{cur ? t('pricing.currentPlan') : plan.id === 'guest' ? t('pricing.getStarted') : t('pricing.upgrade')}</button>
          </motion.div>
        ); })}
      </div>
    </div>
  );
}

// ── Contact, FAQ, Tutorials ───────────────────────────────
function ContactPage({ t }: { t: (k: string) => string }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
    setSubject('');
    setMessage('');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 lg:p-10 overflow-y-auto">
      <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-2">{t('contact.title')}</h1><p className="text-white/40 text-sm mb-8">{t('contact.subtitle')}</p>
      {sent ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-3xl p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-turquoise/10 rounded-full flex items-center justify-center ring-1 ring-turquoise/20 mx-auto"><Check className="w-8 h-8 text-turquoise" /></div>
          <p className="text-white font-bold">{t('contact.sent')}</p>
          <button onClick={() => setSent(false)} className="text-turquoise text-xs font-bold uppercase tracking-wider hover:underline">{t('contact.send')}</button>
        </motion.div>
      ) : (
        <form onSubmit={handleSend} className="glass-card rounded-3xl p-6 lg:p-8 space-y-5">
          <div><label className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2 block">{t('contact.subject')}</label><input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-turquoise/40 text-sm placeholder:text-white/15" placeholder={t('contact.subjectPlaceholder')} /></div>
          <div><label className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2 block">{t('contact.message')}</label><textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-turquoise/40 text-sm placeholder:text-white/15 resize-none" placeholder={t('contact.messagePlaceholder')} /></div>
          <button type="submit" disabled={sending || !subject.trim() || !message.trim()} className="w-full py-3 bg-turquoise text-black font-bold uppercase tracking-widest rounded-xl hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2">{sending ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('contact.sending')}</> : <><Send className="w-4 h-4" /> {t('contact.send')}</>}</button>
        </form>
      )}
    </div>
  );
}

function FAQPage({ t }: { t: (k: string) => string }) {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [{ q: t('faq.q1'), a: t('faq.a1') }, { q: t('faq.q2'), a: t('faq.a2') }, { q: t('faq.q3'), a: t('faq.a3') }, { q: t('faq.q4'), a: t('faq.a4') }, { q: t('faq.q5'), a: t('faq.a5') }];
  return (
    <div className="max-w-2xl mx-auto p-6 lg:p-10 overflow-y-auto">
      <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-8">{t('faq.title')}</h1>
      <div className="space-y-3">{faqs.map((faq, i) => (<div key={i} className="glass-card rounded-2xl overflow-hidden"><button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left"><span className="text-sm font-bold text-white pr-4">{faq.q}</span><ChevronDown className={`w-4 h-4 text-white/30 transition-transform flex-shrink-0 ${open === i ? 'rotate-180' : ''}`} /></button><AnimatePresence>{open === i && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}><p className="px-5 pb-5 text-white/50 text-sm leading-relaxed">{faq.a}</p></motion.div>)}</AnimatePresence></div>))}</div>
    </div>
  );
}

// ── Interactive Tutorials ─────────────────────────────────
function TutorialsPage({ t, onNavigate }: { t: (k: string) => string; onNavigate: (id: ModuleId) => void }) {
  const tutorials = [
    { title: t('tutorials.t1.title'), desc: t('tutorials.t1.desc'), icon: Globe, color: 'text-emerald-400', bg: 'bg-emerald-500/10', module: 'smart-link' as ModuleId, cta: t('tutorials.tryNow') },
    { title: t('tutorials.t2.title'), desc: t('tutorials.t2.desc'), icon: FileText, color: 'text-pink-500', bg: 'bg-pink-500/10', module: 'epk' as ModuleId, cta: t('tutorials.tryNow') },
    { title: t('tutorials.t3.title'), desc: t('tutorials.t3.desc'), icon: ImageIcon, color: 'text-turquoise', bg: 'bg-turquoise/10', module: 'artwork' as ModuleId, cta: t('tutorials.tryNow') },
  ];
  return (
    <div className="max-w-3xl mx-auto p-6 lg:p-10 overflow-y-auto">
      <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-2">{t('tutorials.title')}</h1>
      <p className="text-white/40 text-sm mb-8">{t('tutorials.subtitle')}</p>
      <div className="space-y-4">
        {tutorials.map((tut, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-card rounded-2xl p-6 flex items-start gap-5 group hover:border-white/10 transition-all">
            <div className={`p-3 rounded-xl ${tut.bg} ${tut.color} flex-shrink-0`}><tut.icon className="w-6 h-6" /></div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white">{tut.title}</h3>
              <p className="text-white/40 text-sm mt-1 mb-3">{tut.desc}</p>
              <button onClick={() => onNavigate(tut.module)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg ${tut.bg} ${tut.color} text-[10px] font-bold uppercase tracking-widest hover:brightness-125 transition-all`}>
                {tut.cta} <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ))}
        <div className="glass-card rounded-2xl p-6 flex items-center gap-5 opacity-50"><div className="p-3 rounded-xl bg-purple-neon/10 text-purple-neon"><Video className="w-6 h-6" /></div><p className="text-white/40 text-sm italic">{t('tutorials.comingSoon')}</p></div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ─── MAIN APP ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [country, setCountry] = useState('');

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
  useCrisp();
  const goHome = useCallback(() => setActiveModule('dashboard'), []);

  // ── Auth — with Google redirect fallback + verbose logging ──
  useEffect(() => {
    console.log('[Auth] Initializing... auth:', !!auth, 'db:', !!db);
    if (!auth || !db) {
      console.error('[Auth] Firebase not initialized! Check firebase.ts exports and .env variables.');
      setLoading(false);
      return;
    }

    getRedirectResult(auth)
      .then((result) => { if (result?.user) console.log('[Auth] Redirect result:', result.user.email); })
      .catch((err) => console.error('[Auth] Redirect result error:', err.code, err.message));

    const unsub = onAuthStateChanged(auth, async (u) => {
      console.log('[Auth] State changed:', u ? u.email : 'signed out');
      if (u) {
        try {
          const isTurboAdmin = u.email === ADMIN_EMAIL;
          if (isTurboAdmin) {
            setUser({
              ...u,
              uid: u.uid,
              email: u.email,
              displayName: u.displayName || 'Admin',
              firstName: 'Admin',
              lastName: 'Owner',
              artistName: 'Musaic AI',
              country: 'Global',
              avatar: u.photoURL || '',
              isPro: true,
              plan: 'pro',
              points: 999999,
            });
            setIsAdmin(true);
            if (activeModule === 'landing') setActiveModule('dashboard');
            setLoading(false);
            return;
          }
          
          const ref = doc(db, 'users', u.uid);
          const snap = await getDoc(ref);
          let data: any;

          if (snap.exists()) {
            data = snap.data();
            console.log('[Auth] User doc found:', { plan: data.plan, points: data.points, isPro: data.isPro });
          } else {
            console.log('[Auth] New user — creating Firestore doc with 50 tokens');
            data = {
              email: u.email,
              displayName: u.displayName || '',
              firstName: '',
              lastName: '',
              artistName: '',
              country: '',
              avatar: u.photoURL || '',
              credits: 50,
              points: 50,
              isPro: false,
              plan: 'guest',
              createdAt: serverTimestamp(),
            };
            await setDoc(ref, data);
          }

          setUser({
            ...u,
            ...data,
            uid: u.uid,
            isPro: data.isPro || false,
            plan: data.plan || 'guest',
            points: data.points ?? data.credits ?? 50,
          });
          setIsAdmin(false);
          
          if (activeModule === 'landing') setActiveModule('dashboard');
        } catch (err: any) {
          console.error('[Auth] Firestore error:', err.code, err.message, err);
          const admin = u.email === ADMIN_EMAIL;
          setUser({
            ...u,
            uid: u.uid,
            firstName: '',
            lastName: '',
            artistName: '',
            country: '',
            isPro: admin,
            plan: admin ? 'pro' : 'guest',
            points: admin ? 99999 : 50
          });
          setIsAdmin(admin);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const refreshUserPoints = async () => {
    if (!user?.uid || isAdmin) return;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) setUser((p: any) => p ? { ...p, points: snap.data().points ?? snap.data().credits ?? 0 } : p);
    } catch {}
  };

  const handleGenerate = async (moduleId: string): Promise<boolean> => {
    if (!user) { openAuth(true); return false; }
    if (isAdmin) return true;
    const cost = TOKEN_COSTS[moduleId] || 0;
    if (cost === 0) return true;
    if ((user.points || 0) < cost) { setActiveModule('membership'); return false; }
    const ok = await deductTokens(user.uid, cost, isAdmin);
    if (ok) { await refreshUserPoints(); return true; }
    return false;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!email || !password) {
      setAuthError('Email and password are required.');
      return;
    }

   if (isSignUp) {
      if (!firstName.trim() || !lastName.trim() || !artistName.trim() || !country.trim()) {
        setAuthError('First name, last name, artist name, and country are required.');
        return;
      }
    }

    setIsLoggingIn(true);

    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);

        await setDoc(doc(db, 'users', cred.user.uid), {
          email,
          displayName: `${firstName} ${lastName}`.trim(),
          firstName,
          lastName,
          artistName: artistName.trim(),
          country,
          points: 50,
          credits: 50,
          isPro: false,
          plan: 'guest',
          createdAt: serverTimestamp(),
        });

        const safeSlug = `${artistName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')}-${cred.user.uid.slice(0, 6)}`;

        await setDoc(doc(collection(db, 'smartlinks')), {
          uid: cred.user.uid,
          artistName: artistName.trim(),
          email,
          slug: safeSlug,
          bio: '',
          avatar: '',
          links: [],
          isPublic: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      setShowAuthModal(false);
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setArtistName('');
      setCountry('');
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ── Google Sign-In — verbose logging + redirect fallback ──
  const handleGoogleLogin = async () => {
    setAuthError(null);
    setIsLoggingIn(true);
    const currentDomain = window.location.hostname;
    console.log('[Auth] Starting Google Sign-In from domain:', currentDomain);
    console.log('[Auth] Auth instance ready:', !!auth);
    console.log('[Auth] Google provider ready:', !!googleProvider);

    try {
      console.log('[Auth] Trying signInWithPopup...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('[Auth] Google login SUCCESS:', result.user.email);
      setShowAuthModal(false);
    } catch (error: any) {
      console.error('[Auth] Google login FAILED:', {
        code: error.code,
        message: error.message,
        email: error.customData?.email,
        credential: error.credential,
        fullError: error,
      });

      if (error.code === 'auth/unauthorized-domain') {
        setAuthError(`Domain "${currentDomain}" is not authorized in Firebase. Add it in Firebase Console → Authentication → Settings → Authorized domains.`);
      } else if (error.code === 'auth/operation-not-allowed') {
        setAuthError('Google Sign-In is not enabled in Firebase. Enable it in Firebase Console → Authentication → Sign-in method.');
      } else if (error.code === 'auth/invalid-api-key') {
        setAuthError('Invalid Firebase API key. Check your VITE_FIREBASE_API_KEY in Vercel environment variables.');
      } else if (error.code === 'auth/configuration-not-found') {
        setAuthError('Firebase auth configuration missing. Ensure Google provider is properly set up with a support email.');
      } else if (['auth/popup-blocked', 'auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(error.code)) {
        console.log('[Auth] Popup failed, trying signInWithRedirect...');
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr: any) {
          console.error('[Auth] Redirect also failed:', redirectErr);
          setAuthError(`Popup blocked. Redirect failed: ${redirectErr.message}`);
        }
      } else {
        setAuthError(`Google Sign-In error: [${error.code}] ${error.message}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { setAuthError(t('auth.allFieldsRequired')); return; }
    try { await sendPasswordResetEmail(auth, email); setResetSent(true); setAuthError(null); } catch (e: any) { setAuthError(e.message); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAdmin(false);
    setActiveModule('landing');
    setIsMenuOpen(false);
    navigate('/');
  };

  const openAuth = (signUp: boolean) => {
    setShowAuthModal(true);
    setIsSignUp(signUp);
    setAuthError(null);
    setResetSent(false);
    setIsMenuOpen(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 text-turquoise animate-spin" />
      <p className="text-white/20 text-xs font-bold uppercase tracking-widest">{t('brand.tagline')}</p>
    </div>
  );

  if (location.pathname.startsWith('/s/') || location.pathname.startsWith('/l/')) {
    return <Suspense fallback={<ModuleLoader />}><SpotlightPublic /></Suspense>;
  }

  function renderModule() {
    if (activeModule === 'landing' && !user) return <LandingPage t={t} onGetStarted={() => setActiveModule('dashboard')} />;
    if (activeModule === 'landing' || activeModule === 'dashboard') return <Dashboard t={t} onNavigate={setActiveModule} user={user} onSignUp={() => openAuth(true)} />;

    switch (activeModule) {
      case 'smart-link':
        return <SmartLinkPro t={t} user={user} isAdmin={isAdmin} onBack={goHome} onGenerate={() => handleGenerate('smart-link')} />;
      case 'epk':
      case 'bio':
        return <EPKAssistant t={t} user={user} isAdmin={isAdmin} onBack={goHome} onGenerate={() => handleGenerate('epk')} lang={currentLang} />;
      case 'artwork':
        return <ArtworkStudio t={t} user={user} isAdmin={isAdmin} onBack={goHome} onGenerate={() => handleGenerate('artwork')} />;
      case 'video': {
        const hasAccess = isAdmin || user?.isPro || user?.plan === 'artist' || user?.plan === 'pro';
        if (!user) return <AuthGate t={t} onSignUp={() => openAuth(true)} />;
        if (!hasAccess) return <ProGate t={t} onUpgrade={() => setActiveModule('membership')} />;
        return <VideoModule t={t} onBack={goHome} />;
      }
      case 'tutorials':
        return <TutorialsPage t={t} onNavigate={setActiveModule} />;
      case 'membership':
      case 'pricing':
        return <MembershipPage t={t} user={user} isAdmin={isAdmin} />;
      case 'my-account':
        return user ? <MyAccountPage t={t} user={user} isAdmin={isAdmin} onNavigate={setActiveModule} /> : <AuthGate t={t} onSignUp={() => openAuth(true)} />;
      case 'release-hub':
        return <ReleaseHub />;
      case 'media-library':
        return <MediaLibrary t={t} user={user} onBack={goHome} onSelectImage={(url) => { console.log('[MediaLibrary] Selected:', url); goHome(); }} />;
      case 'contact':
        return <ContactPage t={t} />;
      case 'faq':
        return <FAQPage t={t} />;
      default:
        if (['about', 'privacy', 'terms'].includes(activeModule)) return <InfoPages page={activeModule as any} lang={currentLang} />;
        return <Dashboard t={t} onNavigate={setActiveModule} user={user} onSignUp={() => openAuth(true)} />;
    }
  }

  const showAppShell = activeModule !== 'landing' || user;

  function renderAuthModal() {
    return (
      <AnimatePresence>
        {showAuthModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm" onClick={() => setShowAuthModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="w-full max-w-md bg-[#0B0E14] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-turquoise to-purple-neon" />
              <div className="text-center mb-6">
                <img src="/logo-musaic.jpeg" alt="Musaic AI" className="w-14 h-14 rounded-2xl mx-auto mb-3 shadow-lg" />
                <h2 className="text-xl font-black uppercase tracking-tight text-white">{isSignUp ? t('auth.joinClub') : t('auth.accessStudio')}</h2>
                <p className="text-white/40 text-[10px] font-medium tracking-wider uppercase mt-1">{isSignUp ? t('auth.freeTokensOnSignup') : t('auth.signIn')}</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {authError && <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex items-start gap-2"><AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" /><p className="text-red-400/80 text-xs">{authError}</p></div>}
                {resetSent && <div className="bg-turquoise/10 border border-turquoise/30 p-3 rounded-xl text-turquoise text-xs">{t('auth.resetSent')}</div>}

                <div className="space-y-3">
                  {isSignUp && (
                    <>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-turquoise" />
                        <input
                          type="text"
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-turquoise/40 text-sm placeholder:text-white/15"
                          placeholder="First name"
                        />
                      </div>

                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-turquoise" />
                        <input
                          type="text"
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-turquoise/40 text-sm placeholder:text-white/15"
                          placeholder="Last name"
                        />
                      </div>

                      <div className="relative group">
                        <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-turquoise" />
                        <input
                          type="text"
                          value={artistName}
                          onChange={e => setArtistName(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-turquoise/40 text-sm placeholder:text-white/15"
                          placeholder="Artist name"
                        />
                      </div>

                      <div className="relative group">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-turquoise" />
                        <input
                          type="text"
                          value={country}
                          onChange={e => setCountry(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-turquoise/40 text-sm placeholder:text-white/15"
                          placeholder="Country"
                        />
                      </div>
                    </>
                  )}

                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-turquoise" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-turquoise/40 text-sm placeholder:text-white/15"
                      placeholder={t('auth.emailPlaceholder')}
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-turquoise" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-turquoise/40 text-sm placeholder:text-white/15"
                      placeholder={t('auth.passwordPlaceholder')}
                    />
                  </div>

                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[10px] text-white/30 hover:text-turquoise ml-1"
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  )}
                </div>

                <button type="submit" disabled={isLoggingIn} className="w-full bg-turquoise text-black font-bold uppercase tracking-widest py-3 rounded-xl hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isLoggingIn ? <><Loader2 className="w-4 h-4 animate-spin" />{t('auth.processing')}</> : (isSignUp ? t('auth.createAccount') : t('auth.signIn'))}
                </button>

                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-white/10" />
                  <span className="mx-3 text-white/20 text-[9px] font-bold uppercase tracking-widest">{t('auth.orContinueWith')}</span>
                  <div className="flex-grow border-t border-white/10" />
                </div>

                <button type="button" onClick={handleGoogleLogin} disabled={isLoggingIn} className="w-full bg-white/5 text-white border border-white/10 font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-white/10 disabled:opacity-50 flex items-center justify-center gap-3">
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  Google
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setAuthError(null);
                      setResetSent(false);
                    }}
                    className="text-xs text-white/40 hover:text-turquoise"
                  >
                    {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.newHere')}
                  </button>
                </div>
              </form>

              <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 p-2 text-white/20 hover:text-white"><X className="w-5 h-5" /></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  function renderSidebar() {
    return (
      <aside className="hidden lg:flex flex-col w-20 xl:w-72 border-r border-white/5 bg-[#050505]/50 backdrop-blur-xl z-30">
        <div className="flex-1 py-6 px-3 space-y-2">
          <button onClick={goHome} className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all group ${activeModule === 'dashboard' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
            <Home className={`w-5 h-5 ${activeModule === 'dashboard' ? 'text-turquoise' : 'group-hover:text-turquoise transition-colors'}`} />
            <span className="hidden xl:block text-[11px] font-bold uppercase tracking-widest">Artist Hub</span>
            {activeModule === 'dashboard' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-turquoise shadow-[0_0_10px_rgba(0,255,221,0.8)] hidden xl:block" />}
          </button>
          <div className="h-px bg-white/5 my-2" />
          {NAV_ITEMS.filter(i => i.id !== 'dashboard').map(item => (
            <button key={item.id} onClick={() => setActiveModule(item.id)} className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all group ${activeModule === item.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
              <item.icon className={`w-5 h-5 ${activeModule === item.id ? 'text-turquoise' : 'group-hover:text-turquoise transition-colors'}`} />
              <span className="hidden xl:block text-[11px] font-bold uppercase tracking-widest">{t(item.label)}</span>
              {activeModule === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-turquoise shadow-[0_0_10px_rgba(0,255,221,0.8)] hidden xl:block" />}
            </button>
          ))}
          <div className="h-px bg-white/5 my-3" />
          {[
            { id: 'release-hub', icon: Sparkles, label: t('nav.releaseHub'), active: activeModule === 'release-hub' },
            { id: 'tutorials', icon: BookOpen, label: t('nav.tutorials'), active: activeModule === 'tutorials' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveModule(item.id as ModuleId)} className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all group ${item.active ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
              <item.icon className={`w-5 h-5 ${item.active ? 'text-turquoise' : 'group-hover:text-turquoise transition-colors'}`} />
              <span className="hidden xl:block text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
          <div className="h-px bg-white/5 my-3" />
          <button onClick={() => setActiveModule(user ? 'my-account' : 'membership')} className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all group ${activeModule === 'my-account' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
            <User className={`w-5 h-5 ${activeModule === 'my-account' ? 'text-turquoise' : 'group-hover:text-turquoise transition-colors'}`} />
            <span className="hidden xl:block text-[11px] font-bold uppercase tracking-widest">{t('nav.myAccount')}</span>
          </button>
          <button onClick={() => setActiveModule('membership')} className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all group ${activeModule === 'membership' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
            <Crown className={`w-5 h-5 ${activeModule === 'membership' ? 'text-gold' : 'group-hover:text-gold transition-colors'}`} />
            <span className="hidden xl:block text-[11px] font-bold uppercase tracking-widest">{t('nav.membership')}</span>
          </button>
          <button onClick={() => setShowAIModal(true)} className="w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all group text-white/40 hover:text-white hover:bg-white/5">
            <Sparkles className="w-5 h-5 group-hover:text-purple-500 transition-colors" />
            <span className="hidden xl:block text-[11px] font-bold uppercase tracking-widest">{t('nav.aiPersona')}</span>
          </button>
        </div>
      </aside>
    );
  }

  return (
    <ErrorBoundary t={t}>
      <div className="min-h-screen bg-[#050505] text-white font-sans antialiased overflow-x-hidden">
        <Header
          user={user ? { ...user, displayName: user.artistName || user.displayName || user.email } : user}
          isAdmin={isAdmin}
          isStarted={!!showAppShell}
          onLogin={() => openAuth(false)}
          onSignUp={() => openAuth(true)}
          onMenuOpen={() => setIsMenuOpen(true)}
          currentLang={currentLang}
          onLangChange={setCurrentLang}
          tokenBalance={user?.points}
        />

        {!showAppShell ? (
          <div className="h-screen flex flex-col pt-[80px]">
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {renderSidebar()}
              <main className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-br from-[#050505] to-[#0B0E14] relative pb-20 lg:pb-0">
                <Suspense fallback={<ModuleLoader />}>
                  <LandingPage t={t} onGetStarted={() => setActiveModule('dashboard')} />
                </Suspense>
                <Footer lang={currentLang} onNavigate={page => { setActiveModule(page as ModuleId); window.scrollTo(0, 0); }} />
              </main>
            </div>
          </div>
        ) : (
          <div className="h-screen flex flex-col pt-[80px]">
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {renderSidebar()}
              <main className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-br from-[#050505] to-[#0B0E14] relative pb-20 lg:pb-0">
                <Suspense fallback={<ModuleLoader />}>
                  <AnimatePresence mode="wait">
                    <motion.div key={activeModule} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="relative z-10 min-h-full">
                      {renderModule()}
                    </motion.div>
                  </AnimatePresence>
                </Suspense>
                {!['smart-link', 'dashboard', 'landing', 'artwork', 'epk', 'bio', 'video'].includes(activeModule) && <Footer lang={currentLang} onNavigate={page => { setActiveModule(page as ModuleId); window.scrollTo(0, 0); }} />}
              </main>
            </div>

            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#050505]/95 backdrop-blur-xl border-t border-white/10 safe-area-pb">
              <div className="flex items-center justify-around px-2 py-2">
                {BOTTOM_NAV_ITEMS.map(item => (
                  <button key={item.id} onClick={() => setActiveModule(item.id)} className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${activeModule === item.id ? 'text-turquoise' : 'text-white/30'}`}>
                    <item.icon className="w-5 h-5" />
                    <span className="text-[8px] font-bold uppercase tracking-wider">{t(`bottomNav.${item.id === 'dashboard' ? 'home' : item.id === 'smart-link' ? 'link' : item.id === 'epk' ? 'epk' : item.id === 'artwork' ? 'art' : 'video'}`)}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>
        )}

        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150]" />
              <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed top-0 left-0 h-full w-80 bg-[#0B0E14] border-r border-white/10 z-[151] p-8 shadow-2xl overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <img src="/logo-musaic.jpeg" alt="" className="w-9 h-9 rounded-xl" />
                    <span className="text-lg font-black uppercase tracking-tight text-white">Menu</span>
                  </div>
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6 text-white" /></button>
                </div>

                <div className="space-y-1">
                  {[
                    { icon: Home, label: 'Artist Hub', module: 'dashboard' },
                    { icon: User, label: t('nav.myAccount'), module: user ? 'my-account' : 'membership' },
                    { icon: Crown, label: t('nav.membership'), module: 'membership' },
                    { icon: Sparkles, label: t('nav.releaseHub'), module: 'release-hub' },
                    { icon: BookOpen, label: t('nav.tutorials'), module: 'tutorials' },
                    { icon: HelpCircle, label: t('nav.faq'), module: 'faq' },
                    { icon: MessageSquare, label: t('nav.contact'), module: 'contact' },
                    { icon: Shield, label: t('nav.privacy'), module: 'privacy' },
                    { icon: FileText, label: t('nav.terms'), module: 'terms' }
                  ].map(({ icon: Icon, label, module }) => (
                    <button key={module} onClick={() => { setActiveModule(module as ModuleId); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group text-left">
                      <Icon className="w-5 h-5 text-white/40 group-hover:text-turquoise" />
                      <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white">{label}</span>
                    </button>
                  ))}

                  <div className="h-px bg-white/5 my-4" />

                  {user ? (
                    <>
                      <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group text-left">
                        <LogOut className="w-5 h-5 text-white/40" />
                        <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white">{t('nav.signOut')}</span>
                      </button>
                      <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-500/10 transition-all group text-left mt-4">
                        <Trash2 className="w-5 h-5 text-red-500/60 group-hover:text-red-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-red-500/60 group-hover:text-red-500">{t('nav.deleteAccount')}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => openAuth(false)} className="w-full py-3 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white/10">{t('auth.signIn')}</button>
                      <button onClick={() => openAuth(true)} className="w-full py-3 bg-turquoise text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:brightness-110 mt-2">{t('auth.createAccount')}</button>
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {renderAuthModal()}
      </div>

      <AIPreferencesModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} preferences={aiPreferences} onUpdate={setAIPreferences} />
    </ErrorBoundary>
  );
}

export default App;
