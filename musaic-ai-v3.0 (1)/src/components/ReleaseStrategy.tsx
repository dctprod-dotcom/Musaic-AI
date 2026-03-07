import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Target, Calendar, TrendingUp, Users, CheckCircle2, Circle, ArrowRight } from 'lucide-react';

export function ReleaseStrategy() {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    { id: 1, title: 'Pre-Save Campaign', status: 'active' },
    { id: 2, title: 'Social Teasers', status: 'pending' },
    { id: 3, title: 'Release Day', status: 'pending' },
    { id: 4, title: 'Post-Release Push', status: 'pending' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20">
          <Target className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Release Strategy</h2>
          <p className="text-[10px] font-black italic uppercase tracking-[0.4em] text-white/30 mt-1">AI Marketing Roadmap</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp className="w-32 h-32 text-white" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Current Phase: Pre-Save</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-turquoise/30 transition-all group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-turquoise/20 flex items-center justify-center text-turquoise group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-black italic uppercase tracking-wide text-white">Update Spotify Bio</h4>
                    <p className="text-[10px] text-white/40">Include pre-save link in bio</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-turquoise transition-colors" />
                </div>

                <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-turquoise/30 transition-all group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:scale-110 transition-transform">
                    <Circle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-black italic uppercase tracking-wide text-white/60">Post Teaser Video</h4>
                    <p className="text-[10px] text-white/30">Instagram Reels & TikTok</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-turquoise transition-colors" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-2 hover:bg-white/5 transition-colors">
              <Users className="w-6 h-6 text-purple-neon mb-2" />
              <h4 className="text-2xl font-black italic text-white">1.2k</h4>
              <p className="text-[10px] uppercase tracking-widest text-white/40">Target Reach</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-2 hover:bg-white/5 transition-colors">
              <Calendar className="w-6 h-6 text-turquoise mb-2" />
              <h4 className="text-2xl font-black italic text-white">14 Days</h4>
              <p className="text-[10px] uppercase tracking-widest text-white/40">Until Release</p>
            </div>
          </div>
        </div>

        <div className="bg-black/40 border-l border-white/5 p-6 space-y-8">
          <h3 className="text-xs font-black italic uppercase tracking-widest text-white/40">Roadmap</h3>
          <div className="space-y-0 relative">
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-white/10" />
            {steps.map((step, index) => (
              <div key={step.id} className="relative pl-10 py-4 group cursor-pointer">
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-4 border-[#050505] transition-all ${
                  step.status === 'active' ? 'bg-turquoise scale-110 shadow-[0_0_10px_rgba(0,255,255,0.5)]' : 'bg-white/20 group-hover:bg-white/40'
                }`} />
                <h4 className={`text-xs font-black italic uppercase tracking-wide transition-colors ${
                  step.status === 'active' ? 'text-white' : 'text-white/40 group-hover:text-white/60'
                }`}>
                  {step.title}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
