// ─────────────────────────────────────────────────────────
// Musaic AI — Smart Link Pro Module
// Live phone preview, branded platform detection,
// AI marketing copy via Gemini, Firestore slug storage
// ─────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, X, Link2, Copy, Check, ExternalLink,
  Loader2, Wand2, Plus, Trash2, Music
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { callGemini } from './ai-service';

// ── Platform brand config ─────────────────────────────────
const PLATFORMS = [
  { id: 'spotify',      name: 'Spotify',       color: '#1DB954', icon: '🟢', placeholder: 'https://open.spotify.com/...' },
  { id: 'apple',        name: 'Apple Music',   color: '#FC3C44', icon: '🔴', placeholder: 'https://music.apple.com/...' },
  { id: 'youtube',      name: 'YouTube Music', color: '#FF0000', icon: '▶️', placeholder: 'https://music.youtube.com/...' },
  { id: 'deezer',       name: 'Deezer',        color: '#A238FF', icon: '🟣', placeholder: 'https://deezer.com/...' },
  { id: 'soundcloud',   name: 'SoundCloud',    color: '#FF5500', icon: '🟠', placeholder: 'https://soundcloud.com/...' },
  { id: 'tidal',        name: 'Tidal',         color: '#00FFFF', icon: '🔵', placeholder: 'https://tidal.com/...' },
  { id: 'amazon',       name: 'Amazon Music',  color: '#25D1DA', icon: '🎵', placeholder: 'https://music.amazon.com/...' },
  { id: 'bandcamp',     name: 'Bandcamp',      color: '#1DA0C3', icon: '💿', placeholder: 'https://bandcamp.com/...' },
];

function generateSlug(length = 7): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ── Detect platform from URL ──────────────────────────────
function detectPlatform(url: string): typeof PLATFORMS[0] | null {
  const lower = url.toLowerCase();
  if (lower.includes('spotify'))     return PLATFORMS[0];
  if (lower.includes('apple'))       return PLATFORMS[1];
  if (lower.includes('youtube'))     return PLATFORMS[2];
  if (lower.includes('deezer'))      return PLATFORMS[3];
  if (lower.includes('soundcloud'))  return PLATFORMS[4];
  if (lower.includes('tidal'))       return PLATFORMS[5];
  if (lower.includes('amazon'))      return PLATFORMS[6];
  if (lower.includes('bandcamp'))    return PLATFORMS[7];
  return null;
}

// ── SVG Platform Icons ────────────────────────────────────
function PlatformIcon({ platformId, size = 20 }: { platformId: string; size?: number }) {
  const s = size;
  switch (platformId) {
    case 'spotify': return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>;
    case 'apple': return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043A5.022 5.022 0 0019.2.04a10.49 10.49 0 00-1.69-.039H6.49a10.49 10.49 0 00-1.69.038A5.023 5.023 0 002.426.893C1.31 1.624.563 2.624.246 3.934a9.23 9.23 0 00-.24 2.19C0 6.474 0 6.824 0 12c0 5.176 0 5.526.006 5.876a9.23 9.23 0 00.24 2.19c.317 1.31 1.062 2.31 2.18 3.043a5.022 5.022 0 002.374.854 10.49 10.49 0 001.69.038h11.02a10.49 10.49 0 001.69-.038 5.023 5.023 0 002.374-.854c1.118-.731 1.863-1.731 2.18-3.043a9.23 9.23 0 00.24-2.19c.006-.35.006-.7.006-5.876 0-5.176 0-5.526-.006-5.876zM12 18.75a6.75 6.75 0 110-13.5 6.75 6.75 0 010 13.5zm7.125-12.188a1.688 1.688 0 110-3.374 1.688 1.688 0 010 3.374z"/><circle cx="12" cy="12" r="4.125"/></svg>;
    case 'youtube': return <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
    default: return <Music size={s} />;
  }
}

interface SmartLinkProProps {
  t: (k: string) => string;
  user: any;
  isAdmin: boolean;
  onBack: () => void;
  onGenerate: () => Promise<boolean>;
}

