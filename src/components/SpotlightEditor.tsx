import React, { useState, useEffect, useRef } from 'react';
import { apiGet, apiPost } from '../lib/api-client';
import { storage, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Link as LinkIcon, 
  Instagram, 
  Youtube, 
  Music, 
  Globe, 
  Check, 
  X, 
  Smartphone, 
  Layout, 
  Palette,
  Share2,
  ExternalLink,
  Lock,
  Upload,
  Image as ImageIcon,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Save,
  Eye,
  Copy,
  Loader2
} from 'lucide-react';

interface Asset {
  id: number;
  type: 'image' | 'video';
  title: string;
  data: string; // base64 or url
}

interface SocialLink {
  id: string;
  platform: 'spotify' | 'youtube' | 'soundcloud' | 'instagram' | 'apple' | 'tiktok' | 'custom';
  url: string;
  title?: string;
}

interface SpotlightData {
  slug: string;
  profileName: string;
  bio: string;
  socialMedia: SocialLink[];
  selectedAssets: number[]; // IDs for background carousel
  profileImage: string | null; // Base64 or URL
  theme: 'glass' | 'nightclub' | 'minimal';
  buttonStyle: 'rounded' | 'square';
  buttonColor: string;
  backgroundMotion: boolean;
}

const PLATFORMS = {
  spotify: { icon: Music, color: 'text-green-500', label: 'Spotify' },
  youtube: { icon: Youtube, color: 'text-red-500', label: 'YouTube' },
  instagram: { icon: Instagram, color: 'text-pink-500', label: 'Instagram' },
  soundcloud: { icon: Music, color: 'text-orange-500', label: 'SoundCloud' },
  apple: { icon: Music, color: 'text-gray-400', label: 'Apple Music' },
  tiktok: { icon: Music, color: 'text-cyan-400', label: 'TikTok' },
  custom: { icon: LinkIcon, color: 'text-white', label: 'Custom Link' }
};

