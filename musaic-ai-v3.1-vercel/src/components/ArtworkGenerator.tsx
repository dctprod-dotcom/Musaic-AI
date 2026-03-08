import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Image as ImageIcon, Wand2, Download, Loader2, Layers, Youtube, Instagram, Disc,
  Maximize2, Sparkles, Ban, History, Trash2
} from 'lucide-react';
import { AIPreferences } from '../types';
import { apiPost } from '../lib/api-client';

type ArtFormat = {
  id: string; label: string; subLabel: string;
  width: number; height: number; aspectRatio: string; icon: any;
};

const FORMATS: ArtFormat[] = [
  { id: 'cover', label: 'Cover Art', subLabel: '3000 x 3000px', width: 3000, height: 3000, aspectRatio: '1:1', icon: Disc },
  { id: 'youtube', label: 'YouTube Thumb', subLabel: '1280 x 720px', width: 1280, height: 720, aspectRatio: '16:9', icon: Youtube },
  { id: 'insta-square', label: 'Insta Post', subLabel: '1080 x 1080px', width: 1080, height: 1080, aspectRatio: '1:1', icon: Instagram },
  { id: 'insta-portrait', label: 'Insta Portrait', subLabel: '1080 x 1350px', width: 1080, height: 1350, aspectRatio: '4:5', icon: Maximize2 },
];

const ART_STYLES = [
  { id: 'photorealistic', label: 'Photorealistic' },
  { id: 'surrealist', label: 'Surrealist' },
  { id: 'cyberpunk', label: 'Cyberpunk' },
  { id: 'anime', label: 'Anime' },
  { id: 'oil-painting', label: 'Oil Painting' },
  { id: '3d-render', label: '3D Render' },
  { id: 'minimalist', label: 'Minimalist' },
  { id: 'fantasy', label: 'Fantasy' },
];

interface HistoryItem {
  id: string; url: string; prompt: string; style: string; format: ArtFormat; timestamp: number;
}

