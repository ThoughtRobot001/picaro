const REPLICATE_API_URL = '/api/replicate/v1/models/black-forest-labs/flux-kontext-pro/predictions';
const FLUX2_API_URL = '/api/replicate/v1/models/black-forest-labs/flux-2-pro/predictions';

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
    quality: 'clean black ink linework, white background, manga style, bold outlines, screentone shading, Japanese comic art',
  },
  anime: {
    instruction: 'Transform this hand-drawn sketch into an anime style illustration',
    quality: 'cel shaded, vibrant colors, clean white background, anime art style, smooth linework, Studio Ghibli quality',
  },
  watercolor: {
    instruction: 'Transform this hand-drawn sketch into a watercolor painting',
    quality: 'soft watercolor washes, white paper background, delicate brushwork, artistic, painterly texture',
  },
  oilpainting: {
    instruction: 'Transform this hand-drawn sketch into an oil painting',
    quality: 'rich oil paint texture, visible brushstrokes, classical painting style, white background, museum quality',
  },
  sketch: {
    instruction: 'Transform this rough sketch into a refined pencil sketch illustration',
    quality: 'clean pencil lines, white paper background, professional illustration, detailed linework, artistic sketch',
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

async function buildPrompt(
  sketchDataURL: string,
  style: string,
  userPrompt: string,
  hasCharacterSeed: boolean = false
): Promise<string> {
  const styleConfig = STYLE_INSTRUCTIONS[style] ?? {
    instruction: `Transform this hand-drawn sketch into a ${style} style image`,
    quality: 'white background, clean, professional, high quality',
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

  if (userPrompt.trim()) {
    parts.push(userPrompt.trim());
  }

  return parts.join('. ') + '.';
}

export async function generateFromSketch(
  options: GenerateOptions,
  apiKey: string
): Promise<GenerateResult> {
  const {
    sketchDataURL,
    prompt,
    style,
    characterSeedBase64,
  } = options;

  try {
    const fullPrompt = await buildPrompt(
      sketchDataURL,
      style,
      prompt,
      !!characterSeedBase64
    );
    console.log('Sending prompt to Kontext:', fullPrompt);

    const startResponse = await fetch(REPLICATE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=60',
      },
      body: JSON.stringify({
        input: {
          prompt: fullPrompt,
          input_image: characterSeedBase64 ?? sketchDataURL,
          aspect_ratio: '1:1',
          output_format: 'png',
          output_quality: 95,
          safety_tolerance: 2,
        },
      }),
    });

    if (!startResponse.ok) {
      const err = await startResponse.json();
      console.error('Replicate error:', err);
      return {
        success: false,
        error: err.detail || `API error: ${startResponse.status}`,
      };
    }

    const prediction = await startResponse.json();
    console.log('Prediction response:', prediction);

    if (prediction.status === 'succeeded') {
      const imageURL = extractImageURL(prediction.output);
      if (imageURL) return { success: true, imageURL };
    }

    return await pollPrediction(prediction.id, apiKey);
  } catch (err) {
    console.error('Generation error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

export async function flux2GenerateWithSeed(
  sketchDataURL: string,
  seedBase64: string,
  style: string,
  userPrompt: string,
  apiKey: string
): Promise<GenerateResult> {
  const stylePrompts: Record<string, string> = {
    photorealistic: 'photorealistic product photography, clean white background, studio lighting, sharp focus, 4K',
    manga: 'manga illustration style, clean linework, black and white, bold outlines',
    anime: 'anime style, cel shaded, vibrant colors, clean composition',
    watercolor: 'watercolor painting, soft colors, white background, artistic',
    oilpainting: 'oil painting, classical style, rich brushwork',
    sketch: 'refined pencil sketch, clean linework, white background',
  };

  const styleText = stylePrompts[style] ?? `${style} style, white background, clean, professional`;

  const promptParts = [
    'Using image 1 as the pose and composition guide',
    'and image 2 as the character reference',
    `generate a ${styleText} image`,
    'showing the exact character from image 2',
    'in the pose and scene layout shown in image 1',
    "Preserve the character's face, clothing, hair, and appearance exactly",
    'White background, isolated, clean',
  ];

  if (userPrompt.trim()) {
    promptParts.push(userPrompt.trim());
  }

  const fullPrompt = promptParts.join('. ') + '.';
  console.log('FLUX.2 multi-reference prompt:', fullPrompt);

  try {
    const response = await fetch(FLUX2_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=60',
      },
      body: JSON.stringify({
        input: {
          prompt: fullPrompt,
          input_images: [sketchDataURL, seedBase64],
          aspect_ratio: '1:1',
          output_format: 'png',
          output_quality: 95,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('FLUX.2 error:', err);
      return {
        success: false,
        error: err.detail || `API error: ${response.status}`,
      };
    }

    const prediction = await response.json();
    console.log('FLUX.2 prediction:', prediction);

    if (prediction.status === 'succeeded') {
      const imageURL = extractImageURL(prediction.output);
      if (imageURL) return { success: true, imageURL };
    }

    return await pollPrediction(prediction.id, apiKey);
  } catch (err) {
    console.error('FLUX.2 error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

async function pollPrediction(
  id: string,
  apiKey: string,
  maxAttempts = 60,
  intervalMs = 2000
): Promise<GenerateResult> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));

    const res = await fetch(`/api/replicate/v1/predictions/${id}`, {
      headers: { Authorization: `Token ${apiKey}` },
    });

    const data = await res.json();
    console.log(`Poll ${i + 1} status:`, data.status);

    if (data.status === 'succeeded') {
      const imageURL = extractImageURL(data.output);
      console.log('Generated imageURL:', imageURL);
      if (!imageURL) {
        return {
          success: false,
          error: 'Generation succeeded but no image URL returned',
        };
      }
      return { success: true, imageURL };
    }

    if (data.status === 'failed' || data.status === 'canceled') {
      return {
        success: false,
        error: data.error || 'Generation failed',
      };
    }
  }

  return { success: false, error: 'Timed out after 2 minutes' };
}

function extractImageURL(output: unknown): string | undefined {
  if (typeof output === 'string') return output;
  if (Array.isArray(output)) {
    const first = output[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') {
      const o = first as Record<string, unknown>;
      if (typeof o.url === 'string') return o.url;
    }
  }
  if (output && typeof output === 'object') {
    const o = output as Record<string, unknown>;
    if (typeof o.url === 'string') return o.url;
  }
  return undefined;
}
