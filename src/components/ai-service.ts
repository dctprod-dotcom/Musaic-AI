// ─────────────────────────────────────────────────────────
// Musaic AI — AI Service Layer (V3.1)
// Uses internal authenticated Vercel API routes only.
// ─────────────────────────────────────────────────────────

import { apiPost } from '../lib/api-client';

// ── Gemini 3 Flash — Génération de texte ultra-rapide ─────
export async function callGemini(prompt: string): Promise<string> {
  try {
    const data = await apiPost<{ text?: string }>('/api/ai/generate-text', {
      prompt,
      jsonMode: false,
    });
    return data?.text || 'Erreur de génération.';
  } catch (err: any) {
    return `Error: ${err?.error || err?.message || 'Generation failed'}`;
  }
}

// ── Nano Banana 2 (Imagen 3/4) — Image HD 3000x3000px ─────
export async function callImagen3(
  prompt: string,
  style: string,
  aspectRatio: string = '1:1'
): Promise<string | null> {
  const fullPrompt = `${style} style, ultra-high definition music artwork, 8k resolution, professional lighting: ${prompt}`;

  try {
    const data = await apiPost<{ image?: string }>('/api/ai/generate-image', {
      prompt: fullPrompt,
      aspectRatio,
    });

    if (data?.image) return data.image;
    
    // Fallback automatique si Nano Banana 2 sature
    console.log('[AI] Fallback vers Gemini 3 modality...');
    return null; 
  } catch (err) {
    console.error('[AI] Image Gen Error:', err);
    return null;
  }
}

// ── Veo 3.1 — Vidéo avec support du format ────────────────
export async function callVeo3(
  prompt: string, 
  duration: number = 5,
  format: '9:16' | '16:9' | '1:1' = '16:9'
): Promise<{ status: 'pending' | 'ready' | 'error'; url?: string; message?: string }> {
  try {
    const data = await apiPost<{ video?: string }>('/api/ai/generate-video', {
      prompt,
      duration,
      aspectRatio: format,
    });

    if (data?.video) {
      return { status: 'ready', url: data.video };
    }

    return { status: 'error', message: 'No video generated.' };
  } catch (err) {
    return { status: 'error', message: 'Erreur de connexion Veo.' };
  }
}

// ── Aide à la rédaction (Prompt Enhancer) ──────────────────
export async function enhancePrompt(rawHints: string, context: string): Promise<string> {
  const prompt = `Améliore ce prompt pour une IA de génération d'image (Musaic AI Studio). 
  Contexte: ${context}. Artiste dit: "${rawHints}". 
  Donne un prompt riche, visuel, style artistique pro, sans introduction.`;
  return callGemini(prompt);
}
