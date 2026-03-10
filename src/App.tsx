import React, { useState, useEffect, lazy, Suspense } from 'react';
import './index.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Lock, Mail, AlertCircle, Loader2,
  Menu, X, User, HelpCircle, Trash2, LayoutGrid, Video,
  FileText, LogOut, Globe, BookOpen, Image as ImageIcon,
  Sparkles, Coins, ArrowRight, CreditCard, MessageSquare,
  Send, ChevronDown, Check, Crown
} from 'lucide-react';
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
  signInWithPopup, sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { AIPreferences, DEFAULT_AI_PREFERENCES } from './types';
import { AIPreferencesModal } from './components/AIPreferencesModal';
import { useTranslation, LanguageCode } from './lib/i18n';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

// ── Lazy Modules ──────────────────────────────────────────
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const SpotlightEditor = lazy(() => import('./components/SpotlightEditor').then(m => ({ default: m.SpotlightEditor })));
const VideoGenerator = lazy(() => import('./components/VideoGenerator').then(m => ({ default: m.VideoGenerator })));
const PressKitModule = lazy(() => import('./components/PressKitModule').then(m => ({ default: m.PressKitModule })));
const SpotlightPublic = lazy(() => import('./components/SpotlightPublic').then(m => ({ default: m.SpotlightPublic })));
const Tutorials = lazy(() => import('./components/Tutorials').then(m => ({ default: m.Tutorials })));
const ArtworkGenerator = lazy(() => import('./components/ArtworkGenerator').then(m => ({ default: m.ArtworkGenerator })));
const InfoPages = lazy(() => import('./components/InfoPages').then(m => ({ default: m.InfoPages })));
const ReleaseHub = lazy(() => import('./components/ReleaseHub').then(m => ({ default: m.default })));

// ── Constants ─────────────────────────────────────────────
const ADMIN_EMAIL = "contact.musaicai@gmail.com";

// Token costs per module
const TOKEN_COSTS: Record<string, number> = {
  'smart-link': 5,
  'epk': 5,
  'bio': 5,
  'artwork': 10,
  'video': 0, // PRO-gated, not token-gated
  'dashboard': 0,
  'release-hub': 0,
};

type ModuleId = 'landing' | 'dashboard' | 'smart-link' | 'bio' | 'epk' | 'video' | 'artwork'
  | 'tutorials' | 'membership' | 'release-hub' | 'pricing' | 'my-account'
  | 'about' | 'faq' | 'privacy' | 'terms' | 'contact';

// ── Sidebar nav (cleaned: no Release Strategy, only Artist Hub) ──
const NAV_ITEMS = [
  { id: 'dashboard' as ModuleId, icon: LayoutGrid, label: 'nav.dashboard' },
  { id: 'smart-link' as ModuleId, icon: Globe, label: 'nav.smartLink' },
  { id: 'epk' as ModuleId, icon: FileText, label: 'nav.epk' },
  { id: 'artwork' as ModuleId, icon: ImageIcon, label: 'nav.artwork' },
  { id: 'video' as ModuleId, icon: Video, label: 'nav.video' },
];

const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 5);

// ── Crisp Chat Integration ────────────────────────────────
function useCrisp() {
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).$crisp) {
      (window as any).$crisp = [];
      (window as any).CRISP_WEBSITE_ID = "5b5625ec-57f4-4fee-b118-fa32c27cf91a";
      const d = document;
      const s = d.createElement("script");
      s.src = "https://client.crisp.chat/l.js";
      s.async = true;
      d.getElementsByTagName("head")[0].appendChild(s);
    }
  }, []);
}

// ── Token deduction helper ────────────────────────────────
async function deductTokens(userId: string, cost: number): Promise<boolean> {
  if (cost <= 0) return true;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return false;
    const currentPoints = snap.data().points || 0;
    if (currentPoints < cost) return false;
    await updateDoc(userRef, { points: increment(-cost) });
    return true;
  } catch (err) {
    console.error('Token deduction error:', err);
    return false;
  }
}

// ── Module Loader ─────────────────────────────────────────
function ModuleLoader() {
  return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-turquoise animate-spin" /></div>;
}

// ── Error Boundary ────────────────────────────────────────
class ErrorBoundary extends React.Component<{ children: React.ReactNode; t: (k: string) => string }, { hasError: boolean; error: any }> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
          <div className="space-y-6 max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-black uppercase text-white">{this.props.t('error.title')}</h1>
            <p className="text-gray-400 text-sm">{this.state.error?.message}</p>
            <button onClick={() => window.location.reload()} className="px-8 py-3 bg-turquoise text-black font-bold uppercase rounded-xl">{this.props.t('error.reload')}</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Dashboard — Pizza 2×2 Grid ────────────────────────────
