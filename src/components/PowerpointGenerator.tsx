
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Download, FileText, Sparkles, Save, History } from 'lucide-react';
import { incrementGeminiUsage } from '@/lib/geminiUsage';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// @ts-ignore
import pptxgen from 'pptxgenjs';

const GEMINI_API_KEY = 'AIzaSyC2B0CGruME7Z5AVq7uU8oXzTej5ZiTFaM';

const PowerpointGenerator = () => {
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pptxUrl, setPptxUrl] = useState<string | null>(null);
  const [chunkCount, setChunkCount] = useState(1);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [slidesPreview, setSlidesPreview] = useState<{ title: string, bullets: string[] }[] | null>(null);
  const [pptxFilename, setPptxFilename] = useState<string>('slides.pptx');
  const [presentationTitle, setPresentationTitle] = useState('');

  // Helper to split long text into chunks for Gemini API
  const MAX_CHUNK_SIZE = 2200;
  function splitTextIntoChunks(text: string): string[] {
    if (text.length <= MAX_CHUNK_SIZE) return [text];
    const chunks = [];
    let start = 0;
    while (start < text.length) {
      let end = start + MAX_CHUNK_SIZE;
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

  React.useEffect(() => {
    const chunks = splitTextIntoChunks(inputText.trim());
    setChunkCount(chunks.length);
  }, [inputText]);

  const saveToSupabase = async (slides: { title: string, bullets: string[] }[], title: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('powerpoint_presentations')
        .insert({
          user_id: user.id,
          title: title || 'Untitled Presentation',
          content: { slides }
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: 'Saved',
        description: 'Presentation saved successfully',
      });
      
      return data;
    } catch (error) {
      console.error('Error saving presentation:', error);
      toast({
        title: 'Error',
        description: 'Failed to save presentation',
        variant: 'destructive',
      });
    }
  };

  const generateSlides = async () => {
    if (!inputText.trim()) {
      toast({ title: 'Error', description: 'Please add some content first', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    setPptxUrl(null);
    setCurrentChunk(0);
    
    try {
      const textChunks = splitTextIntoChunks(inputText.trim());
      setChunkCount(textChunks.length);
      let allSlides: { title: string, bullets: string[] }[] = [];
      
      for (let i = 0; i < textChunks.length; i++) {
        setCurrentChunk(i + 1);
        const chunk = textChunks[i];
        
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
        
        const inputTokens = chunk.length / 4;
        const outputTokens = 1024;
        incrementGeminiUsage(Math.round(inputTokens + outputTokens));
        
        const slidesText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        let slidesJson = [];
        try {
          let jsonMatch = slidesText.match(/\[.*\]/s);
          let jsonString = jsonMatch ? jsonMatch[0] : '[]';
          jsonString = jsonString
            .replace(/,\s*([\]\}])/g, '$1')
            .replace(/\n/g, ' ');
          const lastBracket = Math.max(jsonString.lastIndexOf(']'), jsonString.lastIndexOf('}'));
          if (lastBracket !== -1) jsonString = jsonString.slice(0, lastBracket + 1);
          
          if (jsonString.trim() === '[' || jsonString.trim().length < 4) {
            slidesJson = [];
          } else {
            slidesJson = JSON.parse(jsonString);
          }
        } catch (e) {
          console.error('Failed to parse Gemini JSON:', slidesText, e);
          throw new Error('AI response was not valid JSON. Please try again or reduce input size.');
        }
        
        if (!Array.isArray(slidesJson) || slidesJson.length === 0) {
          throw new Error('No slides generated for part ' + (i + 1));
        }
        
        allSlides = allSlides.concat(slidesJson);
      }
      
      const seenTitles = new Set<string>();
      const uniqueSlides = allSlides.filter(slide => {
        const titleKey = slide.title.trim().toLowerCase();
        if (seenTitles.has(titleKey)) return false;
        seenTitles.add(titleKey);
        return true;
      });
      
      setSlidesPreview(uniqueSlides);
      setCurrentChunk(chunkCount);
      
      // Generate presentation title
      const generatedTitle = uniqueSlides.length > 0 ? uniqueSlides[0].title : 'Generated Presentation';
      setPresentationTitle(generatedTitle);
      
      // Save to Supabase
      await saveToSupabase(uniqueSlides, generatedTitle);
      
      // Generate PPTX file
      const pptxInstance = new pptxgen();
      
      function chunkBullets(bullets: string[], size: number) {
        const chunks = [];
        for (let i = 0; i < bullets.length; i += size) {
          chunks.push(bullets.slice(i, i + size));
        }
        return chunks;
      }
      
      uniqueSlides.forEach((slide: { title: string, bullets: string[] }) => {
        const bulletChunks = chunkBullets(slide.bullets, 7);
        bulletChunks.forEach((bullets, chunkIdx) => {
          const slideObj = pptxInstance.addSlide();
          slideObj.background = { fill: 'FFFFFF' };
          
          // Professional header with gradient
          slideObj.addShape('rect', { 
            x: 0, y: 0, w: 10, h: 0.5, 
            fill: { type: 'solid', color: '6366F1' }, 
            line: { color: 'FFFFFF', width: 0 } 
          });
          
          const titleText = chunkIdx === 0 ? slide.title : `${slide.title} (cont.)`;
          slideObj.addText(titleText, {
            x: 0.5, y: 0.7, w: 9, h: 1,
            fontSize: 28, bold: true, color: '1E293B', 
            align: 'left', fontFace: 'Segoe UI', margin: 0.1
          });
          
          // Accent line
          slideObj.addShape('rect', { 
            x: 0.5, y: 1.8, w: 0.1, h: Math.max(0.4 * bullets.length, 3), 
            fill: { color: '6366F1' }, line: { color: 'FFFFFF', width: 0 } 
          });
          
          let fontSize = 16;
          let bulletSpacing = 0.7;
          if (bullets.length > 5) {
            fontSize = 14;
            bulletSpacing = 0.6;
          }
          
          const bulletStartY = 2.0;
          bullets.forEach((bullet, idx) => {
            let thisFontSize = fontSize;
            if (bullet.length > 120) thisFontSize = Math.max(fontSize - 2, 12);
            
            slideObj.addText(bullet, {
              x: 0.8, y: bulletStartY + idx * bulletSpacing, w: 8.5, h: 0.6,
              fontSize: thisFontSize, color: '334155', fontFace: 'Segoe UI',
              bullet: true, align: 'left', margin: 0.1, lineSpacing: 28
            });
          });
          
          // Footer
          slideObj.addText('Generated by Neutron AI', {
            x: 0, y: 7.2, w: 10, h: 0.3,
            fontSize: 10, color: '94A3B8', align: 'center', fontFace: 'Segoe UI'
          });
        });
      });
      
      const blob = await pptxInstance.write('blob' as any);
      const realBlob = blob instanceof Blob ? blob : new Blob([blob]);
      const url = URL.createObjectURL(realBlob);
      
      let aiFilename = 'slides.pptx';
      if (uniqueSlides.length > 0 && uniqueSlides[0].title) {
        aiFilename = uniqueSlides[0].title
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .replace(/\s+/g, '_')
          .slice(0, 40) + '.pptx';
      }
      
      setPptxFilename(aiFilename);
      setPptxUrl(url);
      
      toast({ 
        title: 'Success', 
        description: `Presentation created successfully${chunkCount > 1 ? ` (${chunkCount} sections processed)` : ''}` 
      });
      
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to generate slides', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setCurrentChunk(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-0 shadow-sm">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle className="flex items-center gap-3 text-slate-900 text-xl font-medium">
            <Sparkles className="w-5 h-5 text-slate-600" />
            PowerPoint Generator
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {pptxUrl && (
            <div className="flex gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <a href={pptxUrl} download={pptxFilename} className="flex-1">
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Download Presentation
                </Button>
              </a>
            </div>
          )}
          
          <div className="space-y-3">
            <Label htmlFor="pptx-input" className="text-slate-700 font-medium">
              Content
            </Label>
            <Textarea
              id="pptx-input"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Paste your content here to generate slides..."
              className="min-h-[120px] border-slate-200 focus:border-slate-400 resize-none"
            />
            {chunkCount > 1 && (
              <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-100">
                Will process in {chunkCount} sections
              </div>
            )}
          </div>
          
          <Button 
            onClick={generateSlides} 
            disabled={isLoading || !inputText.trim()} 
            className="w-full bg-slate-900 hover:bg-slate-800 text-white"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Slides
              </div>
            )}
          </Button>
          
          {isLoading && chunkCount > 1 && (
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-slate-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((currentChunk / chunkCount) * 100)}%` }}
              />
            </div>
          )}
          
          {slidesPreview && (
            <div className="border border-slate-200 rounded-lg bg-white">
              <div className="bg-slate-50 p-4 border-b border-slate-200 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-900">Preview</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Save className="w-4 h-4" />
                    {slidesPreview.length} slides
                  </div>
                </div>
              </div>
              <div className="p-4 max-h-80 overflow-y-auto space-y-4">
                {slidesPreview.map((slide, idx) => (
                  <div key={idx} className="border-l-2 border-slate-300 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {idx + 1}
                      </div>
                      <h4 className="font-medium text-slate-900">{slide.title}</h4>
                    </div>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {slide.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-slate-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PowerpointGenerator;
