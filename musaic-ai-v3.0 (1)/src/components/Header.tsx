import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  ChevronDown, 
  Menu, 
  User, 
  LogIn, 
  Sparkles,
  Shield,
  Check
} from 'lucide-react';

// --- Language Configuration ---
export type LanguageCode = 'en' | 'fr' | 'es' | 'pt' | 'it' | 'de' | 'jp';

interface LanguageConfig {
  code: LanguageCode;
  label: string;
}

const LANGUAGES: LanguageConfig[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
  { code: 'jp', label: '日本語' },
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
}

export function Header({ 
  user, 
  isAdmin, 
  isStarted, 
  onLogin, 
  onSignUp, 
  onMenuOpen,
  currentLang,
  onLangChange
}: HeaderProps) {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 h-[80px] bg-[#050505]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 lg:px-10"
    >
      {/* Left: Language Selector */}
      <div className="relative flex items-center">
        <button 
          onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
          className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/80 group"
        >
          <Globe className="w-4 h-4 text-turquoise group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-black italic uppercase tracking-widest hidden sm:inline-block">
            {LANGUAGES.find(l => l.code === currentLang)?.label}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isLangMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 mt-2 w-48 bg-[#0B0E14]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onLangChange(lang.code);
                    setIsLangMenuOpen(false);
                  }}
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

      {/* Center: Logo */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative group cursor-pointer">
          <div className="absolute inset-0 bg-turquoise/20 blur-[20px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <img 
            src="/Logo-musaic.png" 
            alt="Musaic.AI" 
            className="h-[60px] w-auto relative z-10 drop-shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-transform group-hover:scale-105"
            onError={(e) => {
              // Fallback if image fails
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = `
                <div class="flex items-center gap-2">
                  <span class="text-2xl font-black italic uppercase tracking-tighter text-white">Musaic<span class="text-turquoise">.</span>AI</span>
                </div>
              `;
            }}
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {!isStarted ? (
          <>
            <button 
              onClick={onLogin}
              className="hidden sm:flex px-6 py-2.5 rounded-xl text-white/60 hover:text-white font-black italic uppercase tracking-widest text-[10px] transition-colors"
            >
              Login
            </button>
            <button 
              onClick={onSignUp}
              className="px-6 py-2.5 rounded-xl border border-purple-neon text-purple-neon hover:bg-purple-neon hover:text-black font-black italic uppercase tracking-widest text-[10px] transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Up</span>
            </button>
          </>
        ) : (
          <>
            {isAdmin ? (
              <div className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-turquoise/5 border border-turquoise/20 rounded-2xl">
                <Shield className="w-4 h-4 text-turquoise" />
                <span className="text-[11px] font-black italic uppercase tracking-[0.2em] text-turquoise">Admin</span>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl">
                <User className="w-4 h-4 text-white/40" />
                <span className="text-[11px] font-black italic uppercase tracking-[0.2em] text-white/40">Preview</span>
              </div>
            )}
            
            <button 
              onClick={onMenuOpen}
              className="p-3 hover:bg-white/5 rounded-xl transition-colors text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    </motion.header>
  );
}
