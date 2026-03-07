import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Shield, Cookie } from 'lucide-react';
import { cn } from '../lib/utils';

interface CookieBannerProps {
  isVisible: boolean;
  onAcceptAll: () => void;
  onOpenSettings: () => void;
}

export function CookieBanner({ isVisible, onAcceptAll, onOpenSettings }: CookieBannerProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-t border-white/10 p-6 shadow-2xl"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4 max-w-3xl">
              <div className="p-3 bg-white/5 rounded-xl hidden md:block">
                <Cookie className="w-6 h-6 text-[#d4af37]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Cookie Consent</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  We use cookies to enhance your experience, analyze site traffic, and assist in our marketing efforts. 
                  By clicking "Accept All", you consent to our use of cookies. 
                  Visit "Settings" to manage your preferences.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={onOpenSettings}
                className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/5 transition-all"
              >
                Settings
              </button>
              <button
                onClick={onAcceptAll}
                className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-[#d4af37] text-black text-[10px] font-bold uppercase tracking-widest hover:bg-[#c5a028] transition-all shadow-lg shadow-[#d4af37]/20"
              >
                Accept All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface CookieModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: { essential: boolean; nonEssential: boolean };
  setPreferences: (prefs: { essential: boolean; nonEssential: boolean }) => void;
  onSave: () => void;
}

export function CookieModal({ isOpen, onClose, preferences, setPreferences, onSave }: CookieModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#d4af37]" />
                <h2 className="text-sm font-black text-white uppercase tracking-widest">Cookie Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <p className="text-xs text-white/60 leading-relaxed">
                Manage your cookie preferences below. Essential cookies are required for the website to function properly.
              </p>

              {/* Essential Cookies */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Essential Cookies</h3>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider">Required</span>
                  </div>
                  <p className="text-[10px] text-white/40 leading-relaxed">
                    Necessary for core functionality like authentication, security, and session management.
                  </p>
                </div>
                <div className="relative flex items-center">
                  <div className="w-10 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-end px-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm" />
                  </div>
                </div>
              </div>

              {/* Non-Essential Cookies */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Analytics & Marketing</h3>
                  </div>
                  <p className="text-[10px] text-white/40 leading-relaxed">
                    Help us improve our service by collecting anonymous usage data and personalizing your experience.
                  </p>
                </div>
                <button
                  onClick={() => setPreferences({ ...preferences, nonEssential: !preferences.nonEssential })}
                  className={cn(
                    "relative w-10 h-5 rounded-full transition-colors border",
                    preferences.nonEssential 
                      ? "bg-[#d4af37]/20 border-[#d4af37]/50" 
                      : "bg-white/5 border-white/10"
                  )}
                >
                  <motion.div
                    animate={{ x: preferences.nonEssential ? 20 : 2 }}
                    className={cn(
                      "absolute top-0.5 left-0 w-3.5 h-3.5 rounded-full shadow-sm transition-colors",
                      preferences.nonEssential ? "bg-[#d4af37]" : "bg-white/20"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end">
              <button
                onClick={onSave}
                className="px-6 py-3 rounded-xl bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                <Check className="w-3 h-3" />
                Save Preferences
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
