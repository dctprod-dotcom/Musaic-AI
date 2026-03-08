import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, cors } from '../_shared.js';

export const config = { maxDuration: 60 };

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
    const { prompt, aspectRatio = '1:1' } = req.body;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: { imageConfig: { aspectRatio } }
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find((p: any) => p.inlineData);
    if (!imagePart?.inlineData?.data) return res.status(500).json({ error: 'Failed to generate image' });

    res.json({ image: `data:image/png;base64,${imagePart.inlineData.data}` });
  } catch (err: any) {
    console.error('AI image error:', err);
    res.status(500).json({ error: err.message || 'Generation failed' });
  }
}
