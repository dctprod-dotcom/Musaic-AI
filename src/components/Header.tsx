import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, ChevronDown, Menu, LogIn, Sparkles, Check, Coins } from 'lucide-react';
import { useTranslation, LanguageCode } from '../lib/i18n';

interface LanguageConfig { code: LanguageCode; label: string; }

const LANGUAGES: LanguageConfig[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
];

interface HeaderProps {
  user: any;
  isAdmin: boolean;
  isStarted: boolean;
  onLogin: () => void;
  onSignUp: () => void;
  onMenuOpen: () => void;
  currentLang: LanguageCode;
  onLangChange: (lang: LanguageCode) => void;
  tokenBalance?: number;
}

export function Header({
  user, isAdmin, isStarted, onLogin, onSignUp, onMenuOpen,
  currentLang, onLangChange, tokenBalance
}: HeaderProps) {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const { t } = useTranslation(currentLang);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 h-[80px] bg-[#050505]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 lg:px-10"
    >
      {/* Left: Menu */}
      <div className="flex items-center">
        <button onClick={onMenuOpen} className="p-3 hover:bg-white/5 rounded-xl transition-colors text-white">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Center: Logo */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative group cursor-pointer flex items-center gap-2.5">
          <img
            src="/logo-musaic.jpeg"
            alt="Musaic AI"
            className="h-10 w-10 lg:h-11 lg:w-11 rounded-xl object-cover shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow duration-500"
          />
          <div className="hidden sm:flex items-center gap-1.5 relative z-10">
            <span className="text-lg lg:text-xl font-black uppercase tracking-tight text-white">
              Musaic<span className="text-turquoise">.</span>AI
            </span>
            <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded-full text-white/50 font-bold">V3</span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Token balance (mobile + desktop when logged in) */}
        {user && tokenBalance !== undefined && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold/10 border border-gold/20">
            <Coins className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs font-black text-gold">{tokenBalance >= 999999 ? '∞' : tokenBalance}</span>
          </div>
        )}

        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/80 group"
          >
            <Globe className="w-4 h-4 text-turquoise group-hover:rotate-12 transition-transform" />
            <span className="text-xs font-black italic uppercase tracking-widest hidden sm:inline-block">
              {LANGUAGES.find(l => l.code === currentLang)?.label}
            </span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isLangMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="absolute top-full right-0 mt-2 w-48 bg-[#0B0E14]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
              >
                {LANGUAGES.map((lang) => (
                  <button key={lang.code}
                    onClick={() => { onLangChange(lang.code); setIsLangMenuOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors ${
                      currentLang === lang.code ? 'text-turquoise bg-turquoise/5' : 'text-white/60'
                    }`}
                  >
                    {lang.label}
                    {currentLang === lang.code && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!user && (
          <button onClick={onLogin}
            className="px-4 lg:px-6 py-2.5 rounded-xl bg-white text-black font-black italic uppercase tracking-widest text-[10px] hover:bg-turquoise transition-all">
            {t('auth.signIn')}
          </button>
        )}
      </div>
    </motion.header>
  );
}
