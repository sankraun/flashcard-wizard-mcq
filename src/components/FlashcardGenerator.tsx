import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, RefreshCw, ArrowLeftCircle, ArrowRightCircle, Sparkles, FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface Flashcard {
  question: string;
  answer: string;
}

const apiKey = 'AIzaSyCElPVe4sj1H1phq_5wgbApQWkjllvfz3Y';

const FlashcardGenerator: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [flipped, setFlipped] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);

  // Helper to split long text into chunks
  const MAX_CHUNK_SIZE = 3000; // characters
  const OVERLAP_SIZE = 200;
  const splitTextIntoChunks = (text: string): string[] => {
    if (text.length <= MAX_CHUNK_SIZE) return [text];
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      let end = start + MAX_CHUNK_SIZE;
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const breakPoint = Math.max(lastPeriod, lastNewline);
        if (breakPoint > start + 1000) {
          end = breakPoint + 1;
        }
      }
      chunks.push(text.slice(start, end));
      start = end - OVERLAP_SIZE;
    }
    return chunks;
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setFlashcards([]);
    setFlipped(null);
    setCurrent(0);
    try {
      const textChunks = splitTextIntoChunks(inputText.trim());
      let allCards: Flashcard[] = [];
      for (let i = 0; i < textChunks.length; i++) {
        const prompt = `Generate flashcards (question and answer pairs) from the following text. Format as JSON array: [{\\"question\\":\\"...\\",\\"answer\\":\\"...\\"}]. Text: ${textChunks[i]}`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) {
          const cards = JSON.parse(jsonMatch[0]);
          allCards = [...allCards, ...cards];
        } else {
          setError('Could not parse flashcards from response.');
        }
      }
      setFlashcards(allCards);
    } catch (e) {
      setError('Failed to generate flashcards.');
    }
    setLoading(false);
  };

  // When moving to next/prev, always reset flipped to null before changing current
  const handlePrev = () => {
    setFlipped(null);
    setTimeout(() => setCurrent(c => Math.max(0, c - 1)), 200);
  };
  const handleNext = () => {
    setFlipped(null);
    setTimeout(() => setCurrent(c => Math.min(flashcards.length - 1, c + 1)), 200);
  };

  const chunkCount = splitTextIntoChunks(inputText.trim()).length;
  const isLongText = inputText.length > MAX_CHUNK_SIZE;

  return (
    <Card className="shadow-none border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="border-b pb-4 mb-2 bg-white/80 sticky top-0 z-10">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <BookOpen className="w-5 h-10 text-blue-600" />
          Generate Flashcards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-8 w-full">
          {/* Left: Input */}
          <div className="flex-1 min-w-[280px] space-y-3">
            <Label htmlFor="input-text" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="w-4 h-8 text-blue-600" />
              Study Material
            </Label>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>{inputText.trim().split(/\s+/).length} words</span>
              <span>{inputText.length} chars</span>
              {isLongText && (
                <span className="flex items-center gap-1 text-orange-600">
                  {chunkCount} parts
                </span>
              )}
            </div>
            <Textarea
              id="input-text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Paste your study material here..."
              className="min-h-[160px] rounded-lg border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              disabled={loading}
            />
            <Button
              onClick={handleGenerate}
              disabled={loading || !inputText.trim()}
              variant="default"
              size="lg"
              className="w-full rounded-lg text-base font-semibold flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  Generate Flashcards
                </>
              )}
            </Button>
            {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          </div>
          {/* Right: Flashcard Practice */}
          <div className="flex-1 min-w-[280px] flex flex-col items-center justify-center">
            {flashcards.length > 0 ? (
              <div className="flex flex-col items-center gap-6 w-full">
                <div
                  className="relative cursor-pointer group w-full max-w-md mx-auto"
                  onClick={() => setFlipped(flipped === current ? null : current)}
                  tabIndex={0}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setFlipped(flipped === current ? null : current)}
                  role="button"
                  aria-pressed={flipped === current}
                >
                  <div className="perspective-1000 w-full h-full" style={{ minHeight: 160 }}>
                    <div className={`relative w-full h-full transition-transform duration-700 ease-in-out [transform-style:preserve-3d] ${flipped === current ? '[transform:rotateY(180deg)]' : ''}`}
                      style={{ minHeight: 160 }}
                    >
                      {/* Front */}
                      <div className="absolute w-full h-full top-0 left-0 [backface-visibility:hidden] z-2">
                        <Card className="w-full h-full flex flex-col items-center justify-center border border-gray-200 bg-white shadow-sm">
                          <CardHeader className="flex flex-row items-center gap-2 pb-1">
                            <ArrowLeftCircle className="text-blue-400 w-5 h-5" />
                            <CardTitle className="text-base font-semibold">Question</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-gray-900 text-lg font-medium text-center">{flashcards[current].question}</div>
                            <div className="text-xs text-gray-400 mt-2 text-center">Click to flip for answer</div>
                          </CardContent>
                        </Card>
                      </div>
                      {/* Back */}
                      <div className="absolute w-full h-full top-0 left-0 [backface-visibility:hidden] [transform:rotateY(180deg)] z-1">
                        <Card className="w-full h-full flex flex-col items-center justify-center border border-green-200 bg-green-50 shadow-sm">
                          <CardHeader className="flex flex-row items-center gap-2 pb-1">
                            <ArrowRightCircle className="text-green-400 w-5 h-5" />
                            <CardTitle className="text-base font-semibold">Answer</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-gray-900 text-lg font-medium text-center">{flashcards[current].answer}</div>
                            <div className="text-xs text-green-400 mt-2 text-center">Click to flip back</div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2 items-center">
                  <Button variant="outline" onClick={handlePrev} disabled={current === 0} className="rounded-md">
                    <ArrowLeftCircle className="w-4 h-4 mr-1" /> Previous
                  </Button>
                  <span className="text-sm text-gray-500 self-center">{current + 1} / {flashcards.length}</span>
                  <Button variant="outline" onClick={handleNext} disabled={current === flashcards.length - 1} className="rounded-md">
                    Next <ArrowRightCircle className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[180px] w-full text-center text-gray-400 text-base font-medium select-none">
                <Sparkles className="w-8 h-8 mb-2 text-blue-200" />
                Generate New Flashcards to Practice
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlashcardGenerator;