function Dashboard({ t, onNavigate, user, onSignUp }: { t: (k: string) => string; onNavigate: (id: ModuleId) => void; user: any; onSignUp: () => void }) {
  const modules = [
    { id: 'smart-link' as ModuleId, title: t('mod.smartLink'), desc: t('mod.smartLink.desc'), cost: t('mod.cost.smartLink'), icon: Globe, color: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20' },
    { id: 'epk' as ModuleId, title: t('mod.pressKit'), desc: t('mod.pressKit.desc'), cost: t('mod.cost.pressKit'), icon: FileText, color: 'text-pink-500', bg: 'bg-pink-500/10', ring: 'ring-pink-500/20' },
    { id: 'artwork' as ModuleId, title: t('mod.artwork'), desc: t('mod.artwork.desc'), cost: t('mod.cost.artwork'), icon: ImageIcon, color: 'text-turquoise', bg: 'bg-turquoise/10', ring: 'ring-turquoise/20' },
    { id: 'video' as ModuleId, title: t('mod.video'), desc: t('mod.video.desc'), cost: t('mod.cost.video'), icon: Video, color: 'text-purple-neon', bg: 'bg-purple-neon/10', ring: 'ring-purple-neon/20' },
  ];

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Header row */}
      <div className="mb-3 lg:mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-white">
            {user ? t('dash.welcomeBack') : t('dash.studio')}
          </h2>
          <p className="text-white/40 text-[10px] font-semibold uppercase tracking-[0.3em] mt-0.5">
            {user ? t('dash.chooseModule') : t('dash.exploreGuest')}
          </p>
        </div>
        {user && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gold/10 border border-gold/20">
            <Coins className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs font-black text-gold">{user.points >= 999999 ? '∞' : user.points}</span>
            <span className="text-[9px] text-gold/60 font-semibold">{t('dash.tokens')}</span>
          </div>
        )}
      </div>

      {/* Guest banner */}
      {!user && (
        <div className="mb-3 p-3 rounded-2xl bg-turquoise/5 border border-turquoise/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-turquoise flex-shrink-0" />
            <p className="text-xs text-white/70">{t('dash.signupBanner')} <span className="text-turquoise font-bold">{t('dash.freeTokens')}</span></p>
          </div>
          <button onClick={onSignUp} className="px-4 py-1.5 bg-turquoise text-black font-bold text-[10px] uppercase tracking-wider rounded-lg hover:brightness-110 transition-all flex-shrink-0">
            {t('dash.signUp')}
          </button>
        </div>
      )}

      {/* 2×2 Pizza Grid — responsive & centered */}
      <div className="flex-1 grid grid-cols-2 gap-3 lg:gap-4 min-h-0">
        {modules.map((mod, idx) => (
          <motion.button key={mod.id}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.06 }}
            onClick={() => onNavigate(mod.id)}
            className="group relative flex flex-col items-center justify-center glass-card glass-card-hover rounded-2xl lg:rounded-3xl overflow-hidden"
          >
            <div className={`p-4 lg:p-6 rounded-full ${mod.bg} ring-1 ${mod.ring} ${mod.color} group-hover:scale-110 transition-transform duration-500`}>
              <mod.icon className="w-6 h-6 lg:w-10 lg:h-10 drop-shadow-[0_0_15px_currentColor]" />
            </div>
            <h3 className="mt-3 text-xs lg:text-lg font-black uppercase tracking-tight text-white group-hover:text-turquoise transition-colors">
              {mod.title}
            </h3>
            <p className="text-[9px] lg:text-[11px] text-white/30 font-medium mt-0.5 hidden sm:block">{mod.desc}</p>
            {/* Token cost badge */}
            <span className={`mt-2 text-[8px] lg:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${mod.id === 'video' ? 'bg-purple-neon/10 text-purple-neon' : 'bg-white/5 text-white/40'}`}>
              {mod.cost}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Quick row — cleaned: Hub + Tutorials + Account (no Strategy) */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        <button onClick={() => onNavigate('release-hub')}
          className="flex items-center gap-2 p-3 glass-card rounded-xl hover:bg-white/5 transition-all group">
          <Sparkles className="w-4 h-4 text-turquoise" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 group-hover:text-white hidden sm:block">{t('quick.hub')}</span>
          <ArrowRight className="w-3 h-3 text-white/20 ml-auto" />
        </button>
        <button onClick={() => onNavigate('tutorials')}
          className="flex items-center gap-2 p-3 glass-card rounded-xl hover:bg-white/5 transition-all group">
          <BookOpen className="w-4 h-4 text-white/40" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 group-hover:text-white hidden sm:block">{t('quick.tutorials')}</span>
          <ArrowRight className="w-3 h-3 text-white/20 ml-auto" />
        </button>
        <button onClick={() => onNavigate(user ? 'my-account' : 'membership')}
          className="flex items-center gap-2 p-3 glass-card rounded-xl hover:bg-white/5 transition-all group">
          <User className="w-4 h-4 text-white/40" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 group-hover:text-white hidden sm:block">{t('quick.account')}</span>
          <ArrowRight className="w-3 h-3 text-white/20 ml-auto" />
        </button>
      </div>
    </div>
  );
}

