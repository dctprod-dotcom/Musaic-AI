import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  Image as ImageIcon, 
  Video, 
  Pencil 
} from 'lucide-react';
import { cn } from '../lib/utils';

const GUIDE_DATA = [
  {
    id: 'artwork',
    title: 'ARTWORK STUDIO',
    icon: ImageIcon,
    subOptions: [
      {
        title: 'Standard Cover',
        description: 'Use this for 3000x3000px high-resolution square covers.'
      },
      {
        title: 'Variation Tool',
        description: 'Generate different styles based on your initial prompt to find the perfect vibe.'
      }
    ]
  },
  {
    id: 'video',
    title: 'VIDEO ENGINE',
    icon: Video,
    subOptions: [
      {
        title: 'YouTube Thumbnail',
        description: 'Outputs a 16:9 landscape image (1280x720) optimized for clicks.'
      },
      {
        title: 'Social Media Snippets',
        description: 'Create vertical (9:16) or square (1:1) visual assets for Instagram and TikTok promotion.'
      }
    ]
  },
  {
    id: 'press',
    title: 'PRESS & BIO',
    icon: Pencil,
    subOptions: [
      {
        title: 'Artist Bio',
        description: 'Generate a professional 200-word biography for your profile.'
      },
      {
        title: 'Press Release',
        description: 'Draft a formal announcement for your new remix release to send to DJs and blogs.'
      }
    ]
  }
];

export function UserGuide() {
  const [expandedSection, setExpandedSection] = useState<string | null>('artwork');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 max-w-4xl mx-auto"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black uppercase tracking-tighter text-white">User Guide</h2>
        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Master the Musaic AI Studio</p>
      </div>

      <div className="space-y-6">
        {GUIDE_DATA.map((section) => (
          <div 
            key={section.id} 
            className={cn(
              "bg-white/[0.02] border rounded-[32px] overflow-hidden transition-all duration-300",
              expandedSection === section.id ? "border-gold/50 bg-white/[0.05]" : "border-white/10 hover:border-gold/30"
            )}
          >
            <button 
              onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              className="w-full p-8 flex items-center justify-between group"
            >
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                  expandedSection === section.id ? "bg-gold text-navy" : "bg-white/5 text-white/40 group-hover:text-gold"
                )}>
                  <section.icon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className={cn(
                    "text-xl font-black uppercase tracking-tight transition-colors",
                    expandedSection === section.id ? "text-gold" : "text-white"
                  )}>
                    {section.title}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">
                    {expandedSection === section.id ? 'Click to collapse' : 'View Module Guide'}
                  </p>
                </div>
              </div>
              <ChevronDown className={cn(
                "w-6 h-6 text-white/20 transition-transform duration-300",
                expandedSection === section.id && "rotate-180 text-gold"
              )} />
            </button>

            <AnimatePresence>
              {expandedSection === section.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="px-8 pb-8 pt-2">
                    <div className="h-px w-full bg-white/5 mb-6" />
                    <div className="space-y-6">
                      {section.subOptions.map((sub, index) => (
                        <div key={index} className="space-y-2">
                          <h4 className="text-sm font-bold text-gold uppercase tracking-wide flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                            {sub.title}
                          </h4>
                          <p className="text-sm text-white/80 leading-relaxed font-medium pl-3.5 border-l border-white/10 ml-[3px]">
                            {sub.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
