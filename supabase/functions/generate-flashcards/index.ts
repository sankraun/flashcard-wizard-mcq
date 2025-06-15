
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function generateFlashcardsChunk(text: string) {
  const prompt = `
You are an AI assistant. Take the following learning text and create a list of concise flashcards for student self-testing. Each flashcard should be a question-answer (Q&A) pair, helpful for spaced repetition. Example format:
Q: <question>
A: <answer>
Text to turn into flashcards:
"""${text}"""
Return the flashcards as a JSON array: [{ "question": "...", "answer": "..." }, ...]
  `;

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + geminiApiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      let errText: string = "";
      try { errText = await response.text(); } catch {}
      return { error: `Gemini API error: ${response.status} ${errText}` };
    }

    const result = await response.json();
    let text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = null;
    }

    if (Array.isArray(data)) return { flashcards: data };
    if (data && typeof data === "object" && data.flashcards) return { flashcards: data.flashcards };
    if (typeof text === "string") {
      const cards: any[] = [];
      const qas = text.split(/^Q:/gm).map(s => s.trim()).filter(Boolean);
      for (let qaChunk of qas) {
        const [questionPart, ...rest] = qaChunk.split(/^A:/gm);
        if (rest.length) {
          cards.push({
            question: questionPart.trim(),
            answer: rest.join("A:").trim()
          });
        }
      }
      if (cards.length) return { flashcards: cards };
    }

    return { flashcards: [] };
  } catch (error) {
    return { error: "Exception parsing Gemini response: " + (error && error.message ? error.message : error) };
  }
}

// Defensive top-level try/catch ensuring JSON always returned
serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    let text = "";
    try {
      const body = await req.json();
      text = body?.text || "";
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!text) {
      return new Response(JSON.stringify({ error: "Missing input text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: "Missing Gemini API key in edge function env" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chunks = splitText(text, 2000);
    let allFlashcards: any[] = [];
    for (const chunk of chunks) {
      const result = await generateFlashcardsChunk(chunk);
      if (result.error) {
        // Immediate error return (still JSON)
        return new Response(JSON.stringify({ error: result.error }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (result.flashcards) allFlashcards = allFlashcards.concat(result.flashcards);
    }
    return new Response(JSON.stringify({ flashcards: allFlashcards }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    let msg = "Unknown error";
    try {
      msg = error && error.message ? error.message : JSON.stringify(error);
    } catch {}
    // Always return a valid JSON response, even in total failure
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function splitText(text: string, maxLen: number = 2000): string[] {
  const chunks = [];
  let current = "";
  for (const line of text.split("\n")) {
    if (current.length + line.length + 1 > maxLen) {
      chunks.push(current);
      current = "";
    }
    current += (current ? "\n" : "") + line;
  }
  if (current) chunks.push(current);
  return chunks;
}