// ── Auth Gate (Soft Wall) ─────────────────────────────────
function AuthGate({ t, onSignUp }: { t: (k: string) => string; onSignUp: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6">
      <div className="w-16 h-16 bg-turquoise/10 rounded-full flex items-center justify-center ring-1 ring-turquoise/20">
        <Lock className="w-8 h-8 text-turquoise" />
      </div>
      <h2 className="text-2xl font-black uppercase tracking-tight text-white">{t('wall.signInToCreate')}</h2>
      <p className="text-white/40 text-sm max-w-md">{t('wall.exploreFreely')}</p>
      <button onClick={onSignUp} className="px-8 py-4 bg-turquoise text-black font-bold uppercase tracking-widest rounded-xl hover:brightness-110 transition-all">
        {t('wall.signUpFree')}
      </button>
    </div>
  );
}

// ── Token Gate ────────────────────────────────────────────
function TokenGate({ t, onUpgrade }: { t: (k: string) => string; onUpgrade: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6">
      <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center ring-1 ring-gold/20">
        <Coins className="w-8 h-8 text-gold" />
      </div>
      <h2 className="text-2xl font-black uppercase tracking-tight text-white">{t('wall.notEnoughTokens')}</h2>
      <p className="text-white/40 text-sm max-w-md">{t('wall.needMoreTokens')}</p>
      <button onClick={onUpgrade} className="px-8 py-4 bg-gold text-black font-bold uppercase tracking-widest rounded-xl hover:brightness-110 transition-all">
        {t('wall.upgradePlan')}
      </button>
    </div>
  );
}

// ── Pro Gate ──────────────────────────────────────────────
function ProGate({ t, onSignUp }: { t: (k: string) => string; onSignUp: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-6">
      <div className="w-16 h-16 bg-purple-neon/10 rounded-full flex items-center justify-center ring-1 ring-purple-neon/20">
        <Video className="w-8 h-8 text-purple-neon" />
      </div>
      <h2 className="text-2xl font-black uppercase tracking-tight text-white">{t('pro.feature')}</h2>
      <p className="text-white/40 text-sm max-w-md">{t('pro.videoMessage')}</p>
      <button onClick={onSignUp} className="px-8 py-4 bg-white text-black font-bold uppercase tracking-widest rounded-xl hover:bg-turquoise transition-all">
        {t('pro.unlock')}
      </button>
    </div>
  );
}

// ── My Account Page ───────────────────────────────────────
function MyAccountPage({ t, user, isAdmin, onNavigate }: { t: (k: string) => string; user: any; isAdmin: boolean; onNavigate: (id: ModuleId) => void }) {
  if (!user) return null;
  const planLabel = isAdmin ? t('account.admin') : user.isPro ? t('account.planPro') : user.plan === 'artist' ? t('account.planArtist') : t('account.planGuest');

  return (
    <div className="max-w-2xl mx-auto p-6 lg:p-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">{t('account.title')}</h1>
        {isAdmin && (
          <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-[10px] font-bold uppercase tracking-widest">
            <Shield className="w-3 h-3" /> {t('account.admin')}
          </span>
        )}
      </div>

      {/* Token card */}
      <div className="glass-card rounded-3xl p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">{t('account.tokensRemaining')}</p>
          <Coins className="w-5 h-5 text-gold" />
        </div>
        <p className="text-5xl font-black text-gold">{isAdmin ? '∞' : user.points}</p>
        <p className="text-white/30 text-xs mt-1">{isAdmin ? t('account.unlimited') : t('dash.tokens')}</p>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: t('account.currentPlan'), value: planLabel, icon: CreditCard },
          { label: t('account.email'), value: user.email, icon: Mail },
          { label: t('account.role'), value: isAdmin ? t('account.admin') : t('account.user'), icon: Shield },
          { label: t('account.memberSince'), value: user.createdAt?.toDate?.()?.toLocaleDateString?.() || '—', icon: User },
        ].map((item, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 flex items-start gap-4">
            <div className="p-2 rounded-xl bg-white/5"><item.icon className="w-4 h-4 text-white/30" /></div>
            <div>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{item.label}</p>
              <p className="text-sm text-white font-semibold mt-0.5 break-all">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upgrade CTA */}
      {!isAdmin && (
        <button onClick={() => onNavigate('membership')} className="w-full py-4 bg-turquoise text-black font-bold uppercase tracking-widest rounded-xl hover:brightness-110 transition-all">
          {t('account.managePlan')}
        </button>
      )}
    </div>
  );
}

