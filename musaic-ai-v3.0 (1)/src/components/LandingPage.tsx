import React from 'react';
import { motion } from 'motion/react';
import { Music, ChevronRight } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] neon-glow-turquoise rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] neon-glow-purple rounded-full" />
      
      <div className="relative z-10 max-w-lg w-full space-y-16 text-center">
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8"
        >
          <div className="relative w-32 h-32 mx-auto group">
            <div className="absolute inset-0 bg-gradient-to-br from-turquoise to-purple-neon rounded-[40px] blur-2xl opacity-40 group-hover:opacity-80 transition-opacity duration-700 animate-pulse" />
            <div className="relative w-full h-full bg-black border border-white/10 rounded-[40px] flex items-center justify-center shadow-2xl overflow-hidden">
              <Music className="w-14 h-14 text-turquoise drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-8xl font-black italic uppercase tracking-tighter leading-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              Musaic<span className="text-turquoise">.</span>AI
            </h1>
            <p className="text-turquoise font-black italic uppercase tracking-[0.5em] text-[11px] whitespace-nowrap">
              Ibiza Club Latin Edition
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="relative bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-12 rounded-[48px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] space-y-10"
        >
          <div className="space-y-6">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
              The Ultimate Branding Tool<br/>For Independent Artists
            </h2>
            <p className="text-white/60 text-sm font-medium leading-relaxed">
              Generate your EPK, Smart Links, and Visual Content in seconds.
              Powered by AI, designed for the culture.
            </p>
          </div>

          <button 
            onClick={onGetStarted}
            className="w-full group relative overflow-hidden rounded-2xl bg-white p-6 transition-all hover:bg-turquoise active:scale-[0.98] shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)]"
          >
            <span className="relative flex items-center justify-center gap-4 text-black font-black italic uppercase tracking-[0.25em] text-base">
              Start Creating
              <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
