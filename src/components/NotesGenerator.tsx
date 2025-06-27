import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, RefreshCw, Download, ExternalLink, Scissors, AlertTriangle, Zap } from 'lucide-react';
import jsPDF from 'jspdf';
import { incrementGeminiUsage } from '@/lib/geminiUsage';

const NotesGenerator = () => {
  const [inputText, setInputText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const { user } = useAuth();
  const [apiKey] = useState('AIzaSyCElPVe4sj1H1phq_5wgbApQWkjllvfz3Y');

  // Constants for text chunking
  const MAX_CHUNK_SIZE = 3000; // characters
  const OVERLAP_SIZE = 200; // characters for context overlap

  const splitTextIntoChunks = (text: string): string[] => {
    if (text.length <= MAX_CHUNK_SIZE) {
      return [text];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + MAX_CHUNK_SIZE;
      
      // If this isn't the last chunk, try to break at a sentence boundary
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > start + 1000) { // Ensure chunk is not too small
          end = breakPoint + 1;
        }
      }

      chunks.push(text.slice(start, end));
      start = end - OVERLAP_SIZE; // Add overlap for context
    }

    return chunks;
  };

  const generateNotesForChunk = async (chunk: string, chunkIndex: number, totalChunks: number, previousHeadings: string[] = []) => {
    const prevHeadingsStr = previousHeadings.length > 0
      ? `\n\nHeadings already covered in previous parts: ${previousHeadings.join(', ')}.`
      : '';
    const prompt = `
      Create well-structured, comprehensive notes from the following text chunk (${chunkIndex + 1}/${totalChunks}).
      - Do NOT repeat topics, headings, or content already covered in previous parts.\n${prevHeadingsStr}
      - Do NOT include a summary for this part. Only include a summary at the end of the full notes (if at all).
      - Use clear headings and subheadings
      - Use bullet points for key points
      - Highlight important concepts
      - Ensure logical flow and organization
      
      Text: ${chunk}
      
      Return only the formatted notes content, no additional commentary.
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });
    // --- Gemini Usage Tracking ---
    // Estimate tokens used: input + output (rough estimate)
    const inputTokens = chunk.length / 4; // 1 token ≈ 4 chars (rough)
    const outputTokens = 2048; // maxOutputTokens or estimate
    incrementGeminiUsage(Math.round(inputTokens + outputTokens));

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  };

  // Function to convert markdown-style formatting to HTML
  const formatNotesForDisplay = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold text
      .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Italic text
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')  // H3 headings
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')   // H2 headings
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')   // H1 headings
      .replace(/^- (.*$)/gm, '<li class="ml-4">• $1</li>')                         // Bullet points
      .replace(/\n\n/g, '</p><p class="mb-2">')                                    // Paragraphs
      .replace(/\n/g, '<br/>');                                                     // Line breaks
  };

  // Function to clean markdown for plain text export
  const cleanMarkdownForExport = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold markers but keep text
      .replace(/\*(.*?)\*/g, '$1')      // Remove italic markers but keep text
      .replace(/^#{1,3}\s+/gm, '')      // Remove heading markers
      .replace(/^-\s+/gm, '• ');        // Convert bullet points
  };

  // Helper to extract headings from markdown notes
  const extractHeadings = (text: string): string[] => {
    return (text.match(/^#{1,3} .+/gm) || []).map(h => h.replace(/^#+ /, '').trim());
  };

  // Helper to remove duplicate headings/sections and extra summaries
  const deduplicateNotes = (notesArr: string[]): string => {
    const seenHeadings = new Set<string>();
    let result: string[] = [];
    let summaryLines: string[] = [];
    for (let notes of notesArr) {
      let lines = notes.split('\n');
      let filtered: string[] = [];
      let inSummary = false;
      for (let line of lines) {
        // Detect summary section
        if (/^#+\s*Summary/i.test(line)) {
          inSummary = true;
          summaryLines.push(line);
          continue;
        }
        if (inSummary) {
          summaryLines.push(line);
          continue;
        }
        // Deduplicate headings
        if (/^#{1,3} .+/.test(line)) {
          const heading = line.replace(/^#+ /, '').trim();
          if (seenHeadings.has(heading)) continue;
          seenHeadings.add(heading);
        }
        filtered.push(line);
      }
      result.push(filtered.join('\n'));
    }
    // Only keep one summary at the end (if any)
    let summary = '';
    if (summaryLines.length > 0) {
      summary = '\n# Summary\n' + summaryLines
        .filter(l => !/^#+\s*Summary/i.test(l))
        .join('\n');
    }
    return result.join('\n\n') + summary;
  };

  const generateNotes = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to generate notes",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const textChunks = splitTextIntoChunks(inputText.trim());
      let allGeneratedNotes: string[] = [];
      let allHeadings: string[] = [];

      if (textChunks.length > 1) {
        setProcessingStep(`Processing ${textChunks.length} parts of your text...`);
        
        toast({
          title: "Large Text Detected",
          description: `Your text has been divided into ${textChunks.length} parts for optimal processing`,
        });
      }

      // Process each chunk, passing previous headings
      for (let i = 0; i < textChunks.length; i++) {
        setProcessingStep(`Generating notes for part ${i + 1} of ${textChunks.length}...`);
        try {
          const chunkNotes = await generateNotesForChunk(textChunks[i], i, textChunks.length, allHeadings);
          allGeneratedNotes.push(chunkNotes);
          // Update headings for next chunk
          allHeadings = [...allHeadings, ...extractHeadings(chunkNotes)];
          if (i < textChunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Error processing chunk ${i + 1}:`, error);
          toast({
            title: "Warning",
            description: `Failed to process part ${i + 1}, continuing with other parts...`,
            variant: "destructive"
          });
        }
      }

      if (allGeneratedNotes.length === 0) {
        throw new Error('No notes could be generated from the provided text');
      }

      // Deduplicate repeated headings/sections and summaries
      const combinedNotes = deduplicateNotes(allGeneratedNotes);
      setGeneratedNotes(combinedNotes);
      
      // Auto-generate title if not provided
      if (!noteTitle.trim()) {
        setProcessingStep('Generating title...');
        const titlePrompt = `Generate a short, descriptive title (max 5 words) for notes about: ${inputText.substring(0, 200)}`;
        try {
          const titleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: titlePrompt }] }],
              generationConfig: { temperature: 0.5, maxOutputTokens: 20 }
            })
          });
          if (titleResponse.ok) {
            const titleData = await titleResponse.json();
            const title = titleData.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/[^\w\s]/g, '').trim() || 'Generated Notes';
            setNoteTitle(title);
          }
        } catch (error) {
          console.log('Title generation failed, using default');
          setNoteTitle('Generated Notes');
        }
      }
      
      toast({
        title: "Success!",
        description: `Notes generated successfully from ${textChunks.length > 1 ? `${textChunks.length} text parts` : 'your text'}`,
      });

    } catch (error) {
      console.error('Error generating notes:', error);
      toast({
        title: "Error",
        description: "Failed to generate notes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setProcessingStep('');
    }
  };

  const saveNotes = async () => {
    if (!generatedNotes.trim() || !noteTitle.trim()) {
      toast({
        title: "Error",
        description: "Please generate notes and provide a title before saving",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save notes",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      console.log('Saving notes to Supabase...', {
        user_id: user.id,
        title: noteTitle,
        content: generatedNotes,
        original_text: inputText
      });

      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: noteTitle,
          content: generatedNotes,
          original_text: inputText
        })
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Notes saved successfully:', data);

      toast({
        title: "Success!",
        description: "Notes saved successfully",
      });

      // Clear the form
      setInputText('');
      setNoteTitle('');
      setGeneratedNotes('');

    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: "Error",
        description: "Failed to save notes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const exportToPDF = () => {
    if (!generatedNotes.trim()) {
      toast({
        title: "Error",
        description: "No notes to export",
        variant: "destructive"
      });
      return;
    }

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;
    let yPosition = margin;

    // Add title with bold formatting
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    const title = noteTitle || 'Generated Notes';
    pdf.text(title, margin, yPosition);
    yPosition += lineHeight * 2;

    // Process content with basic formatting
    pdf.setFontSize(12);
    const cleanedNotes = cleanMarkdownForExport(generatedNotes);
    const lines = pdf.splitTextToSize(cleanedNotes, pageWidth - 2 * margin);
    
    for (let i = 0; i < lines.length; i++) {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      
      // Check if line looks like a heading (was originally marked with #)
      const originalLines = generatedNotes.split('\n');
      const currentOriginalLine = originalLines[i];
      if (currentOriginalLine && currentOriginalLine.match(/^#{1,3}\s+/)) {
        pdf.setFont('helvetica', 'bold');
      } else {
        pdf.setFont('helvetica', 'normal');
      }
      
      pdf.text(lines[i], margin, yPosition);
      yPosition += lineHeight;
    }

    pdf.save(`${title.replace(/[^\w\s]/gi, '')}.pdf`);
    
    toast({
      title: "Success!",
      description: "Notes exported as PDF",
    });
  };

  const openInGoogleDocs = () => {
    if (!generatedNotes.trim()) {
      toast({
        title: "Error",
        description: "No notes to export",
        variant: "destructive"
      });
      return;
    }

    const title = noteTitle || 'Generated Notes';
    const cleanedContent = cleanMarkdownForExport(generatedNotes);
    const fullContent = `${title}\n\n${cleanedContent}`;
    
    // Create a temporary form to submit the data to Google Docs
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://docs.google.com/document/create';
    form.target = '_blank';
    
    // Add the content as a hidden input
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'text';
    input.value = fullContent;
    form.appendChild(input);
    
    // Add title input
    const titleInput = document.createElement('input');
    titleInput.type = 'hidden';
    titleInput.name = 'title';
    titleInput.value = title;
    form.appendChild(titleInput);
    
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
    
    toast({
      title: "Opening Google Docs",
      description: "Your notes will open in a new tab",
    });
  };

  const getWordCount = () => {
    return inputText.trim().split(/\s+/).length;
  };

  const getChunkCount = () => {
    if (!inputText.trim()) return 0;
    return splitTextIntoChunks(inputText.trim()).length;
  };

  const isLongText = inputText.length > MAX_CHUNK_SIZE;

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <Card className="shadow-none border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="border-b pb-4 mb-2 bg-white/80 sticky top-0 z-10">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <FileText className="w-5 h-5 text-blue-600" />
            Generate Structured Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note-title" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Zap className="w-4 h-4 text-yellow-500" />
              Note Title (optional)
            </Label>
            <Input
              id="note-title"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Enter a title for your notes"
              className="rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="input-text" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="w-4 h-4 text-blue-600" />
              Study Material
            </Label>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>{getWordCount()} words</span>
              <span>{inputText.length} chars</span>
              {isLongText && (
                <span className="flex items-center gap-1 text-orange-600">
                  <Scissors className="w-3 h-3" />
                  {getChunkCount()} parts
                </span>
              )}
            </div>
            {isLongText && (
              <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                <div className="text-xs text-orange-800 font-medium">
                  Large text detected. Your text will be split for optimal processing.
                </div>
              </div>
            )}
            <Textarea
              id="input-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your study material here..."
              className="min-h-[160px] rounded-lg border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>
          <Button 
            onClick={generateNotes} 
            disabled={isGenerating || !inputText.trim()}
            variant="default"
            size="lg"
            className="w-full rounded-lg text-base font-semibold flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <svg className="w-5 h-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                Generating Notes...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 text-blue-600" />
                Generate Structured Notes
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      {/* Generated Notes Section */}
      {generatedNotes && (
        <Card className="shadow-none border-0 bg-gradient-to-br from-white to-blue-50">
          <CardHeader className="border-b pb-4 mb-2 bg-white/80">
            <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-900">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                Generated Notes
              </span>
              <div className="flex gap-1">
                <Button onClick={exportToPDF} variant="ghost" size="icon" className="hover:bg-red-50" title="Export PDF">
                  {/* Red down arrow for PDF */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v12m0 0l-4-4m4 4l4-4" /><rect x="4" y="18" width="16" height="2" rx="1" fill="currentColor" /></svg>
                </Button>
                <Button onClick={openInGoogleDocs} variant="ghost" size="icon" className="hover:bg-blue-50" title="Edit in Google Docs">
                  {/* External link icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 13v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h6m7-5v6m0 0L10 21m7-7H10" /></svg>
                </Button>
                <Button 
                  onClick={saveNotes} 
                  disabled={isSaving || !user}
                  variant="ghost"
                  size="icon"
                  className="hover:bg-green-50"
                  title="Save Notes"
                >
                  {/* Save/Check icon */}
                  {isSaving ? (
                    <svg className="w-5 h-5 animate-spin text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  )}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-6 max-h-96 overflow-y-auto border">
              <div 
                className="prose prose-sm max-w-none leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: `<p class="mb-2">${formatNotesForDisplay(generatedNotes)}</p>` 
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotesGenerator;
