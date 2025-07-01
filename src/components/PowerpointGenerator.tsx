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
        title: 'Success',
        description: 'Presentation saved to your library!',
      });
      
      return data;
    } catch (error) {
      console.error('Error saving presentation:', error);
      toast({
        title: 'Error',
        description: 'Failed to save presentation to library.',
        variant: 'destructive',
      });
    }
  };

  const generateSlides = async () => {
    if (!inputText.trim()) {
      toast({ title: 'Error', description: 'Please paste some text to generate slides.', variant: 'destructive' });
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
        description: `Professional presentation generated and saved! ${chunkCount > 1 ? `Processed ${chunkCount} sections.` : ''}` 
      });
      
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to generate slides.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setCurrentChunk(0);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto shadow-lg border-0 bg-gradient-to-br from-white to-slate-50">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-xl font-bold">
          <div className="p-2 bg-white/20 rounded-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          Professional PowerPoint Generator
        </CardTitle>
        <p className="text-indigo-100 mt-2">Transform your content into stunning presentations</p>
      </CardHeader>
      
      <CardContent className="space-y-6 p-8">
        {pptxUrl && (
          <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
            <a href={pptxUrl} download={pptxFilename} className="flex-1">
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium shadow-md">
                <Download className="w-5 h-5 mr-2" />
                Download Professional PPTX
              </Button>
            </a>
            <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
              <History className="w-5 h-5" />
            </Button>
          </div>
        )}
        
        <div className="space-y-3">
          <Label htmlFor="pptx-input" className="flex items-center gap-2 text-lg font-semibold text-slate-700">
            <FileText className="w-5 h-5 text-indigo-600" />
            Paste Your Content
          </Label>
          <Textarea
            id="pptx-input"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Paste your study material, notes, or any content here to generate professional slides..."
            className="min-h-[140px] border-2 border-slate-200 focus:border-indigo-500 transition-colors resize-none text-base"
          />
          {chunkCount > 1 && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              This content will be processed in <span className="font-semibold">{chunkCount} optimized sections</span>
            </div>
          )}
        </div>
        
        <Button 
          onClick={generateSlides} 
          disabled={isLoading || !inputText.trim()} 
          className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
        >
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="animate-spin">
                <Sparkles className="w-5 h-5" />
              </div>
              <span>Generating Professional Slides...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5" />
              <span>Generate Professional Slides</span>
            </div>
          )}
        </Button>
        
        {isLoading && chunkCount > 1 && (
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 transition-all duration-500 ease-out"
              style={{ width: `${Math.round((currentChunk / chunkCount) * 100)}%` }}
            />
          </div>
        )}
        
        {slidesPreview && (
          <div className="mt-8 border-2 border-slate-200 rounded-xl bg-white shadow-inner">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-t-xl border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Presentation Preview</h3>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Save className="w-4 h-4" />
                  <span>{slidesPreview.length} slides • Saved to library</span>
                </div>
              </div>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto space-y-6">
              {slidesPreview.map((slide, idx) => (
                <div key={idx} className="border-l-4 border-indigo-500 pl-6 py-4 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <h4 className="text-xl font-bold text-slate-800">{slide.title}</h4>
                  </div>
                  <ul className="space-y-2 text-slate-700">
                    {slide.bullets.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="leading-relaxed">{bullet}</span>
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
  );
};

export default PowerpointGenerator;
