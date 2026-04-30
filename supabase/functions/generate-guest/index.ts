import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { sketchDataURL, guestToken, prompt, style } = body;

    if (!sketchDataURL || !guestToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate guestToken format
    if (!/^[a-z0-9-]{20,50}$/.test(guestToken)) {
      return new Response(
        JSON.stringify({ error: 'Invalid guest token' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if guest token already used
    const { data: existingUse } = await adminClient
      .from('guest_generations')
      .select('id')
      .eq('guest_token', guestToken)
      .single();

    if (existingUse) {
      return new Response(
        JSON.stringify({
          error: 'GUEST_LIMIT_REACHED',
          message: 'Sign up for free to keep creating',
        }),
        { status: 429, headers: corsHeaders }
      );
    }

    // Validate image size (~5MB base64)
    if (sketchDataURL.length > 5 * 1024 * 1024 * 1.37) {
      return new Response(
        JSON.stringify({ error: 'Image too large' }),
        { status: 413, headers: corsHeaders }
      );
    }

    const replicateKey = Deno.env.get('REPLICATE_API_KEY');
    if (!replicateKey) {
      return new Response(
        JSON.stringify({ error: 'Service unavailable' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const stylePrompts: Record<string, string> = {
      photorealistic: 'product photography, studio lighting, clean white background, sharp focus, 4K',
      anime: 'anime style, cel shaded, vibrant colors, clean white background',
      manga: 'manga illustration, clean linework, black and white, bold outlines',
      watercolor: 'watercolor painting, soft colors, white background',
      oilpainting: 'oil painting, classical style, rich brushwork',
      sketch: 'refined pencil sketch, clean linework, white paper',
    };

    const styleText = stylePrompts[style ?? 'photorealistic']
      ?? 'photorealistic, studio lighting, white background';

    const generationPrompt = prompt?.trim()
      ? `${prompt.trim()}, ${styleText}, preserve the exact pose and composition of the sketch`
      : `${styleText}, preserve the exact shape and composition of the sketch`;

    // START the prediction — do NOT wait for it to complete
    const startResponse = await fetch(
      'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${replicateKey}`,
          'Content-Type': 'application/json',
          // No 'Prefer: wait' — return immediately with prediction ID
        },
        body: JSON.stringify({
          input: {
            prompt: generationPrompt,
            input_image: sketchDataURL,
            aspect_ratio: '1:1',
            output_format: 'png',
            output_quality: 90,
            safety_tolerance: 2,
          },
        }),
      }
    );

    if (!startResponse.ok) {
      const err = await startResponse.json();
      return new Response(
        JSON.stringify({ error: err.detail || 'Failed to start generation' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const prediction = await startResponse.json();

    // Return the prediction ID immediately — frontend will poll
    return new Response(
      JSON.stringify({
        status: 'processing',
        predictionId: prediction.id,
      }),
      { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('generate-guest error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
