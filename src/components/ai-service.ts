// ─────────────────────────────────────────────────────────
// Musaic AI — AI Service Layer
// Gemini 1.5 Flash (text), Imagen 3 (images), Veo 3 (video)
// ─────────────────────────────────────────────────────────

function getApiKey(): string {
  const key = import.meta.env.VITE_GEMINI_API_KEY || '';
  if (!key) console.warn('[AI] ⚠️ No VITE_GEMINI_API_KEY set. AI features will not work.');
  return key;
}

// ── Gemini 1.5 Flash — Text generation ───────────────────
export async function callGemini(prompt: string): Promise<string> {
  const key = getApiKey();
  if (!key) return '[API key missing. Add VITE_GEMINI_API_KEY to Vercel env vars, then redeploy.]';
  try {
    console.log('[Gemini] Calling gemini-1.5-flash...');
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
      console.error('[Gemini] API error:', res.status, err);
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.warn('[Gemini] No text in response:', data);
      return 'Generation returned empty. Try rephrasing your input.';
    }
    console.log('[Gemini] ✅ Success, length:', text.length);
    return text;
  } catch (err: any) {
    console.error('[Gemini] Error:', err);
    return `Error: ${err.message}`;
  }
}

// ── Imagen 3 — Image generation ──────────────────────────
export async function callImagen3(
  prompt: string,
  style: string,
  aspectRatio: string = '1:1'
): Promise<string | null> {
  const key = getApiKey();
  if (!key) {
    console.error('[Imagen3] No API key');
    return null;
  }

  const fullPrompt = `${style} style, professional music industry artwork: ${prompt}. High quality, vibrant colors, commercial grade, suitable for album cover.`;
  console.log('[Imagen3] Generating with aspect:', aspectRatio, 'prompt:', fullPrompt.substring(0, 80) + '...');

  // Strategy: Try Imagen 3 → fallback Gemini 2.0 Flash image gen → null
  // ── Attempt 1: Imagen 3 via generateImages endpoint ──
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          config: {
            numberOfImages: 1,
            aspectRatio,
            personGeneration: 'DONT_ALLOW',
          },
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      console.log('[Imagen3] Response keys:', Object.keys(data));
      // Response format: { generatedImages: [{ image: { imageBytes: "base64..." } }] }
      const imgBytes = data?.generatedImages?.[0]?.image?.imageBytes;
      if (imgBytes) {
        console.log('[Imagen3] ✅ Image generated successfully');
        return `data:image/png;base64,${imgBytes}`;
      }
      // Alt response format
      const altBytes = data?.predictions?.[0]?.bytesBase64Encoded;
      if (altBytes) {
        console.log('[Imagen3] ✅ Image generated (alt format)');
        return `data:image/png;base64,${altBytes}`;
      }
      console.warn('[Imagen3] Response ok but no image data found:', JSON.stringify(data).substring(0, 200));
    } else {
      const errData = await res.json().catch(() => ({}));
      console.warn('[Imagen3] Attempt 1 failed:', res.status, errData.error?.message || '');
    }
  } catch (err) {
    console.warn('[Imagen3] Attempt 1 exception:', err);
  }

  // ── Attempt 2: Gemini 2.0 Flash with image generation ──
  try {
    console.log('[Imagen3] Trying fallback: gemini-2.0-flash-exp with image modality...');
    const res = await fetch(
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

    if (res.ok) {
      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const imgPart = parts.find((p: any) => p.inlineData);
      if (imgPart?.inlineData?.data) {
        console.log('[Imagen3] ✅ Fallback image generated');
        return `data:${imgPart.inlineData.mimeType || 'image/png'};base64,${imgPart.inlineData.data}`;
      }
      console.warn('[Imagen3] Fallback returned no image:', parts.map((p: any) => Object.keys(p)));
    } else {
      const errData = await res.json().catch(() => ({}));
      console.warn('[Imagen3] Fallback failed:', res.status, errData.error?.message || '');
    }
  } catch (err) {
    console.warn('[Imagen3] Fallback exception:', err);
  }

  console.error('[Imagen3] ❌ All attempts failed. Returning null (placeholder will be used).');
  return null;
}

// ── Prompt Enhancer ──────────────────────────────────────
export async function enhancePrompt(rawHints: string, context: string): Promise<string> {
  const prompt = `You are an expert creative director for the music industry. Transform these raw hints into a detailed, vivid image generation prompt.

Context: ${context}
Artist's raw description: "${rawHints}"

Rules:
- Output ONLY the enhanced prompt text, nothing else
- Be specific: lighting, composition, color palette, texture, mood
- Keep it under 80 words
- Make it perfect for AI image generation (Imagen 3)
- Think album covers, not generic stock photos`;

  return callGemini(prompt);
}

// ── Veo 3 — Video generation ─────────────────────────────
// Veo 3 is Google's latest video generation model
// Available via Vertex AI (requires project-level auth)
// The REST endpoint for API-key auth is not yet publicly available
// This structure is ready for when it opens
export async function callVeo3(prompt: string, duration: number = 5): Promise<{ status: 'pending' | 'ready' | 'error'; url?: string; message?: string }> {
  const key = getApiKey();
  if (!key) return { status: 'error', message: 'API key missing' };

  console.log('[Veo3] Attempting video generation:', prompt.substring(0, 60) + '...');

  // ── Try Veo 3 via Vertex AI endpoint ──
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-preview:predictLongRunning?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{
            prompt: `Cinematic music video: ${prompt}. Professional quality, smooth camera movements, high production value.`,
          }],
          parameters: {
            aspectRatio: '16:9',
            durationSeconds: duration,
            numberOfVideos: 1,
            personGeneration: 'dont_allow',
            enhancePrompt: true,
          },
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      console.log('[Veo3] Response:', JSON.stringify(data).substring(0, 300));
      // Long-running operation — would need polling
      if (data.name) {
        return { status: 'pending', message: `Video generation started. Operation: ${data.name}` };
      }
      // Direct result
      if (data.predictions?.[0]?.videoUrl) {
        return { status: 'ready', url: data.predictions[0].videoUrl };
      }
      return { status: 'pending', message: 'Video queued. Check back in a few minutes.' };
    } else {
      const err = await res.json().catch(() => ({}));
      console.warn('[Veo3] API returned:', res.status, err.error?.message);
      // Expected — Veo 3 may not be available via API key yet
      return { status: 'pending', message: 'Veo 3 is in preview. Video generation will be available soon.' };
    }
  } catch (err: any) {
    console.warn('[Veo3] Not available yet:', err.message);
    return { status: 'pending', message: 'Veo 3 endpoint not yet accessible. Coming soon.' };
  }
}
