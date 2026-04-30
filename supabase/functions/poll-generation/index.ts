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
    const { predictionId, guestToken } = body;

    if (!predictionId || !guestToken) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const replicateKey = Deno.env.get('REPLICATE_API_KEY');
    if (!replicateKey) {
      return new Response(
        JSON.stringify({ error: 'Service unavailable' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Check prediction status once
    const pollResponse = await fetch(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      { headers: { Authorization: `Token ${replicateKey}` } }
    );

    if (!pollResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to check status' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const prediction = await pollResponse.json();

    // Still running — tell frontend to keep polling
    if (prediction.status === 'starting' || prediction.status === 'processing') {
      return new Response(
        JSON.stringify({ status: 'processing' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Failed
    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      return new Response(
        JSON.stringify({ error: 'Generation failed', status: 'failed' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Succeeded — upload to storage and record usage
    if (prediction.status === 'succeeded') {
      const output = prediction.output;
      const imageURL = Array.isArray(output) ? output[0] : output;

      const adminClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

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

        await adminClient.from('guest_generations').insert({
          guest_token: guestToken,
          image_url: urlData.publicUrl,
        });

        return new Response(
          JSON.stringify({ success: true, imageURL: urlData.publicUrl }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (storageErr) {
        console.error('Storage error:', storageErr);
        // Fallback: record with Replicate URL
        await adminClient.from('guest_generations').insert({
          guest_token: guestToken,
          image_url: imageURL,
        });
        return new Response(
          JSON.stringify({ success: true, imageURL }),
          { status: 200, headers: corsHeaders }
        );
      }
    }

    return new Response(
      JSON.stringify({ status: prediction.status }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error('poll-generation error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
