// ─────────────────────────────────────────────────────────
// Musaic AI — Artwork Studio Pro
// Real format dimensions, Imagen 3, AI prompt enhancement
// ─────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, X, Loader2, Wand2, Download, RotateCcw,
  Square, RectangleHorizontal, RectangleVertical, Sparkles
} from 'lucide-react';
import { callImagen3, enhancePrompt } from './ai-service';

const FORMATS = [
  { id: 'cover',   label: 'artwork.formatCover',   dims: '3000 × 3000', ratio: '1:1',  w: 3000, h: 3000, icon: Square,               aspect: 'aspect-square' },
  { id: 'youtube', label: 'artwork.formatYT',       dims: '1280 × 720',  ratio: '16:9', w: 1280, h: 720,  icon: RectangleHorizontal,  aspect: 'aspect-video' },
  { id: 'story',   label: 'artwork.formatStory',    dims: '1080 × 1920', ratio: '9:16', w: 1080, h: 1920, icon: RectangleVertical,    aspect: 'aspect-[9/16]' },
  { id: 'banner',  label: 'artwork.formatBanner',   dims: '1500 × 500',  ratio: '3:1',  w: 1500, h: 500,  icon: RectangleHorizontal,  aspect: 'aspect-[3/1]' },
];

const STYLES = [
  { id: 'cinematic',   label: 'artwork.styleCinematic',  emoji: '🎬' },
  { id: 'anime',       label: 'artwork.styleAnime',      emoji: '🎌' },
  { id: 'abstract',    label: 'artwork.styleAbstract',   emoji: '🎨' },
  { id: 'vintage',     label: 'artwork.styleVintage',    emoji: '📻' },
  { id: 'minimal',     label: 'artwork.styleMinimal',    emoji: '◻️' },
  { id: 'neon',        label: 'artwork.styleNeon',       emoji: '💜' },
  { id: 'watercolor',  label: 'artwork.styleWatercolor', emoji: '🖌️' },
  { id: 'photorealistic', label: 'artwork.stylePhoto',   emoji: '📸' },
];

interface ArtworkStudioProps {
  t: (k: string) => string;
  user: any;
  isAdmin: boolean;
  onBack: () => void;
  onGenerate: () => Promise<boolean>;
}

