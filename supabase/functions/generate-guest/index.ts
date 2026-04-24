import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Track guest usage by a simple token
// stored in the request body
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { sketchDataURL, guestToken } = body;

    if (!sketchDataURL || !guestToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate guestToken format (UUID-like)
    if (!/^[a-z0-9-]{20,50}$/.test(guestToken)) {
      return new Response(
        JSON.stringify({ error: 'Invalid guest token' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if this guest token has already been used
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

    // Validate image size
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

    // Run generation with Kontext Pro
    const replicateURL =
      'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions';

    const prompt =
      'Transform this hand-drawn sketch into a photorealistic product photograph. ' +
      'Preserve the exact shape, proportions, and composition of the original sketch. ' +
      'Studio lighting, clean white background, isolated object, sharp focus, 4K, ' +
      'professional product photography.';

    const startResponse = await fetch(replicateURL, {
      method: 'POST',
      headers: {
        Authorization: `Token ${replicateKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=60',
      },
      body: JSON.stringify({
        input: {
          prompt,
          input_image: sketchDataURL,
          aspect_ratio: '1:1',
          output_format: 'png',
          output_quality: 90,
          safety_tolerance: 2,
        },
      }),
    });

    if (!startResponse.ok) {
      const err = await startResponse.json();
      return new Response(
        JSON.stringify({ error: err.detail || 'Generation failed' }),
        { status: 500, headers: corsHeaders }
      );
    }

    let prediction = await startResponse.json();

    // Poll if needed
    if (prediction.status !== 'succeeded') {
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const poll = await fetch(
          `https://api.replicate.com/v1/predictions/${prediction.id}`,
          { headers: { Authorization: `Token ${replicateKey}` } }
        );
        prediction = await poll.json();
        if (
          prediction.status === 'succeeded' ||
          prediction.status === 'failed'
        ) break;
      }
    }

    if (prediction.status !== 'succeeded') {
      return new Response(
        JSON.stringify({ error: 'Generation failed' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const output = prediction.output;
    const imageURL = Array.isArray(output) ? output[0] : output;

    // Save image to storage
    try {
      const imageResponse = await fetch(imageURL);
      const blob = await imageResponse.blob();
      const buffer = await blob.arrayBuffer();
      const filename = `guests/${guestToken}/${Date.now()}.png`;

      await adminClient.storage
        .from('picaro-images')
        .upload(filename, buffer, {
          contentType: 'image/png',
          upsert: false,
        });

      const { data: urlData } = adminClient.storage
        .from('picaro-images')
        .getPublicUrl(filename);

      // Record guest usage AFTER successful generation
      await adminClient.from('guest_generations').insert({
        guest_token: guestToken,
        image_url: urlData.publicUrl,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          imageURL: urlData.publicUrl 
        }),
        { 
          status: 200,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
          }
        }
      );
    } catch (storageErr) {
      console.error('Storage error:', storageErr);
      // Return Replicate URL as fallback
      await adminClient.from('guest_generations').insert({
        guest_token: guestToken,
        image_url: imageURL,
      });
      return new Response(
        JSON.stringify({ success: true, imageURL }),
        { status: 200, headers: corsHeaders }
      );
    }
  } catch (err) {
    console.error('Guest function error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
