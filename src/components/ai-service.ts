diff --git a/src/components/ai-service.ts b/src/components/ai-service.ts
index 00073f4cd72e73fa47f0263030568c001e88ca04..036e93d214281ed7122bab830e5e22f40755cabe 100644
--- a/src/components/ai-service.ts
+++ b/src/components/ai-service.ts
@@ -1,119 +1,75 @@
 // ─────────────────────────────────────────────────────────
-// Musaic AI — AI Service Layer (V3.1 - Sunday Edition)
-// Gemini 3 Flash (text), Nano Banana 2 (images), Veo 3.1 (video)
+// Musaic AI — AI Service Layer (V3.1)
+// Uses internal authenticated Vercel API routes only.
 // ─────────────────────────────────────────────────────────
 
-function getApiKey(): string {
-  const key = import.meta.env.VITE_GEMINI_API_KEY || '';
-  if (!key) console.warn('[AI] ⚠️ No VITE_GEMINI_API_KEY set.');
-  return key;
-}
+import { apiPost } from '../lib/api-client';
 
 // ── Gemini 3 Flash — Génération de texte ultra-rapide ─────
 export async function callGemini(prompt: string): Promise<string> {
-  const key = getApiKey();
-  if (!key) return '[API key missing]';
-  
   try {
-    // Utilisation du modèle gemini-3-flash-preview (Doc Mars 2026)
-    const res = await fetch(
-      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${key}`,
-      {
-        method: 'POST',
-        headers: { 'Content-Type': 'application/json' },
-        body: JSON.stringify({
-          contents: [{ parts: [{ text: prompt }] }],
-          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
-        }),
-      }
-    );
-    const data = await res.json();
-    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Erreur de génération.';
+    const data = await apiPost<{ text?: string }>('/api/ai/generate-text', {
+      prompt,
+      jsonMode: false,
+    });
+    return data?.text || 'Erreur de génération.';
   } catch (err: any) {
-    return `Error: ${err.message}`;
+    return `Error: ${err?.error || err?.message || 'Generation failed'}`;
   }
 }
 
 // ── Nano Banana 2 (Imagen 3/4) — Image HD 3000x3000px ─────
 export async function callImagen3(
   prompt: string,
   style: string,
   aspectRatio: string = '1:1'
 ): Promise<string | null> {
-  const key = getApiKey();
   const fullPrompt = `${style} style, ultra-high definition music artwork, 8k resolution, professional lighting: ${prompt}`;
 
   try {
-    // Appel au nouveau modèle Nano Banana 2 (Gemini 3 Flash Image)
-    const res = await fetch(
-      `https://generativelanguage.googleapis.com/v1beta/models/nano-banana-2:generateImages?key=${key}`,
-      {
-        method: 'POST',
-        headers: { 'Content-Type': 'application/json' },
-        body: JSON.stringify({
-          prompt: fullPrompt,
-          config: {
-            numberOfImages: 1,
-            aspectRatio: aspectRatio, // '1:1', '9:16', '16:9'
-            outputOptions: { mimeType: "image/png", width: 3000, height: 3000 } // Force Upscaling 3000px
-          },
-        }),
-      }
-    );
+    const data = await apiPost<{ image?: string }>('/api/ai/generate-image', {
+      prompt: fullPrompt,
+      aspectRatio,
+    });
 
-    const data = await res.json();
-    const imgBytes = data?.generatedImages?.[0]?.image?.imageBytes;
-    
-    if (imgBytes) return `data:image/png;base64,${imgBytes}`;
+    if (data?.image) return data.image;
     
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
-  const key = getApiKey();
-  
   try {
-    const res = await fetch(
-      `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1:predictLongRunning?key=${key}`,
-      {
-        method: 'POST',
-        headers: { 'Content-Type': 'application/json' },
-        body: JSON.stringify({
-          instances: [{ prompt: `Cinematic music video, ${format} format: ${prompt}` }],
-          parameters: {
-            aspectRatio: format,
-            durationSeconds: duration,
-            enhancePrompt: true,
-          },
-        }),
-      }
-    );
+    const data = await apiPost<{ video?: string }>('/api/ai/generate-video', {
+      prompt,
+      duration,
+      aspectRatio: format,
+    });
 
-    const data = await res.json();
-    if (data.name) {
-      return { status: 'pending', message: 'Vidéo en cours de création (Veo 3.1)...' };
+    if (data?.video) {
+      return { status: 'ready', url: data.video };
     }
-    return { status: 'error', message: 'Modèle Veo 3.1 temporairement indisponible.' };
+
+    return { status: 'error', message: 'No video generated.' };
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
