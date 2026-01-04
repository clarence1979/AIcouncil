import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { action, apiKey, data } = await req.json();

    if (!apiKey) {
      throw new Error("API key is required");
    }

    if (action === "test") {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );

      return new Response(
        JSON.stringify({ success: response.ok }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (action === "chat") {
      let { model, systemInstruction, contents, generationConfig } = data;

      // Remove -latest suffix if present (API doesn't use it)
      model = model.replace(/-latest$/, '');

      let finalContents = contents;
      if (systemInstruction && systemInstruction.parts) {
        finalContents = [
          {
            role: 'user',
            parts: systemInstruction.parts
          },
          {
            role: 'model',
            parts: [{ text: 'Understood. I will follow these instructions.' }]
          },
          ...contents
        ];
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: finalContents,
            generationConfig
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Gemini API request failed");
      }

      return new Response(
        JSON.stringify(result),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    throw new Error("Invalid action");
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});