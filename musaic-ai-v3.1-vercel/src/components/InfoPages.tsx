import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Mail, MapPin, Shield, FileText, Users, MessageCircle } from 'lucide-react';
import { LanguageCode } from '../lib/i18n';

interface InfoPagesProps {
  page: 'about' | 'faq' | 'privacy' | 'terms' | 'contact';
  lang: LanguageCode;
}

// ─── FAQ Data ────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'What is Musaic AI?',
        a: 'Musaic AI is an all-in-one branding platform for independent music artists. It lets you generate cover art, promotional videos, press kits, smart links, and release strategies — all powered by AI. Think of it as Canva meets Linktree meets a PR agency, built specifically for musicians.'
      },
      {
        q: 'Is Musaic free to use?',
        a: 'Yes! You get 50 free tokens when you sign up — enough to publish a Smart Link and generate several images. Additional tokens can be purchased in packs of 100. PRO subscribers get unlimited access to all features including video generation.'
      },
      {
        q: 'What do I need to get started?',
        a: 'Just an email address or Google account. Sign up, and you\'re immediately in the studio. No credit card required for the free tier. You can start creating artwork and press kits right away.'
      },
    ]
  },
  {
    category: 'Tokens & Pricing',
    items: [
      {
        q: 'How do tokens work?',
        a: 'Tokens are the currency of Musaic AI. Different actions cost different amounts: publishing a new Smart Link costs 15 tokens, AI video generation costs 5 tokens per video. Image generation and press kit creation are included with your account. PRO users have unlimited tokens.'
      },
      {
        q: 'How much do tokens cost?',
        a: '100 tokens cost $10 USD (or equivalent in your local currency). You can also earn tokens through promo codes and special events. PRO membership at $19.99/month gives you unlimited access to everything.'
      },
      {
        q: 'What\'s the difference between Free and PRO?',
        a: 'Free users get 50 tokens, access to artwork generation, press kit tools, and can publish 1 Smart Link. PRO users get unlimited tokens, unlimited Smart Links, HD video generation (powered by Google Veo), priority support, and no watermarks on any content.'
      },
    ]
  },
  {
    category: 'Smart Links',
    items: [
      {
        q: 'What is a Smart Link?',
        a: 'A Smart Link is a customizable landing page that gathers all your music platform links in one place. Instead of choosing between Spotify and Apple Music in your bio, share one Musaic link that lets fans pick their preferred platform. It also tracks views and clicks.'
      },
      {
        q: 'Can I customize the look of my Smart Link?',
        a: 'Absolutely. Choose from three themes (Glass, Nightclub, Minimal), customize button colors and styles, upload a profile photo and background images, and toggle background carousel animations. Your Smart Link is a reflection of your brand.'
      },
      {
        q: 'Is updating my Smart Link free?',
        a: 'Yes. You only pay tokens once to publish a new Smart Link. All future updates — changing links, themes, images, bio — are completely free, forever.'
      },
    ]
  },
  {
    category: 'AI Features',
    items: [
      {
        q: 'What AI powers Musaic?',
        a: 'Musaic uses Google\'s Gemini AI for text generation (bios, press releases, strategies) and image creation (cover art, thumbnails). Video generation is powered by Google Veo. All AI processing happens on our secure servers — your data never leaves our infrastructure.'
      },
      {
        q: 'Do I own the content AI generates?',
        a: 'Yes, 100%. Everything you generate with Musaic AI — images, videos, text — is yours to use commercially. There are no hidden licenses or usage restrictions. You own your art.'
      },
      {
        q: 'Can I control the AI\'s style?',
        a: 'Yes. The AI Persona settings let you define global preferences for art style, biography tone, and video aesthetic. These preferences are applied across all modules automatically. You can also customize each generation with specific prompts, negative prompts, and style selections.'
      },
    ]
  },
];

// ─── About Content ───────────────────────────────────────
const ABOUT_CONTENT = {
  hero: 'Built for artists who do it themselves.',
  story: `Musaic AI was born from a simple frustration: independent artists spend more time on marketing than making music. Between designing cover art, writing press releases, setting up link pages, and planning release campaigns — the creative process gets buried under administrative work.

We built Musaic to change that. By combining cutting-edge generative AI with tools designed specifically for the music industry, we've created a platform where an artist can go from "I just finished a track" to "my release campaign is ready" in under 30 minutes.

Our team brings together experience in music production, AI engineering, and digital marketing. We've been DJs, producers, and artists ourselves — we know what it takes to promote music independently.`,
  mission: 'To give every independent artist the same branding tools that major labels use — powered by AI, accessible to everyone.',
  values: [
    { title: 'Artist First', desc: 'Every feature is designed around real artist workflows. If it doesn\'t save you time or make your brand stronger, we don\'t build it.' },
    { title: 'Own Your Art', desc: 'You own everything you create on Musaic. Full rights, no exceptions. Your music, your visuals, your brand.' },
    { title: 'No Gatekeeping', desc: 'Professional tools shouldn\'t require professional budgets. Our free tier gives you real creative power from day one.' },
  ]
};

