import React from 'react';
import { motion } from 'motion/react';
import { LanguageCode } from './Header';

interface InfoPagesProps {
  page: 'about' | 'faq' | 'privacy' | 'terms' | 'contact';
  lang: LanguageCode;
}

const TRANSLATIONS = {
  en: {
    about: {
      title: 'About Us',
      subtitle: 'Born in Ibiza, Built for Artists',
      content: `Musaic.AI is the ultimate branding tool for independent artists, born from the vibrant club culture of Ibiza. We believe that every artist deserves professional-grade tools to amplify their vision.

      Our mission is to democratize music marketing by combining cutting-edge AI technology with the raw energy of the electronic music scene. Whether you're a bedroom producer or a touring DJ, Musaic.AI empowers you to create stunning visuals, smart links, and press kits in minutes, not days.

      Join the revolution. Amplify your sound. Own your brand.`
    },
    faq: {
      title: 'FAQ',
      subtitle: 'Frequently Asked Questions',
      items: [
        {
          q: 'How do tokens work?',
          a: 'Tokens are the currency of Musaic.AI. You use them to generate AI videos, create new Smart Links, and unlock premium features. You can buy them in packs or get a monthly allowance with our Pro plans.'
        },
        {
          q: 'Can I export my videos?',
          a: 'Yes! All videos generated with Musaic.AI are yours to keep. Pro users can download HD videos without watermarks, ready for Instagram, TikTok, and YouTube.'
        },
        {
          q: 'What is a Smart Link?',
          a: 'A Smart Link is a single landing page that connects your fans to your music on all major streaming platforms (Spotify, Apple Music, etc.). It\'s essential for your bio link.'
        }
      ]
    },
    privacy: {
      title: 'Privacy Policy',
      subtitle: 'Your Data, Protected',
      content: `At Musaic.AI, we take your privacy seriously. This policy outlines how we collect, use, and protect your personal information.

      1. Data Collection: We collect information you provide directly to us, such as your name, email address, and payment information.
      2. Usage: We use your data to provide and improve our services, process transactions, and communicate with you.
      3. Security: We implement industry-standard security measures to protect your data from unauthorized access.
      4. Third Parties: We do not sell your personal data to third parties. We may share data with trusted service providers who assist us in operating our platform.

      For full details, please contact our Data Protection Officer.`
    },
    terms: {
      title: 'Terms & Conditions',
      subtitle: 'Rules of the Dancefloor',
      content: `Welcome to Musaic.AI. By using our platform, you agree to these terms.

      1. License: You grant Musaic.AI a license to host and display your content. You retain ownership of your music and artwork.
      2. Prohibited Content: You may not upload content that is illegal, hateful, or infringes on others' rights.
      3. Termination: We reserve the right to terminate accounts that violate these terms.
      4. Liability: Musaic.AI is provided "as is". We are not liable for any damages arising from your use of the platform.

      Play nice, create art, and respect the community.`
    },
    contact: {
      title: 'Contact Us',
      subtitle: 'Get in Touch',
      content: `Have questions? Need support? Or just want to say hi?

      Email us directly at:`
    }
  },
  fr: {
    about: {
      title: 'À Propos',
      subtitle: 'Né à Ibiza, Conçu pour les Artistes',
      content: `Musaic.AI est l'outil de branding ultime pour les artistes indépendants, né de la culture club vibrante d'Ibiza. Nous croyons que chaque artiste mérite des outils de qualité professionnelle pour amplifier sa vision.

      Notre mission est de démocratiser le marketing musical en combinant une technologie IA de pointe avec l'énergie brute de la scène électronique. Que vous soyez producteur de chambre ou DJ en tournée, Musaic.AI vous permet de créer des visuels époustouflants, des smart links et des kits presse en quelques minutes.

      Rejoignez la révolution. Amplifiez votre son. Maîtrisez votre marque.`
    },
    faq: {
      title: 'FAQ',
      subtitle: 'Questions Fréquentes',
      items: [
        {
          q: 'Comment fonctionnent les tokens ?',
          a: 'Les tokens sont la monnaie de Musaic.AI. Vous les utilisez pour générer des vidéos IA, créer de nouveaux Smart Links et débloquer des fonctionnalités premium.'
        },
        {
          q: 'Puis-je exporter mes vidéos ?',
          a: 'Oui ! Toutes les vidéos générées avec Musaic.AI vous appartiennent. Les utilisateurs Pro peuvent télécharger des vidéos HD sans filigrane.'
        },
        {
          q: 'Qu\'est-ce qu\'un Smart Link ?',
          a: 'Un Smart Link est une page unique qui connecte vos fans à votre musique sur toutes les plateformes de streaming. C\'est essentiel pour votre lien en bio.'
        }
      ]
    },
    privacy: {
      title: 'Politique de Confidentialité',
      subtitle: 'Vos Données, Protégées',
      content: `Chez Musaic.AI, nous prenons votre vie privée au sérieux. Cette politique décrit comment nous collectons, utilisons et protégeons vos informations personnelles.

      1. Collecte : Nous collectons les informations que vous nous fournissez, comme votre nom, email et informations de paiement.
      2. Usage : Nous utilisons vos données pour fournir et améliorer nos services.
      3. Sécurité : Nous mettons en œuvre des mesures de sécurité standard pour protéger vos données.
      4. Tiers : Nous ne vendons pas vos données personnelles.

      Pour plus de détails, contactez notre Délégué à la Protection des Données.`
    },
    terms: {
      title: 'Conditions Générales',
      subtitle: 'Règles du Dancefloor',
      content: `Bienvenue sur Musaic.AI. En utilisant notre plateforme, vous acceptez ces conditions.

      1. Licence : Vous accordez à Musaic.AI une licence pour héberger votre contenu. Vous conservez la propriété de votre musique.
      2. Contenu Interdit : Vous ne pouvez pas télécharger de contenu illégal ou haineux.
      3. Résiliation : Nous nous réservons le droit de résilier les comptes qui violent ces termes.
      4. Responsabilité : Musaic.AI est fourni "tel quel".

      Soyez cool, créez de l'art et respectez la communauté.`
    },
    contact: {
      title: 'Contactez-nous',
      subtitle: 'Restons en contact',
      content: `Des questions ? Besoin d'aide ? Ou juste envie de dire bonjour ?

      Écrivez-nous directement à :`
    }
  },
  es: {
    about: {
      title: 'Sobre Nosotros',
      subtitle: 'Nacido en Ibiza, Construido para Artistas',
      content: `Musaic.AI es la herramienta definitiva de branding para artistas independientes, nacida de la vibrante cultura de club de Ibiza.`
    },
    faq: {
      title: 'FAQ',
      subtitle: 'Preguntas Frecuentes',
      items: [
        { q: '¿Cómo funcionan los tokens?', a: 'Los tokens son la moneda de Musaic.AI para generar videos y Smart Links.' },
        { q: '¿Puedo exportar mis videos?', a: '¡Sí! Los usuarios Pro pueden descargar videos HD sin marca de agua.' },
        { q: '¿Qué es un Smart Link?', a: 'Una página única que conecta a tus fans con tu música en todas las plataformas.' }
      ]
    },
    privacy: {
      title: 'Política de Privacidad',
      subtitle: 'Tus Datos, Protegidos',
      content: `En Musaic.AI, tomamos tu privacidad en serio. No vendemos tus datos a terceros.`
    },
    terms: {
      title: 'Términos y Condiciones',
      subtitle: 'Reglas de la Pista',
      content: `Al usar nuestra plataforma, aceptas estos términos. Tú conservas la propiedad de tu música.`
    },
    contact: {
      title: 'Contáctanos',
      subtitle: 'Ponte en contacto',
      content: `¿Preguntas? ¿Necesitas soporte? Escríbenos a:`
    }
  },
  pt: {
    about: { title: 'Sobre Nós', subtitle: 'Nascido em Ibiza', content: 'Musaic.AI é a ferramenta definitiva de branding para artistas independentes.' },
    faq: { title: 'FAQ', subtitle: 'Perguntas Frequentes', items: [{ q: 'Como funcionam os tokens?', a: 'Tokens são usados para gerar vídeos e links.' }] },
    privacy: { title: 'Privacidade', subtitle: 'Seus Dados Protegidos', content: 'Levamos sua privacidade a sério.' },
    terms: { title: 'Termos', subtitle: 'Regras da Pista', content: 'Ao usar a plataforma, você aceita estes termos.' },
    contact: { title: 'Contato', subtitle: 'Fale Conosco', content: 'Dúvidas? Escreva para:' }
  },
  it: {
    about: { title: 'Chi Siamo', subtitle: 'Nato a Ibiza', content: 'Musaic.AI è lo strumento definitivo per artisti indipendenti.' },
    faq: { title: 'FAQ', subtitle: 'Domande Frequenti', items: [{ q: 'Come funzionano i token?', a: 'I token servono per generare video e link.' }] },
    privacy: { title: 'Privacy', subtitle: 'I Tuoi Dati', content: 'Prendiamo sul serio la tua privacy.' },
    terms: { title: 'Termini', subtitle: 'Regole della Pista', content: 'Utilizzando la piattaforma accetti questi termini.' },
    contact: { title: 'Contatti', subtitle: 'Scrivici', content: 'Domande? Scrivici a:' }
  },
  de: {
    about: { title: 'Über Uns', subtitle: 'Geboren in Ibiza', content: 'Musaic.AI ist das ultimative Branding-Tool für unabhängige Künstler.' },
    faq: { title: 'FAQ', subtitle: 'Häufige Fragen', items: [{ q: 'Wie funktionieren Token?', a: 'Token werden für Videos und Links verwendet.' }] },
    privacy: { title: 'Datenschutz', subtitle: 'Deine Daten', content: 'Wir nehmen deinen Datenschutz ernst.' },
    terms: { title: 'AGB', subtitle: 'Regeln des Dancefloors', content: 'Durch die Nutzung akzeptierst du diese Bedingungen.' },
    contact: { title: 'Kontakt', subtitle: 'Schreib uns', content: 'Fragen? Schreib uns an:' }
  },
  jp: {
    about: { title: '私たちについて', subtitle: 'イビザ生まれ', content: 'Musaic.AIは独立系アーティストのための究極のブランディングツールです。' },
    faq: { title: 'よくある質問', subtitle: 'FAQ', items: [{ q: 'トークンの仕組みは？', a: 'トークンは動画やリンクの生成に使用されます。' }] },
    privacy: { title: 'プライバシーポリシー', subtitle: 'データ保護', content: '私たちはあなたのプライバシーを真剣に受け止めています。' },
    terms: { title: '利用規約', subtitle: 'ダンスフロアのルール', content: 'プラットフォームを使用することで、これらの条件に同意したことになります。' },
    contact: { title: 'お問い合わせ', subtitle: 'ご連絡ください', content: 'ご質問ですか？こちらまでメールください：' }
  }
};

