// ─────────────────────────────────────────────────────────
// Musaic AI — AI Service Layer
// Gemini 1.5 Flash (text), Imagen 3 (images), Veo 2 (video)
// API key from .env — NEVER hardcoded
// ─────────────────────────────────────────────────────────

function getApiKey(): string {
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

// ── Gemini 1.5 Flash — Text generation ───────────────────
export async function callGemini(prompt: string): Promise<string> {
  const key = getApiKey();
  if (!key) return '[API key missing. Add VITE_GEMINI_API_KEY to .env]';
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
        }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Generation failed.';
  } catch (err: any) {
    console.error('[Gemini]', err);
    return `Error: ${err.message}`;
  }
}

// ── Imagen 3 via Vertex AI — Image generation ────────────
export async function callImagen3(
  prompt: string,
  style: string,
  aspectRatio: string = '1:1'
): Promise<string | null> {
  const key = getApiKey();
  if (!key) return null;

  const fullPrompt = `${style} style, professional music artwork: ${prompt}. High quality, vibrant, commercial grade.`;

  try {
    // Primary: Imagen 3 endpoint
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: fullPrompt }],
          parameters: { sampleCount: 1, aspectRatio, personGeneration: 'dont_allow' },
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (data?.predictions?.[0]?.bytesBase64Encoded) {
        return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
      }
    }

    // Fallback: Gemini 2.0 Flash with image generation
    const fallback = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Generate an image: ${fullPrompt}` }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
      }
    );

    if (fallback.ok) {
      const data = await fallback.json();
      const img = data?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      if (img?.inlineData) return `data:${img.inlineData.mimeType};base64,${img.inlineData.data}`;
    }

    return null;
  } catch (err) {
    console.error('[Imagen3]', err);
    return null;
  }
}

// ── Prompt Enhancer — transforms raw hints into pro prompts
export async function enhancePrompt(rawHints: string, context: string): Promise<string> {
  const prompt = `You are an expert creative director for the music industry. Transform these raw hints into a detailed, vivid image generation prompt.

Context: ${context}
Raw hints from artist: "${rawHints}"

Rules:
- Output ONLY the enhanced prompt, nothing else
- Be specific about lighting, composition, color palette, mood
- Keep it under 100 words
- Make it suitable for AI image generation`;

  return callGemini(prompt);
}

// ── Veo 2 — Video generation (structure ready) ──────────
export async function callVeo(_prompt: string): Promise<string | null> {
  // Veo 2 not yet available via REST API key auth
  console.log('[Veo] Endpoint not yet public.');
  return null;
}
