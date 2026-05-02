const fs = require('fs');
const file = 'supabase/functions/generate/index.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove pollReplicatePrediction
code = code.replace(/async function pollReplicatePrediction[\s\S]*?return \{ status: 'failed', error: 'Timed out' \};\n\}/, '');

// 2. Update callGPTImage2
const newCallGPTImage2 = `async function callGPTImage2(
  prompt: string,
  inputImages: string[],
  openAIKey: string,
  quality: 'low' | 'medium' | 'high' = 'medium'
): Promise<string | null> {
  try {
    if (inputImages.length === 0) {
      const response = await fetch(
        'https://api.openai.com/v1/images/generations',
        {
          method: 'POST',
          headers: {
            Authorization: \`Bearer \${openAIKey}\`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-image-2',
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
      return \`data:image/png;base64,\${data.data?.[0]?.b64_json}\`;
    }

    const formData = new FormData();
    formData.append('model', 'gpt-image-2');
    formData.append('prompt', prompt);
    formData.append('n', '1');
    formData.append('size', '1024x1024');
    formData.append('response_format', 'b64_json');
    if (quality) formData.append('quality', quality);

    const getBlob = (dataURL: string) => {
      const base64 = dataURL.split(',')[1];
      const byteChars = atob(base64);
      const byteArr = new Uint8Array(byteChars.length);
      for (let j = 0; j < byteChars.length; j++) {
        byteArr[j] = byteChars.charCodeAt(j);
      }
      return new Blob([byteArr], { type: 'image/png' });
    };

    formData.append('image', getBlob(inputImages[0]), 'image.png');
    
    if (inputImages.length > 1) {
      formData.append('mask', getBlob(inputImages[1]), 'mask.png');
    }

    const response = await fetch(
      'https://api.openai.com/v1/images/edits',
      {
        method: 'POST',
        headers: {
          Authorization: \`Bearer \${openAIKey}\`,
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
    return \`data:image/png;base64,\${b64}\`;

  } catch (err) {
    console.error('GPT Image 2 call failed:', err);
    return null;
  }
}`;

code = code.replace(/async function callGPTImage2[\s\S]*?console\.error\('GPT Image 2 call failed:', err\);\n    return null;\n  \}\n\}/, newCallGPTImage2);

// 3. Replace replicateKey with openAIKey at the top of the request
code = code.replace(/const replicateKey = Deno\.env\.get\('REPLICATE_API_KEY'\);\s*if \(!replicateKey\) \{[\s\S]*?\}\s*\}\s*if \(model === 'two-step-detected'\)/, 
`const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (model === 'two-step-detected')`);

// 4. Update two-step-detected
const twoStepDetectedOld = /if \(model === 'two-step-detected'\) \{[\s\S]*?return new Response\(JSON\.stringify\(\{ success: true, imageURL: permanentURL \}\), \{ status: 200, headers: \{ \.\.\.corsHeaders, 'Content-Type': 'application\/json' \} \}\);\n    \}/;

const twoStepDetectedNew = `if (model === 'two-step-detected') {
      const { sketchDataURL, detection, userPrompt } = input;

      const step1Prompt = \`
        \${detection.safe_prompt}
        Visible features: \${(detection.visible_features || []).join(', ')}.

        CRITICAL REQUIREMENTS:
        - Preserve exact pose and structure from the input sketch precisely
        - Photorealistic render
        - NOT a toy, figurine, or sculpture
        - NOT plastic, smooth, or sculpted
        - Real \${detection.shape_description} with natural textures and anatomy
        - Natural studio lighting
        - Clean white background
        - High quality, detailed
        \${userPrompt ? \`\\nUser Request: \${userPrompt}\` : ''}
      \`.trim();

      console.log('Step 1 - GPT Image prompt (detected):', step1Prompt);

      const step1ImageURL = await callGPTImage2(step1Prompt, [sketchDataURL], openAIKey, 'medium');
      if (!step1ImageURL) {
        return new Response(JSON.stringify({ error: 'Step 1 generation failed' }), { status: 500, headers: corsHeaders });
      }

      console.log('Step 1 complete');

      const step2Prompt = \`
        This is a \${detection.shape_description}.

        Enhance into stunning photorealism:
        - Natural textures (feathers/fur/scales/skin)
        - Cinematic lighting and shadows
        - Fine anatomical detail
        - Professional photography quality

        Keep exactly:
        - Same pose and body position
        - Same camera angle
        - Same composition and framing

        White background.
        National Geographic photo quality.
        \${userPrompt ? \`\\nUser Request: \${userPrompt}\` : ''}
      \`.trim();

      console.log('Step 2 - GPT Image prompt (detected):', step2Prompt);

      const step2ImageURL = await callGPTImage2(step2Prompt, [step1ImageURL], openAIKey, 'medium');

      if (!step2ImageURL) {
        console.error('Step 2 failed, using step 1 result');
        const finalImageURL = await saveToStorage(step1ImageURL, user.id, adminClient);
        await adminClient.from('usage').upsert(
          { user_id: user.id, month: monthKey, generation_count: currentCount + 1, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,month' }
        );
        return new Response(JSON.stringify({ success: true, imageURL: finalImageURL }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      console.log('Step 2 complete');
      const permanentURL = await saveToStorage(step2ImageURL, user.id, adminClient);

      await adminClient.from('usage').upsert(
        { user_id: user.id, month: monthKey, generation_count: currentCount + 1, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,month' }
      );

      return new Response(JSON.stringify({ success: true, imageURL: permanentURL }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }`;

