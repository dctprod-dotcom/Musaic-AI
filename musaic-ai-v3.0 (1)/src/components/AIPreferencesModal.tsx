import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Wand2, Save } from 'lucide-react';
import { AIPreferences } from '../types';

interface AIPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: AIPreferences;
  onUpdate: (prefs: AIPreferences) => void;
}

export function AIPreferencesModal({ isOpen, onClose, preferences, onUpdate }: AIPreferencesModalProps) {
  const [localPrefs, setLocalPrefs] = React.useState<AIPreferences>(preferences);

  // Sync local state when prop changes
  React.useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleSave = () => {
    onUpdate(localPrefs);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0B0E14] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Header Gradient */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-turquoise" />

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">AI Persona</h2>
                  <p className="text-white/40 text-[10px] font-black italic uppercase tracking-widest">Global Creative Preferences</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-white/20 hover:text-white transition-colors rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Art Style Preference */}
              <div className="space-y-2">
                <label className="text-[10px] font-black italic uppercase tracking-widest text-white/40 ml-1">Preferred Art Style</label>
                <div className="relative group">
                  <Wand2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    type="text"
                    value={localPrefs.artStyle}
                    onChange={(e) => setLocalPrefs({ ...localPrefs, artStyle: e.target.value })}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500/50 focus:bg-white/5 transition-all placeholder:text-white/10"
                    placeholder="e.g. Cyberpunk, Minimalist, Abstract..."
                  />
                </div>
                <p className="text-[10px] text-white/30 ml-1">Used for cover art and visual assets.</p>
              </div>

              {/* Bio Tone Preference */}
              <div className="space-y-2">
                <label className="text-[10px] font-black italic uppercase tracking-widest text-white/40 ml-1">Biography Tone</label>
                <div className="relative group">
                  <Wand2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-pink-500 transition-colors" />
                  <input
                    type="text"
                    value={localPrefs.bioTone}
                    onChange={(e) => setLocalPrefs({ ...localPrefs, bioTone: e.target.value })}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-pink-500/50 focus:bg-white/5 transition-all placeholder:text-white/10"
                    placeholder="e.g. Professional, Edgy, Storytelling..."
                  />
                </div>
                <p className="text-[10px] text-white/30 ml-1">Used for press releases and bios.</p>
              </div>

              {/* Video Aesthetic Preference */}
              <div className="space-y-2">
                <label className="text-[10px] font-black italic uppercase tracking-widest text-white/40 ml-1">Video Aesthetic</label>
                <div className="relative group">
                  <Wand2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-turquoise transition-colors" />
                  <input
                    type="text"
                    value={localPrefs.videoAesthetic}
                    onChange={(e) => setLocalPrefs({ ...localPrefs, videoAesthetic: e.target.value })}
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-turquoise/50 focus:bg-white/5 transition-all placeholder:text-white/10"
                    placeholder="e.g. Glitch, Cinematic, Lo-fi..."
                  />
                </div>
                <p className="text-[10px] text-white/30 ml-1">Used for video generation prompts.</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
              <button
                onClick={handleSave}
                className="w-full py-4 rounded-xl bg-white text-black font-black italic uppercase tracking-widest hover:bg-turquoise transition-all flex items-center justify-center gap-2 group"
              >
                <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Save Preferences
              </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