export function InfoPages({ page, lang }: InfoPagesProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
  // Fallback to English if specific page translation is missing in other languages (simplified for brevity in ES/PT/IT/DE/JP)
  const content = t[page] || TRANSLATIONS['en'][page];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto p-8 md:p-12 space-y-8 min-h-[60vh]"
    >
      <div className="space-y-2 border-b border-white/10 pb-8">
        <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
          {content.title}
        </h2>
        <p className="text-sm font-black italic uppercase tracking-[0.3em] text-turquoise">
          {content.subtitle}
        </p>
      </div>

      <div className="prose prose-invert prose-lg max-w-none">
        {page === 'faq' ? (
          <div className="space-y-8">
            {(content as any).items.map((item: any, i: number) => (
              <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/5">
                <h3 className="text-lg font-black italic uppercase tracking-wide text-white mb-2">{item.q}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        ) : page === 'contact' ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-white/80 whitespace-pre-line">{(content as any).content}</p>
            <a 
              href="mailto:contact.musaicai@gmail.com" 
              className="text-2xl md:text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-turquoise to-purple-neon hover:scale-105 transition-transform"
            >
              contact.musaicai@gmail.com
            </a>
          </div>
        ) : (
          <div className="text-white/70 whitespace-pre-line leading-relaxed font-light">
            {(content as any).content}
          </div>
        )}
      </div>
    </motion.div>
  );
}
