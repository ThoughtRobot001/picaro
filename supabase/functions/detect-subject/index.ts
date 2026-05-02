import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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
    const { sketchDataURL } = await req.json();

    if (!sketchDataURL) {
      return new Response(JSON.stringify({ error: 'Missing sketchDataURL' }), { status: 400, headers: corsHeaders });
    }

    const replicateKey = Deno.env.get('REPLICATE_API_KEY');
    if (!replicateKey) {
      return new Response(JSON.stringify({ error: 'Missing Replicate API key' }), { status: 500, headers: corsHeaders });
    }

    const prompt = `You are analyzing a rough sketch to help
an AI image generator understand the 
composition.

Look at this sketch carefully and respond
with ONLY a JSON object. No extra text.

Rules:
- ONLY describe what you can clearly see
- Do NOT guess specific species or brands
- Do NOT assume famous versions of things
- Use generic descriptions
- If unsure, describe the SHAPE not the thing

BAD example: "bald eagle" (too specific)
GOOD example: "large bird of prey with 
  wings spread wide"

BAD example: "Ferrari sports car" 
GOOD example: "low sports car, side view"

BAD example: "samurai warrior"
GOOD example: "human figure in wide stance
  holding a long weapon"

{
  "shape_description": "describe the overall shape and silhouette only",
  "visible_features": ["list only clearly visible details"],
  "pose": "describe position/orientation",
  "category": "animal/human/vehicle/object/creature/other",
  "safe_prompt": "a [category] with [shape_description], [pose], photorealistic, white background, highly detailed"
}

Be conservative. Less assumptions = 
better results.`;

    const response = await fetch(
      'https://api.replicate.com/v1/models/anthropic/claude-opus-4.6/predictions',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${replicateKey}`,
          'Content-Type': 'application/json',
          Prefer: 'wait=60'
        },
        body: JSON.stringify({
          input: {
            prompt: prompt,
            image: sketchDataURL,
            max_tokens: 1024
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error('detect-subject replicate error:', err);
      return new Response(JSON.stringify({ error: err.detail || err.error || 'Failed to detect subject' }), { status: 500, headers: corsHeaders });
    }

    let prediction = await response.json();

    // Since we used Prefer: wait=60, it should be succeeded or failed.
    if (prediction.status !== 'succeeded') {
      // Very basic polling fallback just in case
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
          headers: { Authorization: `Token ${replicateKey}` }
        });
        prediction = await pollRes.json();
        if (prediction.status === 'succeeded' || prediction.status === 'failed') break;
      }
    }

    if (prediction.status !== 'succeeded') {
      console.error('detect-subject prediction failed:', prediction);
      return new Response(JSON.stringify({ error: prediction.error || 'Subject detection timed out' }), { status: 500, headers: corsHeaders });
    }

    const outputText = Array.isArray(prediction.output) ? prediction.output.join('') : prediction.output;
    const cleanJson = outputText.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(cleanJson);
      return new Response(JSON.stringify(parsed), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (parseError) {
      console.error('Failed to parse Claude output as JSON:', cleanJson);
      return new Response(
        JSON.stringify({
          shape_description: 'shape drawn in the sketch',
          visible_features: [],
          pose: 'as drawn in sketch',
          category: 'other',
          safe_prompt: 'a shape with features as drawn in the sketch, photorealistic, white background, highly detailed',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (err) {
    console.error('detect-subject error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders });
  }
});
