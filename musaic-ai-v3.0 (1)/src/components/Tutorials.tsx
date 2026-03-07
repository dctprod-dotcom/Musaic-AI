import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  LayoutGrid, 
  Video, 
  FileText, 
  Target, 
  ChevronDown, 
  ChevronUp, 
  PlayCircle,
  CheckCircle2
} from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
}

interface ModuleGuide {
  id: string;
  title: string;
  icon: any;
  color: string;
  description: string;
  steps: TutorialStep[];
}

export function Tutorials() {
  const [expandedModule, setExpandedModule] = useState<string | null>('smart-link');

  const guides: ModuleGuide[] = [
    {
      id: 'smart-link',
      title: 'Smart Link Studio',
      icon: LayoutGrid,
      color: 'text-turquoise',
      description: 'Create a unified landing page for your music across all platforms.',
      steps: [
        { title: 'Identity & URL', description: 'Set your unique slug (e.g., musaic.ai/your-name) and artist profile details.' },
        { title: 'Visuals', description: 'Upload your profile image and background artwork. Choose between "Glass", "Nightclub", or "Minimal" themes.' },
        { title: 'Social Links', description: 'Add links to Spotify, Apple Music, YouTube, and Instagram. The icons will auto-detect based on the URL.' },
        { title: 'Publish', description: 'Click "Save & Publish" to make your Smart Link live. Share the URL in your bio!' }
      ]
    },
    {
      id: 'video',
      title: 'Video Generator',
      icon: Video,
      color: 'text-purple-neon',
      description: 'Generate AI-powered visualizers for your social media stories and posts.',
      steps: [
        { title: 'Prompting', description: 'Describe the visual vibe you want (e.g., "Neon cyberpunk city with rain").' },
        { title: 'Aspect Ratio', description: 'Select 9:16 for Instagram/TikTok Stories or 1:1 for Feed posts.' },
        { title: 'Generate', description: 'Hit "Generate Video" and wait for the AI to render your clip.' },
        { title: 'Download', description: 'Preview the video and download it directly to your device.' }
      ]
    },
    {
      id: 'epk',
      title: 'Electronic Press Kit',
      icon: FileText,
      color: 'text-pink-500',
      description: 'A professional resume for booking agents, labels, and press.',
      steps: [
        { title: 'Biography', description: 'Write a compelling story about your artistic journey.' },
        { title: 'Assets', description: 'Upload high-resolution press photos.' },
        { title: 'Discography', description: 'Link your latest releases and top tracks.' },
        { title: 'Share', description: 'Generate a shareable link or download as a PDF to send to industry contacts.' }
      ]
    },
    {
      id: 'strategy',
      title: 'Release Strategy',
      icon: Target,
      color: 'text-orange-400',
      description: 'AI-driven roadmap to maximize your music release impact.',
      steps: [
        { title: 'Timeline', description: 'Follow the 4-week countdown plan provided by the AI.' },
        { title: 'Checklist', description: 'Complete tasks like "Update Spotify Bio" and "Post Teaser" to track progress.' },
        { title: 'Analytics', description: 'Monitor your target reach and days remaining until release.' }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="p-3 rounded-2xl bg-white/5 text-white ring-1 ring-white/10">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Tutorials</h2>
          <p className="text-[10px] font-black italic uppercase tracking-[0.4em] text-white/30 mt-1">Master the Studio</p>
        </div>
      </div>

      <div className="grid gap-6">
        {guides.map((guide) => (
          <motion.div 
            key={guide.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border rounded-[32px] overflow-hidden transition-all ${
              expandedModule === guide.id 
                ? 'bg-white/[0.02] border-white/10 shadow-2xl' 
                : 'bg-transparent border-white/5 hover:bg-white/[0.01]'
            }`}
          >
            <button
              onClick={() => setExpandedModule(expandedModule === guide.id ? null : guide.id)}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-2xl bg-black/40 flex items-center justify-center border border-white/5 ${guide.color}`}>
                  <guide.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">{guide.title}</h3>
                  <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest mt-1">{guide.description}</p>
                </div>
              </div>
              <div className={`p-2 rounded-full transition-all ${expandedModule === guide.id ? 'bg-white/10 text-white' : 'text-white/20'}`}>
                {expandedModule === guide.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </button>

            <AnimatePresence>
              {expandedModule === guide.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-0 space-y-4">
                    <div className="h-px w-full bg-white/5 mb-6" />
                    <div className="grid gap-4">
                      {guide.steps.map((step, index) => (
                        <div key={index} className="flex gap-4 p-4 rounded-2xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black text-white/60">
                              {index + 1}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xs font-black italic uppercase tracking-wide text-white">{step.title}</h4>
                            <p className="text-xs text-white/50 leading-relaxed">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-4 flex justify-end">
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-[10px] font-black italic uppercase tracking-widest">
                        <PlayCircle className="w-4 h-4" />
                        Watch Video Guide
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
