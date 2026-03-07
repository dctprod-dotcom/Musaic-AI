import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";

export interface MusicAssetRequest {
  artistName: string;
  songTitle: string;
  subtitle: string;
  genre: string;
  vision: string;
  assetType: 'cover' | 'thumbnail' | 'poster' | 'square' | 'banner';
  language?: string;
}

export interface PressSuiteRequest {
  artistName: string;
  highlights: string;
  styleAnalysis?: string; // Base64 image data
  language?: string;
}

export interface VideoRequest {
  prompt: string;
  referenceImage?: string; // Base64 image data
  type: 'canvas' | 'teaser' | 'social' | 'square';
  aspectRatio?: '9:16' | '1:1' | '16:9';
  language?: string;
}

export const getAI = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing");
  // Use Vertex AI endpoint configuration as requested for paid tier features
  return new GoogleGenAI({ 
    apiKey,
  });
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

/**
 * MUSAIC AI Consultant: Suggests keywords or improvements for inputs
 */
export async function getConsultantSuggestions(field: string, value: string, language: string = 'English'): Promise<string[]> {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As MUSAIC AI Consultant, suggest 5 professional visual keywords or genre terms to improve this ${field}: "${value}". 
      The user is working in ${language}. Return only a JSON array of strings in ${language}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        safetySettings
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Consultant Error:", e);
    return [];
  }
}

export async function generateMusicAsset(request: MusicAssetRequest): Promise<string> {
  const ai = getAI();
  const { artistName, songTitle, subtitle, genre, vision, assetType, language = 'English' } = request;

  const specs = {
    cover: "3000x3000px, high-resolution, centered composition",
    thumbnail: "1280x720px, high-contrast, YouTube optimized",
    poster: "1080x1920px, vertical re-composition, TikTok/Reels ready",
    square: "1080x1080px, Instagram optimized",
    banner: "1500x500px, horizontal layout, Twitter/X/FB optimized"
  };

  const prompt = `
    Product Name: MUSAIC AI (Visual Production Engine).
    Task: Generate a professional ${assetType} image.

    PRIORITY INSTRUCTION: Follow the User Vision below with highest priority (weight: 1.5).
    User Vision: "${vision}"

    Context:
    Artist: ${artistName}
    Title: ${songTitle}
    Subtitle/Version: ${subtitle}
    Genre: ${genre}
    Language/Script: ${language}

    Technical Specs: ${specs[assetType]}.
    General Quality: Premium aesthetic, high resolution, no AI watermarks.
    
    Typography Requirements:
    - Use the ${language} script for all text (Artist, Title, Subtitle).
    - CRITICAL: Use universal, multi-script fonts that natively support ${language} characters (including Latin accents, Hebrew letters, or Arabic script ligatures).
    - Ensure text is perfectly rendered without display errors or missing glyphs.
    - Elite, bold, high-end typography integrated into the scene.
    - Render the [SUBTITLE] "${subtitle}" as secondary typography (smaller font size, positioned clearly under or aligned with the [SONG_TITLE] "${songTitle}").
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio: assetType === 'poster' ? "9:16" : (assetType === 'banner' || assetType === 'thumbnail') ? "16:9" : "1:1"
        },
        safetySettings
      }
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!imagePart?.inlineData?.data) throw new Error("Failed to generate image");

    return `data:image/png;base64,${imagePart.inlineData.data}`;
  } catch (error: any) {
    console.error("Generate Asset Error:", error);
    throw error;
  }
}

export async function generatePressSuite(request: PressSuiteRequest): Promise<string> {
  const ai = getAI();
  const { artistName, highlights, styleAnalysis, language = 'English' } = request;

  const parts: any[] = [
    { text: `
      Generate a professional Press Suite for artist "${artistName}".
      Highlights: ${highlights}
      Language: ${language}
      
      Requirements:
      1. 3 Pitch Templates (Direct, Emotional, Social Buzz).
      2. 1 Professional Artist Bio.
      Format: Markdown with clear headings.
      Style: Premium, industry-standard, engaging.
      IMPORTANT: The entire response MUST be in ${language}.
    `}
  ];

  if (styleAnalysis) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: styleAnalysis.split(',')[1]
      }
    });
    parts[0].text += "\nAnalyze the provided image for visual style and incorporate its mood into the writing.";
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: { safetySettings }
    });

    return response.text || "Failed to generate press suite";
  } catch (error: any) {
    console.error("Press Suite Error:", error);
    throw error;
  }
}

export async function generateMusicVideo(request: VideoRequest): Promise<string> {
  const ai = getAI();
  const { prompt, referenceImage, type, aspectRatio, language = 'English' } = request;

  const config = {
    canvas: { duration: "5-8s", ratio: "9:16", promptSuffix: "seamless cinematic loop, atmospheric, no text" },
    teaser: { duration: "15s", ratio: "9:16", promptSuffix: "high-energy social media teaser, dynamic cuts" },
    social: { duration: "15s", ratio: "9:16", promptSuffix: "full cinematic sequence for social media, immersive" },
    square: { duration: "10s", ratio: "1:1", promptSuffix: "square cinematic visual, centered composition" }
  };

  const videoConfig = config[type as keyof typeof config] || config.canvas;
  const finalRatio = aspectRatio || videoConfig.ratio;

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `${prompt}, ${videoConfig.promptSuffix}. Context language: ${language}.`,
      image: referenceImage ? {
        imageBytes: referenceImage.split(',')[1],
        mimeType: 'image/jpeg'
      } : undefined,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: finalRatio as '9:16' | '1:1',
        // Note: safetySettings might not be supported in generateVideos config yet, but adding just in case or omitting if causes issues.
        // Checking docs: generateVideos config usually doesn't take safetySettings in the same way.
        // I will omit for video to be safe, or check if it's supported. 
        // The prompt doesn't explicitly say video supports safetySettings.
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Failed to generate video");

    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    const videoResponse = await fetch(downloadLink, {
      headers: { 'x-goog-api-key': apiKey! }
    });

    const blob = await videoResponse.blob();
    return URL.createObjectURL(blob);
  } catch (error: any) {
    console.error("Video Generation Error:", error);
    throw error;
  }
}