code = code.replace(twoStepDetectedOld, twoStepDetectedNew);

// 5. Update two-step-seed
const twoStepSeedOld = /if \(model === 'two-step-seed'\) \{[\s\S]*?return new Response\(\n        JSON\.stringify\(\{ success: true, imageURL: permanentURL \}\),\n        \{\n          status: 200,\n          headers: \{\n            \.\.\.corsHeaders,\n            'Content-Type': 'application\/json',\n          \},\n        \}\n      \);\n    \}/;

const twoStepSeedNew = `if (model === 'two-step-seed') {
      const {
        sketchDataURL,
        seedBase64,
        detection,
        styleText,
        userPrompt,
      } = input;

      const detectedSubject = detection?.shape_description || 'shape';
      const detectedSafePrompt = detection?.safe_prompt || 'a shape';
      const detectedFeatures = (detection?.visible_features || []).join(', ');

      const step1Prompt = \`
        \${detectedSafePrompt}
        Visible features: \${detectedFeatures}

        CRITICAL REQUIREMENTS:
        - Preserve exact pose and structure from the input sketch precisely
        - Photorealistic render
        - NOT a toy, figurine, or sculpture
        - NOT plastic, smooth, or sculpted
        - Real \${detectedSubject} with natural textures and anatomy
        - Natural studio lighting
        - Clean white background
        - High quality, detailed
        \${userPrompt ? \`User Request: \${userPrompt}\` : ''}
      \`
        .trim()
        .replace(/\\s+/g, ' ');

      console.log('Step 1 - GPT Image prompt:', step1Prompt);

      const step1ImageURL = await callGPTImage2(step1Prompt, [sketchDataURL], openAIKey, 'medium');
      if (!step1ImageURL) {
        return new Response(
          JSON.stringify({ error: 'Step 1 generation failed' }),
          { status: 500, headers: corsHeaders }
        );
      }

      console.log('Step 1 complete');

      const step2Prompt = \`
        This is a \${detectedSubject}.

        Enhance into stunning photorealism:
        - Natural textures (feathers/fur/scales/skin)
        - Cinematic lighting and shadows
        - Fine anatomical detail
        - Professional photography quality

        Keep exactly:
        - Same pose and body position
        - Same camera angle
        - Same composition and framing

        White background.
        National Geographic photo quality.
        \${userPrompt ? \`User Request: \${userPrompt}\` : ''}
      \`
        .trim()
        .replace(/\\s+/g, ' ');

      console.log('Step 2 - GPT Image prompt:', step2Prompt);

      const step2ImageURL = await callGPTImage2(step2Prompt, [step1ImageURL, seedBase64], openAIKey, 'medium');

      if (!step2ImageURL) {
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

      console.log('Step 2 complete');

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
    }`;

code = code.replace(twoStepSeedOld, twoStepSeedNew);

// 6. Remove remaining Replicate fallback blocks and replace with gpt-image-2 directly if model is unknown or direct
const oldFallback = /let replicateURL: string;[\s\S]*?return new Response\(JSON\.stringify\(\{ error: 'Internal server error' \}\), \{\n      status: 500,\n      headers: corsHeaders,\n    \}\);\n  \}\n\}\);/;

const newFallback = \`if (model === 'gpt-image-2') {
      const generatedURL = await callGPTImage2(
        input.prompt, 
        input.input_images || (input.input_image ? [input.input_image] : []), 
        openAIKey, 
        'high'
      );
      
      if (!generatedURL) {
        return new Response(
          JSON.stringify({ error: 'Generation failed' }),
          { status: 500, headers: corsHeaders }
        );
      }

      let permanentURL = generatedURL;
      if (shouldSaveToStorage) {
        permanentURL = await saveToStorage(generatedURL, user.id, adminClient);
      }

      await adminClient.from('usage').upsert(
        {
          user_id: user.id,
          month: monthKey,
          generation_count: currentCount + 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,month' }
      );

      if (hasUnlimitedAccess) {
        console.log(\\\`Unlimited account \\\${user.id} usage tracked: \\\${currentCount + 1}\\\`);
      } else {
        console.log(\\\`User \\\${user.id} usage: \\\${currentCount + 1}/\\\${FREE_TIER_LIMIT}\\\`);
      }

      return new Response(JSON.stringify({ success: true, imageURL: permanentURL }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    } else {
      return new Response(JSON.stringify({ error: \\\`Unknown model: \\\${model}\\\` }), {
        status: 400,
        headers: corsHeaders,
      });
    }
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});\`;

code = code.replace(oldFallback, newFallback);

fs.writeFileSync(file, code);
console.log('Patched index.ts successfully');
