import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Image as ImageIcon, 
  Wand2, 
  Download, 
  Loader2, 
  Layers, 
  Youtube, 
  Instagram, 
  Disc,
  Maximize2,
  Sparkles,
  Ban
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { AIPreferences } from '../types';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

type ArtFormat = {
  id: string;
  label: string;
  subLabel: string;
  width: number;
  height: number;
  aspectRatio: string;
  icon: any;
};

const FORMATS: ArtFormat[] = [
  { 
    id: 'cover', 
    label: 'Cover Art', 
    subLabel: '3000 x 3000px', 
    width: 3000, 
    height: 3000, 
    aspectRatio: '1:1',
    icon: Disc
  },
  { 
    id: 'youtube', 
    label: 'YouTube Thumbnail', 
    subLabel: '1280 x 720px', 
    width: 1280, 
    height: 720, 
    aspectRatio: '16:9',
    icon: Youtube
  },
  { 
    id: 'insta-square', 
    label: 'Insta Post', 
    subLabel: '1080 x 1080px', 
    width: 1080, 
    height: 1080, 
    aspectRatio: '1:1',
    icon: Instagram
  },
  { 
    id: 'insta-portrait', 
    label: 'Insta Portrait', 
    subLabel: '1080 x 1350px', 
    width: 1080, 
    height: 1350, 
    aspectRatio: '4:5',
    icon: Maximize2
  }
];

const ART_STYLES = [
  { id: 'photorealistic', label: 'Photorealistic', description: 'High detail, realistic lighting' },
  { id: 'surrealist', label: 'Surrealist', description: 'Dreamlike, bizarre, abstract' },
  { id: 'cyberpunk', label: 'Cyberpunk', description: 'Neon, high-tech, low-life' },
  { id: 'anime', label: 'Anime', description: 'Japanese animation style' },
  { id: 'oil-painting', label: 'Oil Painting', description: 'Textured, classic art style' },
  { id: '3d-render', label: '3D Render', description: 'Clean, modern 3D graphics' },
  { id: 'minimalist', label: 'Minimalist', description: 'Simple, clean, few elements' },
  { id: 'fantasy', label: 'Fantasy', description: 'Magical, mythical, epic' },
];

interface ArtworkGeneratorProps {
  aiPreferences?: AIPreferences;
}

