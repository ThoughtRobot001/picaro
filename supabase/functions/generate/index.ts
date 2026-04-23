import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
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

    const { data: usageData } = await adminClient
      .from('usage')
      .select('generation_count')
      .eq('user_id', user.id)
      .eq('month', monthKey)
      .maybeSingle();

    const currentCount = usageData?.generation_count ?? 0;

    if (currentCount >= FREE_TIER_LIMIT) {
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
    const { model, input, saveToStorage = true } = body;

    if (!model || !input) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const ALLOWED_MODELS = ['flux-kontext-pro', 'flux-2-pro'];
    if (!ALLOWED_MODELS.includes(model)) {
      return new Response(
        JSON.stringify({ error: 'Invalid model' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const MAX_IMAGE_SIZE = 5 * 1024 * 1024 * 1.37;
    const imageStr = input.input_image || (input.input_images?.[0] ?? '');
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

    let replicateURL: string;
    if (model === 'flux-kontext-pro') {
      replicateURL = 'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions';
    } else if (model === 'flux-2-pro') {
      replicateURL = 'https://api.replicate.com/v1/models/black-forest-labs/flux-2-pro/predictions';
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
      prediction = await pollPrediction(prediction.id, replicateKey);
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

    if (saveToStorage) {
      try {
        const imageResponse = await fetch(replicateImageURL);
        const imageBlob = await imageResponse.blob();
        const imageBuffer = await imageBlob.arrayBuffer();

        const filename = `${user.id}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.png`;

        const storageClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { error: uploadError } = await storageClient
          .storage
          .from('picaro-images')
          .upload(filename, imageBuffer, {
            contentType: 'image/png',
            upsert: false,
          });

        if (!uploadError) {
          const { data } = storageClient
            .storage
            .from('picaro-images')
            .getPublicUrl(filename);

          permanentURL = data.publicUrl;
        } else {
          console.error('Storage upload error:', uploadError);
        }
      } catch (storageErr) {
        console.error('Storage error:', storageErr);
      }
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

    console.log(`User ${user.id} usage: ${currentCount + 1}/${FREE_TIER_LIMIT}`);

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

async function pollPrediction(
  id: string,
  apiKey: string,
  maxAttempts = 60,
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
