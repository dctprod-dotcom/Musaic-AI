import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  CreditCard, 
  Zap, 
  Check, 
  Star, 
  Crown, 
  Shield,
  Coins,
  Globe,
  ChevronDown,
  Sparkles,
  LayoutGrid,
  Video
} from 'lucide-react';

// --- Language Configuration ---
type LanguageCode = 'en' | 'fr' | 'es' | 'pt' | 'it' | 'de' | 'jp';

interface LanguageConfig {
  code: LanguageCode;
  label: string;
  dir: 'ltr' | 'rtl';
  currency: string;
  tokenPrice: string;
}

const LANGUAGES: LanguageConfig[] = [
  { code: 'en', label: 'English', dir: 'ltr', currency: '$', tokenPrice: '$10' },
  { code: 'fr', label: 'Français', dir: 'ltr', currency: '€', tokenPrice: '10€' },
  { code: 'es', label: 'Español', dir: 'ltr', currency: '€', tokenPrice: '10€' },
  { code: 'pt', label: 'Português', dir: 'ltr', currency: 'R$', tokenPrice: 'R$50' },
  { code: 'it', label: 'Italiano', dir: 'ltr', currency: '€', tokenPrice: '10€' },
  { code: 'de', label: 'Deutsch', dir: 'ltr', currency: '€', tokenPrice: '10€' },
  { code: 'jp', label: '日本語', dir: 'ltr', currency: '¥', tokenPrice: '¥1500' },
];

