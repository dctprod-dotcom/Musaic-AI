import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Instagram, Youtube, Globe, Share2, ExternalLink, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

interface Asset {
  id: number;
  type: 'image' | 'video';
  title: string;
  data: string;
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
  socialMedia: SocialLink[] | string; // Can be string from DB JSON
  selectedAssets: number[] | string; // Can be string from DB JSON
  theme: 'glass' | 'nightclub' | 'minimal';
  buttonStyle: 'rounded' | 'square';
  buttonColor: string;
  backgroundMotion: boolean;
  profileImage: string | null;
  assets?: Asset[]; // Joined from server
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

export function SpotlightPublic() {
  const { slug } = useParams();
  const [data, setData] = useState<SpotlightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    if (slug) {
      const fetchSpotlight = async () => {
        try {
          const docRef = doc(db, 'smartlinks', slug);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const spotlightData = docSnap.data() as any;
            // Parse JSON fields if they are strings
            const parsedSocial = typeof spotlightData.socialMedia === 'string' ? JSON.parse(spotlightData.socialMedia) : spotlightData.socialMedia;
            const parsedAssets = typeof spotlightData.selectedAssets === 'string' ? JSON.parse(spotlightData.selectedAssets) : spotlightData.selectedAssets;
            
            const parsedData = {
              ...spotlightData,
              socialMedia: Array.isArray(parsedSocial) ? parsedSocial : [],
              selectedAssets: Array.isArray(parsedAssets) ? parsedAssets : [],
              theme: spotlightData.theme || 'glass',
              buttonStyle: spotlightData.buttonStyle || 'rounded',
              buttonColor: spotlightData.buttonColor || '#00FFFF',
              backgroundMotion: spotlightData.backgroundMotion !== undefined ? !!spotlightData.backgroundMotion : true
            };
            setData(parsedData);
            
            // Track View
            updateDoc(docRef, { views: increment(1) }).catch(console.error);
          } else {
            console.error('No such document!');
          }
        } catch (err) {
          console.error("Error fetching spotlight:", err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchSpotlight();
    }
  }, [slug]);

  const handleSocialClick = (platform: string) => {
    // Optional: Track clicks
    console.log("Clicked", platform);
  };

  // Carousel Auto-Play
  useEffect(() => {
    if (data && Array.isArray(data.selectedAssets) && data.selectedAssets.length > 1 && data.backgroundMotion) {
      const interval = setInterval(() => {
        const assets = data.selectedAssets as any[];
        if (assets && assets.length > 0) {
          setCarouselIndex(prev => (prev + 1) % assets.length);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [data]);

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white"><div className="loading loading-spinner loading-lg text-turquoise"></div></div>;
  if (!data) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-black italic uppercase tracking-widest">Spotlight not found</div>;

  const socialLinks = Array.isArray(data.socialMedia) ? data.socialMedia : [];
  const selectedAssetIds = Array.isArray(data.selectedAssets) ? data.selectedAssets : [];
  const assets = data.assets || [];

  return (
    <div className={`min-h-screen w-full overflow-hidden relative transition-colors duration-500 ${
      data.theme === 'minimal' ? 'bg-white' : 'bg-[#050505]'
    }`}>
      
      {/* Background Carousel */}
      <div className="fixed inset-0 z-0">
        {data.theme !== 'minimal' && (
          <AnimatePresence mode="wait">
            {selectedAssetIds.length > 0 ? (
              <motion.img
                key={data.backgroundMotion ? selectedAssetIds[carouselIndex] : selectedAssetIds[0]}
                src={assets.find(a => a.id === (data.backgroundMotion ? selectedAssetIds[carouselIndex] : selectedAssetIds[0]))?.data}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: data.theme === 'nightclub' ? 0.6 : 0.4, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-turquoise/10 via-[#050505] to-[#050505]" />
            )}
          </AnimatePresence>
        )}
        {data.theme !== 'minimal' && (
          <div className={`absolute inset-0 bg-gradient-to-b ${
            data.theme === 'nightclub' 
              ? 'from-purple-neon/40 via-[#050505]/80 to-[#050505]' 
              : 'from-transparent via-[#050505]/80 to-[#050505]'
          }`} />
        )}
      </div>

      {/* Content */}
      <div className={`relative z-10 w-full min-h-screen overflow-y-auto custom-scrollbar p-6 flex flex-col items-center pt-12 space-y-8 max-w-md mx-auto ${
        data.theme === 'minimal' ? 'text-black' : 'text-white'
      }`}>
        
        {/* Profile Image */}
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`w-32 h-32 rounded-full p-1 shadow-[0_0_30px_rgba(0,255,255,0.2)] ${
            data.theme === 'nightclub' ? 'bg-gradient-to-br from-purple-neon to-turquoise' : 
            data.theme === 'minimal' ? 'bg-black' : 
            'bg-gradient-to-br from-turquoise to-purple-neon'
          }`}
        >
          <div className={`w-full h-full rounded-full overflow-hidden ${
            data.theme === 'minimal' ? 'bg-white border-4 border-white' : 'bg-black border-4 border-[#050505]'
          }`}>
            {data.profileImage ? (
              <img src={data.profileImage} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${
                data.theme === 'minimal' ? 'bg-gray-100' : 'bg-white/10'
              }`}>
                <ImageIcon className={`w-10 h-10 ${
                  data.theme === 'minimal' ? 'text-gray-300' : 'text-white/20'
                }`} />
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Bio */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-4 w-full px-4"
        >
          <h1 className={`text-4xl font-black italic uppercase tracking-tighter drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] ${
            data.theme === 'minimal' ? 'text-black' : 
            data.theme === 'nightclub' ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-neon to-turquoise' : 
            'text-white'
          }`}>
            {data.profileName}
          </h1>
          <p className={`text-[11px] max-w-[300px] mx-auto leading-relaxed font-black italic uppercase tracking-[0.2em] drop-shadow-md ${
            data.theme === 'minimal' ? 'text-gray-500' : 'text-white/60'
          }`}>
            {data.bio}
          </p>
        </motion.div>

        {/* Links */}
        <div className="w-full space-y-4 pt-4">
          {socialLinks.map((link, i) => {
            // @ts-ignore
            const PlatformIcon = PLATFORMS[link.platform]?.icon || LinkIcon;
            // @ts-ignore
            const label = link.title || PLATFORMS[link.platform]?.label || 'Link';
            
            return (
              <motion.a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleSocialClick(link.platform)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (i * 0.1) }}
                className={`block w-full p-1 transition-all cursor-pointer group backdrop-blur-sm border overflow-hidden ${
                  data.buttonStyle === 'rounded' ? 'rounded-full' : 'rounded-none'
                } ${
                  data.theme === 'minimal' 
                    ? 'bg-white border-black text-black hover:bg-black hover:text-white' 
                    : data.theme === 'nightclub'
                      ? 'bg-black/60 border-pink-500/50 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]'
                      : 'bg-gradient-to-r from-white/10 to-white/5 hover:from-turquoise/20 hover:to-purple-500/20 border-white/10'
                }`}
                style={{
                  borderColor: data.theme === 'glass' ? data.buttonColor : undefined
                }}
              >
                <div className={`flex items-center gap-4 p-4 transition-all ${
                  data.buttonStyle === 'rounded' ? 'rounded-full' : 'rounded-none'
                } ${
                  data.theme === 'minimal' ? '' : 'bg-[#050505]/40 group-hover:bg-[#050505]/20'
                }`}>
                  <div 
                    className={`w-10 h-10 flex items-center justify-center ${
                      data.buttonStyle === 'rounded' ? 'rounded-full' : 'rounded-xl'
                    } ${
                      data.theme === 'minimal' ? 'bg-black text-white group-hover:bg-white group-hover:text-black' : 'bg-black/40'
                    }`}
                    style={{
                      color: data.theme !== 'minimal' ? data.buttonColor : undefined
                    }}
                  >
                    <PlatformIcon className="w-5 h-5" />
                  </div>
                  <span 
                    className="flex-1 text-[11px] font-black italic uppercase tracking-[0.2em] text-left"
                    style={{
                      color: data.theme !== 'minimal' ? data.buttonColor : undefined
                    }}
                  >
                    {label}
                  </span>
                  <ExternalLink 
                    className="w-4 h-4 transition-colors opacity-40 group-hover:opacity-100" 
                    style={{
                      color: data.theme !== 'minimal' ? data.buttonColor : undefined
                    }}
                  />
                </div>
              </motion.a>
            );
          })}
        </div>
        
        <div className="mt-auto pt-12 pb-8">
          <div className="flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
            <div className={`w-5 h-5 rounded flex items-center justify-center ${
              data.theme === 'minimal' ? 'bg-black text-white' : 'bg-turquoise/20 text-turquoise'
            }`}>
              <Music className="w-3 h-3" />
            </div>
            <p className={`text-[10px] uppercase tracking-[0.2em] font-bold ${
              data.theme === 'minimal' ? 'text-black' : 'text-white'
            }`}>Musaic Smart Link</p>
          </div>
        </div>
      </div>
    </div>
  );
}