// ─── Privacy Content ─────────────────────────────────────
const PRIVACY_SECTIONS = [
  { title: '1. Information We Collect', content: 'We collect information you provide directly: your name, email address, and payment information when you make purchases. We also collect usage data (which features you use, generation counts) to improve our service. We do NOT collect or analyze your music files, lyrics, or creative content.' },
  { title: '2. How We Use Your Data', content: 'Your data is used to: provide and maintain your account, process transactions, improve our AI models (anonymized and aggregated only), send important service updates, and provide customer support. We never sell your personal data to third parties.' },
  { title: '3. AI-Generated Content', content: 'Content you generate (images, videos, text) is processed on our secure servers using Google Cloud infrastructure. Generated content is temporarily cached for delivery but is not stored permanently by us or used to train AI models. You retain full ownership.' },
  { title: '4. Data Security', content: 'We use industry-standard encryption (TLS 1.3) for data in transit and AES-256 for data at rest. Authentication is handled through Firebase Auth with secure token verification. Payment processing is handled entirely by Stripe — we never see or store your credit card details.' },
  { title: '5. Third-Party Services', content: 'We use: Firebase (authentication & database), Google Cloud (AI processing), Stripe (payments), and Vercel/Cloud Run (hosting). Each service has its own privacy policy and is GDPR-compliant.' },
  { title: '6. Your Rights', content: 'You can: access all data we hold about you, request corrections, delete your account and all associated data, export your data, and opt out of non-essential communications. To exercise any of these rights, contact us at contact.musaicai@gmail.com.' },
  { title: '7. Cookie Policy', content: 'We use essential cookies for authentication and session management (required for the app to work). We use optional analytics cookies to understand how our platform is used. You can manage cookie preferences at any time through the cookie settings banner.' },
];

// ─── Terms Content ───────────────────────────────────────
const TERMS_SECTIONS = [
  { title: '1. Acceptance of Terms', content: 'By creating an account or using Musaic AI, you agree to these Terms of Service. If you don\'t agree, please don\'t use the platform. We may update these terms — continued use after changes constitutes acceptance.' },
  { title: '2. Your Account', content: 'You must provide accurate information when creating your account. You\'re responsible for maintaining the security of your credentials. One person per account — sharing accounts is not permitted. You must be at least 16 years old to use Musaic AI.' },
  { title: '3. Content Ownership', content: 'You retain full ownership of all content you create using Musaic AI. This includes generated images, videos, text, and any content you upload. You grant Musaic a limited license to host and display your content solely for the purpose of providing the service (e.g., displaying your Smart Link page).' },
  { title: '4. Acceptable Use', content: 'You agree not to: generate content that is illegal, hateful, or violates others\' rights; attempt to reverse-engineer our AI systems; use automated scripts to mass-generate content; resell Musaic-generated content as a competing service; or impersonate other artists.' },
  { title: '5. Tokens & Payments', content: 'Tokens are non-refundable once used. Unused tokens remain in your account indefinitely. PRO subscriptions are billed monthly and can be cancelled anytime — access continues until the end of the billing period. Prices may change with 30 days notice.' },
  { title: '6. Service Availability', content: 'We aim for 99.9% uptime but cannot guarantee uninterrupted service. AI generation times may vary based on demand. We reserve the right to modify, suspend, or discontinue features with reasonable notice.' },
  { title: '7. Limitation of Liability', content: 'Musaic AI is provided "as is". We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability is limited to the amount you\'ve paid us in the 12 months preceding the claim.' },
  { title: '8. Termination', content: 'We reserve the right to suspend or terminate accounts that violate these terms. You can delete your account at any time through the app settings. Upon deletion, your data is permanently removed within 30 days.' },
];