// ── Membership / Pricing Page ─────────────────────────────
function MembershipPage({ t, user, isAdmin }: { t: (k: string) => string; user: any; isAdmin: boolean }) {
  const currentPlan = isAdmin ? 'admin' : user?.isPro ? 'pro' : user?.plan === 'artist' ? 'artist' : 'guest';

  const plans = [
    {
      id: 'guest', name: t('pricing.guest'), price: t('pricing.guestPrice'), tokens: t('pricing.guestTokens'),
      features: [t('pricing.guest.f1'), t('pricing.guest.f2'), t('pricing.guest.f3'), t('pricing.guest.f4')],
      color: 'border-white/10', badge: null,
    },
    {
      id: 'artist', name: t('pricing.artist'), price: t('pricing.artistPrice'), tokens: t('pricing.artistTokens'),
      features: [t('pricing.artist.f1'), t('pricing.artist.f2'), t('pricing.artist.f3'), t('pricing.artist.f4')],
      color: 'border-turquoise/30', badge: t('pricing.popular'),
    },
    {
      id: 'pro', name: t('pricing.pro'), price: t('pricing.proPrice'), tokens: t('pricing.proTokens'),
      features: [t('pricing.pro.f1'), t('pricing.pro.f2'), t('pricing.pro.f3'), t('pricing.pro.f4')],
      color: 'border-purple-neon/30', badge: null,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tight text-white">{t('pricing.title')}</h1>
        <p className="text-white/40 text-sm mt-2">{t('pricing.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <motion.div key={plan.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className={`relative glass-card rounded-3xl p-6 lg:p-8 border ${plan.color} ${plan.id === 'artist' ? 'ring-1 ring-turquoise/20' : ''}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-turquoise text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                  {plan.badge}
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-lg font-black uppercase tracking-tight text-white">{plan.name}</h3>
                <p className="text-3xl font-black text-white mt-2">{plan.price}</p>
                <p className="text-white/40 text-xs mt-1">{plan.tokens}</p>
              </div>
              <div className="space-y-3 mb-8">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className={`w-4 h-4 flex-shrink-0 ${i === plan.features.length - 1 && plan.id !== 'pro' ? 'text-white/20' : 'text-turquoise'}`} />
                    <span className={`text-xs ${i === plan.features.length - 1 && plan.id !== 'pro' ? 'text-white/20 line-through' : 'text-white/60'}`}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                disabled={isCurrent}
                className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${
                  isCurrent
                    ? 'bg-white/5 text-white/30 cursor-default'
                    : plan.id === 'artist'
                      ? 'bg-turquoise text-black hover:brightness-110'
                      : plan.id === 'pro'
                        ? 'bg-purple-neon text-white hover:brightness-110'
                        : 'bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                {isCurrent ? t('pricing.currentPlan') : plan.id === 'guest' ? t('pricing.getStarted') : t('pricing.upgrade')}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Contact Page ──────────────────────────────────────────
function ContactPage({ t }: { t: (k: string) => string }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    // Simulated send — replace with actual backend call (e.g. Firebase function, emailJS, etc.)
    await new Promise(r => setTimeout(r, 1200));
    console.log('[Contact Form]', { subject, message });
    setSending(false);
    setSent(true);
    setSubject('');
    setMessage('');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 lg:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">{t('contact.title')}</h1>
        <p className="text-white/40 text-sm mt-2">{t('contact.subtitle')}</p>
      </div>

      {sent ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-3xl p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-turquoise/10 rounded-full flex items-center justify-center ring-1 ring-turquoise/20 mx-auto">
            <Check className="w-8 h-8 text-turquoise" />
          </div>
          <p className="text-white font-bold">{t('contact.sent')}</p>
          <button onClick={() => setSent(false)} className="text-turquoise text-xs font-bold uppercase tracking-wider hover:underline">
            {t('contact.send')}
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleSend} className="glass-card rounded-3xl p-6 lg:p-8 space-y-5">
          <div>
            <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2 block">{t('contact.subject')}</label>
            <input
              type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-turquoise/40 transition-all text-sm placeholder:text-white/15"
              placeholder={t('contact.subjectPlaceholder')}
            />
          </div>
          <div>
            <label className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2 block">{t('contact.message')}</label>
            <textarea
              value={message} onChange={(e) => setMessage(e.target.value)} rows={6}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-turquoise/40 transition-all text-sm placeholder:text-white/15 resize-none"
              placeholder={t('contact.messagePlaceholder')}
            />
          </div>
          <button type="submit" disabled={sending || !subject.trim() || !message.trim()}
            className="w-full py-3 bg-turquoise text-black font-bold uppercase tracking-widest rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('contact.sending')}</> : <><Send className="w-4 h-4" /> {t('contact.send')}</>}
          </button>
        </form>
      )}
    </div>
  );
}

// ── FAQ Page (i18n) ───────────────────────────────────────
function FAQPage({ t }: { t: (k: string) => string }) {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 lg:p-10">
      <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-8">{t('faq.title')}</h1>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="glass-card rounded-2xl overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
              <span className="text-sm font-bold text-white pr-4">{faq.q}</span>
              <ChevronDown className={`w-4 h-4 text-white/30 transition-transform flex-shrink-0 ${open === i ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <p className="px-5 pb-5 text-white/50 text-sm leading-relaxed">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tutorials Page (i18n) ─────────────────────────────────
function TutorialsPage({ t }: { t: (k: string) => string }) {
  const tutorials = [
    { title: t('tutorials.t1.title'), desc: t('tutorials.t1.desc'), icon: Globe, color: 'text-emerald-400' },
    { title: t('tutorials.t2.title'), desc: t('tutorials.t2.desc'), icon: FileText, color: 'text-pink-500' },
    { title: t('tutorials.t3.title'), desc: t('tutorials.t3.desc'), icon: ImageIcon, color: 'text-turquoise' },
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 lg:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">{t('tutorials.title')}</h1>
        <p className="text-white/40 text-sm mt-2">{t('tutorials.subtitle')}</p>
      </div>
      <div className="space-y-4">
        {tutorials.map((tut, i) => (
          <div key={i} className="glass-card rounded-2xl p-6 flex items-start gap-5">
            <div className={`p-3 rounded-xl bg-white/5 ${tut.color}`}>
              <tut.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{tut.title}</h3>
              <p className="text-white/40 text-sm mt-1">{tut.desc}</p>
            </div>
          </div>
        ))}
        <div className="glass-card rounded-2xl p-6 flex items-center gap-5 opacity-50">
          <div className="p-3 rounded-xl bg-white/5 text-purple-neon"><Video className="w-6 h-6" /></div>
          <p className="text-white/40 text-sm italic">{t('tutorials.comingSoon')}</p>
        </div>
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

  // ── Crisp chat widget ──
  useCrisp();

  // ── Auth state listener ──
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
            // ── NEW USER: auto-assign 50 credits (number type) ──
            userData = {
              email: u.email,
              displayName: u.displayName || '',
              avatar: u.photoURL || '',
              credits: 50,   // ← Firestore field: credits (number)
              points: 50,    // ← Legacy compat
              isPro: false,
              plan: 'guest',
              createdAt: serverTimestamp(),
            };
            await setDoc(userDocRef, userData);
          }
          const isSuperAdmin = u.email === ADMIN_EMAIL;
          setUser({
            ...u,
            ...userData,
            uid: u.uid,
            isPro: isSuperAdmin || userData.isPro,
            points: isSuperAdmin ? 999999 : (userData.points ?? userData.credits ?? 50),
          });
          setIsAdmin(isSuperAdmin);
          if (activeModule === 'landing') setActiveModule('dashboard');
        } catch (error) {
          console.error("Auth error:", error);
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

  // ── Refresh user points from Firestore ──
  const refreshUserPoints = async () => {
    if (!user?.uid || isAdmin) return;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const pts = snap.data().points ?? snap.data().credits ?? 0;
        setUser((prev: any) => prev ? { ...prev, points: pts } : prev);
      }
    } catch (err) { console.error('Refresh points error:', err); }
  };

  // ── Token-aware generate handler (passed to modules) ──
  const handleGenerate = async (moduleId: string): Promise<boolean> => {
    // Not logged in → open auth modal
    if (!user) {
      openAuth(true);
      return false;
    }
    // Admin gets unlimited
    if (isAdmin) return true;
    // Check cost
    const cost = TOKEN_COSTS[moduleId] || 0;
    if (cost === 0) return true;
    // Check balance
    if ((user.points || 0) < cost) {
      setActiveModule('membership');
      return false;
    }
    // Deduct
    const success = await deductTokens(user.uid, cost);
    if (success) {
      await refreshUserPoints();
      return true;
    }
    return false;
  };

  // ── Auth handlers ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!email || !password) { setAuthError(t('auth.allFieldsRequired')); return; }
    setIsLoggingIn(true);
    try {
      if (isSignUp) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
      setShowAuthModal(false);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') setAuthError(t('auth.accountExists'));
      else if (['auth/wrong-password', 'auth/user-not-found', 'auth/invalid-credential'].includes(error.code)) setAuthError(t('auth.invalidCredentials'));
      else if (error.code === 'auth/weak-password') setAuthError(t('auth.weakPassword'));
      else setAuthError(error.message);
    } finally { setIsLoggingIn(false); }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setIsLoggingIn(true);
    try { await signInWithPopup(auth, googleProvider); setShowAuthModal(false); }
    catch (error: any) { if (!['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(error.code)) setAuthError(error.message); }
    finally { setIsLoggingIn(false); }
  };

  const handleForgotPassword = async () => {
    if (!email) { setAuthError(t('auth.allFieldsRequired')); return; }
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
    setShowAuthModal(true);
    setIsSignUp(signUp);
    setAuthError(null);
    setResetSent(false);
    setIsMenuOpen(false);
  };

  // ── Loading screen ──
  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="w-12 h-12 text-turquoise animate-spin" /></div>;

  // ── Public smart link route ──
  if (location.pathname.startsWith('/s/')) return <Suspense fallback={<ModuleLoader />}><SpotlightPublic /></Suspense>;

  // ═══════════════════════════════════════════════════════
  // ─── Module Renderer ──────────────────────────────────
  // ═══════════════════════════════════════════════════════
  function renderModule() {
    // Landing (non-logged in)
    if (activeModule === 'landing' && !user) return <LandingPage t={t} onGetStarted={() => setActiveModule('dashboard')} />;
    if (activeModule === 'landing' || activeModule === 'dashboard') return <Dashboard t={t} onNavigate={setActiveModule} user={user} onSignUp={() => openAuth(true)} />;

    switch (activeModule) {
      // ── Smart Link: soft wall (explore freely, auth on generate) ──
      case 'smart-link':
        return <SpotlightEditor
          user={user || { uid: 'guest', displayName: 'Guest' }}
          t={t}
          onBack={() => setActiveModule('dashboard')}
          generatedAssets={{}}
          onGenerate={() => handleGenerate('smart-link')}
        />;

      // ── Bio / Press Kit: soft wall ──
      case 'epk': case 'bio':
        return <PressKitModule lang={currentLang} aiPreferences={aiPreferences} onGenerate={() => handleGenerate('epk')} />;

      // ── Artwork: soft wall ──
      case 'artwork':
        return <ArtworkGenerator aiPreferences={aiPreferences} onGenerate={() => handleGenerate('artwork')} />;

      // ── Video: PRO only (hard gate for non-PRO) ──
      case 'video':
        return (user?.isPro || isAdmin)
          ? <VideoGenerator aiPreferences={aiPreferences} />
          : <ProGate t={t} onSignUp={() => setActiveModule('membership')} />;

      // ── Tutorials (i18n) ──
      case 'tutorials':
        return <TutorialsPage t={t} />;

      // ── Membership / Pricing ──
      case 'membership': case 'pricing':
        return <MembershipPage t={t} user={user} isAdmin={isAdmin} />;

      // ── My Account ──
      case 'my-account':
        return user
          ? <MyAccountPage t={t} user={user} isAdmin={isAdmin} onNavigate={setActiveModule} />
          : <AuthGate t={t} onSignUp={() => openAuth(true)} />;

      // ── Release Hub ──
      case 'release-hub':
        return <ReleaseHub />;

      // ── Contact (new i18n form) ──
      case 'contact':
        return <ContactPage t={t} />;

      // ── FAQ (i18n) ──
      case 'faq':
        return <FAQPage t={t} />;

      // ── Static pages (privacy, terms, about) ──
      default:
        if (['about', 'privacy', 'terms'].includes(activeModule))
          return <InfoPages page={activeModule as any} lang={currentLang} />;
        return <Dashboard t={t} onNavigate={setActiveModule} user={user} onSignUp={() => openAuth(true)} />;
    }
  }

  const showAppShell = activeModule !== 'landing' || user;

  // ═══════════════════════════════════════════════════════
  // ─── Auth Modal ───────────────────────────────────────
  // ═══════════════════════════════════════════════════════
  function renderAuthModal() {
    return (
      <AnimatePresence>
        {showAuthModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm" onClick={() => setShowAuthModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-[#0B0E14] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
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
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-turquoise transition-colors" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-turquoise/40 transition-all text-sm placeholder:text-white/15" placeholder={t('auth.emailPlaceholder')} />
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-turquoise transition-colors" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-turquoise/40 transition-all text-sm placeholder:text-white/15" placeholder={t('auth.passwordPlaceholder')} />
                  </div>
                  {!isSignUp && <button type="button" onClick={handleForgotPassword} className="text-[10px] text-white/30 hover:text-turquoise transition-colors ml-1">{t('auth.forgotPassword')}</button>}
                </div>
                <button type="submit" disabled={isLoggingIn} className="w-full bg-turquoise text-black font-bold uppercase tracking-widest py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isLoggingIn ? <><Loader2 className="w-4 h-4 animate-spin" />{t('auth.processing')}</> : (isSignUp ? t('auth.createAccount') : t('auth.signIn'))}
                </button>
                <div className="relative flex items-center py-1"><div className="flex-grow border-t border-white/10" /><span className="mx-3 text-white/20 text-[9px] font-bold uppercase tracking-widest">{t('auth.orContinueWith')}</span><div className="flex-grow border-t border-white/10" /></div>
                <button type="button" onClick={handleGoogleLogin} disabled={isLoggingIn} className="w-full bg-white/5 text-white border border-white/10 font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  Google
                </button>
                <div className="text-center"><button type="button" onClick={() => { setIsSignUp(!isSignUp); setAuthError(null); setResetSent(false); }} className="text-xs text-white/40 hover:text-turquoise transition-colors">{isSignUp ? t('auth.alreadyHaveAccount') : t('auth.newHere')}</button></div>
              </form>
              <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 p-2 text-white/20 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // ═══════════════════════════════════════════════════════
  // ─── Unified Sidebar (identical landing + modules) ────
  // ═══════════════════════════════════════════════════════
  function renderSidebar() {
    return (
      <aside className="hidden lg:flex flex-col w-20 xl:w-72 border-r border-white/5 bg-[#050505]/50 backdrop-blur-xl z-30">
        <div className="flex-1 py-6 px-3 space-y-2">
          {/* Main nav items */}
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all group ${activeModule === item.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
              <item.icon className={`w-5 h-5 ${activeModule === item.id ? 'text-turquoise' : 'group-hover:text-turquoise transition-colors'}`} />
              <span className="hidden xl:block text-[11px] font-bold uppercase tracking-widest">{t(item.label)}</span>
              {activeModule === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-turquoise shadow-[0_0_10px_rgba(0,255,221,0.8)] hidden xl:block" />}
            </button>
          ))}

          <div className="h-px bg-white/5 my-3" />

          {/* Release Hub */}
          <button onClick={() => setActiveModule('release-hub')}
            className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all group ${activeModule === 'release-hub' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
            <Sparkles className={`w-5 h-5 ${activeModule === 'release-hub' ? 'text-turquoise' : 'group-hover:text-turquoise transition-colors'}`} />
            <span className="hidden xl:block text-[11px] font-bold uppercase tracking-widest">{t('nav.releaseHub')}</span>
            {activeModule === 'release-hub' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-turquoise shadow-[0_0_10px_rgba(0,255,221,0.8)] hidden xl:block" />}
          </button>

          {/* Tutorials */}
          <button onClick={() => setActiveModule('tutorials')}
            className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all group ${activeModule === 'tutorials' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
            <BookOpen className={`w-5 h-5 ${activeModule === 'tutorials' ? 'text-turquoise' : 'group-hover:text-turquoise transition-colors'}`} />
            <span className="hidden xl:block text-[11px] font-bold uppercase tracking-widest">{t('nav.tutorials')}</span>
          </button>

          <div className="h-px bg-white/5 my-3" />

          {/* My Account */}
          <button onClick={() => setActiveModule(user ? 'my-account' : 'membership')}
            className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all group ${activeModule === 'my-account' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
            <User className={`w-5 h-5 ${activeModule === 'my-account' ? 'text-turquoise' : 'group-hover:text-turquoise transition-colors'}`} />
            <span className="hidden xl:block text-[11px] font-bold uppercase tracking-widest">{t('nav.myAccount')}</span>
          </button>

          {/* Membership */}
          <button onClick={() => setActiveModule('membership')}
            className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all group ${activeModule === 'membership' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
            <Crown className={`w-5 h-5 ${activeModule === 'membership' ? 'text-gold' : 'group-hover:text-gold transition-colors'}`} />
            <span className="hidden xl:block text-[11px] font-bold uppercase tracking-widest">{t('nav.membership')}</span>
          </button>

          {/* AI Persona */}
          <button onClick={() => setShowAIModal(true)} className="w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all group text-white/40 hover:text-white hover:bg-white/5">
            <Sparkles className="w-5 h-5 group-hover:text-purple-500 transition-colors" />
            <span className="hidden xl:block text-[11px] font-bold uppercase tracking-widest">{t('nav.aiPersona')}</span>
          </button>
        </div>
      </aside>
    );
  }

  // ═══════════════════════════════════════════════════════
  // ─── Render ───────────────────────────────────────────
  // ═══════════════════════════════════════════════════════
  return (
    <ErrorBoundary t={t}>
      <div className="min-h-screen bg-[#050505] text-white font-sans antialiased overflow-x-hidden">
        <Header user={user} isAdmin={isAdmin} isStarted={!!showAppShell}
          onLogin={() => openAuth(false)} onSignUp={() => openAuth(true)} onMenuOpen={() => setIsMenuOpen(true)}
          currentLang={currentLang} onLangChange={setCurrentLang} tokenBalance={user?.points} />

        {!showAppShell ? (
          /* Landing page — ALSO gets the sidebar for consistency */
          <div className="h-screen flex flex-col pt-[80px]">
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {renderSidebar()}
              <main className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-br from-[#050505] to-[#0B0E14] relative pb-20 lg:pb-0">
                <Suspense fallback={<ModuleLoader />}>
                  <LandingPage t={t} onGetStarted={() => setActiveModule('dashboard')} />
                </Suspense>
                <Footer lang={currentLang} onNavigate={(page) => { setActiveModule(page as ModuleId); window.scrollTo(0, 0); }} />
              </main>
            </div>
          </div>
        ) : (
          /* App shell with sidebar */
          <div className="h-screen flex flex-col pt-[80px]">
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {renderSidebar()}

              {/* Content */}
              <main className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-br from-[#050505] to-[#0B0E14] relative pb-20 lg:pb-0">
                <Suspense fallback={<ModuleLoader />}>
                  <AnimatePresence mode="wait">
                    <motion.div key={activeModule} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="relative z-10 min-h-full">
                      {renderModule()}
                    </motion.div>
                  </AnimatePresence>
                </Suspense>
                {!['smart-link', 'dashboard', 'landing'].includes(activeModule) && (
                  <Footer lang={currentLang} onNavigate={(page) => { setActiveModule(page as ModuleId); window.scrollTo(0, 0); }} />
                )}
              </main>
            </div>

            {/* Mobile bottom nav */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#050505]/95 backdrop-blur-xl border-t border-white/10 safe-area-pb">
              <div className="flex items-center justify-around px-2 py-2">
                {BOTTOM_NAV_ITEMS.map((item) => (
                  <button key={item.id} onClick={() => setActiveModule(item.id)}
                    className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${activeModule === item.id ? 'text-turquoise' : 'text-white/30'}`}>
                    <item.icon className="w-5 h-5" />
                    <span className="text-[8px] font-bold uppercase tracking-wider">
                      {t(`bottomNav.${item.id === 'dashboard' ? 'home' : item.id === 'smart-link' ? 'link' : item.id === 'epk' ? 'epk' : item.id === 'artwork' ? 'art' : 'video'}`)}
                    </span>
                  </button>
                ))}
              </div>
            </nav>
          </div>
        )}

        {/* ── Hamburger menu ── */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150]" />
              <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed top-0 left-0 h-full w-80 bg-[#0B0E14] border-r border-white/10 z-[151] p-8 shadow-2xl overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <img src="/logo-musaic.jpeg" alt="" className="w-9 h-9 rounded-xl" />
                    <span className="text-lg font-black uppercase tracking-tight text-white">Menu</span>
                  </div>
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6 text-white" /></button>
                </div>
                <div className="space-y-1">
                  {/* My Account */}
                  <button onClick={() => { setActiveModule(user ? 'my-account' : 'membership'); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group text-left">
                    <User className="w-5 h-5 text-white/40 group-hover:text-turquoise" />
                    <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white">{t('nav.myAccount')}</span>
                  </button>
                  {/* Membership */}
                  <button onClick={() => { setActiveModule('membership'); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group text-left">
                    <Crown className="w-5 h-5 text-gold/40 group-hover:text-gold" />
                    <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white">{t('nav.membership')}</span>
                  </button>
                  {/* Release Hub */}
                  <button onClick={() => { setActiveModule('release-hub'); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group text-left">
                    <Sparkles className="w-5 h-5 text-turquoise/60 group-hover:text-turquoise" />
                    <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white">{t('nav.releaseHub')}</span>
                  </button>
                  {/* Other links */}
                  {([
                    { icon: BookOpen, label: t('nav.tutorials'), module: 'tutorials' },
                    { icon: HelpCircle, label: t('nav.faq'), module: 'faq' },
                    { icon: MessageSquare, label: t('nav.contact'), module: 'contact' },
                    { icon: Shield, label: t('nav.privacy'), module: 'privacy' },
                    { icon: FileText, label: t('nav.terms'), module: 'terms' },
                  ] as const).map(({ icon: Icon, label, module }) => (
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
                      <button onClick={() => openAuth(false)} className="w-full py-3 bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white/10 transition-all">{t('auth.signIn')}</button>
                      <button onClick={() => openAuth(true)} className="w-full py-3 bg-turquoise text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:brightness-110 transition-all mt-2">{t('auth.createAccount')}</button>
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
