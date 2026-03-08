import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { apiPost } from '../lib/api-client';
import { 
  FileText, 
  Upload, 
  Globe, 
  Music, 
  Mail, 
  Link as LinkIcon, 
  Check, 
  ChevronDown,
  Download,
  Share2,
  Sparkles,
  Wand2,
  X,
  Loader2
} from 'lucide-react';
import { AIPreferences } from '../types';

// --- Language Configuration ---
type LanguageCode = 'en' | 'fr' | 'es' | 'pt' | 'it' | 'de' | 'jp';

interface LanguageConfig {
  code: LanguageCode;
  label: string;
  dir: 'ltr' | 'rtl';
}

const LANGUAGES: LanguageConfig[] = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'es', label: 'Español', dir: 'ltr' },
  { code: 'pt', label: 'Português', dir: 'ltr' },
  { code: 'it', label: 'Italiano', dir: 'ltr' },
  { code: 'de', label: 'Deutsch', dir: 'ltr' },
  { code: 'jp', label: '日本語', dir: 'ltr' },
];

// --- Translations ---
const TRANSLATIONS = {
  en: {
    title: 'Electronic Press Kit',
    subtitle: 'Professional Artist Profile',
    bioTitle: 'Artist Biography',
    bioPlaceholder: 'Tell your story...',
    mediaTitle: 'Official Media',
    dropZone: 'Drop official photo here',
    orBrowse: 'or browse files',
    discoTitle: 'Discography & Links',
    latestRelease: 'Latest Release Title',
    streamingLink: 'Streaming Link (Spotify/Apple)',
    contactTitle: 'Contact & Booking',
    mgmtName: 'Management Name',
    mgmtEmail: 'Management Email',
    bookingEmail: 'Booking Email',
    downloadPdf: 'Download PDF',
    shareEpk: 'Share EPK',
    pressReleaseTitle: 'Latest Press Release',
    pressReleasePlaceholder: 'Paste your press release or generate one with AI...',
    generateAI: 'Generate with AI',
    generating: 'Generating...',
    aiPromptTitle: 'AI Content Generator',
    artistName: 'Artist Name',
    genre: 'Genre / Style',
    highlights: 'Key Highlights / Achievements',
    tone: 'Tone',
    style: 'Style / Format',
    variationFocus: 'Variation Focus',
    focusMilestones: 'Career Milestones',
    focusGenre: 'Genre / Artistic Identity',
    focusPersonal: 'Personal Story',
    selectVariation: 'Select a Variation',
    releaseTitle: 'Release Title',
    releaseDate: 'Release Date',
    generate: 'Generate'
  },
  fr: {
    title: 'Dossier de Presse (EPK)',
    subtitle: 'Profil Artiste Professionnel',
    bioTitle: 'Biographie de l\'Artiste',
    bioPlaceholder: 'Racontez votre histoire...',
    mediaTitle: 'Médias Officiels',
    dropZone: 'Déposez votre photo officielle ici',
    orBrowse: 'ou parcourez les fichiers',
    discoTitle: 'Discographie & Liens',
    latestRelease: 'Titre de la dernière sortie',
    streamingLink: 'Lien Streaming (Spotify/Apple)',
    contactTitle: 'Contact & Booking',
    mgmtName: 'Nom du Management',
    mgmtEmail: 'Email du Management',
    bookingEmail: 'Email de Booking',
    downloadPdf: 'Télécharger PDF',
    shareEpk: 'Partager EPK',
    pressReleaseTitle: 'Dernier Communiqué de Presse',
    pressReleasePlaceholder: 'Collez votre communiqué ou générez-le avec l\'IA...',
    generateAI: 'Générer avec IA',
    generating: 'Génération...',
    aiPromptTitle: 'Générateur de Contenu IA',
    artistName: 'Nom de l\'Artiste',
    genre: 'Genre / Style',
    highlights: 'Points Forts / Réalisations',
    tone: 'Ton',
    style: 'Style / Format',
    variationFocus: 'Focus de Variation',
    focusMilestones: 'Jalons de Carrière',
    focusGenre: 'Genre / Identité Artistique',
    focusPersonal: 'Histoire Personnelle',
    selectVariation: 'Choisir une Variation',
    releaseTitle: 'Titre de la Sortie',
    releaseDate: 'Date de Sortie',
    generate: 'Générer'
  },
  es: {
    title: 'Kit de Prensa Electrónico',
    subtitle: 'Perfil de Artista Profesional',
    bioTitle: 'Biografía del Artista',
    bioPlaceholder: 'Cuenta tu historia...',
    mediaTitle: 'Medios Oficiales',
    dropZone: 'Suelta tu foto oficial aquí',
    orBrowse: 'o buscar archivos',
    discoTitle: 'Discografía y Enlaces',
    latestRelease: 'Título del Último Lanzamiento',
    streamingLink: 'Enlace de Streaming',
    contactTitle: 'Contacto y Contratación',
    mgmtName: 'Nombre del Management',
    mgmtEmail: 'Email del Management',
    bookingEmail: 'Email de Contratación',
    downloadPdf: 'Descargar PDF',
    shareEpk: 'Compartir EPK',
    pressReleaseTitle: 'Último Comunicado de Prensa',
    pressReleasePlaceholder: 'Pega tu comunicado o genéralo con IA...',
    generateAI: 'Generar con IA',
    generating: 'Generando...',
    aiPromptTitle: 'Generador de Contenido IA',
    artistName: 'Nombre del Artista',
    genre: 'Género / Estilo',
    highlights: 'Puntos Clave / Logros',
    tone: 'Tono',
    style: 'Estilo / Formato',
    variationFocus: 'Enfoque de Variación',
    focusMilestones: 'Hitos de Carrera',
    focusGenre: 'Género / Identidad Artística',
    focusPersonal: 'Historia Personal',
    selectVariation: 'Seleccionar Variación',
    releaseTitle: 'Título del Lanzamiento',
    releaseDate: 'Fecha de Lanzamiento',
    generate: 'Generar'
  },
  pt: {
    title: 'Kit de Imprensa Eletrônico',
    subtitle: 'Perfil Artístico Profissional',
    bioTitle: 'Biografia do Artista',
    bioPlaceholder: 'Conte sua história...',
    mediaTitle: 'Mídia Oficial',
    dropZone: 'Solte sua foto oficial aqui',
    orBrowse: 'ou procurar arquivos',
    discoTitle: 'Discografia & Links',
    latestRelease: 'Título do Último Lançamento',
    streamingLink: 'Link de Streaming',
    contactTitle: 'Contato & Booking',
    mgmtName: 'Nome da Gestão',
    mgmtEmail: 'Email da Gestão',
    bookingEmail: 'Email para Booking',
    downloadPdf: 'Baixar PDF',
    shareEpk: 'Compartilhar EPK',
    pressReleaseTitle: 'Último Comunicado de Imprensa',
    pressReleasePlaceholder: 'Cole seu comunicado ou gere com IA...',
    generateAI: 'Gerar com IA',
    generating: 'Gerando...',
    aiPromptTitle: 'Gerador de Conteúdo IA',
    artistName: 'Nome do Artista',
    genre: 'Gênero / Estilo',
    highlights: 'Destaques / Conquistas',
    tone: 'Tom',
    style: 'Estilo / Formato',
    variationFocus: 'Foco da Variação',
    focusMilestones: 'Marcos de Carreira',
    focusGenre: 'Gênero / Identidade Artística',
    focusPersonal: 'História Pessoal',
    selectVariation: 'Selecionar Variação',
    releaseTitle: 'Título do Lançamento',
    releaseDate: 'Data de Lançamento',
    generate: 'Gerar'
  },
  it: {
    title: 'Cartella Stampa Elettronica',
    subtitle: 'Profilo Artista Professionale',
    bioTitle: 'Biografia dell\'Artista',
    bioPlaceholder: 'Racconta la tua storia...',
    mediaTitle: 'Media Ufficiali',
    dropZone: 'Rilascia qui la tua foto ufficiale',
    orBrowse: 'o sfoglia i file',
    discoTitle: 'Discografia & Link',
    latestRelease: 'Titolo Ultima Uscita',
    streamingLink: 'Link Streaming',
    contactTitle: 'Contatti & Booking',
    mgmtName: 'Nome Management',
    mgmtEmail: 'Email Management',
    bookingEmail: 'Email Booking',
    downloadPdf: 'Scarica PDF',
    shareEpk: 'Condividi EPK',
    pressReleaseTitle: 'Ultimo Comunicato Stampa',
    pressReleasePlaceholder: 'Incolla il tuo comunicato o generalo con l\'IA...',
    generateAI: 'Genera con IA',
    generating: 'Generazione...',
    aiPromptTitle: 'Generatore di Contenuti IA',
    artistName: 'Nome Artista',
    genre: 'Genere / Stile',
    highlights: 'Punti Salienti / Risultati',
    tone: 'Tono',
    style: 'Stile / Formato',
    variationFocus: 'Focus Variazione',
    focusMilestones: 'Tappe della Carriera',
    focusGenre: 'Genere / Identità Artistica',
    focusPersonal: 'Storia Personale',
    selectVariation: 'Seleziona Variazione',
    releaseTitle: 'Titolo Uscita',
    releaseDate: 'Data Uscita',
    generate: 'Genera'
  },
  de: {
    title: 'Elektronische Pressemappe',
    subtitle: 'Professionelles Künstlerprofil',
    bioTitle: 'Künstlerbiografie',
    bioPlaceholder: 'Erzähle deine Geschichte...',
    mediaTitle: 'Offizielle Medien',
    dropZone: 'Offizielles Foto hier ablegen',
    orBrowse: 'oder Dateien durchsuchen',
    discoTitle: 'Diskografie & Links',
    latestRelease: 'Titel der letzten Veröffentlichung',
    streamingLink: 'Streaming-Link',
    contactTitle: 'Kontakt & Booking',
    mgmtName: 'Management Name',
    mgmtEmail: 'Management E-Mail',
    bookingEmail: 'Booking E-Mail',
    downloadPdf: 'PDF Herunterladen',
    shareEpk: 'EPK Teilen',
    pressReleaseTitle: 'Neueste Pressemitteilung',
    pressReleasePlaceholder: 'Fügen Sie Ihre Pressemitteilung ein oder generieren Sie sie mit KI...',
    generateAI: 'Mit KI generieren',
    generating: 'Generiere...',
    aiPromptTitle: 'KI-Inhaltsgenerator',
    artistName: 'Künstlername',
    genre: 'Genre / Stil',
    highlights: 'Highlights / Erfolge',
    tone: 'Ton',
    style: 'Stil / Format',
    variationFocus: 'Variationsfokus',
    focusMilestones: 'Karriere-Meilensteine',
    focusGenre: 'Genre / Künstlerische Identität',
    focusPersonal: 'Persönliche Geschichte',
    selectVariation: 'Variation Auswählen',
    releaseTitle: 'Veröffentlichungstitel',
    releaseDate: 'Veröffentlichungsdatum',
    generate: 'Generieren'
  },
  jp: {
    title: '電子プレスキット (EPK)',
    subtitle: 'プロフェッショナルアーティストプロフィール',
    bioTitle: 'アーティストの経歴',
    bioPlaceholder: 'あなたの物語を語ってください...',
    mediaTitle: '公式メディア',
    dropZone: '公式写真をここにドロップ',
    orBrowse: 'またはファイルを参照',
    discoTitle: 'ディスコグラフィーとリンク',
    latestRelease: '最新リリースのタイトル',
    streamingLink: 'ストリーミングリンク',
    contactTitle: '連絡先と予約',
    mgmtName: 'マネジメント名',
    mgmtEmail: 'マネジメントメール',
    bookingEmail: '予約メール',
    downloadPdf: 'PDFをダウンロード',
    shareEpk: 'EPKを共有',
    pressReleaseTitle: '最新のプレスリリース',
    pressReleasePlaceholder: 'プレスリリースを貼り付けるか、AIで生成してください...',
    generateAI: 'AIで生成',
    generating: '生成中...',
    aiPromptTitle: 'AIコンテンツジェネレーター',
    artistName: 'アーティスト名',
    genre: 'ジャンル / スタイル',
    highlights: 'ハイライト / 実績',
    tone: 'トーン',
    style: 'スタイル / フォーマット',
    variationFocus: 'バリエーションの焦点',
    focusMilestones: 'キャリアの節目',
    focusGenre: 'ジャンル / アーティストのアイデンティティ',
    focusPersonal: '個人的なストーリー',
    selectVariation: 'バリエーションを選択',
    releaseTitle: 'リリースタイトル',
    releaseDate: 'リリース日',
    generate: '生成'
  }
};

