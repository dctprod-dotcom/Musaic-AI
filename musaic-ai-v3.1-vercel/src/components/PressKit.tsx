import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Upload, Download, Loader2, Image as ImageIcon, Music, Link as LinkIcon, Share2 } from 'lucide-react';

export function PressKit() {
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [tracks, setTracks] = useState<string[]>([]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="p-3 rounded-2xl bg-turquoise/10 text-turquoise ring-1 ring-turquoise/20">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Electronic Press Kit</h2>
          <p className="text-[10px] font-black italic uppercase tracking-[0.4em] text-white/30 mt-1">Professional Artist Profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Artist Biography</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-5 text-base font-medium text-white focus:border-turquoise/50 focus:ring-8 focus:ring-turquoise/5 focus:outline-none transition-all h-60 resize-none placeholder:text-white/10"
              placeholder="Tell your story..."
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">High-Res Photos</label>
            <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-turquoise/30 transition-all group cursor-pointer bg-black/20">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-white/20 group-hover:text-turquoise" />
              </div>
              <p className="text-[10px] font-black italic uppercase tracking-widest text-white/30">Upload Images</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Latest Releases</label>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-black/40 rounded-xl border border-white/5 hover:border-turquoise/20 transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-neon to-turquoise rounded-lg flex items-center justify-center">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black italic uppercase tracking-wide text-white">Neon Nights</h4>
                  <p className="text-[10px] uppercase tracking-widest text-white/40">Single • 2024</p>
                </div>
                <button className="p-2 text-white/20 hover:text-turquoise transition-colors">
                  <LinkIcon className="w-4 h-4" />
                </button>
              </div>
              
              <button className="w-full py-4 border border-dashed border-white/10 rounded-xl text-[10px] font-black italic uppercase tracking-widest text-white/30 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Track
              </button>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 space-y-4">
            <button className="w-full py-4 bg-turquoise text-black rounded-xl font-black italic uppercase tracking-widest text-xs hover:scale-[1.02] transition-all shadow-lg shadow-turquoise/20 flex items-center justify-center gap-3">
              <Share2 className="w-4 h-4" /> Share EPK Link
            </button>
            <button className="w-full py-4 bg-white/5 text-white rounded-xl font-black italic uppercase tracking-widest text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-3">
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Plus(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
