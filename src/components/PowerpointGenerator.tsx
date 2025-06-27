import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Download, FileText, Sparkles } from 'lucide-react';
import { incrementGeminiUsage } from '@/lib/geminiUsage';

// @ts-ignore
import pptxgen from 'pptxgenjs';

const GEMINI_API_KEY = 'AIzaSyC2B0CGruME7Z5AVq7uU8oXzTej5ZiTFaM';

const PowerpointGenerator = () => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pptxUrl, setPptxUrl] = useState<string | null>(null);
  const [chunkCount, setChunkCount] = useState(1);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [slidesPreview, setSlidesPreview] = useState<{ title: string, bullets: string[] }[] | null>(null);
  const [pptxFilename, setPptxFilename] = useState<string>('slides.pptx');

  // Helper to split long text into chunks for Gemini API
  const MAX_CHUNK_SIZE = 2200; // Increased for more reliable Gemini responses
  function splitTextIntoChunks(text: string): string[] {
    if (text.length <= MAX_CHUNK_SIZE) return [text];
    const chunks = [];
    let start = 0;
    while (start < text.length) {
      let end = start + MAX_CHUNK_SIZE;
      // Try to break at a sentence boundary
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const breakPoint = Math.max(lastPeriod, lastNewline);
        if (breakPoint > start + 500) end = breakPoint + 1;
      }
      chunks.push(text.slice(start, end));
      start = end;
    }
    return chunks;
  }

  // Show chunk count as user types
  React.useEffect(() => {
    const chunks = splitTextIntoChunks(inputText.trim());
    setChunkCount(chunks.length);
  }, [inputText]);

  const generateSlides = async () => {
    if (!inputText.trim()) {
      toast({ title: 'Error', description: 'Please paste some text to generate slides.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setPptxUrl(null);
    setCurrentChunk(0);
    try {
      // Split text into chunks if too long
      const textChunks = splitTextIntoChunks(inputText.trim());
      setChunkCount(textChunks.length);
      let allSlides: { title: string, bullets: string[] }[] = [];
      for (let i = 0; i < textChunks.length; i++) {
        setCurrentChunk(i + 1);
        const chunk = textChunks[i];
        // Improved prompt for structure, no repetition, and comprehensive slides
        const prompt = `You are an expert presentation designer. Create a highly structured, non-redundant PowerPoint outline from the following text.\n- Use clear, non-repetitive slide titles.\n- Group related points under the same slide.\n- Avoid repeating topics or slide titles across all slides.\n- Each slide should have a concise title and 3-7 bullet points.\n- Each bullet point should be explanatory, and self-contained, not just a phrase.\n- Make each bullet at least 7-9 words long, so it is easy to understand for someone new to the topic.\n- Cover all important concepts, but do not duplicate content from previous slides.\n- Return JSON in this format: [{title: string, bullets: string[]}].\nText: ${chunk}`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.3, topK: 20, topP: 0.8, maxOutputTokens: 1024 }
            })
          });
        if (!response.ok) throw new Error('Failed to generate slides');
        const data = await response.json();
        // --- Gemini Usage Tracking ---
        // Estimate tokens used: input + output (rough estimate)
        const inputTokens = chunk.length / 4; // 1 token ≈ 4 chars (rough)
        const outputTokens = 1024; // maxOutputTokens
        incrementGeminiUsage(Math.round(inputTokens + outputTokens));
        const slidesText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        // Robust JSON extraction and parsing
        let slidesJson = [];
        try {
          // Try to extract the JSON array from the response
          let jsonMatch = slidesText.match(/\[.*\]/s);
          let jsonString = jsonMatch ? jsonMatch[0] : '[]';
          // Remove trailing commas before ] or } (even inside nested arrays)
          jsonString = jsonString
            .replace(/,\s*([\]\}])/g, '$1') // Remove trailing commas before ] or }
            .replace(/\n/g, ' '); // Remove newlines
          // Remove any text after the last closing bracket
          const lastBracket = Math.max(jsonString.lastIndexOf(']'), jsonString.lastIndexOf('}'));
          if (lastBracket !== -1) jsonString = jsonString.slice(0, lastBracket + 1);
          // If the string is just '[' or too short, treat as empty array
          if (jsonString.trim() === '[' || jsonString.trim().length < 4) {
            slidesJson = [];
          } else {
            slidesJson = JSON.parse(jsonString);
          }
        } catch (e) {
          console.error('Failed to parse Gemini JSON:', slidesText, e);
          toast({
            title: 'AI JSON Error',
            description: `Gemini returned invalid JSON. Raw output: ${slidesText.slice(0, 500)}...`,
            variant: 'destructive',
          });
          throw new Error('AI response was not valid JSON. Please try again or reduce input size.');
        }
        if (!Array.isArray(slidesJson) || slidesJson.length === 0) throw new Error('No slides generated for part ' + (i + 1));
        allSlides = allSlides.concat(slidesJson);
      }
      // Remove duplicate slide titles (case-insensitive)
      const seenTitles = new Set<string>();
      const uniqueSlides = allSlides.filter(slide => {
        const titleKey = slide.title.trim().toLowerCase();
        if (seenTitles.has(titleKey)) return false;
        seenTitles.add(titleKey);
        return true;
      });
      setSlidesPreview(uniqueSlides); // Set preview for browser view
      setCurrentChunk(chunkCount); // Ensure progress bar is full at end
      // Step 2: Generate PPTX file in browser using PptxGenJS
      const pptxInstance = new pptxgen();
      // Helper to split bullets into chunks of max 7 per slide
      function chunkBullets(bullets: string[], size: number) {
        const chunks = [];
        for (let i = 0; i < bullets.length; i += size) {
          chunks.push(bullets.slice(i, i + size));
        }
        return chunks;
      }
      uniqueSlides.forEach((slide: { title: string, bullets: string[] }, slideIdx) => {
        const bulletChunks = chunkBullets(slide.bullets, 7);
        bulletChunks.forEach((bullets, chunkIdx) => {
          const slideObj = pptxInstance.addSlide();
          slideObj.background = { fill: 'F7F9FB' };
          slideObj.addShape('rect', { x: 0, y: 0, w: 10, h: 0.25, fill: { color: '6C63FF' }, line: { color: 'FFFFFF', width: 0 } });
          // Add (cont.) to title if this is a continuation
          const titleText = chunkIdx === 0 ? slide.title : `${slide.title} (cont.)`;
          // Decrease title font size
          slideObj.addText(titleText, {
            x: 0.6, y: 0.35, w: 8.5, h: 1,
            fontSize: 24, // was 32
            bold: true, color: '2B3674', align: 'left', fontFace: 'Segoe UI', margin: 0.1
          });
          slideObj.addShape('rect', { x: 0.7, y: 1.2, w: 0.15, h: Math.max(0.5 * bullets.length, 2.5), fill: { color: '6C63FF' }, line: { color: 'FFFFFF', width: 0 } });
          // Decrease base font size for all bullets and increase spacing
          let fontSize = 13; // Decreased font size
          let bulletSpacing = 0.6; // Increased spacing for better readability
          if (bullets.length > 5) {
            fontSize = 12;
            bulletSpacing = 0.5;
          }
          if (bullets.length > 6) {
            fontSize = 11;
            bulletSpacing = 0.42;
          }
          const bulletStartY = 1.2;
          bullets.forEach((bullet, idx) => {
            // If bullet is very long, reduce font size for that bullet
            let thisFontSize = fontSize;
            if (bullet.length > 120) thisFontSize = Math.max(fontSize - 2, 9);
            slideObj.addText(bullet, {
              x: 1.0,
              y: bulletStartY + idx * bulletSpacing,
              w: 7.8,
              h: 0.5,
              fontSize: thisFontSize,
              color: '363636',
              fontFace: 'Segoe UI',
              bullet: true,
              align: 'left',
              margin: 0.1,
              lineSpacing: 24
            });
          });
          // Footer with slide number (across all generated slides)
          slideObj.addText(`Slide`, {
            x: 0, y: 6.7, w: 10, h: 0.3,
            fontSize: 12, color: 'A0A0A0', align: 'center', fontFace: 'Segoe UI'
          });
        });
      });
      const blob = await pptxInstance.write('blob' as any);
      const realBlob = blob instanceof Blob ? blob : new Blob([blob]);
      const url = URL.createObjectURL(realBlob);
      // AI-generate a filename from the first slide title or input text
      let aiFilename = 'slides.pptx';
      if (uniqueSlides.length > 0 && uniqueSlides[0].title) {
        aiFilename = uniqueSlides[0].title
          .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
          .replace(/\s+/g, '_') // Spaces to underscores
          .slice(0, 40) // Limit length
          + '.pptx';
      } else if (inputText.trim().length > 0) {
        aiFilename = inputText.trim().split(/\s+/).slice(0, 6).join('_').replace(/[^a-zA-Z0-9_]/g, '') + '.pptx';
      }
      setPptxFilename(aiFilename);
      setPptxUrl(url);
      toast({ title: 'Success', description: `Slides generated from ${chunkCount} part${chunkCount > 1 ? 's' : ''}! Click download to save your PPTX.` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to generate slides.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setCurrentChunk(0);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="w-5 h-5 text-purple-500" /> PowerPoint Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {pptxUrl && (
          <a href={pptxUrl} download={pptxFilename}>
            <Button variant="outline" className="w-full flex items-center gap-2 mb-4">
              <Download className="w-5 h-5" /> Download PPTX
            </Button>
          </a>
        )}
        <div className="space-y-2">
          <Label htmlFor="pptx-input" className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> Paste your text
          </Label>
          <Textarea
            id="pptx-input"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Paste your study material or notes here..."
            className="min-h-[120px]"
          />
          {chunkCount > 1 && (
            <div className="text-xs text-orange-600 mt-1">This text will be divided into <b>{chunkCount}</b> parts for slide generation.</div>
          )}
        </div>
        <Button onClick={generateSlides} disabled={isLoading || !inputText.trim()} className="w-full flex items-center gap-2">
          {isLoading ? (
            <span className="animate-spin mr-2"><Sparkles className="w-5 h-5 text-purple-500" /></span>
          ) : (
            <Sparkles className="w-5 h-5 text-purple-500" />
          )}
          Generate Slides
        </Button>
        {isLoading && chunkCount > 1 && (
          <div className="w-full bg-gray-100 rounded-full h-3 mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-400 to-purple-400 h-3 transition-all duration-300"
              style={{ width: `${Math.round((currentChunk / chunkCount) * 100)}%` }}
            />
          </div>
        )}
        {slidesPreview && (
          <div className="mt-6 border rounded-lg bg-gray-50 p-4">
            <div className="mb-2 text-sm font-semibold text-gray-700">Preview Slides ({slidesPreview.length})</div>
            <div className="space-y-6">
              {slidesPreview.map((slide, idx) => (
                <div key={idx} className="border-b last:border-b-0 pb-4 last:pb-0">
                  <div className="font-bold text-lg text-blue-900 mb-1">{slide.title}</div>
                  <ul className="list-disc pl-6 text-gray-800">
                    {slide.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PowerpointGenerator;