export function ArtworkGenerator({ aiPreferences }: ArtworkGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [vision, setVision] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<ArtFormat>(FORMATS[0]);
  const [selectedStyle, setSelectedStyle] = useState<string>('photorealistic');
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Set initial style based on AI preferences if available
  useEffect(() => {
    if (aiPreferences?.artStyle) {
      const matchedStyle = ART_STYLES.find(s => 
        aiPreferences.artStyle.toLowerCase().includes(s.id)
      );
      if (matchedStyle) {
        setSelectedStyle(matchedStyle.id);
      }
    }
  }, [aiPreferences]);

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      // Use the appropriate model based on requirements
      // Note: Actual 3000x3000 generation might require specific model capabilities or upscaling
      // For this implementation, we'll use the standard image generation model
      const model = 'gemini-2.5-flash-image';
      
      const styleLabel = ART_STYLES.find(s => s.id === selectedStyle)?.label || selectedStyle;
      const styleInstruction = ` Style: ${styleLabel}. ${aiPreferences?.artStyle ? `(Global Pref: ${aiPreferences.artStyle})` : ''}`;
      const visionInstruction = vision ? ` Creative Vision/Context: ${vision}.` : '';
      const negativeInstruction = negativePrompt ? ` Negative Prompt (Avoid these): ${negativePrompt}.` : '';
      
      const fullPrompt = `Generate a high quality music album artwork or social media visual. Description: ${prompt}.${visionInstruction}${styleInstruction}${negativeInstruction} Aspect Ratio: ${selectedFormat.aspectRatio}`;

      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [
            {
              text: fullPrompt,
            },
          ],
        },
      });

      // Extract image from response
      let imageUrl = null;
      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (imageUrl) {
        setGeneratedImage(imageUrl);
      } else {
        throw new Error("No image generated");
      }

    } catch (err: any) {
      console.error("Generation failed:", err);
      // Fallback for demo/preview if API fails or key is missing
      setError("Generation failed. Please check your API key or try again.");
    } finally {
      setGenerating(false);
    }
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
        {/* Controls Section */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Format Selector */}
          <div className="space-y-4">
            <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Output Format</label>
            <div className="grid grid-cols-2 gap-3">
              {FORMATS.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format)}
                  className={`relative p-4 rounded-2xl border text-left transition-all group overflow-hidden ${
                    selectedFormat.id === format.id
                      ? 'bg-white/10 border-pink-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.2)]'
                      : 'bg-white/[0.02] border-white/10 text-white/40 hover:bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="relative z-10 flex flex-col h-full justify-between gap-3">
                    <format.icon className={`w-6 h-6 ${selectedFormat.id === format.id ? 'text-pink-500' : 'text-white/20'}`} />
                    <div>
                      <div className="text-xs font-black italic uppercase tracking-wide">{format.label}</div>
                      <div className="text-[10px] font-medium opacity-50 mt-1">{format.subLabel}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Art Style</label>
              {aiPreferences?.artStyle && (
                <div className="flex items-center gap-1 text-[10px] text-pink-400">
                  <Sparkles className="w-3 h-3" />
                  <span>Global: {aiPreferences.artStyle}</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ART_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    selectedStyle === style.id
                      ? 'bg-pink-500/20 border-pink-500 text-white'
                      : 'bg-white/[0.02] border-white/10 text-white/40 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="text-[9px] font-black italic uppercase tracking-wider truncate" title={style.label}>{style.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div className="space-y-4">
            <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Visual Concept</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-5 text-base font-medium text-white focus:border-pink-500/50 focus:ring-8 focus:ring-pink-500/5 focus:outline-none transition-all h-32 resize-none placeholder:text-white/10"
              placeholder="Describe your artwork: 'Surreal desert landscape with neon pyramids, synthwave style, purple and cyan lighting'..."
            />
          </div>

          {/* Creative Vision Input */}
          <div className="space-y-4">
            <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Creative Vision (Optional)</label>
            <textarea
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-5 text-sm font-medium text-white focus:border-pink-500/50 focus:ring-8 focus:ring-pink-500/5 focus:outline-none transition-all h-24 resize-none placeholder:text-white/10"
              placeholder="Add context, mood, or meaning: 'Melancholic atmosphere representing urban isolation'..."
            />
          </div>

          {/* Negative Prompt Input */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Negative Prompt</label>
              <div className="p-1 rounded bg-white/5 text-white/30" title="Things to avoid in the image">
                <Ban className="w-3 h-3" />
              </div>
            </div>
            <input
              type="text"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium text-white focus:border-red-500/50 focus:ring-8 focus:ring-red-500/5 focus:outline-none transition-all placeholder:text-white/10"
              placeholder="Avoid: 'blurry, low quality, text, watermark'..."
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black italic uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {generating ? "Generating Artwork..." : "Generate Asset"}
          </button>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Preview Section */}
        <div className="lg:col-span-7">
          <div className="h-full bg-black/40 border border-white/10 rounded-[32px] p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[500px]">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {generatedImage ? (
              <div className="relative group w-full h-full flex items-center justify-center">
                <img 
                  src={generatedImage} 
                  alt="Generated Artwork" 
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl shadow-black/50"
                  style={{ aspectRatio: selectedFormat.aspectRatio.replace(':', '/') }}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm rounded-xl">
                  <a 
                    href={generatedImage} 
                    download={`musaic-artwork-${selectedFormat.id}.png`}
                    className="p-4 rounded-full bg-white text-black hover:bg-pink-500 hover:text-white transition-all transform hover:scale-110"
                  >
                    <Download className="w-6 h-6" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6 opacity-30">
                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                  <Layers className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase tracking-widest text-white">Canvas Empty</h3>
                  <p className="text-xs font-medium uppercase tracking-widest text-white/50 mt-2">Select a format and generate</p>
                </div>
              </div>
            )}

            {generating && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 backdrop-blur-md z-20">
                <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
                <p className="text-xs font-black italic uppercase tracking-widest text-pink-500 animate-pulse">Rendering Pixels...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
