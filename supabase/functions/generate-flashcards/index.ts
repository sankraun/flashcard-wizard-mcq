
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
  const result = await response.json();
  try {
    // Parse Gemini response for the first candidate's content
    let text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    // Try parsing as JSON
    let data = JSON.parse(text);
    if (Array.isArray(data)) return data;
    if (typeof data === "object" && data.flashcards) return data.flashcards;
    throw new Error("Could not parse flashcards from Gemini");
  } catch (error) {
    return [];
  }
}

function splitText(text: string, maxLen: number = 2000): string[] {
  // Split on paragraph, sentence, or whitespace boundaries for maxLen
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { text } = await req.json();
    if (!text) throw new Error("Missing input text");
    const chunks = splitText(text, 2000);
    let allFlashcards: any[] = [];
    for (const chunk of chunks) {
      const cards = await generateFlashcardsChunk(chunk);
      allFlashcards = allFlashcards.concat(cards);
    }
    return new Response(JSON.stringify({ flashcards: allFlashcards }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error?.message || error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
