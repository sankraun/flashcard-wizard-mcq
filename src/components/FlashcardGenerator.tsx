
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

type Flashcard = {
  question: string;
  answer: string;
};

export default function FlashcardGenerator() {
  const { user } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [saving, setSaving] = useState(false);

  // For editing new entries
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  const handleAddCard = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast({ title: "Question and answer are required.", variant: "destructive" });
      return;
    }
    setFlashcards([...flashcards, { question: newQuestion.trim(), answer: newAnswer.trim() }]);
    setNewQuestion("");
    setNewAnswer("");
  };

  const handleDeleteCard = (idx: number) => {
    setFlashcards(flashcards.filter((_, i) => i !== idx));
  };

  const handleEditCard = (
    idx: number,
    field: "question" | "answer",
    value: string
  ) => {
    setFlashcards(flashcards.map((card, i) =>
      i === idx ? { ...card, [field]: value } : card
    ));
  };

  const handleSave = async () => {
    if (!user) {
      toast({ title: "Sign in to save flashcards", variant: "destructive" });
      return;
    }
    if (flashcards.length === 0) {
      toast({ title: "No flashcards to save", variant: "destructive" });
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
      setFlashcards([]);
    } catch (e: any) {
      toast({ title: "Failed to save flashcards", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <Label className="font-semibold">Add a Flashcard</Label>
          <Input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Question"
            className="mb-2"
          />
          <Textarea
            rows={2}
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="Answer"
            className="mb-2"
          />
          <Button
            type="button"
            onClick={handleAddCard}
            className="w-full"
            variant="secondary"
          >
            Add Flashcard
          </Button>
        </div>
      </Card>
      {flashcards.length > 0 && (
        <Card className="p-4 space-y-3">
          <div className="font-bold text-blue-700 mb-2">Your Flashcards</div>
          <div className="divide-y divide-gray-200">
            {flashcards.map((card, idx) => (
              <div key={idx} className="py-2 flex gap-2 items-center">
                <Input
                  value={card.question}
                  onChange={e => handleEditCard(idx, "question", e.target.value)}
                  placeholder="Question"
                  className="flex-1"
                />
                <Textarea
                  value={card.answer}
                  onChange={e => handleEditCard(idx, "answer", e.target.value)}
                  rows={2}
                  placeholder="Answer"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => handleDeleteCard(idx)}
                  variant="destructive"
                  size="sm"
                  className="shrink-0"
                >
                  Delete
                </Button>
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
