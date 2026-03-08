import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, cors } from '../_shared.js';

export const config = { maxDuration: 30 };

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
    const { prompt, jsonMode = false } = req.body;

    const config: any = {};
    if (jsonMode) config.responseMimeType = 'application/json';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-05-20',
      contents: prompt,
      config,
    });

    res.json({ text: response.text || '' });
  } catch (err: any) {
    console.error('AI text error:', err);
    res.status(500).json({ error: err.message || 'Generation failed' });
  }
}
