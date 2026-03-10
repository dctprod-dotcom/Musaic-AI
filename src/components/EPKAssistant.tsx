// ─────────────────────────────────────────────────────────
// Musaic AI — EPK Assistant (AI Writing Studio)
// Gemini-powered bio generation, structured EPK output
// ─────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, X, Loader2, Wand2, Copy, Check,
  FileText, ChevronRight, RotateCcw
} from 'lucide-react';
import { callGemini } from './ai-service';
import { LanguageCode } from '../lib/i18n';

interface EPKSection {
  id: string;
  title: string;
  content: string;
}

interface EPKAssistantProps {
  t: (k: string) => string;
  user: any;
  isAdmin: boolean;
  onBack: () => void;
  onGenerate: () => Promise<boolean>;
  lang: LanguageCode;
}

export function EPKAssistant({ t, user, isAdmin, onBack, onGenerate, lang }: EPKAssistantProps) {
  // ── Step state ──
  const [step, setStep] = useState<'input' | 'generating' | 'result'>('input');

  // ── Input fields ──
  const [artistName, setArtistName] = useState('');
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [influences, setInfluences] = useState('');
  const [achievements, setAchievements] = useState('');
  const [socialLinks, setSocialLinks] = useState('');
  const [extraNotes, setExtraNotes] = useState('');

  // ── Results ──
  const [sections, setSections] = useState<EPKSection[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const langNames: Record<string, string> = {
    en: 'English', fr: 'French', es: 'Spanish', it: 'Italian', de: 'German'
  };

  const copySection = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAll = () => {
    const full = sections.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(full);
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerate = async () => {
    if (!artistName.trim() || !genre.trim()) return;
    setError(null);
    setStep('generating');

    try {
      const allowed = await onGenerate();
      if (!allowed) { setStep('input'); return; }

      const prompt = `You are an elite music publicist who has written EPKs for major label artists. Create a complete, professional Electronic Press Kit for this independent artist.

=== ARTIST INFO ===
Name: ${artistName}
Genre: ${genre}
Mood/Sound: ${mood || 'not specified'}
Influences: ${influences || 'not specified'}
Key achievements: ${achievements || 'emerging independent artist'}
Social/streaming links: ${socialLinks || 'not provided'}
Additional notes: ${extraNotes || 'none'}

=== INSTRUCTIONS ===
Write in ${langNames[lang] || 'English'}.
Create EXACTLY these 5 sections, using these EXACT headers:

[SHORT BIO]
3-4 punchy sentences. Third person. The kind you'd see on Spotify "About". No clichés.

[FULL BIO]
2-3 paragraphs. Detailed, compelling narrative. Tell their story. Make people care.

[PRESS ONE-LINER]
ONE single sentence that a journalist could copy-paste as a description. Bold and memorable.

[PRESS RELEASE TEMPLATE]
A ready-to-send press release template with [BRACKETS] for customizable parts like release name, date, quotes.

[PRESS CONTACT]
A professional contact block template with placeholders.

=== FORMAT ===
Use the exact headers in brackets. No markdown formatting. No asterisks. Clean plain text.`;

      const result = await callGemini(prompt);

      // Parse sections
      const sectionMap: { id: string; title: string; regex: RegExp }[] = [
        { id: 'short-bio', title: t('epk.sectionShortBio'), regex: /\[SHORT BIO\]\s*([\s\S]*?)(?=\[FULL BIO\]|$)/i },
        { id: 'full-bio', title: t('epk.sectionFullBio'), regex: /\[FULL BIO\]\s*([\s\S]*?)(?=\[PRESS ONE-LINER\]|$)/i },
        { id: 'one-liner', title: t('epk.sectionOneLiner'), regex: /\[PRESS ONE-LINER\]\s*([\s\S]*?)(?=\[PRESS RELEASE|$)/i },
        { id: 'press-release', title: t('epk.sectionPressRelease'), regex: /\[PRESS RELEASE[^\]]*\]\s*([\s\S]*?)(?=\[PRESS CONTACT\]|$)/i },
        { id: 'contact', title: t('epk.sectionContact'), regex: /\[PRESS CONTACT\]\s*([\s\S]*?)$/i },
      ];

      const parsed: EPKSection[] = sectionMap.map(s => {
        const match = result.match(s.regex);
        return { id: s.id, title: s.title, content: match?.[1]?.trim() || '' };
      }).filter(s => s.content);

      // Fallback: if parsing fails, show everything as one section
      if (parsed.length === 0) {
        parsed.push({ id: 'full', title: t('epk.result'), content: result });
      }

      setSections(parsed);
      setStep('result');
    } catch (err) {
      console.error('EPK generation error:', err);
      setError(t('epk.error'));
      setStep('input');
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-20 bg-gradient-to-b from-[#050505] via-[#050505]/95 to-transparent pt-4 pb-2 px-4 lg:px-8">
        <button onClick={onBack} className="inline-flex items-center gap-2 px-3 py-2 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest hover:bg-white/5 rounded-xl transition-all">
          <ArrowLeft className="w-4 h-4" /> {t('action.back')}
        </button>
        <h1 className="text-lg font-black uppercase tracking-tight text-white hidden sm:block">{t('mod.pressKit')}</h1>
        <button onClick={onBack} className="p-2.5 text-white/30 hover:text-white hover:bg-white/10 rounded-xl transition-all"><X className="w-5 h-5" /></button>
      </div>

      <div className="max-w-3xl mx-auto p-4 lg:p-8 pt-0">
        <AnimatePresence mode="wait">
          {/* ── STEP: Input ── */}
          {step === 'input' && (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Intro */}
              <div className="glass-card rounded-2xl p-5 flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-500"><Wand2 className="w-5 h-5" /></div>
                <div>
                  <h3 className="text-sm font-bold text-white">{t('epk.assistantTitle')}</h3>
                  <p className="text-xs text-white/40 mt-1">{t('epk.assistantDesc')}</p>
                </div>
              </div>

              {/* Form */}
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <div>
                  <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2 block">{t('epk.artistName')} *</label>
                  <input type="text" value={artistName} onChange={e => setArtistName(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-pink-500/40 text-sm placeholder:text-white/15 transition-all"
                    placeholder={t('epk.artistNamePlaceholder')} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2 block">{t('epk.genre')} *</label>
                    <input type="text" value={genre} onChange={e => setGenre(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-pink-500/40 text-sm placeholder:text-white/15 transition-all"
                      placeholder={t('epk.genrePlaceholder')} />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2 block">{t('epk.mood')}</label>
                    <input type="text" value={mood} onChange={e => setMood(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-pink-500/40 text-sm placeholder:text-white/15 transition-all"
                      placeholder={t('epk.moodPlaceholder')} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2 block">{t('epk.influences')}</label>
                  <input type="text" value={influences} onChange={e => setInfluences(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-pink-500/40 text-sm placeholder:text-white/15 transition-all"
                    placeholder={t('epk.influencesPlaceholder')} />
                </div>
                <div>
                  <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2 block">{t('epk.achievements')}</label>
                  <textarea value={achievements} onChange={e => setAchievements(e.target.value)} rows={2}
                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-pink-500/40 text-sm placeholder:text-white/15 resize-none transition-all"
                    placeholder={t('epk.achievementsPlaceholder')} />
                </div>
                <div>
                  <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2 block">{t('epk.socialLinks')}</label>
                  <input type="text" value={socialLinks} onChange={e => setSocialLinks(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-pink-500/40 text-sm placeholder:text-white/15 transition-all"
                    placeholder={t('epk.socialLinksPlaceholder')} />
                </div>
                <div>
                  <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-2 block">{t('epk.extraNotes')}</label>
                  <textarea value={extraNotes} onChange={e => setExtraNotes(e.target.value)} rows={2}
                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-pink-500/40 text-sm placeholder:text-white/15 resize-none transition-all"
                    placeholder={t('epk.extraNotesPlaceholder')} />
                </div>
              </div>

              {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>}

              <button onClick={handleGenerate} disabled={!artistName.trim() || !genre.trim()}
                className="w-full py-4 bg-pink-500 text-white font-bold uppercase tracking-widest rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <Wand2 className="w-5 h-5" /> {t('epk.generate')} — 5 {t('dash.tokens')}
              </button>
            </motion.div>
          )}

          {/* ── STEP: Generating ── */}
          {step === 'generating' && (
            <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-pink-500/10 animate-pulse" />
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold">{t('epk.generating')}</p>
                <p className="text-white/30 text-xs mt-1">{t('epk.generatingDesc')}</p>
              </div>
            </motion.div>
          )}

          {/* ── STEP: Result ── */}
          {step === 'result' && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Copy all + regenerate */}
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-widest text-pink-500">{t('epk.result')} — {artistName}</h2>
                <div className="flex gap-2">
                  <button onClick={copyAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-[9px] font-bold uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all">
                    {copiedId === 'all' ? <Check className="w-3 h-3 text-turquoise" /> : <Copy className="w-3 h-3" />}
                    {copiedId === 'all' ? t('smartlink.copied') : t('epk.copyAll')}
                  </button>
                  <button onClick={() => { setStep('input'); setSections([]); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-[9px] font-bold uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all">
                    <RotateCcw className="w-3 h-3" /> {t('epk.regenerate')}
                  </button>
                </div>
              </div>

              {/* Sections */}
              {sections.map((section, i) => (
                <motion.div key={section.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="glass-card rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-pink-500/60" />
                      <span className="text-xs font-bold uppercase tracking-widest text-white/60">{section.title}</span>
                    </div>
                    <button onClick={() => copySection(section.id, section.content)}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-white/20 hover:text-white transition-all">
                      {copiedId === section.id ? <Check className="w-3.5 h-3.5 text-turquoise" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{section.content}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