export function ArtworkGenerator({ aiPreferences }: { aiPreferences?: AIPreferences }) {
  const [prompt, setPrompt] = useState('');
  const [vision, setVision] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<ArtFormat>(FORMATS[0]);
  const [selectedStyle, setSelectedStyle] = useState<string>('photorealistic');
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (aiPreferences?.artStyle) {
      const matched = ART_STYLES.find(s => aiPreferences.artStyle.toLowerCase().includes(s.id));
      if (matched) setSelectedStyle(matched.id);
    }
  }, [aiPreferences]);

  const handleGenerate = async () => {
    if (!prompt) return;
    setGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const styleLabel = ART_STYLES.find(s => s.id === selectedStyle)?.label || selectedStyle;
      const fullPrompt = [
        `Generate a high quality music album artwork or social media visual.`,
        `Description: ${prompt}.`,
        vision ? `Creative Vision: ${vision}.` : '',
        `Style: ${styleLabel}.`,
        aiPreferences?.artStyle ? `Global style preference: ${aiPreferences.artStyle}.` : '',
        negativePrompt ? `Avoid: ${negativePrompt}.` : '',
        `Aspect Ratio: ${selectedFormat.aspectRatio}.`,
      ].filter(Boolean).join(' ');

      // ✅ Server-side call — no API key exposed
      const data = await apiPost('/api/ai/generate-image', {
        prompt: fullPrompt,
        aspectRatio: selectedFormat.aspectRatio,
      });

      if (data.image) {
        setGeneratedImage(data.image);
        setHistory(prev => [{
          id: Date.now().toString(), url: data.image, prompt, style: selectedStyle,
          format: selectedFormat, timestamp: Date.now()
        }, ...prev]);
      } else {
        throw new Error("No image returned");
      }
    } catch (err: any) {
      console.error("Generation failed:", err);
      setError(err.error || err.message || "Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setGeneratedImage(item.url);
    setPrompt(item.prompt);
    setSelectedStyle(item.style);
    setSelectedFormat(item.format);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-500 ring-1 ring-pink-500/20">
          <ImageIcon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Artwork Studio</h2>
          <p className="text-[10px] font-black italic uppercase tracking-[0.4em] text-white/30 mt-1">Cover Art & Social Assets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Format */}
          <div className="space-y-3">
            <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Output Format</label>
            <div className="grid grid-cols-2 gap-3">
              {FORMATS.map((format) => (
                <button key={format.id} onClick={() => setSelectedFormat(format)}
                  className={`relative p-4 rounded-2xl border text-left transition-all group overflow-hidden ${
                    selectedFormat.id === format.id
                      ? 'bg-white/10 border-pink-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.2)]'
                      : 'bg-white/[0.02] border-white/10 text-white/40 hover:bg-white/5'
                  }`}>
                  <format.icon className={`w-6 h-6 mb-2 ${selectedFormat.id === format.id ? 'text-pink-500' : 'text-white/20'}`} />
                  <div className="text-xs font-black italic uppercase tracking-wide">{format.label}</div>
                  <div className="text-[10px] font-medium opacity-50 mt-1">{format.subLabel}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="space-y-3">
            <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Art Style</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ART_STYLES.map((style) => (
                <button key={style.id} onClick={() => setSelectedStyle(style.id)}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    selectedStyle === style.id
                      ? 'bg-pink-500/20 border-pink-500 text-white'
                      : 'bg-white/[0.02] border-white/10 text-white/40 hover:bg-white/5'
                  }`}>
                  <div className="text-[9px] font-black italic uppercase tracking-wider truncate">{style.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-3">
            <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Visual Concept</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-5 text-base text-white focus:border-pink-500/50 focus:outline-none transition-all h-32 resize-none placeholder:text-white/10"
              placeholder="Describe your artwork..." />
          </div>

          {/* Vision */}
          <div className="space-y-3">
            <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Creative Vision (Optional)</label>
            <textarea value={vision} onChange={(e) => setVision(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-5 text-sm text-white focus:border-pink-500/50 focus:outline-none transition-all h-24 resize-none placeholder:text-white/10"
              placeholder="Add context, mood, meaning..." />
          </div>

          {/* Negative */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Negative Prompt</label>
              <Ban className="w-3 h-3 text-white/30" />
            </div>
            <input type="text" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-red-500/50 focus:outline-none transition-all placeholder:text-white/10"
              placeholder="Avoid: blurry, low quality, text..." />
          </div>

          {/* Generate */}
          <button onClick={handleGenerate} disabled={generating || !prompt}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black italic uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-pink-500/20 disabled:opacity-50 flex items-center justify-center gap-3">
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {generating ? "Generating..." : "Generate Asset"}
          </button>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>
          )}
        </div>

        {/* Preview */}
        <div className="lg:col-span-7 space-y-6">
          <div className="h-full bg-black/40 border border-white/10 rounded-[32px] p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px] lg:min-h-[500px]">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />

            {generatedImage ? (
              <div className="relative group w-full h-full flex items-center justify-center">
                <img src={generatedImage} alt="Generated" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                  style={{ aspectRatio: selectedFormat.aspectRatio.replace(':', '/') }} />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                  <a href={generatedImage} download={`musaic-${selectedFormat.id}.png`}
                    className="p-4 rounded-full bg-white text-black hover:bg-pink-500 hover:text-white transition-all">
                    <Download className="w-6 h-6" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6 opacity-30">
                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                  <Layers className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-widest text-white">Canvas Empty</h3>
              </div>
            )}

            {generating && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 backdrop-blur-md z-20">
                <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
                <p className="text-xs font-black italic uppercase tracking-widest text-pink-500 animate-pulse">Rendering Pixels...</p>
              </div>
            )}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-white/50" />
                  <h3 className="text-xs font-black italic uppercase tracking-widest text-white/50">Recent Creations</h3>
                </div>
                <button onClick={() => setHistory([])} className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {history.map((item) => (
                  <button key={item.id} onClick={() => loadFromHistory(item)}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-pink-500/50 transition-all">
                    <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="w-4 h-4 text-white" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