export function SpotlightEditor({ user, t, onBack, generatedAssets }: { user: any, t: (key: string) => string, onBack: () => void, generatedAssets?: any }) {
  const publicAppUrl = (import.meta.env.VITE_PUBLIC_APP_URL || '').replace(/\/$/, '');
  const baseOrigin = publicAppUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const shortBase = baseOrigin.replace(/^https?:\/\//, '');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [initialSlug, setInitialSlug] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
  const [assetType, setAssetType] = useState<'profile' | 'background'>('profile');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<SpotlightData>({
    slug: '',
    profileName: user?.displayName || '',
    bio: '',
    socialMedia: [],
    selectedAssets: [],
    profileImage: user?.avatar || null,
    theme: 'glass',
    buttonStyle: 'rounded',
    buttonColor: '#00FFFF',
    backgroundMotion: true
  });

  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Fetch user's existing spotlight data
    apiGet('/api/spotlight/me')
      
      .then(data => {
        if (data) {
          const parsedSocial = typeof data.socialMedia === 'string' ? JSON.parse(data.socialMedia) : data.socialMedia;
          const parsedAssets = typeof data.selectedAssets === 'string' ? JSON.parse(data.selectedAssets) : data.selectedAssets;

          setFormData({
            ...data,
            profileName: data.profileName || '',
            slug: data.slug || '',
            bio: data.bio || '',
            socialMedia: Array.isArray(parsedSocial) ? parsedSocial : [],
            selectedAssets: Array.isArray(parsedAssets) ? parsedAssets : [],
            profileImage: data.profileImage || user?.avatar || null
          });
          setInitialSlug(data.slug || '');
        }
      });

    // Fetch user's assets
    apiGet('/api/library/list')
      
      .then(data => {
        let allAssets = Array.isArray(data) ? data : [];
        if (generatedAssets?.artwork) {
          const generated = Object.entries(generatedAssets.artwork).map(([format, url], index) => ({
            id: Date.now() + index,
            type: 'image' as const,
            title: `Generated ${format}`,
            data: url as string
          }));
          allAssets = [...generated, ...allAssets];
        }
        setAssets(allAssets);
      });
  }, [generatedAssets]);

  // Carousel Auto-Play
  useEffect(() => {
    if (formData?.selectedAssets && Array.isArray(formData.selectedAssets) && formData.selectedAssets.length > 1) {
      const interval = setInterval(() => {
        setCarouselIndex(prev => (prev + 1) % formData.selectedAssets.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [formData?.selectedAssets]);

  useEffect(() => {
    if (formData.profileName && !formData.slug) {
      const generatedSlug = formData.profileName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
      checkSlug(generatedSlug);
    }
  }, [formData.profileName]);

  const checkSlug = async (slug: string) => {
    if (!slug) return;
    if (slug === initialSlug) {
      setSlugAvailable(true);
      return;
    }
    const data = await apiGet(`/api/spotlight/check-slug?slug=${slug}`);
    // data already parsed
    setSlugAvailable(data.available);
  };

  const handleSave = async () => {
    setLoading(true);
    setErrorMsg('');
    
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/spotlight/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.status === 402) {
        setShowRefillModal(true);
        return;
      }
      
      if (res.status === 403) {
        setErrorMsg(data.error);
        return;
      }

      if (data.success) {
        if (initialSlug) {
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        } else {
          setShowSuccessModal(true);
        }
      } else if (data.error) {
        setErrorMsg(data.error);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'background') => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      try {
        const storageRef = ref(storage, `users/${auth.currentUser?.uid}/assets/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        if (type === 'profile') {
          setFormData(prev => ({ ...prev, profileImage: url }));
        } else {
          // Upload background to library to get an ID
          try {
            const libToken = await auth.currentUser?.getIdToken();
            const res = await fetch("/api/library/save", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...(libToken ? { 'Authorization': `Bearer ${libToken}` } : {}) },
              body: JSON.stringify({ 
                type: 'image', 
                title: file.name || 'Background Upload', 
                artist: formData.profileName || 'Artist', 
                data: url, 
                cost: 0 
              })
            });
            
            if (res.ok) {
              const saveData = await res.json();
              const libData = await apiGet('/api/library/list');
              setAssets(libData);

              const newAssetId = saveData.asset?.id || libData.find((a: Asset) => a.title === (file.name || 'Background Upload'))?.id;
              
              if (newAssetId) {
                setFormData(prev => ({ 
                  ...prev, 
                  selectedAssets: [...prev.selectedAssets, newAssetId] 
                }));
              }
            }
          } catch (err) {
            console.error("Failed to upload background", err);
            // Fallback: add locally with temp ID (might not persist correctly on backend if it expects real IDs)
            const tempId = Date.now();
            const newAsset: Asset = {
              id: tempId,
              type: 'image',
              title: file.name || 'Uploaded Image',
              data: url
            };
            setAssets(prev => [newAsset, ...prev]);
            setFormData(prev => ({ ...prev, selectedAssets: [...prev.selectedAssets, tempId] }));
          }
        }
      } catch (err) {
        console.error("Failed to upload file to storage", err);
        setErrorMsg("Failed to upload file.");
      } finally {
        setLoading(false);
      }
    }
  };

  const detectPlatform = (url: string): SocialLink['platform'] => {
    if (url.includes('spotify.com')) return 'spotify';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('soundcloud.com')) return 'soundcloud';
    if (url.includes('music.apple.com')) return 'apple';
    if (url.includes('tiktok.com')) return 'tiktok';
    return 'custom';
  };

  const addLink = () => {
    setFormData(prev => ({
      ...prev,
      socialMedia: [...prev.socialMedia, { id: Date.now().toString(), platform: 'custom', url: '', title: '' }]
    }));
  };

  const updateLink = (index: number, field: keyof SocialLink, value: string) => {
    const newLinks = [...formData.socialMedia];
    newLinks[index] = { ...newLinks[index], [field]: value };
    
    if (field === 'url') {
      newLinks[index].platform = detectPlatform(value);
    }
    
    setFormData({ ...formData, socialMedia: newLinks });
  };

  const removeLink = (index: number) => {
    const newLinks = formData.socialMedia.filter((_, i) => i !== index);
    setFormData({ ...formData, socialMedia: newLinks });
  };

  const toggleAsset = (id: number) => {
    setFormData(prev => {
      const selected = prev.selectedAssets.includes(id)
        ? prev.selectedAssets.filter(a => a !== id)
        : [...prev.selectedAssets, id];
      return { ...prev, selectedAssets: selected };
    });
  };

  return (
    <div ref={containerRef} className="flex flex-col lg:grid lg:grid-cols-2 gap-8 h-full lg:overflow-hidden overflow-y-auto custom-scrollbar pb-32 lg:pb-0 relative">
      {/* Editor Column */}
      <div className="space-y-8 lg:overflow-y-auto lg:pr-4 custom-scrollbar relative">
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0B0E14]/95 backdrop-blur-xl p-4 border-t border-white/10 flex items-center justify-between lg:sticky lg:top-0 lg:border-t-0 lg:border-b lg:border-white/5 lg:mb-6 lg:p-0 lg:py-4 lg:bg-[#0B0E14]/95">
          <div className="flex items-center gap-2">
            <button 
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-white/5 rounded-lg transition-colors text-white/60 hover:text-white hidden lg:block"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl lg:text-3xl font-black italic uppercase tracking-tighter text-white flex items-center gap-4">
              <div className="p-2 bg-turquoise/10 rounded-xl">
                <Globe className="w-6 h-6 text-turquoise" />
              </div>
              <span className="hidden sm:inline">{t('smart_link_studio')}</span>
              <span className="sm:hidden">{t('studio')}</span>
            </h2>
          </div>
          <div className="flex gap-3">
             <button 
              onClick={onBack}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black italic uppercase tracking-widest text-[10px] transition-all border border-white/5"
            >
              {t('cancel')}
            </button>
            <button 
              onClick={handleSave}
              disabled={loading || user.uid === 'guest'}
              className={`px-8 py-2.5 rounded-xl font-black italic uppercase tracking-widest text-[10px] transition-all flex items-center gap-3 shadow-lg ${
                user.uid === 'guest' 
                  ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5' 
                  : 'bg-turquoise text-black hover:scale-105 shadow-turquoise/20'
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? t('saving') : (initialSlug ? 'UPDATE LINK' : t('save_publish'))}
            </button>
          </div>
        </div>

        {/* Editor Sections */}
        <div className="space-y-10 pb-10">
          
          {/* Section 1: Identity & URL */}
          <section className="space-y-8">
            <div className="flex items-center gap-4 border-b border-white/5 pb-4">
              <div className="p-3 rounded-2xl bg-turquoise/10 text-turquoise ring-1 ring-turquoise/20">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">{t('identity_section')}</h3>
                <p className="text-[9px] font-black italic uppercase tracking-[0.4em] text-white/20">Slug & Artist Name</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Custom URL Slug */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">{t('custom_url_slug')}</label>
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-xs font-mono">{shortBase || 'musaic-ai.app'}/</span>     
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={formData.slug || ''}
                      onChange={e => {
                        setFormData({ ...formData, slug: e.target.value });
                        checkSlug(e.target.value);
                      }}
                      className={`w-full bg-white/5 border rounded-xl px-4 py-4 text-base text-white focus:outline-none transition-colors ${
                        slugAvailable === true ? 'border-green-500/50' : slugAvailable === false ? 'border-red-500/50' : 'border-white/10'
                      }`}
                      placeholder="artist-name"
                    />
                    {slugAvailable === true && <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />}
                    {slugAvailable === false && <X className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />}
                  </div>
                </div>
              </div>

              {/* Artist Name */}
              <div className="space-y-4">
                <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">{t('artist_name_label')}</label>
                <input
                  type="text"
                  value={formData.profileName || ''}
                  onChange={e => setFormData({ ...formData, profileName: e.target.value })}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-lg font-black italic uppercase tracking-tighter text-white focus:border-turquoise/40 focus:ring-8 focus:ring-turquoise/5 focus:outline-none transition-all placeholder:text-white/5"
                  placeholder={t('placeholder_artist_name')}
                />
              </div>

              {/* Short Bio */}
              <div className="space-y-4">
                <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">{t('short_bio_label')}</label>
                <textarea
                  value={formData.bio || ''}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-base font-medium text-white/80 focus:border-turquoise/40 focus:ring-8 focus:ring-turquoise/5 focus:outline-none transition-all h-40 resize-none placeholder:text-white/5"
                  placeholder={t('placeholder_describe_career')}
                />
              </div>
            </div>
          </section>

          {/* Section 2: Visuals */}
          <section className="space-y-8">
            <div className="flex items-center gap-4 border-b border-white/5 pb-4">
              <div className="p-3 rounded-2xl bg-purple-neon/10 text-purple-neon ring-1 ring-purple-neon/20">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">{t('visuals_section')}</h3>
                <p className="text-[9px] font-black italic uppercase tracking-[0.4em] text-white/20">Artwork & Background</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-6 border-b border-white/5 pb-4">
                <button 
                  onClick={() => setAssetType('profile')}
                  className={`text-[11px] font-black italic uppercase tracking-[0.3em] transition-all ${assetType === 'profile' ? 'text-turquoise' : 'text-white/20 hover:text-white'}`}
                >
                  {t('profile_image')}
                </button>
                <button 
                  onClick={() => setAssetType('background')}
                  className={`text-[11px] font-black italic uppercase tracking-[0.3em] transition-all ${assetType === 'background' ? 'text-turquoise' : 'text-white/20 hover:text-white'}`}
                >
                  {t('background_images')}
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <button 
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 py-5 rounded-2xl text-[10px] font-black italic uppercase tracking-widest transition-all border ${activeTab === 'upload' ? 'bg-white/10 text-white border-white/20 shadow-lg' : 'text-white/20 border-transparent hover:bg-white/5'}`}
                >
                  {t('upload_image')}
                </button>
                <button 
                  onClick={() => setActiveTab('library')}
                  className={`flex-1 py-5 rounded-2xl text-[10px] font-black italic uppercase tracking-widest transition-all border ${activeTab === 'library' ? 'bg-white/10 text-white border-white/20 shadow-lg' : 'text-white/20 border-transparent hover:bg-white/5'}`}
                >
                  {t('select_from_history')}
                </button>
              </div>

              {activeTab === 'upload' ? (
                <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-turquoise/50 transition-colors group cursor-pointer relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, assetType)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-white/40 group-hover:text-turquoise" />
                  </div>
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-wide">{t('drag_drop_images')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto custom-scrollbar">
                  {assets.filter(a => a.type === 'image').length > 0 ? (
                    assets.filter(a => a.type === 'image').map(asset => (
                      <div 
                        key={asset.id}
                        onClick={() => {
                          if (assetType === 'profile') {
                            setFormData(prev => ({ ...prev, profileImage: asset.data }));
                          } else {
                            toggleAsset(asset.id);
                          }
                        }}
                        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                          (assetType === 'profile' && formData.profileImage === asset.data) || (assetType === 'background' && formData.selectedAssets.includes(asset.id))
                            ? 'border-turquoise opacity-100' 
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={asset.data} className="w-full h-full object-cover" />
                        {((assetType === 'profile' && formData.profileImage === asset.data) || (assetType === 'background' && formData.selectedAssets.includes(asset.id))) && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-turquoise rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-navy" />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 py-8 text-center text-white/40 text-[10px] uppercase tracking-widest">
                      {t('no_assets_library')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Section 2.5: Custom Design */}
          <section className="space-y-8">
            <div className="flex items-center gap-4 border-b border-white/5 pb-4">
              <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-400 ring-1 ring-pink-500/20">
                <Layout className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">{t('custom_design_section')}</h3>
                <p className="text-[9px] font-black italic uppercase tracking-[0.4em] text-white/20">Themes & Styles</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Theme Selector */}
              <div className="space-y-4">
                <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">{t('theme_label')}</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'glass', label: t('theme_glass') },
                    { id: 'nightclub', label: t('theme_nightclub') },
                    { id: 'minimal', label: t('theme_minimal') }
                  ].map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => setFormData(prev => ({ ...prev, theme: theme.id as any }))}
                      className={`py-4 px-2 rounded-2xl text-[10px] font-black italic uppercase tracking-widest border transition-all ${
                        formData.theme === theme.id 
                          ? 'bg-white/10 border-turquoise text-white shadow-lg shadow-turquoise/5' 
                          : 'bg-white/[0.02] border-white/5 text-white/20 hover:bg-white/5'
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Button Style & Motion */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">{t('button_style_label')}</label>
                  <div className="flex bg-white/[0.02] border border-white/5 p-1.5 rounded-2xl">
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, buttonStyle: 'rounded' }))}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black italic uppercase tracking-widest transition-all ${
                        formData.buttonStyle === 'rounded' ? 'bg-white/10 text-white shadow-xl' : 'text-white/20 hover:text-white'
                      }`}
                    >
                      {t('style_rounded')}
                    </button>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, buttonStyle: 'square' }))}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black italic uppercase tracking-widest transition-all ${
                        formData.buttonStyle === 'square' ? 'bg-white/10 text-white shadow-xl' : 'text-white/20 hover:text-white'
                      }`}
                    >
                      {t('style_square')}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black italic uppercase tracking-[0.3em] text-white/30 ml-1">{t('background_motion_label')}</label>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, backgroundMotion: !prev.backgroundMotion }))}
                    className={`w-full py-4 rounded-2xl text-[10px] font-black italic uppercase tracking-widest border transition-all flex items-center justify-center gap-3 ${
                      formData.backgroundMotion
                        ? 'bg-turquoise/10 border-turquoise text-turquoise' 
                        : 'bg-white/[0.02] border-white/5 text-white/20 hover:bg-white/5'
                    }`}
                  >
                    {formData.backgroundMotion ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {t('motion_carousel')}
                  </button>
                </div>
              </div>

              {/* Button Color */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">{t('button_color_label')}</label>
                <div className="flex gap-3">
                  {['#00FFFF', '#FFD700', '#FFFFFF', '#FF0000', '#00FF00'].map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData(prev => ({ ...prev, buttonColor: color }))}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        formData.buttonColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <div className="relative group">
                    <input
                      type="color"
                      value={formData.buttonColor}
                      onChange={e => setFormData(prev => ({ ...prev, buttonColor: e.target.value }))}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5 group-hover:border-white/40 transition-colors">
                      <Palette className="w-4 h-4 text-white/60" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Social Links */}
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">{t('social_links_label')}</h3>
                  <p className="text-[9px] font-black italic uppercase tracking-[0.4em] text-white/20">Connect Your Platforms</p>
                </div>
              </div>
              <button 
                onClick={addLink}
                className="flex items-center gap-3 px-5 py-2.5 bg-turquoise text-black rounded-xl text-[10px] font-black italic uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-turquoise/20"
              >
                <Plus className="w-4 h-4" /> {t('add_social_link')}
              </button>
            </div>

            <div className="space-y-4">
              {formData.socialMedia.map((link, idx) => {
                const PlatformIcon = PLATFORMS[link.platform]?.icon || LinkIcon;
                return (
                  <div key={link.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4 group hover:border-white/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center ${PLATFORMS[link.platform]?.color || 'text-white'}`}>
                        <PlatformIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          value={link.url}
                          onChange={e => updateLink(idx, 'url', e.target.value)}
                          placeholder={t('link_url')}
                          className="w-full bg-transparent border-b border-white/10 py-2 text-base text-white focus:border-turquoise focus:outline-none transition-colors placeholder:text-white/20"
                        />
                        {link.platform === 'custom' && (
                          <input
                            type="text"
                            value={link.title || ''}
                            onChange={e => updateLink(idx, 'title', e.target.value)}
                            placeholder={t('link_title')}
                            className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-white/60 focus:border-turquoise focus:outline-none transition-colors placeholder:text-white/20"
                          />
                        )}
                      </div>
                      <button 
                        onClick={() => removeLink(idx)}
                        className="p-3 text-white/20 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {formData.socialMedia?.length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-xl">
                  <p className="text-xs font-bold text-white/20 uppercase tracking-widest">{t('no_links_added')}</p>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>

      {/* Preview Column */}
      <div className="relative flex items-center justify-center bg-navy-dark/50 rounded-[40px] border border-white/5 p-8 lg:sticky lg:top-4">
        <div className="mockup-phone border-gray-800 shadow-2xl transform scale-[0.85] sm:scale-100 origin-top lg:origin-center">
          <div className="camera"></div> 
          <div className="display">
            <div className={`artboard artboard-demo phone-1 overflow-hidden relative transition-colors duration-500 ${
              formData.theme === 'minimal' ? 'bg-white' : 'bg-navy'
            }`}>
              
              {/* Background Carousel */}
              <div className="absolute inset-0 z-0">
                {formData.theme !== 'minimal' && (
                  <AnimatePresence mode="wait">
                    {formData.selectedAssets?.length > 0 ? (
                      <motion.img
                        key={formData.backgroundMotion ? formData.selectedAssets[carouselIndex] : formData.selectedAssets[0]}
                        src={assets.find(a => a.id === (formData.backgroundMotion ? formData.selectedAssets[carouselIndex] : formData.selectedAssets[0]))?.data}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: formData.theme === 'nightclub' ? 0.6 : 0.4, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-turquoise/20 to-navy" />
                    )}
                  </AnimatePresence>
                )}
                {formData.theme !== 'minimal' && (
                  <div className={`absolute inset-0 bg-gradient-to-b ${
                    formData.theme === 'nightclub' 
                      ? 'from-purple-900/50 via-black/60 to-black' 
                      : 'from-transparent via-navy/80 to-navy'
                  }`} />
                )}
              </div>

              {/* Mobile Preview Content */}
              <div className={`relative z-10 w-full h-full overflow-y-auto custom-scrollbar p-6 flex flex-col items-center pt-12 space-y-6 ${
                formData.theme === 'minimal' ? 'text-black' : 'text-white'
              }`}>
                
                {/* Profile Image */}
                <div className={`w-28 h-28 rounded-full p-1 shadow-xl ${
                  formData.theme === 'nightclub' ? 'bg-gradient-to-br from-pink-500 to-cyan-500' : 
                  formData.theme === 'minimal' ? 'bg-black' : 
                  'bg-gradient-to-br from-turquoise to-purple-600'
                }`}>
                  <div className={`w-full h-full rounded-full overflow-hidden ${
                    formData.theme === 'minimal' ? 'bg-white border-4 border-white' : 'bg-black border-4 border-navy'
                  }`}>
                    {formData.profileImage ? (
                      <img src={formData.profileImage} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${
                        formData.theme === 'minimal' ? 'bg-gray-100' : 'bg-white/10'
                      }`}>
                        <ImageIcon className={`w-8 h-8 ${
                          formData.theme === 'minimal' ? 'text-gray-300' : 'text-white/20'
                        }`} />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Bio */}
                <div className="text-center space-y-2 w-full">
                  <h3 className={`text-2xl font-black tracking-tight drop-shadow-lg ${
                    formData.theme === 'minimal' ? 'text-black' : 
                    formData.theme === 'nightclub' ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-500' : 
                    'text-white'
                  }`}>
                    {formData.profileName || t('artist_name')}
                  </h3>
                  <p className={`text-xs max-w-[240px] mx-auto leading-relaxed font-medium drop-shadow-md ${
                    formData.theme === 'minimal' ? 'text-gray-500' : 'text-white/80'
                  }`}>
                    {formData.bio || t('placeholder_describe_career')}
                  </p>
                </div>

                {/* Links */}
                <div className="w-full space-y-3 pt-4">
                  {formData.socialMedia.map((link, i) => {
                    const PlatformIcon = PLATFORMS[link.platform]?.icon || LinkIcon;
                    const label = link.title || PLATFORMS[link.platform]?.label || 'Link';
                    
                    return (
                      <motion.div
                        key={link.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`w-full p-1 transition-all cursor-pointer group backdrop-blur-sm border overflow-hidden ${
                          formData.buttonStyle === 'rounded' ? 'rounded-full' : 'rounded-none'
                        } ${
                          formData.theme === 'minimal' 
                            ? 'bg-white border-black text-black hover:bg-black hover:text-white' 
                            : formData.theme === 'nightclub'
                              ? 'bg-black/60 border-pink-500/50 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]'
                              : 'bg-gradient-to-r from-white/10 to-white/5 hover:from-turquoise/20 hover:to-purple-500/20 border-white/10'
                        }`}
                        style={{
                          borderColor: formData.theme === 'glass' ? formData.buttonColor : undefined
                        }}
                      >
                        <div className={`flex items-center gap-4 p-3 transition-all ${
                          formData.buttonStyle === 'rounded' ? 'rounded-full' : 'rounded-none'
                        } ${
                          formData.theme === 'minimal' ? '' : 'bg-navy/40 group-hover:bg-navy/20'
                        }`}>
                          <div 
                            className={`w-8 h-8 flex items-center justify-center ${
                              formData.buttonStyle === 'rounded' ? 'rounded-full' : 'rounded-sm'
                            } ${
                              formData.theme === 'minimal' ? 'bg-black text-white group-hover:bg-white group-hover:text-black' : 'bg-black/40'
                            }`}
                            style={{
                              color: formData.theme !== 'minimal' ? formData.buttonColor : undefined
                            }}
                          >
                            <PlatformIcon className="w-4 h-4" />
                          </div>
                          <span 
                            className="flex-1 text-xs font-bold uppercase tracking-widest text-left"
                            style={{
                              color: formData.theme !== 'minimal' ? formData.buttonColor : undefined
                            }}
                          >
                            {label}
                          </span>
                          <ExternalLink 
                            className="w-3 h-3 transition-colors" 
                            style={{
                              color: formData.theme !== 'minimal' ? formData.buttonColor : undefined
                            }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                <div className="mt-auto pt-12 pb-4">
                  <div className="flex items-center gap-2 opacity-30">
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${
                      formData.theme === 'minimal' ? 'bg-black text-white' : 'bg-turquoise/20 text-turquoise'
                    }`}>
                      <Music className="w-2 h-2" />
                    </div>
                    <p className={`text-[8px] uppercase tracking-[0.2em] ${
                      formData.theme === 'minimal' ? 'text-black' : 'text-white'
                    }`}>Musaic Smart Link</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-navy border border-white/10 rounded-3xl p-8 max-w-md w-full space-y-6 relative shadow-2xl shadow-turquoise/10"
            >
              <button onClick={() => setShowSuccessModal(false)} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
              
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto ring-1 ring-green-500/20">
                  <Check className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">CONGRATULATIONS</h3>
                  <p className="text-white/60 text-sm mt-2 font-medium">Your Smart Link is now live!</p>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 flex items-center gap-3 border border-white/5">
                <Globe className="w-5 h-5 text-turquoise shrink-0" />
                  <span className="text-white/40 text-xs font-mono">{shortBase || 'musaic-ai.app'}/</span> 
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => {
                  const url = `${baseOrigin}/s/${formData.slug}`;
              navigator.clipboard.writeText(url);
                  alert(t('link_copied'));
                }} className="flex items-center justify-center gap-2 py-3.5 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold uppercase text-xs tracking-widest transition-all border border-white/10">
                  <Copy className="w-4 h-4" /> {t('copy_link')}
                </button>
                <button onClick={onBack} className="flex items-center justify-center gap-2 py-3.5 bg-turquoise text-navy rounded-xl font-bold uppercase text-xs tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-turquoise/20">
                  <Layout className="w-4 h-4" /> SEE ANALYTICS
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Refill Tokens Modal */}
      <AnimatePresence>
        {showRefillModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-navy border border-gold/20 rounded-3xl p-8 max-w-md w-full space-y-6 relative shadow-2xl shadow-gold/10"
            >
              <button onClick={() => setShowRefillModal(false)} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
              
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-gold/10 text-gold flex items-center justify-center mx-auto ring-1 ring-gold/20">
                  <Lock className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Insufficient Tokens</h3>
                  <p className="text-white/60 text-sm mt-2 font-medium">You need 15 tokens to publish your Smart Link.</p>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => {
                    // Redirect to wallet or trigger checkout
                    // For now, just close and maybe show a message or redirect
                    setShowRefillModal(false);
                    // In a real app, this would open the wallet or stripe checkout
                    alert("Please top up your wallet in the dashboard.");
                  }}
                  className="w-full py-4 bg-gold text-navy rounded-xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all shadow-lg shadow-gold/20"
                >
                  Refill Tokens
                </button>
                <button 
                  onClick={() => setShowRefillModal(false)}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 font-black uppercase tracking-widest text-xs transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Modal */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-navy border border-red-500/20 rounded-3xl p-8 max-w-md w-full space-y-6 relative shadow-2xl shadow-red-500/10"
            >
              <button onClick={() => setErrorMsg('')} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
              
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto ring-1 ring-red-500/20">
                  <X className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Error</h3>
                  <p className="text-white/60 text-sm mt-2 font-medium">{errorMsg}</p>
                </div>
              </div>

              <button 
                onClick={() => setErrorMsg('')}
                className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl text-white font-black uppercase tracking-widest text-xs transition-all"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-navy px-6 py-3 rounded-xl shadow-xl flex items-center gap-3"
          >
            <Check className="w-5 h-5" />
            <span className="font-bold uppercase tracking-widest text-xs">Changes Saved Successfully</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
