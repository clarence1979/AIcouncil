import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey, x-supabase-auth",
};

interface RequestBody {
  characterName: string;
  apiKey: string;
  customDescription?: string;
  customTraits?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { characterName, apiKey, customDescription, customTraits }: RequestBody = await req.json();

    if (!characterName || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Character name and API key are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let description = customDescription || "";
    let traits = customTraits || [];
    let imageUrl = "";

    let speakingStyle = "";
    let catchphrases: string[] = [];
    let mannerisms: string[] = [];
    let voiceCharacteristics: any = null;

    if (!customDescription || !customTraits) {
      const researchResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a character research assistant. Provide comprehensive personality analysis for the given character. Return ONLY valid JSON with no markdown formatting."
            },
            {
              role: "user",
              content: `Research the character: ${characterName}. Provide a detailed analysis of how they think, speak, and act.

Return a JSON object with:
{
  "description": "brief 2-3 sentence description of who they are",
  "traits": ["5-7 key personality traits"],
  "speakingStyle": "detailed description of how they speak, their tone, vocabulary, sentence structure, and communication style",
  "catchphrases": ["3-5 famous quotes or characteristic phrases they might say"],
  "mannerisms": ["3-5 behavioral quirks, gestures, or distinctive actions they're known for"],
  "voiceCharacteristics": {
    "gender": "male/female/neutral - based on the character",
    "ageRange": "young/middle/elderly - based on the character's typical age",
    "accent": "describe their accent/dialect (e.g., British RP, American Southern, German, French, Ancient Greek, etc.) based on their origin, time period, and background",
    "suggestedVoice": "choose from: nova (warm female), shimmer (gentle female), alloy (neutral), echo (friendly male), fable (British male), onyx (deep male) - pick the BEST match based on gender, age, and accent",
    "reasoning": "1-2 sentence explanation of why this voice matches the character"
  }
}`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
      });

      if (!researchResponse.ok) {
        throw new Error(`OpenAI research failed: ${researchResponse.statusText}`);
      }

      const researchData = await researchResponse.json();
      const characterData = JSON.parse(researchData.choices[0].message.content);
      description = customDescription || characterData.description;
      traits = customTraits || characterData.traits;
      speakingStyle = characterData.speakingStyle || "";
      catchphrases = characterData.catchphrases || [];
      mannerisms = characterData.mannerisms || [];
      voiceCharacteristics = characterData.voiceCharacteristics || null;
    }

    const imagePrompt = `Portrait of ${characterName}, professional headshot style, detailed face, neutral background, high quality, photorealistic`;
    
    const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
    });

    if (!imageResponse.ok) {
      throw new Error(`DALL-E failed: ${imageResponse.statusText}`);
    }

    const imageData = await imageResponse.json();
    imageUrl = imageData.data[0].url;

    return new Response(
      JSON.stringify({
        name: characterName,
        description,
        traits,
        speakingStyle,
        catchphrases,
        mannerisms,
        imageUrl,
        voiceCharacteristics,
        isCustom: !!(customDescription || customTraits),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Character research error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
