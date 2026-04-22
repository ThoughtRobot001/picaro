import { supabase } from '../lib/supabase';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate`;

export interface GenerateOptions {
  sketchDataURL: string;
  prompt: string;
  style: string;
  characterSeedBase64?: string | null;
}

export interface GenerateResult {
  success: boolean;
  imageURL?: string;
  error?: string;
}

const STYLE_INSTRUCTIONS: Record<string, {
  instruction: string;
  quality: string;
}> = {
  photorealistic: {
    instruction: 'Transform this hand-drawn sketch into a photorealistic product photograph',
    quality: 'studio lighting, clean white background, isolated object, sharp focus, 4K, professional product photography',
  },
  manga: {
    instruction: 'Transform this hand-drawn sketch into a manga illustration',
    quality: 'clean black ink linework, white background, manga style, bold outlines, Japanese comic art',
  },
  anime: {
    instruction: 'Transform this hand-drawn sketch into an anime style illustration',
    quality: 'cel shaded, vibrant colors, clean white background, anime art style, smooth linework',
  },
  watercolor: {
    instruction: 'Transform this hand-drawn sketch into a watercolor painting',
    quality: 'soft watercolor washes, white paper background, delicate brushwork, artistic',
  },
  oilpainting: {
    instruction: 'Transform this hand-drawn sketch into an oil painting',
    quality: 'rich oil paint texture, visible brushstrokes, classical painting style, white background',
  },
  sketch: {
    instruction: 'Transform this rough sketch into a refined pencil sketch illustration',
    quality: 'clean pencil lines, white paper background, professional illustration',
  },
};

export function analyseCanvasColors(dataURL: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const sampleSize = 100;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const data = imageData.data;
        const colorCounts: Record<string, number> = {};
        let totalDrawnPixels = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 128) continue;
          if (r > 230 && g > 230 && b > 230) continue;
          totalDrawnPixels++;
          const colorName = classifyColor(r, g, b);
          colorCounts[colorName] = (colorCounts[colorName] || 0) + 1;
        }
        if (totalDrawnPixels < 50) {
          resolve('black lines on white background');
          return;
        }
        const sorted = Object.entries(colorCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([color]) => color);
        if (sorted.length === 0) {
          resolve('black lines on white background');
        } else if (sorted.length === 1) {
          resolve(`${sorted[0]} lines on white background`);
        } else {
          resolve(
            `${sorted.slice(0, -1).join(', ')} and ${sorted[sorted.length - 1]} colors on white background`
          );
        }
      } catch {
        resolve('colored sketch on white background');
      }
    };
    img.onerror = () => resolve('sketch on white background');
    img.src = dataURL;
  });
}

function classifyColor(r: number, g: number, b: number): string {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (max < 60) return 'black';
  if (delta < 30 && max < 180) return 'grey';
  if (r > g && r > b) {
    if (g > 150) return 'yellow';
    if (b > 100) return 'pink';
    return 'red';
  }
  if (g > r && g > b) {
    if (r > 150) return 'yellow';
    return 'green';
  }
  if (b > r && b > g) {
    if (r > 150) return 'purple';
    return 'blue';
  }
  if (r > 200 && g > 150 && b < 100) return 'orange';
  return 'colored';
}

async function callEdgeFunction(
  model: string,
  input: Record<string, unknown>
): Promise<GenerateResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      success: false,
      error: 'Please sign in to generate images',
    };
  }

  try {
    console.log('Edge function URL:', EDGE_FUNCTION_URL);
    console.log('Session token exists:', !!session.access_token);
    console.log('Token preview:', session.access_token?.slice(0, 20));

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ model, input }),
    });

    console.log('Edge function response status:', response.status);
    console.log('Edge function response headers:', 
      Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge function error body:', errorText);
      return {
        success: false,
        error: errorText || `Error: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      imageURL: data.imageURL,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

async function buildPrompt(
  sketchDataURL: string,
  style: string,
  userPrompt: string,
  hasCharacterSeed = false
): Promise<string> {
  const styleConfig = STYLE_INSTRUCTIONS[style] ?? {
    instruction: `Transform this sketch into ${style} style`,
    quality: 'white background, clean, professional',
  };
  const colorContext = await analyseCanvasColors(sketchDataURL);
  const parts: string[] = [];
  parts.push(styleConfig.instruction);
  parts.push(`The sketch has ${colorContext}`);
  if (hasCharacterSeed) {
    parts.push(
      'Keep the exact appearance, face, clothing, and style of the character in this reference image'
    );
    parts.push(
      'Place the character in the pose and scene shown in the sketch composition'
    );
  } else {
    parts.push(
      'Preserve the exact shape, proportions, and composition of the original sketch'
    );
  }
  parts.push(styleConfig.quality);
  if (userPrompt.trim()) parts.push(userPrompt.trim());
  return parts.join('. ') + '.';
}

export async function generateFromSketch(
  options: GenerateOptions,
  _apiKey?: string
): Promise<GenerateResult> {
  const { sketchDataURL, prompt, style } = options;
  const fullPrompt = await buildPrompt(sketchDataURL, style, prompt);
  console.log('Prompt:', fullPrompt);

  return callEdgeFunction('flux-kontext-pro', {
    prompt: fullPrompt,
    input_image: sketchDataURL,
    aspect_ratio: '1:1',
    output_format: 'png',
    output_quality: 95,
    safety_tolerance: 2,
  });
}

export async function flux2GenerateWithSeed(
  sketchDataURL: string,
  seedBase64: string,
  style: string,
  userPrompt: string,
  _apiKey?: string
): Promise<GenerateResult> {
  const stylePrompts: Record<string, string> = {
    photorealistic: 'photorealistic product photography, clean white background, studio lighting, sharp focus, 4K',
    manga: 'manga illustration style, clean linework, black and white, bold outlines',
    anime: 'anime style, cel shaded, vibrant colors, clean composition',
    watercolor: 'watercolor painting, soft colors, white background, artistic',
    oilpainting: 'oil painting, classical style, rich brushwork',
    sketch: 'refined pencil sketch, clean linework, white background',
  };
  const styleText = stylePrompts[style] ?? `${style} style, white background, clean`;

  const promptParts = [
    'Using image 1 as the pose and composition guide',
    'and image 2 as the character reference',
    `generate a ${styleText} image`,
    'showing the exact character from image 2',
    'in the pose and scene layout shown in image 1',
    "Preserve the character's face, clothing, hair exactly",
    'White background, isolated, clean',
  ];
  if (userPrompt.trim()) promptParts.push(userPrompt.trim());
  const fullPrompt = promptParts.join('. ') + '.';
  console.log('FLUX.2 prompt:', fullPrompt);

  return callEdgeFunction('flux-2-pro', {
    prompt: fullPrompt,
    input_images: [sketchDataURL, seedBase64],
    aspect_ratio: '1:1',
    output_format: 'png',
    output_quality: 95,
  });
}