// --- Translations ---
const TRANSLATIONS = {
  en: {
    title: 'Membership & Billing',
    subtitle: 'Manage your creative arsenal',
    currentPlan: 'Current Plan',
    tokens: 'Musaic Points',
    buyTokens: 'Buy 100 Points',
    upgrade: 'Upgrade to Pro',
    downgrade: 'Switch to Free',
    active: 'Active',
    mostPopular: 'Most Popular',
    free: {
      name: 'Free',
      price: '0',
      period: '/mo',
      features: [
        'Limited Studio Access',
        '1 Active Smart Link',
        'Watermarked Videos',
        'Standard Support'
      ]
    },
    pro: {
      name: 'Ibiza Pro',
      price: '19.99',
      period: '/mo',
      features: [
        'Unlimited Smart Links',
        'HD Video Generator (No Watermark)',
        'Full EPK & Strategy Access',
        'Priority Support'
      ]
    },
    tokenStore: {
      title: 'Token Store',
      subtitle: 'Pay as you go',
      desc: 'Top up your balance to create more assets without a subscription.',
      costLink: '15 pts / Smart Link',
      costVideo: '5 pts / AI Video'
    }
  },
  fr: {
    title: 'Abonnement & Facturation',
    subtitle: 'Gérez votre arsenal créatif',
    currentPlan: 'Plan Actuel',
    tokens: 'Points Musaic',
    buyTokens: 'Acheter 100 Points',
    upgrade: 'Passer Pro',
    downgrade: 'Passer au Gratuit',
    active: 'Actif',
    mostPopular: 'Le Plus Populaire',
    free: {
      name: 'Gratuit',
      price: '0',
      period: '/mois',
      features: [
        'Accès Studio Limité',
        '1 Smart Link Actif',
        'Vidéos avec Filigrane',
        'Support Standard'
      ]
    },
    pro: {
      name: 'Ibiza Pro',
      price: '19.99',
      period: '/mois',
      features: [
        'Smart Links Illimités',
        'Générateur Vidéo HD (Sans Filigrane)',
        'Accès Complet EPK & Stratégie',
        'Support Prioritaire'
      ]
    },
    tokenStore: {
      title: 'Boutique de Tokens',
      subtitle: 'Paiement à la carte',
      desc: 'Rechargez votre solde pour créer plus d\'actifs sans abonnement.',
      costLink: '15 pts / Smart Link',
      costVideo: '5 pts / Vidéo IA'
    }
  },
  es: {
    title: 'Membresía y Facturación',
    subtitle: 'Gestiona tu arsenal creativo',
    currentPlan: 'Plan Actual',
    tokens: 'Puntos Musaic',
    buyTokens: 'Comprar 100 Puntos',
    upgrade: 'Mejorar a Pro',
    downgrade: 'Cambiar a Gratis',
    active: 'Activo',
    mostPopular: 'Más Popular',
    free: {
      name: 'Gratis',
      price: '0',
      period: '/mes',
      features: [
        'Acceso Limitado al Estudio',
        '1 Smart Link Activo',
        'Videos con Marca de Agua',
        'Soporte Estándar'
      ]
    },
    pro: {
      name: 'Ibiza Pro',
      price: '19.99',
      period: '/mes',
      features: [
        'Smart Links Ilimitados',
        'Generador de Video HD (Sin Marca)',
        'Acceso Completo EPK y Estrategia',
        'Soporte Prioritario'
      ]
    },
    tokenStore: {
      title: 'Tienda de Tokens',
      subtitle: 'Pago por uso',
      desc: 'Recarga tu saldo para crear más activos sin suscripción.',
      costLink: '15 pts / Smart Link',
      costVideo: '5 pts / Video IA'
    }
  },
  pt: {
    title: 'Assinatura e Faturamento',
    subtitle: 'Gerencie seu arsenal criativo',
    currentPlan: 'Plano Atual',
    tokens: 'Pontos Musaic',
    buyTokens: 'Comprar 100 Pontos',
    upgrade: 'Mudar para Pro',
    downgrade: 'Mudar para Grátis',
    active: 'Ativo',
    mostPopular: 'Mais Popular',
    free: {
      name: 'Grátis',
      price: '0',
      period: '/mês',
      features: [
        'Acesso Limitado ao Estúdio',
        '1 Smart Link Ativo',
        'Vídeos com Marca D\'água',
        'Suporte Padrão'
      ]
    },
    pro: {
      name: 'Ibiza Pro',
      price: '19.99',
      period: '/mês',
      features: [
        'Smart Links Ilimitados',
        'Gerador de Vídeo HD (Sem Marca)',
        'Acesso Completo EPK e Estratégia',
        'Suporte Prioritário'
      ]
    },
    tokenStore: {
      title: 'Loja de Tokens',
      subtitle: 'Pague pelo uso',
      desc: 'Recarregue seu saldo para criar mais ativos sem assinatura.',
      costLink: '15 pts / Smart Link',
      costVideo: '5 pts / Vídeo IA'
    }
  },
  it: {
    title: 'Abbonamento e Fatturazione',
    subtitle: 'Gestisci il tuo arsenale creativo',
    currentPlan: 'Piano Attuale',
    tokens: 'Punti Musaic',
    buyTokens: 'Compra 100 Punti',
    upgrade: 'Passa a Pro',
    downgrade: 'Passa a Gratuito',
    active: 'Attivo',
    mostPopular: 'Più Popolare',
    free: {
      name: 'Gratuito',
      price: '0',
      period: '/mese',
      features: [
        'Accesso Limitato allo Studio',
        '1 Smart Link Attivo',
        'Video con Filigrana',
        'Supporto Standard'
      ]
    },
    pro: {
      name: 'Ibiza Pro',
      price: '19.99',
      period: '/mese',
      features: [
        'Smart Link Illimitati',
        'Generatore Video HD (No Filigrana)',
        'Accesso Completo EPK e Strategia',
        'Supporto Prioritario'
      ]
    },
    tokenStore: {
      title: 'Negozio di Token',
      subtitle: 'Paga a consumo',
      desc: 'Ricarica il tuo saldo per creare più risorse senza abbonamento.',
      costLink: '15 pt / Smart Link',
      costVideo: '5 pt / Video IA'
    }
  },
  de: {
    title: 'Mitgliedschaft & Abrechnung',
    subtitle: 'Verwalte dein kreatives Arsenal',
    currentPlan: 'Aktueller Plan',
    tokens: 'Musaic Punkte',
    buyTokens: '100 Punkte kaufen',
    upgrade: 'Upgrade auf Pro',
    downgrade: 'Wechsel zu Kostenlos',
    active: 'Aktiv',
    mostPopular: 'Beliebtestes',
    free: {
      name: 'Kostenlos',
      price: '0',
      period: '/Monat',
      features: [
        'Begrenzter Studiozugang',
        '1 Aktiver Smart Link',
        'Videos mit Wasserzeichen',
        'Standard-Support'
      ]
    },
    pro: {
      name: 'Ibiza Pro',
      price: '19.99',
      period: '/Monat',
      features: [
        'Unbegrenzte Smart Links',
        'HD Video Generator (Kein Wasserzeichen)',
        'Voller EPK & Strategie Zugang',
        'Prioritäts-Support'
      ]
    },
    tokenStore: {
      title: 'Token Store',
      subtitle: 'Pay-as-you-go',
      desc: 'Lade dein Guthaben auf, um mehr Assets ohne Abo zu erstellen.',
      costLink: '15 Pkt / Smart Link',
      costVideo: '5 Pkt / KI Video'
    }
  },
  jp: {
    title: 'メンバーシップと請求',
    subtitle: 'クリエイティブな武器を管理する',
    currentPlan: '現在のプラン',
    tokens: 'Musaicポイント',
    buyTokens: '100ポイント購入',
    upgrade: 'Proにアップグレード',
    downgrade: '無料プランへ',
    active: 'アクティブ',
    mostPopular: '一番人気',
    free: {
      name: '無料',
      price: '0',
      period: '/月',
      features: [
        'スタジオアクセス制限あり',
        'アクティブなスマートリンク1つ',
        '透かし入り動画',
        '標準サポート'
      ]
    },
    pro: {
      name: 'Ibiza Pro',
      price: '19.99',
      period: '/月',
      features: [
        '無制限のスマートリンク',
        'HD動画ジェネレーター（透かしなし）',
        'EPKと戦略への完全アクセス',
        '優先サポート'
      ]
    },
    tokenStore: {
      title: 'トークンストア',
      subtitle: '都度払い',
      desc: 'サブスクリプションなしでアセットを作成するために残高をチャージします。',
      costLink: '15 pt / スマートリンク',
      costVideo: '5 pt / AI動画'
    }
  }
};

