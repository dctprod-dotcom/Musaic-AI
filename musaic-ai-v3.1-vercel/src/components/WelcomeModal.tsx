import React, { useState } from 'react';
import { X, Music, Sparkles, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function WelcomeModal({ t }: { t: (key: string) => string }) {
  const [isOpen, setIsOpen] = useState(() => {
    // Check localStorage before initial render to prevent flash
    const isHidden = localStorage.getItem('musaic_welcome_hidden');
    return isHidden !== 'true';
  });
  
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('musaic_welcome_hidden', 'true');
    }
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gold/20 bg-black/95 shadow-2xl shadow-gold/10"
          >
            {/* Close Button */}
            <button 
              onClick={handleClose}
              className="absolute top-[15px] right-[15px] cursor-pointer text-white hover:text-white/80 transition-colors z-10"
            >
              <X size={24} />
            </button>

            <div className="p-8 sm:p-10">
              {/* Header */}
              <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-bold text-gold mb-3 tracking-tight">
                  {t('welcome_title')}
                </h2>
                <p className="text-lg text-white/60 font-medium max-w-xl mx-auto">
                  {t('welcome_desc')}
                </p>
              </div>

              {/* Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-gold/0 via-gold/20 to-gold/0" />

                {/* Step 1 */}
                <div className="relative flex flex-col items-center text-center group">
                  <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4 group-hover:bg-gold/20 group-hover:scale-110 transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                    <Music className="w-8 h-8 text-gold" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{t('welcome_step1_title')}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {t('welcome_step1_desc')}
                  </p>
                </div>

                {/* Step 2 */}
                <div className="relative flex flex-col items-center text-center group">
                  <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4 group-hover:bg-gold/20 group-hover:scale-110 transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                    <Sparkles className="w-8 h-8 text-gold" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{t('welcome_step2_title')}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {t('welcome_step2_desc')}
                  </p>
                </div>

                {/* Step 3 */}
                <div className="relative flex flex-col items-center text-center group">
                  <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4 group-hover:bg-gold/20 group-hover:scale-110 transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                    <Globe className="w-8 h-8 text-gold" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{t('welcome_step3_title')}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {t('welcome_step3_desc')}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col items-center gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={dontShowAgain}
                      onChange={(e) => setDontShowAgain(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border-2 border-white/30 rounded transition-colors peer-checked:bg-gold peer-checked:border-gold group-hover:border-white/50"></div>
                    <svg 
                      className="absolute left-1 top-1 w-3 h-3 text-black opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="text-sm text-white/50 group-hover:text-white/80 transition-colors select-none">
                    {t('dont_show_again')}
                  </span>
                </label>

                <div className="mt-2">
                  <button 
                    id="btn-start-musaic"
                    onClick={handleClose}
                    className="bg-[#D4AF37] text-[#000000] font-bold px-[30px] py-[15px] rounded-[8px] hover:bg-[#E5C150] transition-colors uppercase"
                  >
                    {t('start_creating')}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
