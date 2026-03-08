import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Target, Calendar, TrendingUp, Users, CheckCircle2, Circle,
  ArrowRight, Wand2, Loader2, RotateCcw, Sparkles
} from 'lucide-react';
import { apiPost } from '../lib/api-client';

interface StrategyTask {
  title: string;
  description: string;
  phase: string;
  completed: boolean;
}

interface GeneratedStrategy {
  phases: {
    name: string;
    duration: string;
    tasks: { title: string; description: string }[];
  }[];
  targetReach: string;
  keyInsight: string;
}

export function ReleaseStrategy({ user, lang }: { user?: any; lang?: string }) {
  const [releaseTitle, setReleaseTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [platforms, setPlatforms] = useState('Spotify, Apple Music, YouTube');
  const [generating, setGenerating] = useState(false);
  const [strategy, setStrategy] = useState<GeneratedStrategy | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!releaseTitle || !genre) return;
    setGenerating(true);
    setError(null);

    try {
      const prompt = `You are a music marketing expert. Generate a detailed release strategy for:

Artist: ${user?.displayName || 'Independent Artist'}
Release Title: "${releaseTitle}"
Genre: ${genre}
Release Date: ${releaseDate || 'TBD (suggest a 4-week plan)'}
Target Platforms: ${platforms}
Language for response: ${lang === 'fr' ? 'French' : lang === 'es' ? 'Spanish' : lang === 'it' ? 'Italian' : lang === 'de' ? 'German' : 'English'}

Return ONLY valid JSON (no markdown, no backticks) with this exact structure:
{
  "phases": [
    {
      "name": "Phase name",
      "duration": "Week 1-2",
      "tasks": [
        { "title": "Task title", "description": "Detailed action item" }
      ]
    }
  ],
  "targetReach": "Estimated reach number with context",
  "keyInsight": "One key strategic insight for this type of release"
}

Create 4 phases with 3-4 tasks each. Be specific, actionable, and relevant to the genre.`;

      const data = await apiPost('/api/ai/generate-text', {
        prompt,
        jsonMode: true,
      });

      const parsed = JSON.parse(data.text);
      setStrategy(parsed);
      setCompletedTasks(new Set());
    } catch (err: any) {
      console.error("Strategy generation failed:", err);
      setError(err.error || "Failed to generate strategy. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleTask = (phaseIdx: number, taskIdx: number) => {
    const key = `${phaseIdx}-${taskIdx}`;
    setCompletedTasks(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const totalTasks = strategy?.phases.reduce((sum, p) => sum + p.tasks.length, 0) || 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks.size / totalTasks) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20">
          <Target className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Release Strategy</h2>
          <p className="text-[10px] font-black italic uppercase tracking-[0.4em] text-white/30 mt-1">AI Marketing Roadmap</p>
        </div>
      </div>

      {/* Input Form */}
      {!strategy && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 space-y-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">Generate Your Roadmap</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Release Title *</label>
              <input type="text" value={releaseTitle} onChange={(e) => setReleaseTitle(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-base text-white focus:border-orange-400/50 focus:outline-none transition-all placeholder:text-white/10"
                placeholder="My New Single" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Genre / Style *</label>
              <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-base text-white focus:border-orange-400/50 focus:outline-none transition-all placeholder:text-white/10"
                placeholder="Electronic, House, Hip-Hop..." />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Release Date</label>
              <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-base text-white focus:border-orange-400/50 focus:outline-none transition-all [color-scheme:dark]" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">Target Platforms</label>
              <input type="text" value={platforms} onChange={(e) => setPlatforms(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-base text-white focus:border-orange-400/50 focus:outline-none transition-all placeholder:text-white/10"
                placeholder="Spotify, Apple Music, YouTube" />
            </div>
          </div>

          <button onClick={handleGenerate} disabled={generating || !releaseTitle || !genre}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black italic uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-3">
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {generating ? "AI is thinking..." : "Generate Strategy"}
          </button>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>
          )}
        </motion.div>
      )}

      {/* Generated Strategy */}
      {strategy && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-2">
              <TrendingUp className="w-6 h-6 text-turquoise mb-2" />
              <h4 className="text-2xl font-black italic text-white">{progress}%</h4>
              <p className="text-[10px] uppercase tracking-widest text-white/40">Progress ({completedTasks.size}/{totalTasks})</p>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-turquoise to-emerald-400 rounded-full"
                />
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-2">
              <Users className="w-6 h-6 text-purple-neon mb-2" />
              <h4 className="text-lg font-black italic text-white">{strategy.targetReach}</h4>
              <p className="text-[10px] uppercase tracking-widest text-white/40">Target Reach</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-2">
              <Sparkles className="w-6 h-6 text-gold mb-2" />
              <p className="text-sm font-medium text-white/80 leading-relaxed">{strategy.keyInsight}</p>
              <p className="text-[10px] uppercase tracking-widest text-white/40">AI Insight</p>
            </div>
          </div>

          {/* Phases */}
          <div className="space-y-6">
            {strategy.phases.map((phase, phaseIdx) => (
              <div key={phaseIdx} className="bg-white/[0.02] border border-white/5 rounded-[32px] p-6 lg:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black ${
                      phase.tasks.every((_, tIdx) => completedTasks.has(`${phaseIdx}-${tIdx}`))
                        ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                        : 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30'
                    }`}>
                      {phaseIdx + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">{phase.name}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{phase.duration}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {phase.tasks.map((task, taskIdx) => {
                    const isComplete = completedTasks.has(`${phaseIdx}-${taskIdx}`);
                    return (
                      <button
                        key={taskIdx}
                        onClick={() => toggleTask(phaseIdx, taskIdx)}
                        className={`w-full flex items-start gap-4 p-4 rounded-2xl border transition-all text-left group ${
                          isComplete
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-black/20 border-white/5 hover:border-orange-400/30'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                          isComplete
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-white/5 text-white/20 group-hover:text-orange-400'
                        }`}>
                          {isComplete ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className={`text-xs font-black italic uppercase tracking-wide ${
                            isComplete ? 'text-emerald-400 line-through' : 'text-white'
                          }`}>{task.title}</h4>
                          <p className="text-[10px] text-white/40 leading-relaxed">{task.description}</p>
                        </div>
                        <ArrowRight className={`w-4 h-4 flex-shrink-0 mt-1 transition-colors ${
                          isComplete ? 'text-emerald-500/40' : 'text-white/10 group-hover:text-orange-400'
                        }`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Reset */}
          <button onClick={() => { setStrategy(null); setCompletedTasks(new Set()); }}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 text-xs font-black italic uppercase tracking-widest transition-all mx-auto">
            <RotateCcw className="w-4 h-4" /> Generate New Strategy
          </button>
        </motion.div>
      )}
    </div>
  );
}
