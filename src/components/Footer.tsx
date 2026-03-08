import React from 'react';
import { LanguageCode } from '../lib/i18n';

interface FooterProps {
  lang: LanguageCode;
  onNavigate: (page: 'about' | 'faq' | 'tutorials' | 'privacy' | 'terms' | 'contact') => void;
}

const T: Record<string, Record<string, string>> = {
  en: { about: 'About', faq: 'FAQ', tutorials: 'Tutorials', privacy: 'Privacy', terms: 'Terms', contact: 'Contact', rights: 'All rights reserved', tagline: 'Built for artists who do it themselves.' },
  fr: { about: 'À propos', faq: 'FAQ', tutorials: 'Tutoriels', privacy: 'Confidentialité', terms: 'CGU', contact: 'Contact', rights: 'Tous droits réservés', tagline: 'Conçu pour les artistes indépendants.' },
  es: { about: 'Nosotros', faq: 'FAQ', tutorials: 'Tutoriales', privacy: 'Privacidad', terms: 'Términos', contact: 'Contacto', rights: 'Todos los derechos reservados', tagline: 'Hecho para artistas independientes.' },
  it: { about: 'Chi siamo', faq: 'FAQ', tutorials: 'Tutorial', privacy: 'Privacy', terms: 'Termini', contact: 'Contatti', rights: 'Tutti i diritti riservati', tagline: 'Per artisti indipendenti.' },
  de: { about: 'Über uns', faq: 'FAQ', tutorials: 'Tutorials', privacy: 'Datenschutz', terms: 'AGB', contact: 'Kontakt', rights: 'Alle Rechte vorbehalten', tagline: 'Für unabhängige Künstler.' },
};

export function Footer({ lang, onNavigate }: FooterProps) {
  const t = T[lang] || T['en'];

  return (
    <footer className="border-t border-white/5 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <img src="/logo-musaic.jpeg" alt="Musaic AI" className="w-10 h-10 rounded-xl" />
              <span className="text-lg font-black uppercase tracking-tight text-white">
                Musaic<span className="text-turquoise">.</span>AI
              </span>
            </div>
            <p className="text-xs text-white/30 leading-relaxed max-w-[200px]">{t.tagline}</p>
            <p className="text-[10px] text-white/20">© {new Date().getFullYear()} Musaic AI. {t.rights}.</p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-turquoise">Product</h4>
            <div className="flex flex-col gap-2.5">
              {[
                { label: t.about, page: 'about' as const },
                { label: t.tutorials, page: 'tutorials' as const },
                { label: t.faq, page: 'faq' as const },
              ].map(item => (
                <button key={item.page} onClick={() => onNavigate(item.page)}
                  className="text-xs text-white/40 hover:text-white transition-colors text-left font-medium">
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-turquoise">Legal</h4>
            <div className="flex flex-col gap-2.5">
              {[
                { label: t.privacy, page: 'privacy' as const },
                { label: t.terms, page: 'terms' as const },
              ].map(item => (
                <button key={item.page} onClick={() => onNavigate(item.page)}
                  className="text-xs text-white/40 hover:text-white transition-colors text-left font-medium">
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-turquoise">Connect</h4>
            <div className="flex flex-col gap-2.5">
              <button onClick={() => onNavigate('contact')}
                className="text-xs text-white/40 hover:text-white transition-colors text-left font-medium">
                {t.contact}
              </button>
              <a href="mailto:contact.musaicai@gmail.com"
                className="text-xs text-white/30 hover:text-turquoise transition-colors break-all font-mono">
                contact.musaicai@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
