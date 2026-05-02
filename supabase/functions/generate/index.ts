// @ts-nocheck
// Suppress TS errors in VS Code since this is a Deno environment, not Node.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const UNLIMITED_ACCOUNT_EMAILS = new Set([
  'thoughtrobot001@gmail.com',
]);

async function saveToStorage(
  imageURL: string,
  userId: string,
  adminClient: any
): Promise<string> {
  try {
    const response = await fetch(imageURL);
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const filename = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.png`;

    const { error: uploadError } = await adminClient.storage
      .from('picaro-images')
      .upload(filename, buffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return imageURL;
    }

    const { data } = adminClient.storage
      .from('picaro-images')
      .getPublicUrl(filename);

    return data.publicUrl;
  } catch (err) {
    console.error('Storage error:', err);
    return imageURL;
  }
}

async function pollReplicatePrediction(
  id: string,
  apiKey: string,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));

    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Token ${apiKey}` },
    });

    const data = await res.json();
    console.log(`Poll ${i + 1}:`, data.status);

    if (
      data.status === 'succeeded' ||
      data.status === 'failed' ||
      data.status === 'canceled'
    ) {
      return data;
    }
  }

  return { status: 'failed', error: 'Timed out' };
}

async function callGPTImage2(
  prompt: string,
  inputImages: string[],
  openAIKey: string,
  quality: 'low' | 'medium' | 'high' = 'medium'
): Promise<string | null> {
  try {
    const openAIKey_ = openAIKey;

    if (inputImages.length === 0) {
      const response = await fetch(
        'https://api.openai.com/v1/images/generations',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openAIKey_}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-image-1',
            prompt,
            n: 1,
            size: '1024x1024',
            quality,
            response_format: 'b64_json',
          }),
        }
      );
      if (!response.ok) {
        const err = await response.json();
        console.error('GPT Image 2 gen error:', err);
        return null;
      }
      const data = await response.json();
      return `data:image/png;base64,${data.data?.[0]?.b64_json}`;
    }

    const formData = new FormData();
    formData.append('model', 'gpt-image-1');
    formData.append('prompt', prompt);
    formData.append('n', '1');
    formData.append('size', '1024x1024');
    formData.append('response_format', 'b64_json');
    formData.append('quality', quality);

    for (let i = 0; i < inputImages.length; i++) {
      const dataURL = inputImages[i];
      const base64 = dataURL.split(',')[1];
      const byteChars = atob(base64);
      const byteArr = new Uint8Array(byteChars.length);
      for (let j = 0; j < byteChars.length; j++) {
        byteArr[j] = byteChars.charCodeAt(j);
      }
      const blob = new Blob([byteArr], { type: 'image/png' });
      formData.append('image[]', blob, `image${i}.png`);
    }

    const response = await fetch(
      'https://api.openai.com/v1/images/edits',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAIKey_}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error('GPT Image 2 edit error:', err);
      return null;
    }

    const data = await response.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) return null;
    return `data:image/png;base64,${b64}`;

  } catch (err) {
    console.error('GPT Image 2 call failed:', err);
    return null;
  }
}