export function Membership({ user, lang = 'en' }: { user: any, lang?: LanguageCode }) {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  // Initialize state based on user props if available
  const [currentPlanId, setCurrentPlanId] = useState<'free' | 'pro'>(user?.isPro ? 'pro' : 'free');
  const [tokenBalance, setTokenBalance] = useState(user?.points ?? 50);
  const [loading, setLoading] = useState(false);

  // Effect to sync with user prop changes (e.g. when admin logs in)
  React.useEffect(() => {
    if (user) {
      if (user.isPro !== undefined) setCurrentPlanId(user.isPro ? 'pro' : 'free');
      if (user.points !== undefined) setTokenBalance(user.points);
    }
  }, [user]);

  const currentLang = lang;
  const t = TRANSLATIONS[currentLang];
  const langConfig = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];
  const currentDir = langConfig.dir;

  const handleUpgrade = async (planId: 'free' | 'pro') => {
    setLoading(true);
    // Simulate API call to Stripe
    setTimeout(() => {
      setCurrentPlanId(planId);
      setLoading(false);
      alert(`Successfully switched to ${planId === 'pro' ? 'Ibiza Pro' : 'Free'} plan!`);
    }, 1500);
  };

  const buyTokens = async () => {
    setLoading(true);
    // Simulate API call to Stripe
    setTimeout(() => {
      setTokenBalance(prev => prev + 100);
      setLoading(false);
      alert('Successfully purchased 100 Musaic Points!');
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12" dir={currentDir}>
      {/* Header & Language Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-white/5 text-white ring-1 ring-white/10 backdrop-blur-md">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">{t.title}</h2>
            <p className="text-[10px] font-black italic uppercase tracking-[0.4em] text-white/30 mt-1">{t.subtitle}</p>
          </div>
        </div>

        <div className="relative">
          {/* Language selector removed - handled by Header */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Subscription Status (Pricing Cards) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* FREE Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`relative flex flex-col p-8 rounded-[32px] border backdrop-blur-md transition-all duration-300 ${
              currentPlanId === 'free'
                ? 'bg-white/[0.05] border-white/20 shadow-xl'
                : 'bg-black/20 border-white/5 opacity-60 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 rounded-xl bg-white/5 text-white/60">
                <User className="w-6 h-6" />
              </div>
              {currentPlanId === 'free' && (
                <div className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-black italic uppercase tracking-widest text-white">
                  {t.active}
                </div>
              )}
            </div>

            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">{t.free.name}</h3>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-black tracking-tighter text-white">{langConfig.currency}{t.free.price}</span>
              <span className="text-xs font-bold uppercase tracking-wider text-white/40">{t.free.period}</span>
            </div>

            <div className="flex-1 space-y-4 mb-8">
              {t.free.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-white/30" />
                  <span className="text-xs font-medium text-white/60">{feature}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => handleUpgrade('free')}
              disabled={currentPlanId === 'free' || loading}
              className={`w-full py-4 rounded-xl font-black italic uppercase tracking-widest text-[10px] transition-all border ${
                currentPlanId === 'free'
                  ? 'bg-white/5 border-white/10 text-white/40 cursor-default'
                  : 'bg-transparent border-white/20 text-white hover:bg-white/5 hover:border-white/40'
              }`}
            >
              {currentPlanId === 'free' ? t.currentPlan : t.downgrade}
            </button>
          </motion.div>

          {/* IBIZA PRO Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`relative flex flex-col p-8 rounded-[32px] border backdrop-blur-md transition-all duration-300 ${
              currentPlanId === 'pro'
                ? 'bg-gradient-to-br from-turquoise/10 to-purple-neon/10 border-turquoise/50 shadow-[0_0_40px_rgba(0,255,255,0.15)]'
                : 'bg-black/40 border-white/10 hover:border-turquoise/30'
            }`}
          >
            {currentPlanId !== 'pro' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-turquoise text-black text-[9px] font-black italic uppercase tracking-widest shadow-lg shadow-turquoise/20">
                {t.mostPopular}
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-turquoise to-purple-neon text-white shadow-lg">
                <Crown className="w-6 h-6" />
              </div>
              {currentPlanId === 'pro' && (
                <div className="px-3 py-1 rounded-full bg-turquoise/20 border border-turquoise/30 text-[10px] font-black italic uppercase tracking-widest text-turquoise">
                  {t.active}
                </div>
              )}
            </div>

            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-turquoise to-purple-neon mb-2">
              {t.pro.name}
            </h3>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-black tracking-tighter text-white">{langConfig.currency}{t.pro.price}</span>
              <span className="text-xs font-bold uppercase tracking-wider text-white/40">{t.pro.period}</span>
            </div>

            <div className="flex-1 space-y-4 mb-8">
              {t.pro.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 p-0.5 rounded-full bg-turquoise/20">
                    <Check className="w-3 h-3 text-turquoise" />
                  </div>
                  <span className="text-xs font-medium text-white">{feature}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => handleUpgrade('pro')}
              disabled={currentPlanId === 'pro' || loading}
              className={`w-full py-4 rounded-xl font-black italic uppercase tracking-widest text-[10px] transition-all shadow-lg ${
                currentPlanId === 'pro'
                  ? 'bg-white/5 border border-white/10 text-white/40 cursor-default'
                  : 'bg-white text-black hover:bg-turquoise hover:shadow-[0_0_20px_rgba(0,255,255,0.6)] hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {currentPlanId === 'pro' ? t.currentPlan : t.upgrade}
            </button>
          </motion.div>
        </div>

        {/* Token Store (Pay-as-you-go) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-4"
        >
          <div className="h-full bg-white/[0.02] border border-white/10 rounded-[32px] p-8 flex flex-col backdrop-blur-md relative overflow-hidden group">
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-turquoise/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-turquoise/10 transition-colors duration-700" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-white/5 text-turquoise ring-1 ring-turquoise/20">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">{t.tokenStore.title}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{t.tokenStore.subtitle}</p>
                </div>
              </div>

              {/* Token Counter */}
              <div className="bg-black/40 border border-white/5 rounded-2xl p-6 mb-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-turquoise/5 animate-pulse" />
                <div className="relative z-10">
                  <div className="text-5xl font-black tracking-tighter text-turquoise drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">
                    {tokenBalance}
                  </div>
                  <div className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/40 mt-2">
                    {t.tokens}
                  </div>
                </div>
              </div>

              <p className="text-xs text-white/60 leading-relaxed mb-8">
                {t.tokenStore.desc}
              </p>

              {/* Cost Breakdown */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <LayoutGrid className="w-4 h-4 text-white/60" />
                    <span className="text-xs font-medium text-white/80">Smart Link</span>
                  </div>
                  <span className="text-[10px] font-bold text-turquoise">{t.tokenStore.costLink}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <Video className="w-4 h-4 text-white/60" />
                    <span className="text-xs font-medium text-white/80">AI Video</span>
                  </div>
                  <span className="text-[10px] font-bold text-turquoise">{t.tokenStore.costVideo}</span>
                </div>
              </div>

              <div className="mt-auto">
                <button 
                  onClick={buyTokens}
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-turquoise/20 to-purple-neon/20 border border-turquoise/30 text-white font-black italic uppercase tracking-widest text-[10px] hover:bg-turquoise hover:text-black hover:border-turquoise hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 group-hover:border-turquoise/50"
                >
                  <Sparkles className="w-4 h-4" />
                  {t.buyTokens} <span className="opacity-50">({langConfig.tokenPrice})</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