export function InfoPages({ page, lang }: InfoPagesProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const pageIcons = {
    about: Users,
    faq: MessageCircle,
    privacy: Shield,
    terms: FileText,
    contact: Mail,
  };
  const PageIcon = pageIcons[page] || FileText;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6 lg:p-10 space-y-10 min-h-[60vh]"
    >
      {/* ─── ABOUT ─────────────────────────────────── */}
      {page === 'about' && (
        <>
          <div className="space-y-4 border-b border-white/10 pb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-turquoise/10 text-turquoise ring-1 ring-turquoise/20">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tight text-white">About Musaic AI</h2>
            </div>
            <p className="text-2xl font-bold text-turquoise">{ABOUT_CONTENT.hero}</p>
          </div>

          <div className="text-white/60 text-base leading-relaxed whitespace-pre-line font-light">
            {ABOUT_CONTENT.story}
          </div>

          <div className="glass-card rounded-3xl p-8 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-turquoise">Our Mission</h3>
            <p className="text-lg text-white/80 font-medium leading-relaxed">{ABOUT_CONTENT.mission}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ABOUT_CONTENT.values.map((v, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-white">{v.title}</h4>
                <p className="text-xs text-white/40 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─── FAQ ───────────────────────────────────── */}
      {page === 'faq' && (
        <>
          <div className="space-y-2 border-b border-white/10 pb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-purple-neon/10 text-purple-neon ring-1 ring-purple-neon/20">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tight text-white">FAQ</h2>
            </div>
            <p className="text-sm text-white/40 font-medium">Everything you need to know about Musaic AI.</p>
          </div>

          <div className="space-y-10">
            {FAQ_ITEMS.map((section, sIdx) => (
              <div key={sIdx} className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-turquoise">{section.category}</h3>
                <div className="space-y-2">
                  {section.items.map((item, iIdx) => {
                    const globalIdx = FAQ_ITEMS.slice(0, sIdx).reduce((sum, s) => sum + s.items.length, 0) + iIdx;
                    const isOpen = openFaq === globalIdx;
                    return (
                      <div key={iIdx} className={`glass-card rounded-2xl overflow-hidden transition-all ${isOpen ? 'ring-1 ring-white/10' : ''}`}>
                        <button
                          onClick={() => setOpenFaq(isOpen ? null : globalIdx)}
                          className="w-full flex items-center justify-between p-5 text-left group"
                        >
                          <h4 className="text-sm font-semibold text-white group-hover:text-turquoise transition-colors pr-4">{item.q}</h4>
                          <ChevronDown className={`w-4 h-4 text-white/30 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180 text-turquoise' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 pb-5 pt-0">
                                <p className="text-sm text-white/50 leading-relaxed">{item.a}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─── PRIVACY ───────────────────────────────── */}
      {page === 'privacy' && (
        <>
          <div className="space-y-2 border-b border-white/10 pb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tight text-white">Privacy Policy</h2>
            </div>
            <p className="text-sm text-white/40">Last updated: March 2026. Your data, protected.</p>
          </div>

          <div className="space-y-8">
            {PRIVACY_SECTIONS.map((section, i) => (
              <div key={i} className="space-y-3">
                <h3 className="text-base font-bold text-white">{section.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─── TERMS ─────────────────────────────────── */}
      {page === 'terms' && (
        <>
          <div className="space-y-2 border-b border-white/10 pb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gold/10 text-gold ring-1 ring-gold/20">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tight text-white">Terms of Service</h2>
            </div>
            <p className="text-sm text-white/40">Last updated: March 2026. Please read carefully.</p>
          </div>

          <div className="space-y-8">
            {TERMS_SECTIONS.map((section, i) => (
              <div key={i} className="space-y-3">
                <h3 className="text-base font-bold text-white">{section.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─── CONTACT ───────────────────────────────── */}
      {page === 'contact' && (
        <>
          <div className="space-y-2 border-b border-white/10 pb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-400 ring-1 ring-pink-500/20">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tight text-white">Contact Us</h2>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-10 text-center space-y-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Questions? Feedback? Partnerships?</h3>
              <p className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">
                We read every message. Whether you need help with your account, have a feature request,
                or want to discuss a collaboration — we're here.
              </p>
            </div>

            <a
              href="mailto:contact.musaicai@gmail.com"
              className="inline-flex items-center gap-3 px-8 py-4 bg-turquoise text-black font-bold uppercase tracking-wider rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-turquoise/20"
            >
              <Mail className="w-5 h-5" />
              contact.musaicai@gmail.com
            </a>

            <div className="pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-6 text-left max-w-md mx-auto">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/60">Support</h4>
                <p className="text-sm text-white/40">We typically respond within 24 hours on business days.</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/60">Business</h4>
                <p className="text-sm text-white/40">For partnerships and press inquiries, use the same email.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
