diff --git a/api/ai/generate-video.ts b/api/ai/generate-video.ts
index 6d68e385ad23d7776ca95c9994d02c0553f075de..d8f75b2f0c57c5ff4c89cc894e708703161ce500 100644
--- a/api/ai/generate-video.ts
+++ b/api/ai/generate-video.ts
@@ -1,47 +1,48 @@
 import type { VercelRequest, VercelResponse } from '@vercel/node';
 import { requireAuth, cors } from '../_shared.js';
 
 // Veo can take up to 2 minutes — use max Vercel Pro timeout
 export const config = { maxDuration: 300 };
 
 export default async function handler(req: VercelRequest, res: VercelResponse) {
   if (cors(req, res)) return;
   if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
 
   const user = await requireAuth(req, res);
   if (!user) return;
 
   const apiKey = process.env.GEMINI_API_KEY;
   if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
 
   try {
     const { GoogleGenAI } = await import('@google/genai');
     const ai = new GoogleGenAI({ apiKey });
     const { prompt, aspectRatio = '9:16' } = req.body;
+    const safeAspectRatio = (['9:16', '1:1', '16:9'].includes(aspectRatio) ? aspectRatio : '9:16') as '9:16' | '1:1' | '16:9';
 
     let operation = await ai.models.generateVideos({
       model: 'veo-3.1-fast-generate-preview',
       prompt,
-      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: aspectRatio as '9:16' | '1:1' }
+      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: safeAspectRatio }
     });
 
     while (!operation.done) {
       await new Promise(r => setTimeout(r, 5000));
       operation = await ai.operations.getVideosOperation({ operation });
     }
 
     if ((operation as any).error) throw new Error((operation as any).error.message || 'Video generation failed');
 
     const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
     if (!videoUri) throw new Error('No video URI returned');
 
     const videoResponse = await fetch(videoUri, { headers: { 'x-goog-api-key': apiKey } });
     if (!videoResponse.ok) throw new Error('Failed to download video from Google');
 
     const buffer = Buffer.from(await videoResponse.arrayBuffer());
     res.json({ video: `data:video/mp4;base64,${buffer.toString('base64')}` });
   } catch (err: any) {
     console.error('AI video error:', err);
     res.status(500).json({ error: err.message || 'Generation failed' });
   }
 }
