import React from 'react';
import { motion } from 'motion/react';
import { LanguageCode } from './Header';

interface FooterProps {
  lang: LanguageCode;
  onNavigate: (page: 'about' | 'faq' | 'tutorials' | 'privacy' | 'terms' | 'contact') => void;
}

const TRANSLATIONS = {
  en: {
    about: 'About Us',
    faq: 'FAQ',
    tutorials: 'Tutorials',
    privacy: 'Privacy Policy',
    terms: 'Terms & Conditions',
    contact: 'Contact',
    rights: 'All Rights Reserved'
  },
  fr: {
    about: 'À Propos',
    faq: 'FAQ',
    tutorials: 'Tutoriels',
    privacy: 'Politique de Confidentialité',
    terms: 'Conditions Générales',
    contact: 'Contact',
    rights: 'Tous Droits Réservés'
  },
  es: {
    about: 'Sobre Nosotros',
    faq: 'FAQ',
    tutorials: 'Tutoriales',
    privacy: 'Política de Privacidad',
    terms: 'Términos y Condiciones',
    contact: 'Contacto',
    rights: 'Todos los Derechos Reservados'
  },
  pt: {
    about: 'Sobre Nós',
    faq: 'FAQ',
    tutorials: 'Tutoriais',
    privacy: 'Privacidade',
    terms: 'Termos',
    contact: 'Contato',
    rights: 'Todos os Direitos Reservados'
  },
  it: {
    about: 'Chi Siamo',
    faq: 'FAQ',
    tutorials: 'Tutorial',
    privacy: 'Privacy',
    terms: 'Termini',
    contact: 'Contatti',
    rights: 'Tutti i Diritti Riservati'
  },
  de: {
    about: 'Über Uns',
    faq: 'FAQ',
    tutorials: 'Tutorials',
    privacy: 'Datenschutz',
    terms: 'AGB',
    contact: 'Kontakt',
    rights: 'Alle Rechte Vorbehalten'
  },
  jp: {
    about: '私たちについて',
    faq: 'よくある質問',
    tutorials: 'チュートリアル',
    privacy: 'プライバシーポリシー',
    terms: '利用規約',
    contact: 'お問い合わせ',
    rights: '全著作権所有'
  }
};

export function Footer({ lang, onNavigate }: FooterProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];

  return (
    <footer className="border-t border-white/5 bg-[#050505] py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand */}
        <div className="col-span-1 md:col-span-1 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black italic uppercase tracking-tighter text-white">
              Musaic<span className="text-turquoise">.</span>AI
            </span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 leading-relaxed">
            Born in Ibiza.<br/>Built for Artists.
          </p>
          <div className="text-[10px] font-medium text-white/20">
            © {new Date().getFullYear()} Musaic.AI<br/>{t.rights}
          </div>
        </div>

        {/* Links Column 1 */}
        <div className="col-span-1 space-y-4">
          <h4 className="text-xs font-black italic uppercase tracking-widest text-turquoise mb-6">Explore</h4>
          <ul className="space-y-3">
            <li>
              <button onClick={() => onNavigate('about')} className="text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors text-left">
                {t.about}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('tutorials')} className="text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors text-left">
                {t.tutorials}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('faq')} className="text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors text-left">
                {t.faq}
              </button>
            </li>
          </ul>
        </div>

        {/* Links Column 2 */}
        <div className="col-span-1 space-y-4">
          <h4 className="text-xs font-black italic uppercase tracking-widest text-turquoise mb-6">Legal</h4>
          <ul className="space-y-3">
            <li>
              <button onClick={() => onNavigate('privacy')} className="text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors text-left">
                {t.privacy}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('terms')} className="text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors text-left">
                {t.terms}
              </button>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div className="col-span-1 space-y-4">
          <h4 className="text-xs font-black italic uppercase tracking-widest text-turquoise mb-6">Connect</h4>
          <button onClick={() => onNavigate('contact')} className="text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors text-left block mb-2">
            {t.contact}
          </button>
          <a href="mailto:contact.musaicai@gmail.com" className="text-xs font-bold uppercase tracking-wider text-white/40 hover:text-turquoise transition-colors break-all">
            contact.musaicai@gmail.com
          </a>
        </div>

      </div>
    </footer>
  );
}