export function ArtworkStudio({ t, user, isAdmin, onBack, onGenerate }: ArtworkStudioProps) {
  const [rawHints, setRawHints] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [style, setStyle] = useState('cinematic');
  const [format, setFormat] = useState('cover');
  const [generating, setGenerating] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedFormat = FORMATS.find(f => f.id === format)!;

  // AI transforms raw hints → pro prompt
  const handleEnhance = async () => {
    if (!rawHints.trim()) return;
    setEnhancing(true);
    setError(null);
    try {
      const result = await enhancePrompt(rawHints, `${selectedFormat.dims} ${style} style music artwork`);
      setEnhancedPrompt(result);
    } catch (err) { setError('Enhancement failed.'); }
    finally { setEnhancing(false); }
  };

  const handleGenerate = async () => {
    const prompt = enhancedPrompt || rawHints;
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const allowed = await onGenerate();
      if (!allowed) { setGenerating(false); return; }

      const imgResult = await callImagen3(prompt, style, selectedFormat.ratio);
      if (imgResult) {
        setResult(imgResult);
      } else {
        // Fallback placeholder with correct aspect ratio
        const w = Math.min(selectedFormat.w, 1024);
        const h = Math.round(w * (selectedFormat.h / selectedFormat.w));
        setResult(`https://picsum.photos/seed/${Date.now()}/${w}/${h}`);
      }
    } catch (err) {
      setError('Generation failed. Try again.');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-20 bg-gradient-to-b from-[#050505] via-[#050505]/95 to-transparent pt-4 pb-2 px-4 lg:px-8">
        <button onClick={onBack} className="inline-flex items-center gap-2 px-3 py-2 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest hover:bg-white/5 rounded-xl transition-all">
          <ArrowLeft className="w-4 h-4" /> {t('action.back')}
        </button>
        <h1 className="text-lg font-black uppercase tracking-tight text-white hidden sm:block">{t('mod.artwork')}</h1>
        <button onClick={onBack} className="p-2.5 text-white/30 hover:text-white hover:bg-white/10 rounded-xl transition-all"><X className="w-5 h-5" /></button>
      </div>

      <div className="max-w-4xl mx-auto p-4 lg:p-8 pt-0 space-y-6">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              {/* Result preview with real format */}
              <div className="glass-card rounded-3xl overflow-hidden p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{selectedFormat.dims} • {style}</span>
                </div>
                <div className={`rounded-2xl overflow-hidden mx-auto ${format === 'cover' ? 'max-w-lg' : format === 'story' ? 'max-w-xs' : 'max-w-2xl'}`}>
                  <img src={result} alt="Generated artwork" className={`w-full object-cover ${selectedFormat.aspect}`} />
                </div>
              </div>
              <div className="flex gap-3">
                <a href={result} download={`musaic-${format}-${Date.now()}.png`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 py-3 bg-turquoise text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> {t('artwork.download')}
                </a>
                <button onClick={() => { setResult(null); setError(null); }}
                  className="flex-1 py-3 bg-white/5 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4" /> {t('artwork.generateAnother')}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Format Selector */}
              <div className="glass-card rounded-2xl p-5">
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mb-3">{t('artwork.format')}</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {FORMATS.map(f => (
                    <button key={f.id} onClick={() => setFormat(f.id)}
                      className={`p-3 rounded-xl text-center transition-all ${format === f.id ? 'bg-turquoise/10 border border-turquoise/30 text-turquoise' : 'bg-white/5 border border-transparent text-white/40 hover:text-white/60 hover:bg-white/10'}`}>
                      <f.icon className="w-5 h-5 mx-auto mb-1.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">{t(f.label)}</span>
                      <span className="text-[8px] text-white/20 block mt-0.5">{f.dims}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Selector */}
              <div className="glass-card rounded-2xl p-5">
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mb-3">{t('artwork.style')}</p>
                <div className="grid grid-cols-4 gap-2">
                  {STYLES.map(s => (
                    <button key={s.id} onClick={() => setStyle(s.id)}
                      className={`py-2.5 px-2 rounded-xl text-center transition-all ${style === s.id ? 'bg-turquoise text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                      <span className="text-base block mb-0.5">{s.emoji}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider">{t(s.label)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Section */}
              <div className="glass-card rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">{t('artwork.yourIdea')}</p>
                  <button onClick={handleEnhance} disabled={enhancing || !rawHints.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-[9px] font-bold uppercase tracking-wider hover:bg-purple-500/20 transition-all disabled:opacity-30">
                    {enhancing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {t('artwork.aiEnhance')}
                  </button>
                </div>
                <textarea value={rawHints} onChange={e => setRawHints(e.target.value)} rows={3}
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-turquoise/40 text-sm placeholder:text-white/15 resize-none transition-all"
                  placeholder={t('artwork.promptPlaceholder')} />
                {enhancedPrompt && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                    <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
                      <p className="text-[9px] text-purple-400/60 font-bold uppercase tracking-wider mb-1">{t('artwork.enhancedPrompt')}</p>
                      <p className="text-xs text-white/60 leading-relaxed">{enhancedPrompt}</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>
              )}

              {/* Generate */}
              <button onClick={handleGenerate} disabled={generating || (!rawHints.trim() && !enhancedPrompt.trim())}
                className="w-full py-4 bg-turquoise text-black font-bold uppercase tracking-widest rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {generating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> {t('artwork.generating')}</>
                ) : (
                  <><Wand2 className="w-5 h-5" /> {t('artwork.generate')} — 10 {t('dash.tokens')}</>
                )}
              </button>

              {generating && (
                <div className="glass-card rounded-2xl p-8 text-center">
                  <div className={`mx-auto mb-4 rounded-2xl bg-turquoise/5 animate-pulse ${selectedFormat.aspect} max-w-[200px]`} />
                  <p className="text-white/30 text-xs">{t('artwork.processingImagen')}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
