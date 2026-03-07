import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Video, Upload, Wand2, Play, Download, Loader2, Film, Sparkles, AlertCircle, Ban } from 'lucide-react';
import { AIPreferences } from '../types';
import { GoogleGenAI } from "@google/genai";

// Define window.aistudio types
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface VideoGeneratorProps {
  aiPreferences?: AIPreferences;
}

const VIDEO_STYLES = [
  { id: 'cinematic', label: 'Cinematic', description: 'High quality, movie-like' },
  { id: 'lo-fi', label: 'Lo-fi', description: 'Retro, grainy, relaxed' },
  { id: 'glitch', label: 'Glitch', description: 'Distorted, digital noise' },
  { id: 'anime', label: 'Anime', description: 'Japanese animation style' },
  { id: '3d-render', label: '3D Render', description: 'Clean, modern 3D' },
];

export function VideoGenerator({ aiPreferences }: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [vision, setVision] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('cinematic');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Set initial style based on AI preferences if available
  useEffect(() => {
    if (aiPreferences?.videoAesthetic) {
      const matchedStyle = VIDEO_STYLES.find(s => 
        aiPreferences.videoAesthetic.toLowerCase().includes(s.id)
      );
      if (matchedStyle) {
        setSelectedStyle(matchedStyle.id);
      }
    }
  }, [aiPreferences]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setVideoUrl(null);
    setStatusMessage('Initializing...');

    try {
      // 1. Check/Request API Key
      let hasKey = false;
      try {
        hasKey = await window.aistudio.hasSelectedApiKey();
      } catch (e) {
        console.warn("aistudio check failed, assuming false", e);
      }

      if (!hasKey) {
        setStatusMessage('Waiting for API Key selection...');
        await window.aistudio.openSelectKey();
        // We assume success after the dialog closes, or we could check again.
        // The system instructions say: "assume the key selection was successful"
      }

      // 2. Initialize AI
      // Note: process.env.API_KEY is injected by the platform after selection
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("API Key not found. Please select a valid key.");
      }

      const ai = new GoogleGenAI({ apiKey });

      // 3. Construct Prompt
      const styleLabel = VIDEO_STYLES.find(s => s.id === selectedStyle)?.label || selectedStyle;
      const fullPrompt = `${prompt}. Style: ${styleLabel}. ${vision ? `Context: ${vision}.` : ''} ${negativePrompt ? `Negative Prompt: ${negativePrompt}.` : ''} ${aiPreferences?.videoAesthetic ? `Aesthetic: ${aiPreferences.videoAesthetic}.` : ''}`;

      setStatusMessage('Submitting generation request...');

      // 4. Call Veo API
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: fullPrompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio
        }
      });

      setStatusMessage('Rendering video (this may take a minute)...');

      // 5. Poll for completion
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      if (operation.error) {
        const errorMessage = (operation.error as any).message || "Video generation failed";
        throw new Error(errorMessage);
      }

      const generatedVideo = operation.response?.generatedVideos?.[0];
      if (!generatedVideo?.video?.uri) {
        throw new Error("No video URI returned");
      }

      setStatusMessage('Downloading video...');

      // 6. Fetch the video
      const downloadLink = generatedVideo.video.uri;
      const response = await fetch(downloadLink, {
        method: 'GET',
        headers: {
          'x-goog-api-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);

    } catch (err: any) {
      console.error("Video generation error:", err);
      setError(err.message || "An error occurred during generation.");
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
          
          {/* Style Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Video Style</label>
              {aiPreferences?.videoAesthetic && (
                <div className="flex items-center gap-1 text-[10px] text-purple-400">
                  <Sparkles className="w-3 h-3" />
                  <span>Global: {aiPreferences.videoAesthetic}</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {VIDEO_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedStyle === style.id
                      ? 'bg-purple-neon/20 border-purple-neon text-white'
                      : 'bg-white/[0.02] border-white/10 text-white/40 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="text-[10px] font-black italic uppercase tracking-wider">{style.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Visual Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-5 text-base font-medium text-white focus:border-purple-neon/50 focus:ring-8 focus:ring-purple-neon/5 focus:outline-none transition-all h-32 resize-none placeholder:text-white/10"
              placeholder="Describe the vibe: Neon lights, cyberpunk city, slow motion waves..."
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Creative Vision (Optional)</label>
            <textarea
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-5 text-sm font-medium text-white focus:border-purple-neon/50 focus:ring-8 focus:ring-purple-neon/5 focus:outline-none transition-all h-24 resize-none placeholder:text-white/10"
              placeholder="Add context, mood, or meaning: 'Melancholic atmosphere representing urban isolation'..."
            />
          </div>

          {/* Negative Prompt Input */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Negative Prompt</label>
              <div className="p-1 rounded bg-white/5 text-white/30" title="Things to avoid in the video">
                <Ban className="w-3 h-3" />
              </div>
            </div>
            <input
              type="text"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium text-white focus:border-red-500/50 focus:ring-8 focus:ring-red-500/5 focus:outline-none transition-all placeholder:text-white/10"
              placeholder="Avoid: 'shaky camera, blurry, text, watermark'..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setAspectRatio('9:16')}
              className={`py-4 rounded-xl border text-[10px] font-black italic uppercase tracking-widest transition-all ${
                aspectRatio === '9:16' 
                  ? 'bg-white/10 border-purple-neon text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]' 
                  : 'bg-white/[0.02] border-white/10 text-white/40 hover:bg-white/5 hover:text-white'
              }`}
            >
              9:16 (Story/Reel)
            </button>
            <button 
              onClick={() => setAspectRatio('16:9')}
              className={`py-4 rounded-xl border text-[10px] font-black italic uppercase tracking-widest transition-all ${
                aspectRatio === '16:9' 
                  ? 'bg-white/10 border-purple-neon text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]' 
                  : 'bg-white/[0.02] border-white/10 text-white/40 hover:bg-white/5 hover:text-white'
              }`}
            >
              16:9 (Landscape)
            </button>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !prompt}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-purple-neon to-purple-600 text-white font-black italic uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-purple-neon/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {generating ? statusMessage || "Generating..." : "Generate Video (Veo)"}
          </button>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="bg-black/40 border border-white/10 rounded-[32px] overflow-hidden relative aspect-[9/16] lg:aspect-square flex items-center justify-center group">
          {videoUrl ? (
            <div className="relative w-full h-full">
              <video src={videoUrl} className="w-full h-full object-cover" controls autoPlay loop />
              <div className="absolute top-4 right-4">
                <a 
                  href={videoUrl}
                  download="generated-video.mp4"
                  className="p-3 rounded-full bg-black/50 text-white hover:bg-turquoise hover:text-black transition-all inline-flex"
                >
                  <Download className="w-5 h-5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 opacity-30 group-hover:opacity-50 transition-opacity">
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