export function PressKitModule({ lang = 'en', aiPreferences }: { lang?: LanguageCode, aiPreferences?: AIPreferences }) {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  
  // Content State
  const [bio, setBio] = useState('');
  const [pressRelease, setPressRelease] = useState('');
  
  // AI Generator State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatorType, setGeneratorType] = useState<'bio' | 'press' | null>(null);
  const [genPrompt, setGenPrompt] = useState({
    artistName: '',
    genre: '',
    highlights: '',
    tone: 'Professional',
    style: 'Standard',
    variationFocus: 'Milestones',
    releaseTitle: '',
    releaseDate: ''
  });
  const [variations, setVariations] = useState<string[]>([]);
  const [showVariations, setShowVariations] = useState(false);

  const currentLang = lang;
  const t = TRANSLATIONS[currentLang];
  const currentDir = LANGUAGES.find(l => l.code === currentLang)?.dir || 'ltr';
  const alignClass = currentDir === 'rtl' ? 'text-right' : 'text-left';

  const handlePhotoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPhoto(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPhoto(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!generatorType) return;
    
    setIsGenerating(true);
    try {
      let prompt = '';
      const styleInstruction = genPrompt.style !== 'Standard' ? ` Format/Style: ${genPrompt.style}.` : '';
      const toneInstruction = aiPreferences?.bioTone ? ` Global Tone Preference: ${aiPreferences.bioTone}.` : '';

      if (generatorType === 'bio') {
        prompt = `Write 3 distinct variations of a ${genPrompt.tone} artist biography for ${genPrompt.artistName || 'an artist'}, a ${genPrompt.genre} musician.
        Focus heavily on: ${genPrompt.variationFocus} (Milestones, Genre Identity, or Personal Story).
        Key highlights: ${genPrompt.highlights}. 
        ${styleInstruction}${toneInstruction}
        Keep each variation engaging, professional, and under 300 words. 
        Language: ${LANGUAGES.find(l => l.code === currentLang)?.label || 'English'}.
        
        IMPORTANT: Return ONLY a valid JSON array of strings, like this: ["Variation 1 text...", "Variation 2 text...", "Variation 3 text..."]. Do not include markdown formatting or code blocks.`;
      } else {
        prompt = `Write a professional press release for ${genPrompt.artistName || 'an artist'}'s new release titled "${genPrompt.releaseTitle}". 
        Genre: ${genPrompt.genre}. Release Date: ${genPrompt.releaseDate}. 
        Key details and highlights: ${genPrompt.highlights}. 
        Tone: ${genPrompt.tone}.${styleInstruction}${toneInstruction} Language: ${LANGUAGES.find(l => l.code === currentLang)?.label || 'English'}.`;
      }

      const result = await apiPost('/api/ai/generate-text', { prompt });
      const text = result.text;
      
      if (generatorType === 'bio') {
        try {
          // Clean up potential markdown code blocks if the model ignores instructions
          const cleanText = text?.replace(/```json/g, '').replace(/```/g, '').trim() || '[]';
          const parsed = JSON.parse(cleanText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setVariations(parsed);
            setShowVariations(true);
            setIsGenerating(false);
            return; // Stop here to let user choose
          } else {
             setBio(text || '');
          }
        } catch (e) {
          console.warn("Failed to parse JSON variations, falling back to raw text", e);
          setBio(text || '');
        }
      } else {
        setPressRelease(text || '');
      }
      
      setGeneratorType(null); // Close modal on success
      setVariations([]);
      setShowVariations(false);
    } catch (error) {
      console.error("AI Generation Error:", error);
      // Ideally show a toast error here
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 relative" dir={currentDir}>
      {/* AI Generator Modal */}
      <AnimatePresence>
        {generatorType && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0B0E14] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setGeneratorType(null)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-turquoise/10 text-turquoise">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">{t.aiPromptTitle}</h3>
              </div>
              
              <div className="space-y-4">
                {showVariations ? (
                  <div className="space-y-4">
                    <h4 className="text-sm font-black italic uppercase tracking-widest text-white">{t.selectVariation}</h4>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                      {variations.map((variation, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            setBio(variation);
                            setGeneratorType(null);
                            setVariations([]);
                            setShowVariations(false);
                          }}
                          className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-turquoise/50 hover:bg-white/10 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-turquoise">Option {idx + 1}</span>
                            <Check className="w-4 h-4 text-turquoise opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-xs text-white/80 line-clamp-4">{variation}</p>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => {
                        setVariations([]);
                        setShowVariations(false);
                      }}
                      className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-black italic uppercase tracking-widest hover:bg-white/10 transition-all text-xs"
                    >
                      Back to Settings
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black italic uppercase tracking-widest text-white/40">{t.artistName}</label>
                  <input 
                    type="text" 
                    value={genPrompt.artistName}
                    onChange={(e) => setGenPrompt({...genPrompt, artistName: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-turquoise focus:outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black italic uppercase tracking-widest text-white/40">{t.genre}</label>
                    <input 
                      type="text" 
                      value={genPrompt.genre}
                      onChange={(e) => setGenPrompt({...genPrompt, genre: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-turquoise focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black italic uppercase tracking-widest text-white/40">{t.tone}</label>
                    <select 
                      value={genPrompt.tone}
                      onChange={(e) => setGenPrompt({...genPrompt, tone: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-turquoise focus:outline-none appearance-none"
                    >
                      <option value="Professional">Professional</option>
                      <option value="Edgy">Edgy / Underground</option>
                      <option value="Emotional">Emotional / Storytelling</option>
                      <option value="Hype">Hype / Energetic</option>
                      <option value="Minimalist">Minimalist / Clean</option>
                      <option value="Avant-Garde">Avant-Garde / Experimental</option>
                      <option value="Humorous">Humorous / Witty</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black italic uppercase tracking-widest text-white/40">{t.style}</label>
                    <select 
                      value={genPrompt.style}
                      onChange={(e) => setGenPrompt({...genPrompt, style: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-turquoise focus:outline-none appearance-none"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Narrative">Narrative (Story-driven)</option>
                      <option value="Bullet Points">Bullet Points (Quick facts)</option>
                      <option value="Interview">Interview Style (Q&A)</option>
                      <option value="Review">Review Style (Third-party)</option>
                    </select>
                  </div>

                  {generatorType === 'bio' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black italic uppercase tracking-widest text-white/40">{t.variationFocus}</label>
                      <select 
                        value={genPrompt.variationFocus}
                        onChange={(e) => setGenPrompt({...genPrompt, variationFocus: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-turquoise focus:outline-none appearance-none"
                      >
                        <option value="Milestones">{t.focusMilestones}</option>
                        <option value="Genre">{t.focusGenre}</option>
                        <option value="Personal">{t.focusPersonal}</option>
                      </select>
                    </div>
                  )}
                </div>

                {generatorType === 'press' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black italic uppercase tracking-widest text-white/40">{t.releaseTitle}</label>
                      <input 
                        type="text" 
                        value={genPrompt.releaseTitle}
                        onChange={(e) => setGenPrompt({...genPrompt, releaseTitle: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-turquoise focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black italic uppercase tracking-widest text-white/40">{t.releaseDate}</label>
                      <input 
                        type="text" 
                        value={genPrompt.releaseDate}
                        onChange={(e) => setGenPrompt({...genPrompt, releaseDate: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-turquoise focus:outline-none"
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black italic uppercase tracking-widest text-white/40">{t.highlights}</label>
                  <textarea 
                    value={genPrompt.highlights}
                    onChange={(e) => setGenPrompt({...genPrompt, highlights: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-turquoise focus:outline-none h-24 resize-none"
                    placeholder="Awards, notable venues, collaborations, inspiration..."
                  />
                </div>
                </>
                )}
              </div>
              
              {!showVariations && (
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 rounded-xl bg-turquoise text-black font-black italic uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.generating}
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    {t.generate}
                  </>
                )}
              </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Language Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-neon ring-1 ring-purple-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">{t.title}</h2>
            <p className="text-[10px] font-black italic uppercase tracking-[0.4em] text-white/30 mt-1">{t.subtitle}</p>
          </div>
        </div>

        <div className="relative">
          {/* Language selector removed - handled by Header */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Bio Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className={`flex items-center justify-between ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-3 ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-px bg-turquoise/50" />
                <h3 className="text-lg font-black italic uppercase tracking-widest text-white">{t.bioTitle}</h3>
              </div>
              <button 
                onClick={() => setGeneratorType('bio')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-turquoise/10 text-turquoise hover:bg-turquoise/20 transition-colors text-[10px] font-black italic uppercase tracking-widest border border-turquoise/20"
              >
                <Sparkles className="w-3 h-3" />
                {t.generateAI}
              </button>
            </div>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className={`w-full h-64 bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-white placeholder:text-white/20 focus:border-turquoise/50 focus:ring-1 focus:ring-turquoise/50 focus:outline-none transition-all resize-none leading-relaxed ${alignClass}`}
              placeholder={t.bioPlaceholder}
            />
          </motion.section>

          {/* Press Release Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-4"
          >
            <div className={`flex items-center justify-between ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-3 ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-px bg-pink-500/50" />
                <h3 className="text-lg font-black italic uppercase tracking-widest text-white">{t.pressReleaseTitle}</h3>
              </div>
              <button 
                onClick={() => setGeneratorType('press')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-500 hover:bg-pink-500/20 transition-colors text-[10px] font-black italic uppercase tracking-widest border border-pink-500/20"
              >
                <Sparkles className="w-3 h-3" />
                {t.generateAI}
              </button>
            </div>
            <textarea 
              value={pressRelease}
              onChange={(e) => setPressRelease(e.target.value)}
              className={`w-full h-64 bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-white placeholder:text-white/20 focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 focus:outline-none transition-all resize-none leading-relaxed ${alignClass}`}
              placeholder={t.pressReleasePlaceholder}
            />
          </motion.section>

          {/* Discography Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className={`flex items-center gap-3 ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
              <div className="w-8 h-px bg-purple-neon/50" />
              <h3 className="text-lg font-black italic uppercase tracking-widest text-white">{t.discoTitle}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={`block text-[10px] font-black italic uppercase tracking-widest text-white/40 ${alignClass}`}>
                  {t.latestRelease}
                </label>
                <div className="relative group">
                  <Music className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-purple-neon transition-colors ${currentDir === 'rtl' ? 'right-4' : 'left-4'}`} />
                  <input 
                    type="text"
                    className={`w-full bg-white/[0.02] border border-white/10 rounded-xl py-4 ${currentDir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-white focus:border-purple-neon/50 focus:outline-none transition-all text-sm`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`block text-[10px] font-black italic uppercase tracking-widest text-white/40 ${alignClass}`}>
                  {t.streamingLink}
                </label>
                <div className="relative group">
                  <LinkIcon className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-purple-neon transition-colors ${currentDir === 'rtl' ? 'right-4' : 'left-4'}`} />
                  <input 
                    type="url"
                    className={`w-full bg-white/[0.02] border border-white/10 rounded-xl py-4 ${currentDir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-white focus:border-purple-neon/50 focus:outline-none transition-all text-sm`}
                  />
                </div>
              </div>
            </div>
          </motion.section>

          {/* Contact Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <div className={`flex items-center gap-3 ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}>
              <div className="w-8 h-px bg-white/30" />
              <h3 className="text-lg font-black italic uppercase tracking-widest text-white">{t.contactTitle}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={`block text-[10px] font-black italic uppercase tracking-widest text-white/40 ${alignClass}`}>
                  {t.mgmtName}
                </label>
                <input 
                  type="text"
                  className={`w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-white focus:border-white/30 focus:outline-none transition-all text-sm ${alignClass}`}
                />
              </div>
              <div className="space-y-2">
                <label className={`block text-[10px] font-black italic uppercase tracking-widest text-white/40 ${alignClass}`}>
                  {t.mgmtEmail}
                </label>
                <div className="relative group">
                  <Mail className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white transition-colors ${currentDir === 'rtl' ? 'right-4' : 'left-4'}`} />
                  <input 
                    type="email"
                    className={`w-full bg-white/[0.02] border border-white/10 rounded-xl py-4 ${currentDir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-white focus:border-white/30 focus:outline-none transition-all text-sm`}
                  />
                </div>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Sidebar Column (Media & Actions) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Media Upload */}
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <h3 className={`text-sm font-black italic uppercase tracking-widest text-white/60 ${alignClass}`}>{t.mediaTitle}</h3>
            
            <div 
              className="relative aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-turquoise/30 transition-all group overflow-hidden"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handlePhotoDrop}
            >
              {photo ? (
                <div className="relative w-full h-full">
                  <img src={photo} alt="Artist Official" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setPhoto(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors"
                  >
                    <span className="sr-only">Remove</span>
                    ×
                  </button>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-white/40 group-hover:text-turquoise" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wide text-white/60 mb-2">{t.dropZone}</p>
                  <label className="cursor-pointer">
                    <span className="text-[10px] font-black italic uppercase tracking-widest text-turquoise hover:underline">{t.orBrowse}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoSelect} />
                  </label>
                </div>
              )}
            </div>
          </motion.section>

          {/* Actions */}
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4 pt-4 border-t border-white/10"
          >
            <button className="w-full py-4 rounded-xl bg-white text-black font-black italic uppercase tracking-widest text-xs hover:bg-turquoise transition-colors flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              {t.downloadPdf}
            </button>
            <button className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-black italic uppercase tracking-widest text-xs hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
              <Share2 className="w-4 h-4" />
              {t.shareEpk}
            </button>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