function arrayBufferToDataUrl(buffer: ArrayBuffer, mimeType = 'image/png'): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return `data:${mimeType};base64,${btoa(binary)}`;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Create Supabase admin client to verify the JWT
    // Using service role key bypasses JWT algorithm issues
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract the JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');

    // Verify user using admin client
    const {
      data: { user },
      error: authError,
    } = await adminClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const FREE_TIER_LIMIT = 10;
    const hasUnlimitedAccess = !!user.email && UNLIMITED_ACCOUNT_EMAILS.has(user.email);

    const { data: usageData } = await adminClient
      .from('usage')
      .select('generation_count')
      .eq('user_id', user.id)
      .eq('month', monthKey)
      .maybeSingle();

    const currentCount = usageData?.generation_count ?? 0;

    if (!hasUnlimitedAccess && currentCount >= FREE_TIER_LIMIT) {
      return new Response(
        JSON.stringify({
          error: 'LIMIT_REACHED',
          message: `You have used all ${FREE_TIER_LIMIT} free generations this month. Upgrade to continue.`,
          count: currentCount,
          limit: FREE_TIER_LIMIT,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const body = await req.json();
    const { model, input, saveToStorage: shouldSaveToStorage = true } = body;

    if (!model || !input) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const ALLOWED_MODELS = [
      'flux-kontext-pro',
      'flux-2-pro',
      'gpt-image-2',
      'two-step-seed',
      'two-step-detected',
    ];
    if (!ALLOWED_MODELS.includes(model)) {
      return new Response(
        JSON.stringify({ error: 'Invalid model' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const MAX_IMAGE_SIZE = 5 * 1024 * 1024 * 1.37;
    const imageStr =
      input.input_image ||
      input.sketchDataURL ||
      (input.input_images?.[0] ?? '');
    if (imageStr.length > MAX_IMAGE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'Image too large' }),
        { status: 413, headers: corsHeaders }
      );
    }

    const replicateKey = Deno.env.get('REPLICATE_API_KEY');
    if (!replicateKey) {
      return new Response(
        JSON.stringify({ error: 'Replicate API key not configured' }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (model === 'two-step-detected') {
      const { sketchDataURL, detection, styleText, userPrompt } = input;
      const detectedSubject = detection?.detected_subject || 'subject';
      const detectedAttributes = detection?.detected_attributes || 'as drawn in the sketch';

      const step1Prompt = `
        Use the uploaded sketch strictly as a pose and silhouette constraint.
        The subject is: ${detectedSubject}.
        Key characteristics: ${detectedAttributes}.

        Transform this sketch into clean, clear, and anatomically correct line art while preserving the exact pose, orientation, proportions, and overall structure.
        Do not rotate, flip, or change the perspective.
        Do not replace the pose with a more standard, generic, or idealized version.
        Enhance only the clarity, anatomy/structure, and line quality.
        Preserve the original gesture, energy, and intent.
        Keep all elements in the same relative positions as in the sketch.
        Output as clean, smooth vector line art with minimal black outlines on a white background.
        No shading, no color, no extra details, no stylistic changes.
        ${userPrompt ? `\nUser Request: ${userPrompt}` : ''}
      `
        .trim()
        .replace(/^\s+/gm, '');

      console.log('Step 1 - Kontext prompt (detected):', step1Prompt);

      const step1Res = await fetch(
        'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions',
        {
          method: 'POST',
          headers: {
            Authorization: `Token ${replicateKey}`,
            'Content-Type': 'application/json',
            Prefer: 'wait=60',
          },
          body: JSON.stringify({
            input: {
              prompt: step1Prompt,
              input_image: sketchDataURL,
              aspect_ratio: '1:1',
              output_format: 'png',
              output_quality: 95,
              safety_tolerance: 2,
            },
          }),
        }
      );

      if (!step1Res.ok) {
        const err = await step1Res.json();
        return new Response(JSON.stringify({ error: err.detail || 'Step 1 failed' }), { status: 500, headers: corsHeaders });
      }

      let step1Prediction = await step1Res.json();
      if (step1Prediction.status !== 'succeeded') {
        step1Prediction = await pollReplicatePrediction(step1Prediction.id, replicateKey);
      }

      if (step1Prediction.status !== 'succeeded') {
        return new Response(JSON.stringify({ error: 'Step 1 generation failed' }), { status: 500, headers: corsHeaders });
      }

      const step1Output = step1Prediction.output;
      const step1ImageURL = Array.isArray(step1Output) ? step1Output[0] : step1Output;
      console.log('Step 1 complete:', step1ImageURL);

      const step1ImageRes = await fetch(step1ImageURL);
      const step1Blob = await step1ImageRes.blob();
      const step1Buffer = await step1Blob.arrayBuffer();
      const step1Base64 = arrayBufferToDataUrl(step1Buffer);

      const step2Prompt = `
        This is a ${detectedSubject}.

        Enhance the line art to the following style:
        ${styleText || 'Photorealistic, highly detailed'}

        Keep exactly:
        - Same pose and body position
        - Same camera angle
        - Same composition and framing

        ${userPrompt ? `\nUser Request: ${userPrompt}` : ''}
      `
        .trim()
        .replace(/^\s+/gm, '');

      console.log('Step 2 - GPT Image prompt (detected):', step2Prompt);

      const gptImageRes = await fetch(
        'https://api.replicate.com/v1/models/openai/gpt-image-2/predictions',
        {
          method: 'POST',
          headers: {
            Authorization: `Token ${replicateKey}`,
            'Content-Type': 'application/json',
            Prefer: 'wait=60',
          },
          body: JSON.stringify({
            input: {
              prompt: step2Prompt,
              input_images: [step1Base64],
              quality: 'medium',
              aspect_ratio: '1:1',
              output_format: 'png',
              background: 'opaque',
            },
          }),
        }
      );

      if (!gptImageRes.ok) {
        console.error('Step 2 GPT Image failed');
        const finalImageURL = await saveToStorage(step1ImageURL, user.id, adminClient);
        await adminClient.from('usage').upsert(
          { user_id: user.id, month: monthKey, generation_count: currentCount + 1, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,month' }
        );
        return new Response(JSON.stringify({ success: true, imageURL: finalImageURL }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      let gptImagePrediction = await gptImageRes.json();
      if (gptImagePrediction.status !== 'succeeded') {
        gptImagePrediction = await pollReplicatePrediction(gptImagePrediction.id, replicateKey);
      }

      const step2Output = gptImagePrediction.output;
      const step2ImageURL = Array.isArray(step2Output) ? step2Output[0] : step2Output;

      if (!step2ImageURL) {
        const finalImageURL = await saveToStorage(step1ImageURL, user.id, adminClient);
        await adminClient.from('usage').upsert(
          { user_id: user.id, month: monthKey, generation_count: currentCount + 1, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,month' }
        );
        return new Response(JSON.stringify({ success: true, imageURL: finalImageURL }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      console.log('Step 2 complete:', step2ImageURL);
      const permanentURL = await saveToStorage(step2ImageURL, user.id, adminClient);

      await adminClient.from('usage').upsert(
        { user_id: user.id, month: monthKey, generation_count: currentCount + 1, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,month' }
      );

      return new Response(JSON.stringify({ success: true, imageURL: permanentURL }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (model === 'two-step-seed') {
      const {
        sketchDataURL,
        seedBase64,
        detection,
        styleText,
        userPrompt,
      } = input;

      const detectedSubject = detection?.detected_subject || 'subject';
      const detectedAttributes = detection?.detected_attributes || 'as drawn in the sketch';

      const step1Prompt = `
        Use the uploaded sketch strictly as a pose and silhouette constraint.
        The subject is: ${detectedSubject}.
        Key characteristics: ${detectedAttributes}.

        Transform this sketch into clean, clear, and anatomically correct line art while preserving the exact pose, orientation, proportions, and overall structure.
        Do not rotate, flip, or change the perspective.
        Do not replace the pose with a more standard, generic, or idealized version.
        Enhance only the clarity, anatomy/structure, and line quality.
        Preserve the original gesture, energy, and intent.
        Keep all elements in the same relative positions as in the sketch.
        Output as clean, smooth vector line art with minimal black outlines on a white background.
        No shading, no color, no extra details, no stylistic changes.
        ${userPrompt ? `User Request: ${userPrompt}` : ''}
      `
        .trim()
        .replace(/^\s+/gm, '');

      console.log('Step 1 - Kontext prompt:', step1Prompt);

      const step1Res = await fetch(
        'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions',
        {
          method: 'POST',
          headers: {
            Authorization: `Token ${replicateKey}`,
            'Content-Type': 'application/json',
            Prefer: 'wait=60',
          },
          body: JSON.stringify({
            input: {
              prompt: step1Prompt,
              input_image: sketchDataURL,
              aspect_ratio: '1:1',
              output_format: 'png',
              output_quality: 95,
              safety_tolerance: 2,
            },
          }),
        }
      );

      if (!step1Res.ok) {
        const err = await step1Res.json();
        return new Response(
          JSON.stringify({
            error: err.detail || 'Step 1 failed',
          }),
          { status: 500, headers: corsHeaders }
        );
      }

      let step1Prediction = await step1Res.json();

      if (step1Prediction.status !== 'succeeded') {
        step1Prediction = await pollReplicatePrediction(
          step1Prediction.id,
          replicateKey
        );
      }

      if (step1Prediction.status !== 'succeeded') {
        return new Response(
          JSON.stringify({ error: 'Step 1 generation failed' }),
          { status: 500, headers: corsHeaders }
        );
      }

      const step1Output = step1Prediction.output;
      const step1ImageURL = Array.isArray(step1Output)
        ? step1Output[0]
        : step1Output;

      console.log('Step 1 complete:', step1ImageURL);

      const step1ImageRes = await fetch(step1ImageURL);
      const step1Blob = await step1ImageRes.blob();
      const step1Buffer = await step1Blob.arrayBuffer();
      const step1Base64 = arrayBufferToDataUrl(step1Buffer);

      const step2Prompt = `
        This is a ${detectedSubject}.

        Enhance the line art to the following style:
        ${styleText || 'Photorealistic, highly detailed'}

        Keep exactly:
        - Same pose and body position
        - Same camera angle
        - Same composition and framing

        ${userPrompt ? `User Request: ${userPrompt}` : ''}
      `
        .trim()
        .replace(/^\s+/gm, '');

      console.log('Step 2 - GPT Image prompt:', step2Prompt);

      const gptImageRes = await fetch(
        'https://api.replicate.com/v1/models/openai/gpt-image-2/predictions',
        {
          method: 'POST',
          headers: {
            Authorization: `Token ${replicateKey}`,
            'Content-Type': 'application/json',
            Prefer: 'wait=60',
          },
          body: JSON.stringify({
            input: {
              prompt: step2Prompt,
              input_images: [step1Base64, seedBase64],
              quality: 'medium',
              aspect_ratio: '1:1',
              output_format: 'png',
              background: 'opaque',
            },
          }),
        }
      );

      if (!gptImageRes.ok) {
        const errText = await gptImageRes.text();
        console.error('Step 2 GPT Image failed:', errText);
        console.error('Step 2 failed, using step 1 result');
        const finalImageURL = await saveToStorage(
          step1ImageURL,
          user.id,
          adminClient
        );

        await adminClient.from('usage').upsert(
          {
            user_id: user.id,
            month: monthKey,
            generation_count: currentCount + 1,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,month' }
        );

        return new Response(
          JSON.stringify({ success: true, imageURL: finalImageURL }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      let gptImagePrediction = await gptImageRes.json();

      if (gptImagePrediction.status !== 'succeeded') {
        gptImagePrediction = await pollReplicatePrediction(
          gptImagePrediction.id,
          replicateKey
        );
      }

      const step2Output = gptImagePrediction.output;
      const step2ImageURL = Array.isArray(step2Output)
        ? step2Output[0]
        : step2Output;

      if (!step2ImageURL) {
        const finalImageURL = await saveToStorage(
          step1ImageURL,
          user.id,
          adminClient
        );

        await adminClient.from('usage').upsert(
          {
            user_id: user.id,
            month: monthKey,
            generation_count: currentCount + 1,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,month' }
        );

        return new Response(
          JSON.stringify({ success: true, imageURL: finalImageURL }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      console.log('Step 2 complete:', step2ImageURL);

      const permanentURL = await saveToStorage(
        step2ImageURL,
        user.id,
        adminClient
      );

      await adminClient.from('usage').upsert(
        {
          user_id: user.id,
          month: monthKey,
          generation_count: currentCount + 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,month' }
      );

      return new Response(
        JSON.stringify({ success: true, imageURL: permanentURL }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    let replicateURL: string;
    if (model === 'flux-kontext-pro') {
      replicateURL = 'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions';
    } else if (model === 'flux-2-pro') {
      replicateURL = 'https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro/predictions';
    } else if (model === 'gpt-image-2') {
      replicateURL = 'https://api.replicate.com/v1/models/openai/gpt-image-2/predictions';
    } else {
      return new Response(JSON.stringify({ error: `Unknown model: ${model}` }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const startResponse = await fetch(replicateURL, {
      method: 'POST',
      headers: {
        Authorization: `Token ${replicateKey}`,
        'Content-Type': 'application/json',
        Prefer: 'wait=60',
      },
      body: JSON.stringify({ input }),
    });

    if (!startResponse.ok) {
      const err = await startResponse.json();
      return new Response(
        JSON.stringify({
          error: err.detail || `Replicate error: ${startResponse.status}`,
        }),
        { status: startResponse.status, headers: corsHeaders }
      );
    }

    let prediction = await startResponse.json();

    if (prediction.status !== 'succeeded') {
      prediction = await pollReplicatePrediction(prediction.id, replicateKey);
    }

    if (prediction.status !== 'succeeded') {
      return new Response(
        JSON.stringify({ error: prediction.error || 'Generation failed' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const output = prediction.output;
    let replicateImageURL: string;
    if (typeof output === 'string') {
      replicateImageURL = output;
    } else if (Array.isArray(output)) {
      replicateImageURL = output[0];
    } else {
      return new Response(JSON.stringify({ error: 'No image in response' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    let permanentURL = replicateImageURL;

    if (shouldSaveToStorage) {
      permanentURL = await saveToStorage(replicateImageURL, user.id, adminClient);
    }

    await adminClient
      .from('usage')
      .upsert(
        {
          user_id: user.id,
          month: monthKey,
          generation_count: currentCount + 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,month' }
      );

    if (hasUnlimitedAccess) {
      console.log(`Unlimited account ${user.id} usage tracked: ${currentCount + 1}`);
    } else {
      console.log(`User ${user.id} usage: ${currentCount + 1}/${FREE_TIER_LIMIT}`);
    }

    return new Response(JSON.stringify({ success: true, imageURL: permanentURL }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

