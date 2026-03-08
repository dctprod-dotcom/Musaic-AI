import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Video, Wand2, Download, Loader2, Film, Sparkles, AlertCircle, Ban } from 'lucide-react';
import { AIPreferences } from '../types';
import { apiPost } from '../lib/api-client';

const VIDEO_STYLES = [
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'lo-fi', label: 'Lo-fi' },
  { id: 'glitch', label: 'Glitch' },
  { id: 'anime', label: 'Anime' },
  { id: '3d-render', label: '3D Render' },
];

export function VideoGenerator({ aiPreferences }: { aiPreferences?: AIPreferences }) {
  const [prompt, setPrompt] = useState('');
  const [vision, setVision] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('cinematic');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (aiPreferences?.videoAesthetic) {
      const matched = VIDEO_STYLES.find(s => aiPreferences.videoAesthetic.toLowerCase().includes(s.id));
      if (matched) setSelectedStyle(matched.id);
    }
  }, [aiPreferences]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setVideoUrl(null);
    setStatusMessage('Submitting to AI...');

    try {
      const styleLabel = VIDEO_STYLES.find(s => s.id === selectedStyle)?.label || selectedStyle;
      const fullPrompt = [
        prompt,
        `Style: ${styleLabel}.`,
        vision ? `Context: ${vision}.` : '',
        negativePrompt ? `Avoid: ${negativePrompt}.` : '',
        aiPreferences?.videoAesthetic ? `Aesthetic: ${aiPreferences.videoAesthetic}.` : '',
      ].filter(Boolean).join(' ');

      setStatusMessage('Rendering video (this may take 1-2 minutes)...');

      // ✅ Server-side call — no API key exposed, no window.aistudio dependency
      const data = await apiPost('/api/ai/generate-video', {
        prompt: fullPrompt,
        aspectRatio,
      });

      if (data.video) {
        setVideoUrl(data.video);
      } else {
        throw new Error("No video returned");
      }
    } catch (err: any) {
      console.error("Video generation error:", err);
      setError(err.error || err.message || "An error occurred during generation.");
    } finally {
      setGenerating(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="p-3 rounded-2xl bg-purple-neon/10 text-purple-neon ring-1 ring-purple-neon/20">
          <Film className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">AI Video Generator</h2>
          <p className="text-[10px] font-black italic uppercase tracking-[0.4em] text-white/30 mt-1">Create Visuals for Socials</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Style */}
          <div className="space-y-3">
            <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Video Style</label>
            <div className="grid grid-cols-3 gap-2">
              {VIDEO_STYLES.map((style) => (
                <button key={style.id} onClick={() => setSelectedStyle(style.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedStyle === style.id
                      ? 'bg-purple-neon/20 border-purple-neon text-white'
                      : 'bg-white/[0.02] border-white/10 text-white/40 hover:bg-white/5'
                  }`}>
                  <div className="text-[10px] font-black italic uppercase tracking-wider">{style.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-3">
            <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Visual Prompt</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-5 text-base text-white focus:border-purple-neon/50 focus:outline-none transition-all h-32 resize-none placeholder:text-white/10"
              placeholder="Neon lights, cyberpunk city, slow motion waves..." />
          </div>

          {/* Vision */}
          <div className="space-y-3">
            <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Creative Vision (Optional)</label>
            <textarea value={vision} onChange={(e) => setVision(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-5 text-sm text-white focus:border-purple-neon/50 focus:outline-none transition-all h-24 resize-none placeholder:text-white/10"
              placeholder="Melancholic atmosphere, urban isolation..." />
          </div>

          {/* Negative */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Negative Prompt</label>
              <Ban className="w-3 h-3 text-white/30" />
            </div>
            <input type="text" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-red-500/50 focus:outline-none transition-all placeholder:text-white/10"
              placeholder="Avoid: shaky, blurry, text..." />
          </div>

          {/* Aspect Ratio */}
          <div className="grid grid-cols-2 gap-4">
            {(['9:16', '16:9'] as const).map(ratio => (
              <button key={ratio} onClick={() => setAspectRatio(ratio)}
                className={`py-4 rounded-xl border text-[10px] font-black italic uppercase tracking-widest transition-all ${
                  aspectRatio === ratio
                    ? 'bg-white/10 border-purple-neon text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                    : 'bg-white/[0.02] border-white/10 text-white/40 hover:bg-white/5'
                }`}>
                {ratio === '9:16' ? '9:16 (Story/Reel)' : '16:9 (Landscape)'}
              </button>
            ))}
          </div>

          {/* Generate */}
          <button onClick={handleGenerate} disabled={generating || !prompt}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-purple-neon to-purple-600 text-white font-black italic uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-purple-neon/20 disabled:opacity-50 flex items-center justify-center gap-3">
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {generating ? statusMessage || "Generating..." : "Generate Video (Veo)"}
          </button>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="bg-black/40 border border-white/10 rounded-[32px] overflow-hidden relative aspect-[9/16] lg:aspect-square flex items-center justify-center group">
          {videoUrl ? (
            <div className="relative w-full h-full">
              <video src={videoUrl} className="w-full h-full object-cover" controls autoPlay loop />
              <div className="absolute top-4 right-4">
                <a href={videoUrl} download="musaic-video.mp4"
                  className="p-3 rounded-full bg-black/50 text-white hover:bg-turquoise hover:text-black transition-all inline-flex">
                  <Download className="w-5 h-5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 opacity-30">
              <Video className="w-16 h-16 mx-auto" />
              <p className="text-[10px] font-black italic uppercase tracking-widest">Preview Area</p>
            </div>
          )}

          {generating && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 backdrop-blur-sm p-6 text-center">
              <Loader2 className="w-10 h-10 text-purple-neon animate-spin" />
              <p className="text-[10px] font-black italic uppercase tracking-widest text-purple-neon animate-pulse">{statusMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
