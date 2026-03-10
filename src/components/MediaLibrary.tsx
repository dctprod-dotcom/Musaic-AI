// ─────────────────────────────────────────────────────────
// Musaic AI — Media Library
// Upload files + browse generation history from Firestore
// Reusable image picker for Smart Link, EPK, Artwork
// ─────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, X, Upload, Image as ImageIcon, Check,
  Loader2, Trash2, Clock, Search, Grid, List
} from 'lucide-react';
import {
  collection, query, where, orderBy, getDocs, addDoc,
  deleteDoc, doc, serverTimestamp, limit
} from 'firebase/firestore';
import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from 'firebase/storage';
import { db } from '../firebase';

// Try to import storage — may not exist yet in firebase.ts
let storage: any = null;
try {
  const fb = require('../firebase');
  storage = fb.storage;
} catch {}

interface MediaItem {
  id: string;
  url: string;
  name: string;
  type: 'upload' | 'generated';
  module?: string;
  createdAt: any;
}

interface MediaLibraryProps {
  t: (k: string) => string;
  user: any;
  onBack: () => void;
  onSelectImage: (url: string) => void;
  // When used as a modal/picker:
  isModal?: boolean;
  onClose?: () => void;
}

export function MediaLibrary({ t, user, onBack, onSelectImage, isModal, onClose }: MediaLibraryProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user's media from Firestore
  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    loadMedia();
  }, [user?.uid]);

  const loadMedia = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const mediaItems: MediaItem[] = [];

      // 1. Load from 'media' collection (uploads)
      try {
        const mediaQ = query(
          collection(db, 'media'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const mediaSnap = await getDocs(mediaQ);
        mediaSnap.forEach(d => {
          const data = d.data();
          mediaItems.push({
            id: d.id,
            url: data.url,
            name: data.name || 'Upload',
            type: 'upload',
            createdAt: data.createdAt,
          });
        });
      } catch (err) {
        console.log('[MediaLibrary] No media collection yet, skipping');
      }

      // 2. Load from 'generations' collection (AI-generated)
      try {
        const genQ = query(
          collection(db, 'generations'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const genSnap = await getDocs(genQ);
        genSnap.forEach(d => {
          const data = d.data();
          if (data.imageUrl || data.url) {
            mediaItems.push({
              id: d.id,
              url: data.imageUrl || data.url,
              name: data.prompt?.substring(0, 40) || data.title || 'AI Generated',
              type: 'generated',
              module: data.module,
              createdAt: data.createdAt,
            });
          }
        });
      } catch (err) {
        console.log('[MediaLibrary] No generations collection yet, skipping');
      }

      // Sort by date
      mediaItems.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setItems(mediaItems);
    } catch (err) {
      console.error('[MediaLibrary] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('application/pdf')) {
      alert('Only images and PDFs are supported.');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Max 5MB.');
      return;
    }

    setUploading(true);
    try {
      let downloadUrl = '';

      if (storage) {
        // Upload to Firebase Storage
        const storageRef = ref(storage, `media/${user.uid}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        downloadUrl = await getDownloadURL(snapshot.ref);
      } else {
        // Fallback: convert to base64 data URL (works without Storage)
        downloadUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      // Save reference in Firestore
      await addDoc(collection(db, 'media'), {
        userId: user.uid,
        url: downloadUrl,
        name: file.name,
        type: file.type,
        size: file.size,
        createdAt: serverTimestamp(),
      });

      console.log('[MediaLibrary] Upload success:', file.name);
      await loadMedia(); // Refresh list
    } catch (err) {
      console.error('[MediaLibrary] Upload error:', err);
      alert('Upload failed. Try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Delete media item
  const handleDelete = async (item: MediaItem) => {
    if (!confirm('Delete this file?')) return;
    try {
      const collName = item.type === 'upload' ? 'media' : 'generations';
      await deleteDoc(doc(db, collName, item.id));
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) {
      console.error('[MediaLibrary] Delete error:', err);
    }
  };

  // Filter items
  const filteredItems = searchQuery.trim()
    ? items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  const handleSelect = (item: MediaItem) => {
    setSelectedId(item.id);
    onSelectImage(item.url);
  };

  // ── Render ──
  const content = (
    <div className={`${isModal ? '' : 'h-full'} overflow-y-auto`}>
      {/* Header */}
      {!isModal && (
        <div className="flex items-center justify-between sticky top-0 z-20 bg-gradient-to-b from-[#050505] via-[#050505]/95 to-transparent pt-4 pb-2 px-4 lg:px-8">
          <button onClick={onBack} className="inline-flex items-center gap-2 px-3 py-2 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest hover:bg-white/5 rounded-xl transition-all">
            <ArrowLeft className="w-4 h-4" /> {t('action.back')}
          </button>
          <h1 className="text-lg font-black uppercase tracking-tight text-white hidden sm:block">{t('media.title')}</h1>
          <button onClick={onBack} className="p-2.5 text-white/30 hover:text-white hover:bg-white/10 rounded-xl transition-all"><X className="w-5 h-5" /></button>
        </div>
      )}

      <div className={`${isModal ? 'p-4' : 'max-w-4xl mx-auto p-4 lg:p-8 pt-0'} space-y-5`}>
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          {/* Upload button */}
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-turquoise text-black font-bold text-[10px] uppercase tracking-widest rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex-shrink-0">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? t('media.uploading') : t('media.upload')}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={handleUpload} className="hidden" />

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-turquoise/40 text-sm placeholder:text-white/15 transition-all"
              placeholder={t('media.search')} />
          </div>

          {/* View toggle */}
          <div className="flex rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
            <button onClick={() => setViewMode('grid')} className={`p-2 transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white'}`}><Grid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white'}`}><List className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-turquoise animate-spin" /></div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <ImageIcon className="w-12 h-12 text-white/10 mx-auto" />
            <p className="text-white/30 text-sm">{t('media.empty')}</p>
            <p className="text-white/20 text-xs">{t('media.emptyHint')}</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredItems.map(item => (
              <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className={`relative group rounded-2xl overflow-hidden cursor-pointer transition-all ${selectedId === item.id ? 'ring-2 ring-turquoise' : 'ring-1 ring-white/5 hover:ring-white/20'}`}
                onClick={() => handleSelect(item)}>
                <div className="aspect-square bg-black/30">
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).className = 'hidden'; }} />
                </div>
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-all">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-[10px] text-white font-bold truncate">{item.name}</p>
                    <p className="text-[8px] text-white/40 uppercase">{item.type === 'generated' ? `AI • ${item.module || ''}` : 'Upload'}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                {/* Selected indicator */}
                {selectedId === item.id && (
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-turquoise flex items-center justify-center">
                    <Check className="w-3 h-3 text-black" />
                  </div>
                )}
                {/* Type badge */}
                {item.type === 'generated' && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-purple-500/80 text-[7px] font-bold text-white uppercase">AI</div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {filteredItems.map(item => (
              <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all group ${selectedId === item.id ? 'bg-turquoise/10 border border-turquoise/20' : 'glass-card hover:bg-white/5'}`}
                onClick={() => handleSelect(item)}>
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-black/30">
                  <img src={item.url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-semibold truncate">{item.name}</p>
                  <p className="text-[10px] text-white/30">{item.type === 'generated' ? `AI Generated • ${item.module || ''}` : 'Uploaded'}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                  className="p-1.5 rounded-lg text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render as modal or full page
  if (isModal) {
    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[180] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[80vh] bg-[#0B0E14] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="text-sm font-black uppercase tracking-widest text-white">{t('media.title')}</h2>
              <button onClick={onClose} className="p-2 text-white/30 hover:text-white rounded-xl hover:bg-white/10 transition-all"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-60px)]">
              {content}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return content;
}

// ── Reusable Media Picker Button ──────────────────────────
// Drop this into any module to let users pick from library
export function MediaPickerButton({ t, user, onSelect, currentUrl }: {
  t: (k: string) => string; user: any;
  onSelect: (url: string) => void; currentUrl?: string;
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setShowPicker(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-[9px] font-bold uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all">
        <ImageIcon className="w-3 h-3" /> {t('media.pickFromLibrary')}
      </button>
      {showPicker && (
        <MediaLibrary
          t={t} user={user}
          onBack={() => setShowPicker(false)}
          onSelectImage={(url) => { onSelect(url); setShowPicker(false); }}
          isModal onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