export function SmartLinkPro({ t, user, isAdmin, onBack, onGenerate }: SmartLinkProProps) {
  const [title, setTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [description, setDescription] = useState('');
  const [links, setLinks] = useState<{ url: string }[]>([{ url: '' }, { url: '' }, { url: '' }]);
  const [generating, setGenerating] = useState(false);
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Auto-detect platforms from URLs
  const detectedLinks = useMemo(() =>
    links.map(l => ({ ...l, platform: detectPlatform(l.url) })).filter(l => l.url.trim()),
    [links]
  );

  const addLink = () => setLinks(prev => [...prev, { url: '' }]);
  const removeLink = (idx: number) => setLinks(prev => prev.filter((_, i) => i !== idx));
  const updateLink = (idx: number, url: string) => setLinks(prev => prev.map((l, i) => i === idx ? { url } : l));

  // AI marketing copy
  const generateCopy = async () => {
    if (!title.trim()) return;
    setGeneratingCopy(true);
    try {
      const prompt = `Write a short, compelling marketing description (2-3 sentences max) for a music release Smart Link page.
Artist: ${artistName || 'Unknown'}
Title: ${title}
Release date: ${releaseDate || 'TBA'}
Tone: exciting, professional, made for social media sharing. No hashtags. No emojis.`;
      const result = await callGemini(prompt);
      setDescription(result);
    } catch (err) { console.error(err); }
    finally { setGeneratingCopy(false); }
  };

  const handleGenerate = async () => {
    if (!title.trim()) return;
    setGenerating(true);
    try {
      const allowed = await onGenerate();
      if (!allowed) { setGenerating(false); return; }

      const slug = generateSlug();
      const activeLinks = detectedLinks.map(l => ({
        url: l.url,
        platform: l.platform?.id || 'other',
        name: l.platform?.name || 'Link',
      }));

      if (user?.uid && user.uid !== 'guest') {
        await addDoc(collection(db, 'links'), {
          slug,
          userId: user.uid,
          title: title.trim(),
          artistName: artistName.trim(),
          imageUrl: imageUrl.trim(),
          description: description.trim(),
          releaseDate: releaseDate || null,
          links: activeLinks,
          createdAt: serverTimestamp(),
        });
      }
      setGeneratedUrl(`musaicaistudio.com/l/${slug}`);
    } catch (err) { console.error(err); }
    finally { setGenerating(false); }
  };

  const copyUrl = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(`https://${generatedUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setGeneratedUrl(null); setTitle(''); setArtistName('');
    setImageUrl(''); setReleaseDate(''); setDescription('');
    setLinks([{ url: '' }, { url: '' }, { url: '' }]);
  };

  // ── Success State ──
  if (generatedUrl) {
    return (
      <div className="max-w-3xl mx-auto p-4 lg:p-8 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="glass-card rounded-3xl p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center ring-1 ring-emerald-500/20 mx-auto">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-black uppercase text-white">{t('smartlink.ready')}</h2>
            <div className="flex items-center gap-2 justify-center bg-black/40 border border-white/10 rounded-xl p-4">
              <Link2 className="w-4 h-4 text-turquoise flex-shrink-0" />
              <span className="text-turquoise font-mono text-sm font-bold">{generatedUrl}</span>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={copyUrl} className="px-6 py-3 bg-turquoise text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:brightness-110 transition-all flex items-center gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('smartlink.copied') : t('smartlink.copyLink')}
              </button>
              <a href={`https://${generatedUrl}`} target="_blank" rel="noopener noreferrer"
                className="px-6 py-3 bg-white/5 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white/10 transition-all flex items-center gap-2">
                <ExternalLink className="w-4 h-4" /> {t('smartlink.preview')}
              </a>
            </div>
            <button onClick={reset} className="text-white/30 text-xs hover:text-turquoise transition-colors">{t('smartlink.createAnother')}</button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Editor + Live Preview ──
  return (
    <div className="h-full overflow-y-auto">
      {/* Module Header */}
      <div className="flex items-center justify-between sticky top-0 z-20 bg-gradient-to-b from-[#050505] via-[#050505]/95 to-transparent pt-4 pb-2 px-4 lg:px-8">
        <button onClick={onBack} className="inline-flex items-center gap-2 px-3 py-2 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest hover:bg-white/5 rounded-xl transition-all">
          <ArrowLeft className="w-4 h-4" /> {t('action.back')}
        </button>
        <h1 className="text-lg font-black uppercase tracking-tight text-white hidden sm:block">{t('mod.smartLink')}</h1>
        <button onClick={onBack} className="p-2.5 text-white/30 hover:text-white hover:bg-white/10 rounded-xl transition-all"><X className="w-5 h-5" /></button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-8 pt-0">
        {/* ── Left: Editor ── */}
        <div className="flex-1 space-y-5 min-w-0">
          {/* Release Info */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">{t('smartlink.releaseInfo')}</p>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-turquoise/40 text-sm placeholder:text-white/15 transition-all"
              placeholder={t('smartlink.releaseTitlePlaceholder')} />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={artistName} onChange={e => setArtistName(e.target.value)}
                className="bg-black/30 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-turquoise/40 text-sm placeholder:text-white/15 transition-all"
                placeholder={t('smartlink.artistNamePlaceholder')} />
              <input type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)}
                className="bg-black/30 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-turquoise/40 text-sm text-white/70 [color-scheme:dark] transition-all" />
            </div>
            <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-turquoise/40 text-sm placeholder:text-white/15 transition-all"
              placeholder={t('smartlink.coverUrlPlaceholder')} />

            {/* AI Description */}
            <div className="relative">
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 pr-12 focus:outline-none focus:border-turquoise/40 text-sm placeholder:text-white/15 resize-none transition-all"
                placeholder={t('smartlink.descPlaceholder')} />
              <button onClick={generateCopy} disabled={generatingCopy || !title.trim()}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-turquoise/10 hover:bg-turquoise/20 text-turquoise transition-all disabled:opacity-30" title={t('smartlink.aiSuggest')}>
                {generatingCopy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Platform Links */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">{t('smartlink.platformLinks')}</p>
              <button onClick={addLink} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"><Plus className="w-3.5 h-3.5" /></button>
            </div>
            {links.map((link, i) => {
              const detected = detectPlatform(link.url);
              return (
                <div key={i} className="flex items-center gap-2 group">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${detected ? '' : 'bg-white/5'}`}
                    style={detected ? { backgroundColor: `${detected.color}20` } : {}}>
                    {detected ? (
                      <span style={{ color: detected.color }}><PlatformIcon platformId={detected.id} size={18} /></span>
                    ) : (
                      <Link2 className="w-4 h-4 text-white/20" />
                    )}
                  </div>
                  <input type="url" value={link.url} onChange={e => updateLink(i, e.target.value)}
                    className="flex-1 bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 focus:outline-none focus:border-turquoise/40 text-sm placeholder:text-white/15 transition-all"
                    style={detected ? { borderColor: `${detected.color}30` } : {}}
                    placeholder={detected?.placeholder || t('smartlink.pasteLinkPlaceholder')} />
                  {links.length > 1 && (
                    <button onClick={() => removeLink(i)} className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Generate Button */}
          <button onClick={handleGenerate} disabled={generating || !title.trim()}
            className="w-full py-4 bg-turquoise text-black font-bold uppercase tracking-widest rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {generating ? <><Loader2 className="w-5 h-5 animate-spin" /> {t('smartlink.generating')}</> : <><Link2 className="w-5 h-5" /> {t('smartlink.generate')} — 5 {t('dash.tokens')}</>}
          </button>
        </div>

        {/* ── Right: Live Phone Preview ── */}
        <div className="hidden lg:flex flex-col items-center w-80 flex-shrink-0">
          <p className="text-[9px] text-white/20 font-bold uppercase tracking-[0.3em] mb-4">{t('smartlink.livePreview')}</p>
          <div className="w-[280px] h-[560px] rounded-[40px] border-4 border-white/10 bg-[#0a0a0a] overflow-hidden relative shadow-2xl shadow-black/50">
            {/* Phone notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl z-10" />
            {/* Content */}
            <div className="h-full overflow-y-auto p-5 pt-10 space-y-4">
              {imageUrl ? (
                <img src={imageUrl} alt="" className="w-full aspect-square rounded-2xl object-cover shadow-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="w-full aspect-square rounded-2xl bg-white/5 flex items-center justify-center">
                  <Music className="w-12 h-12 text-white/10" />
                </div>
              )}
              <div className="text-center space-y-1">
                <h3 className="text-sm font-black text-white uppercase tracking-tight">{title || t('smartlink.releaseTitlePlaceholder')}</h3>
                <p className="text-[10px] text-white/40 font-medium">{artistName || t('smartlink.artistNamePlaceholder')}</p>
                {description && <p className="text-[9px] text-white/30 leading-relaxed mt-2">{description}</p>}
              </div>
              {/* Platform buttons */}
              <div className="space-y-2 pt-2">
                {detectedLinks.length > 0 ? detectedLinks.map((link, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{ backgroundColor: `${link.platform?.color || '#ffffff'}15`, border: `1px solid ${link.platform?.color || '#ffffff'}25` }}>
                    <span style={{ color: link.platform?.color }}>
                      <PlatformIcon platformId={link.platform?.id || 'other'} size={16} />
                    </span>
                    <span className="text-xs font-bold text-white/80">{link.platform?.name || 'Link'}</span>
                    <ExternalLink className="w-3 h-3 text-white/20 ml-auto" />
                  </div>
                )) : (
                  <div className="text-center py-4">
                    <p className="text-[9px] text-white/15">{t('smartlink.addLinksHint')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
