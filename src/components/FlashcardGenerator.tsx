
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Flashcard = {
  question: string;
  answer: string;
};

export default function FlashcardGenerator() {
  const { user } = useAuth();
  const [inputText, setInputText] = useState("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast({ title: "Please enter some text.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/functions/v1/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      let data: any = {};
      try {
        // Only attempt .json if content-type is 'application/json'
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          data = await res.json();
        } else {
          // Attempt to get text for better debugging/error messages
          const asText = await res.text();
          throw new Error(`Invalid response from API: ${asText.slice(0, 200)}`);
        }
      } catch (e: any) {
        throw new Error("Failed to parse server response: " + (e.message || e));
      }

      if (data.error) throw new Error(data.error);
      setFlashcards(data.flashcards || []);
      toast({
        title: "Flashcards generated!",
        description: `${(data.flashcards || []).length} cards created.`
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({ title: "Sign in to save flashcards", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      for (const card of flashcards) {
        await supabase.from("content_items").insert({
          title: card.question,
          type: "notes",
          content: { question: card.question, answer: card.answer },
          user_id: user.id,
          tags: ["flashcard"],
        });
      }
      toast({ title: "Flashcards saved to your library!" });
      setInputText("");
      setFlashcards([]);
    } catch (e: any) {
      toast({ title: "Failed to save flashcards", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <Card className="p-6 space-y-4">
        <Label htmlFor="flashcard-input" className="font-semibold">Paste Text to Generate Flashcards</Label>
        <Textarea
          id="flashcard-input"
          rows={8}
          placeholder="Paste your notes, textbook content, or any educational text..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
        />
        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? "Generating..." : "Generate Flashcards"}
        </Button>
      </Card>
      {flashcards.length > 0 && (
        <Card className="p-4 space-y-3">
          <div className="font-bold text-blue-700 mb-2">Generated Flashcards</div>
          <div className="divide-y divide-gray-200">
            {flashcards.map((card, idx) => (
              <div key={idx} className="py-3">
                <div>
                  <span className="font-semibold">Q:</span> {card.question}
                </div>
                <div>
                  <span className="font-semibold">A:</span> {card.answer}
                </div>
              </div>
            ))}
          </div>
          <Button onClick={handleSave} disabled={saving || !user} className="w-full mt-2">
            {saving ? "Saving..." : "Save All to Library"}
          </Button>
        </Card>
      )}
    </div>
  );
}
