// ─────────────────────────────────────────────────────────
// Musaic AI — AI Service Layer (Gemini 3 / Nano Banana 2 / Veo 3.1)
// Client-side calls to Google Generative Language API.
// ─────────────────────────────────────────────────────────

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function getApiKey(): string {
  const key = import.meta.env.VITE_GEMINI_API_KEY || '';
  if (!key) console.warn('[AI] Missing VITE_GEMINI_API_KEY');
  return key;
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || data?.message || `HTTP ${res.status}`);
  }
  return data;
}

// ── Gemini 3 Flash — Text ────────────────────────────────
export async function callGemini(prompt: string): Promise<string> {
  const key = getApiKey();
  if (!key) return 'Error: API key missing';

  const url = `${API_BASE}/gemini-3-flash-preview:generateContent?key=${key}`;

  try {
    const data = await postJson(url, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 3072,
      },
    });

    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || '').join('')?.trim();

    if (text) return text;

    if (/press kit|epk|biography|bio|communiqu/i.test(prompt)) {
      return `[SHORT BIO]\nArtist bio unavailable, please retry.\n\n[FULL BIO]\nGeneration returned empty content. Retry with more details.\n\n[PRESS ONE-LINER]\nIndependent artist blending emotion and innovation.\n\n[PRESS RELEASE]\nNew release available soon.\n\n[PRESS CONTACT]\ncontact@musaicai.com`;
    }

    return 'Error: Empty AI response';
  } catch (err: any) {
    return `Error: ${err?.message || 'Generation failed'}`;
  }
}

// ── Nano Banana 2 — Images (forced 3000x3000) ────────────
export async function callImagen3(
  prompt: string,
  style: string,
  aspectRatio: string = '1:1'
): Promise<string | null> {
  const key = getApiKey();
  if (!key) return null;

  const fullPrompt = `${style} style, ultra-high definition music artwork, 8k quality, studio lighting: ${prompt}`;
  const url = `${API_BASE}/nano-banana-2:generateImages?key=${key}`;

  try {
    const data = await postJson(url, {
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        aspectRatio,
        outputOptions: {
          mimeType: 'image/png',
          width: 3000,
          height: 3000,
        },
      },
    });

    const imgBytes = data?.generatedImages?.[0]?.image?.imageBytes;
    return imgBytes ? `data:image/png;base64,${imgBytes}` : null;
  } catch (err) {
    console.error('[AI] Image generation error:', err);
    return null;
  }
}

// ── Veo 3.1 — Video ──────────────────────────────────────
export async function callVeo3(
  prompt: string,
  duration: number = 5,
  format: '9:16' | '16:9' | '1:1' = '16:9'
): Promise<{ status: 'pending' | 'ready' | 'error'; url?: string; message?: string }> {
  const key = getApiKey();
  if (!key) return { status: 'error', message: 'API key missing' };

  const safeFormat = (['9:16', '16:9', '1:1'].includes(format) ? format : '16:9') as '9:16' | '16:9' | '1:1';
  const generateUrl = `${API_BASE}/veo-3.1:predictLongRunning?key=${key}`;

  try {
    const op = await postJson(generateUrl, {
      instances: [{ prompt: `Cinematic music video, ${safeFormat}, ${prompt}` }],
      parameters: {
        aspectRatio: safeFormat,
        durationSeconds: duration,
        enhancePrompt: true,
      },
    });

    const operationName = op?.name;
    if (!operationName) {
      return { status: 'error', message: 'No operation returned by Veo 3.1' };
    }

    // Poll operation endpoint
    for (let i = 0; i < 36; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const pollRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${key}`);
      const poll = await pollRes.json().catch(() => ({}));

      if (poll?.done) {
        const videoUri = poll?.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) {
          return { status: 'error', message: poll?.error?.message || 'No video URI returned' };
        }

        const videoResponse = await fetch(videoUri, { headers: { 'x-goog-api-key': key } });
        if (!videoResponse.ok) {
          return { status: 'error', message: 'Unable to download generated video' };
        }

        const buffer = await videoResponse.arrayBuffer();
        const binary = new Uint8Array(buffer);
        let str = '';
        binary.forEach((b) => { str += String.fromCharCode(b); });
        const base64 = btoa(str);

        return { status: 'ready', url: `data:video/mp4;base64,${base64}` };
      }
    }

    return { status: 'pending', message: 'Video generation still in progress.' };
  } catch (err: any) {
    return { status: 'error', message: err?.message || 'Veo generation failed' };
  }
}

// ── Prompt Enhancer ───────────────────────────────────────
export async function enhancePrompt(rawHints: string, context: string): Promise<string> {
  const prompt = `Améliore ce prompt pour une IA de génération d'image Musaic AI Studio.\nContexte: ${context}.\nIndice artiste: "${rawHints}".\nRetourne uniquement un prompt visuel riche et professionnel.`;
  return callGemini(prompt);
}
