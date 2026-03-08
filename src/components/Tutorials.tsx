import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Globe, Video, FileText, Target, Image as ImageIcon,
  ChevronDown, ChevronUp, Lightbulb, Coins, Clock, Sparkles
} from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  tip?: string;
}

interface ModuleGuide {
  id: string;
  title: string;
  icon: any;
  color: string;
  bg: string;
  description: string;
  cost: string;
  time: string;
  steps: TutorialStep[];
}

export function Tutorials() {
  const [expandedModule, setExpandedModule] = useState<string | null>('smart-link');

  const guides: ModuleGuide[] = [
    {
      id: 'smart-link',
      title: 'Smart Link Studio',
      icon: Globe,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      description: 'Create a branded landing page that connects fans to your music on every platform.',
      cost: '15 tokens to publish (updates free)',
      time: '~5 minutes',
      steps: [
        {
          title: '1. Set Your Identity',
          description: 'Choose a custom URL slug (e.g. musaic.ai/s/your-name) and enter your artist name. The slug auto-generates from your name but you can customize it. A green checkmark confirms it\'s available.',
          tip: 'Keep your slug short and memorable — it\'s what fans will see in your bio link.'
        },
        {
          title: '2. Write Your Bio',
          description: 'Add a short biography (2-3 sentences) that tells visitors who you are. This appears front and center on your Smart Link page, right under your profile image.',
          tip: 'Think of it as your elevator pitch: genre, vibe, and what makes you unique.'
        },
        {
          title: '3. Upload Your Visuals',
          description: 'Upload a profile photo and background images. You can select from previously generated artwork in your library, or upload fresh images. Multiple backgrounds enable an auto-rotating carousel.',
          tip: 'For best results, use square images (1080×1080) for profile and landscape (1920×1080) for backgrounds.'
        },
        {
          title: '4. Customize Your Design',
          description: 'Choose from three themes — Glass (frosted overlay), Nightclub (neon glow), or Minimal (clean white). Pick your button style (rounded or square), accent color, and toggle the background carousel animation.',
        },
        {
          title: '5. Add Your Links',
          description: 'Add links to Spotify, Apple Music, YouTube, Instagram, SoundCloud, TikTok, or any custom URL. The platform icon auto-detects based on the URL. For custom links, add a title like "Merch Store" or "Tickets".',
          tip: 'Put your #1 streaming platform first — most fans click the top link.'
        },
        {
          title: '6. Preview & Publish',
          description: 'The live phone preview on the right updates in real-time as you edit. When everything looks right, hit "Save & Publish". Your link goes live instantly. Share it in your Instagram bio, Twitter, or wherever you connect with fans.',
        }
      ]
    },
    {
      id: 'artwork',
      title: 'Artwork Studio',
      icon: ImageIcon,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
      description: 'Generate professional cover art, YouTube thumbnails, and social media visuals with AI.',
      cost: 'Included with account',
      time: '~30 seconds per image',
      steps: [
        {
          title: '1. Choose Your Format',
          description: 'Select the output format: Cover Art (3000×3000 for Spotify/Apple), YouTube Thumbnail (1280×720), Instagram Post (1080×1080), or Instagram Portrait (1080×1350). Each format is optimized for its platform.',
        },
        {
          title: '2. Pick an Art Style',
          description: 'Choose from 8 visual styles: Photorealistic, Surrealist, Cyberpunk, Anime, Oil Painting, 3D Render, Minimalist, or Fantasy. Your AI Persona global preference (if set) will also influence the result.',
          tip: 'Cyberpunk and Surrealist work great for electronic music. Oil Painting suits jazz and classical.'
        },
        {
          title: '3. Describe Your Vision',
          description: 'Write a detailed visual concept in the main prompt field. Be specific about colors, composition, mood, and elements you want. Example: "A lone astronaut floating in a cosmic ocean of purple nebulas, with a small boombox glowing turquoise."',
        },
        {
          title: '4. Add Context & Negatives',
          description: 'The Creative Vision field lets you add deeper meaning or context (e.g. "represents isolation in the digital age"). The Negative Prompt field tells AI what to avoid (e.g. "blurry, text, watermark, low quality").',
          tip: 'Always add "text, watermark, low quality" to your negative prompt for cleaner results.'
        },
        {
          title: '5. Generate & Download',
          description: 'Hit "Generate Asset" and wait ~30 seconds. The preview shows your result. Hover over it to reveal the download button. All generated images are saved to your session history for quick access.',
        }
      ]
    },
    {
      id: 'video',
      title: 'AI Video Generator',
      icon: Video,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      description: 'Create AI-generated video loops and teasers for social media — powered by Google Veo.',
      cost: 'PRO feature only',
      time: '1-2 minutes per video',
      steps: [
        {
          title: '1. Select a Style',
          description: 'Choose from Cinematic (high-end film look), Lo-fi (retro grain), Glitch (digital distortion), Anime (Japanese animation), or 3D Render (clean CG). Your global AI Persona aesthetic preference is applied automatically.',
        },
        {
          title: '2. Write Your Prompt',
          description: 'Describe the visual scene you want. Be specific about motion, lighting, and atmosphere. Example: "Slow-motion rain falling on neon-lit Tokyo streets at night, with reflections in puddles and distant fog."',
          tip: 'Include motion words: "slow motion", "camera panning", "zooming in", "particles floating" for more dynamic results.'
        },
        {
          title: '3. Choose Aspect Ratio',
          description: 'Pick 9:16 for Instagram Reels, TikTok, and Stories, or 16:9 for YouTube and landscape formats. The video renders at 720p resolution.',
        },
        {
          title: '4. Generate & Wait',
          description: 'Hit "Generate Video" and wait 1-2 minutes. The AI renders your video through Google\'s Veo engine on our server. You\'ll see status updates as it processes. Once complete, the video auto-plays in the preview.',
        },
        {
          title: '5. Download & Use',
          description: 'Click the download button to save your video as MP4. Add your track in any video editor (CapCut, InShot, Premiere) and post to your socials. These clips work perfectly as album teasers, visualizers, or story backgrounds.',
        }
      ]
    },
    {
      id: 'epk',
      title: 'Electronic Press Kit',
      icon: FileText,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      description: 'Build a professional press kit with AI-generated bios, press releases, and media assets.',
      cost: 'Included with account',
      time: '~2 minutes with AI',
      steps: [
        {
          title: '1. Fill Your Profile',
          description: 'Enter your artist name, genre, key highlights (awards, streams, collaborations, notable shows), and upload a high-quality press photo. This information feeds the AI for more accurate content.',
        },
        {
          title: '2. Generate Your Bio',
          description: 'Use the AI Content Generator to create your artist biography. Choose your tone (Professional, Edgy, Storytelling) and variation focus (Career Milestones, Genre Identity, or Personal Story). The AI generates 3 variations — pick the one that fits best.',
          tip: 'Generate all 3 variations and mix the best paragraphs from each for a truly unique bio.'
        },
        {
          title: '3. Create a Press Release',
          description: 'Switch to Press Release mode, enter your release title, date, and description. The AI generates a formatted press release ready to send to blogs, playlists, and media contacts.',
        },
        {
          title: '4. Add Discography & Links',
          description: 'Add your latest release title and streaming link. Include management/booking contact info so industry professionals can reach your team directly.',
        },
        {
          title: '5. Export & Share',
          description: 'Download your EPK as a PDF or share it via a link. The PDF includes your photo, bio, press release, discography, and contact details in a clean, professional layout.',
          tip: 'Send your EPK to playlist curators at least 4 weeks before release day for best results.'
        }
      ]
    },
    {
      id: 'strategy',
      title: 'Release Strategy',
      icon: Target,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      description: 'Get a personalized AI-generated marketing roadmap for your next release.',
      cost: 'Included with account',
      time: '~1 minute to generate',
      steps: [
        {
          title: '1. Enter Release Details',
          description: 'Provide your release title, genre/style, target release date, and which platforms you\'re focusing on (Spotify, Apple Music, YouTube, etc.). The AI tailors the strategy to your specific release type and genre.',
        },
        {
          title: '2. Generate Your Roadmap',
          description: 'Click "Generate Strategy" and the AI creates a 4-phase marketing plan with 12-16 actionable tasks. Each phase has a timeline (e.g. "Week 1-2: Pre-Save Campaign") and specific, actionable steps.',
          tip: 'Be specific about your genre — the AI gives different advice for EDM vs Hip-Hop vs Indie releases.'
        },
        {
          title: '3. Track Your Progress',
          description: 'Click tasks to mark them complete. The progress bar tracks your overall completion. Stats show your estimated target reach and a key strategic insight from the AI.',
        },
        {
          title: '4. Execute & Iterate',
          description: 'Follow the roadmap phase by phase. Use Musaic\'s other tools along the way: generate teaser videos for phase 1, create your cover art for phase 2, and publish your Smart Link for release day. You can generate a new strategy anytime if plans change.',
        }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-white/5 text-turquoise ring-1 ring-turquoise/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-white">Tutorials</h2>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/30 mt-1">Step-by-step guides for every module</p>
          </div>
        </div>
      </div>

      {/* Guides */}
      <div className="space-y-4">
        {guides.map((guide) => (
          <motion.div
            key={guide.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-card rounded-3xl overflow-hidden transition-all ${
              expandedModule === guide.id ? 'ring-1 ring-white/10' : ''
            }`}
          >
            <button
              onClick={() => setExpandedModule(expandedModule === guide.id ? null : guide.id)}
              className="w-full flex items-center justify-between p-6 text-left group"
            >
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl ${guide.bg} flex items-center justify-center ${guide.color}`}>
                  <guide.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-turquoise transition-colors">{guide.title}</h3>
                  <p className="text-xs text-white/40 mt-1 hidden sm:block">{guide.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-4 text-[10px] text-white/30">
                  <span className="flex items-center gap-1"><Coins className="w-3 h-3" />{guide.cost}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{guide.time}</span>
                </div>
                <div className={`p-2 rounded-full transition-all ${expandedModule === guide.id ? 'bg-white/10 text-white' : 'text-white/20'}`}>
                  {expandedModule === guide.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </button>

            <AnimatePresence>
              {expandedModule === guide.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-8 pt-0 space-y-4">
                    <div className="h-px w-full bg-white/5 mb-6" />

                    {/* Mobile meta */}
                    <div className="flex md:hidden items-center gap-4 text-[10px] text-white/30 mb-4">
                      <span className="flex items-center gap-1"><Coins className="w-3 h-3" />{guide.cost}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{guide.time}</span>
                    </div>

                    <div className="space-y-4">
                      {guide.steps.map((step, index) => (
                        <div key={index} className="group/step rounded-2xl bg-black/30 border border-white/5 hover:border-white/10 transition-colors overflow-hidden">
                          <div className="p-5 space-y-2">
                            <h4 className="text-sm font-bold text-white">{step.title}</h4>
                            <p className="text-sm text-white/50 leading-relaxed">{step.description}</p>
                            {step.tip && (
                              <div className="flex items-start gap-2.5 mt-3 p-3 rounded-xl bg-turquoise/5 border border-turquoise/10">
                                <Lightbulb className="w-4 h-4 text-turquoise flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-turquoise/80 leading-relaxed">{step.tip}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
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
