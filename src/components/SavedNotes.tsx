import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Trash2, Calendar, Filter, Brain } from 'lucide-react';
import jsPDF from 'jspdf';
import { incrementGeminiUsage } from '@/lib/geminiUsage';

interface Note {
  id: string;
  title: string;
  content: string;
  original_text: string | null;
  created_at: string;
  updated_at: string;
}

const SavedNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("All");
  const [generatingMCQs, setGeneratingMCQs] = useState<{ [key: string]: boolean }>({});
  const { user } = useAuth();
  const apiKey = 'AIzaSyCElPVe4sj1H1phq_5wgbApQWkjllvfz3Y';

  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [user]);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(notes.filter(note => note.id !== noteId));
      toast({
        title: "Success",
        description: "Note deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive"
      });
    }
  };

  const splitTextIntoChunks = (text: string, maxChunkSize: number = 3000): string[] => {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if ((currentChunk + trimmedSentence).length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmedSentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.length > 0 ? chunks : [text];
  };

  const generateMCQsFromNote = async (note: Note) => {
    setGeneratingMCQs(prev => ({ ...prev, [note.id]: true }));
    
    try {
      const chunks = splitTextIntoChunks(note.content);
      const allGeneratedMCQs: any[] = [];
      
      toast({
        title: "Processing...",
        description: `Breaking note into ${chunks.length} part${chunks.length > 1 ? 's' : ''} for MCQ generation`,
      });

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const questionsPerChunk = Math.max(2, Math.min(5, Math.ceil(10 / chunks.length)));
        
        const prompt = `
          Generate ${questionsPerChunk} high-quality multiple choice questions from the following text (Part ${i + 1} of ${chunks.length}).
          
          Text: ${chunk}
          
          Return a JSON array with this exact structure:
          [
            {
              "question": "Question text here",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": 0,
              "explanation": "Detailed explanation of why this is correct",
              "difficulty": "Medium"
            }
          ]
          
          Make sure questions are:
          - Clear and unambiguous
          - Based directly on the provided text
          - Have plausible distractors
          - Include comprehensive explanations
          - Cover key concepts from this section
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
          throw new Error(`API request failed for part ${i + 1}: ${response.status}`);
        }

        const data = await response.json();
        const generatedText = data.candidates[0].content.parts[0].text;
        
        const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          console.warn(`No valid JSON found in response for part ${i + 1}`);
          continue;
        }

        const partMCQs = JSON.parse(jsonMatch[0]);
        allGeneratedMCQs.push(...partMCQs);

        // Add small delay between requests to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (allGeneratedMCQs.length === 0) {
        throw new Error('No MCQs were generated from any part of the note');
      }

      // Save MCQs to Supabase
      const mcqsForDB = allGeneratedMCQs.map((mcq: any) => ({
        user_id: user!.id,
        question: mcq.question,
        options: mcq.options,
        correct_answer: mcq.correctAnswer,
        explanation: mcq.explanation,
        difficulty: mcq.difficulty,
        question_type: 'single',
        chapter: note.title,
        original_text: note.content
      }));

      const { error } = await supabase
        .from('mcqs')
        .insert(mcqsForDB);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Generated ${allGeneratedMCQs.length} MCQs from "${note.title}" (${chunks.length} part${chunks.length > 1 ? 's' : ''})`,
      });

    } catch (error) {
      console.error('Error generating MCQs:', error);
      toast({
        title: "Error",
        description: "Failed to generate MCQs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGeneratingMCQs(prev => ({ ...prev, [note.id]: false }));
    }
  };

  const formatNotesForDisplay = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>') // Highlight key points (bold)
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
      .replace(/^### (.*$)/gm, '<h3 style="font-family: Calibri, Arial, sans-serif; font-size: 1.1rem;" class="text-lg font-bold mt-4 mb-2 text-pink-600">$1</h3>') // H3 headings (subheading, pink)
      .replace(/^## (.*$)/gm, '<h2 style="font-family: Calibri, Arial, sans-serif; font-size: 1.25rem;" class="text-xl font-bold mt-6 mb-3 text-green-700">$1</h2>') // H2 headings (main subheading, green)
      .replace(/^# (.*$)/gm, '<h1 style="font-family: Calibri, Arial, sans-serif; font-size: 1.5rem;" class="text-2xl font-bold mt-8 mb-4 text-blue-900">$1</h1>') // H1 headings (main heading)
      .replace(/^- (.*$)/gm, '<li style="font-family: Calibri, Arial, sans-serif; font-size: 1rem;" class="ml-4">• <span class="bg-yellow-100 px-1 rounded">$1</span></li>') // Bullet points highlighted
      .replace(/\n\n/g, '</p><p class="mb-2" style="font-family: Calibri, Arial, sans-serif; font-size: 1rem;">') // Paragraphs
      .replace(/\n/g, '<br/>'); // Line breaks
  };

  const exportToPDF = (note: Note) => {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin + 30;
    let pageNumber = 1;

    // Helper function to add page numbers
    const addPageNumber = () => {
      pdf.setFontSize(9);
      pdf.setTextColor(120, 120, 120);
      pdf.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 25, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
    };

    // Main title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(30, 58, 138); // Blue
    const titleLines = pdf.splitTextToSize(note.title, contentWidth);
    for (const line of titleLines) {
      pdf.text(line, margin, yPosition);
      yPosition += 24;
    }
    yPosition += 10;

    // Date and metadata
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Created: ${new Date(note.created_at).toLocaleDateString()}`, margin, yPosition);
    yPosition += 20;

    // Divider line
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(1);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 25;

    // Process content with proper formatting
    const lines = note.content.split('\n');
    
    for (let line of lines) {
      line = line.trim();
      if (!line) {
        yPosition += 8; // Small space for empty lines
        continue;
      }

      // Check if new page is needed
      if (yPosition > pageHeight - margin - 50) {
        addPageNumber();
        pdf.addPage();
        pageNumber++;
        yPosition = margin + 30;
      }

      // Handle different text formats
      if (line.startsWith('# ')) {
        // Main heading
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.setTextColor(30, 58, 138); // Blue
        const headingText = line.replace(/^# /, '');
        const headingLines = pdf.splitTextToSize(headingText, contentWidth);
        for (const headingLine of headingLines) {
          pdf.text(headingLine, margin, yPosition);
          yPosition += 20;
        }
        yPosition += 8;
      } else if (line.startsWith('## ')) {
        // Sub heading
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(34, 139, 34); // Green
        const subHeadingText = line.replace(/^## /, '');
        const subHeadingLines = pdf.splitTextToSize(subHeadingText, contentWidth);
        for (const subHeadingLine of subHeadingLines) {
          pdf.text(subHeadingLine, margin, yPosition);
          yPosition += 18;
        }
        yPosition += 6;
      } else if (line.startsWith('### ')) {
        // Minor heading
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(219, 39, 119); // Pink
        const minorHeadingText = line.replace(/^### /, '');
        const minorHeadingLines = pdf.splitTextToSize(minorHeadingText, contentWidth);
        for (const minorHeadingLine of minorHeadingLines) {
          pdf.text(minorHeadingLine, margin, yPosition);
          yPosition += 16;
        }
        yPosition += 4;
      } else if (line.startsWith('- ')) {
        // Bullet points
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(60, 60, 60);
        const bulletText = line.replace(/^- /, '');
        
        // Add bullet symbol
        pdf.text('•', margin + 10, yPosition);
        
        // Add bullet content with highlighting effect (using gray background color)
        pdf.setFillColor(255, 248, 196); // Light yellow background
        const bulletLines = pdf.splitTextToSize(bulletText, contentWidth - 30);
        for (const bulletLine of bulletLines) {
          // Create a subtle background for key points
          const textWidth = pdf.getTextWidth(bulletLine);
          pdf.rect(margin + 25, yPosition - 8, textWidth + 4, 12, 'F');
          pdf.text(bulletLine, margin + 27, yPosition);
          yPosition += 14;
        }
        yPosition += 2;
      } else if (line.includes('**') || line.includes('*')) {
        // Handle bold and italic text
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(40, 40, 40);
        
        // Simple bold handling (remove ** markers and make text bold)
        let processedLine = line.replace(/\*\*(.*?)\*\*/g, '$1');
        processedLine = processedLine.replace(/\*(.*?)\*/g, '$1');
        
        // Highlight important text with background
        if (line.includes('**')) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFillColor(255, 235, 59); // Yellow highlight
          const textWidth = pdf.getTextWidth(processedLine);
          pdf.rect(margin, yPosition - 8, textWidth + 4, 12, 'F');
        }
        
        const processedLines = pdf.splitTextToSize(processedLine, contentWidth);
        for (const processedTextLine of processedLines) {
          pdf.text(processedTextLine, margin, yPosition);
          yPosition += 14;
        }
        yPosition += 3;
      } else {
        // Regular paragraph text
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(40, 40, 40);
        const paragraphLines = pdf.splitTextToSize(line, contentWidth);
        for (const paragraphLine of paragraphLines) {
          pdf.text(paragraphLine, margin, yPosition);
          yPosition += 14;
        }
        yPosition += 4;
      }
    }

    // Add final page number
    addPageNumber();

    // Generate clean filename
    const cleanTitle = note.title
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 40);
    
    pdf.save(`${cleanTitle || 'note'}_structured.pdf`);
    
    toast({
      title: "Success!",
      description: "Structured PDF with clean formatting exported successfully",
    });
  };

  const exportToDoc = (note: Note) => {
    // Clean content for Word export
    const cleanContent = note.content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold text
      .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Italic text
      .replace(/^# (.*$)/gm, '<h1 style="color:#1E3A8A;font-size:1.5em;margin:1em 0 0.5em 0;">$1</h1>')     // H1 headings
      .replace(/^## (.*$)/gm, '<h2 style="color:#228B22;font-size:1.3em;margin:1em 0 0.5em 0;">$1</h2>')    // H2 headings  
      .replace(/^### (.*$)/gm, '<h3 style="color:#DB2777;font-size:1.1em;margin:1em 0 0.5em 0;">$1</h3>')   // H3 headings
      .replace(/^- (.*$)/gm, '<li style="margin:0.2em 0;background:#FFF9C4;padding:2px 4px;border-radius:3px;">$1</li>') // Bullet points
      .replace(/\n\n/g, '</p><p style="margin:0.5em 0;">')           // Paragraphs
      .replace(/\n/g, '<br/>');                                       // Line breaks

    let htmlContent = `
      <html>
        <head>
          <meta charset='utf-8'>
          <title>${note.title}</title>
          <style>
            body { 
              font-family: Calibri, Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 2em; 
              background: #fff;
            }
            h1 { color: #1E3A8A; font-size: 1.5em; border-bottom: 2px solid #E5E7EB; padding-bottom: 0.3em; }
            h2 { color: #228B22; font-size: 1.3em; margin-top: 1.5em; }
            h3 { color: #DB2777; font-size: 1.1em; margin-top: 1.2em; }
            p { margin: 0.5em 0; text-align: justify; }
            li { margin: 0.2em 0; background: #FFF9C4; padding: 2px 6px; border-radius: 3px; list-style-type: disc; }
            ul { margin: 0.5em 0 0.5em 2em; }
            strong { background: #FBBF24; padding: 1px 3px; border-radius: 2px; }
            .header { border-bottom: 1px solid #E5E7EB; margin-bottom: 1.5em; padding-bottom: 1em; }
            .date { color: #6B7280; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${note.title}</h1>
            <div class="date">Created: ${new Date(note.created_at).toLocaleDateString()}</div>
          </div>
          <div>${cleanContent}</div>
        </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^\w\s]/gi, '')}_structured.doc`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    toast({
      title: "Success!",
      description: "Structured Word document exported successfully",
    });
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (dateFilter === "All") return true;
    const noteDate = new Date(note.created_at);
    if (dateFilter === "Today") return isToday(noteDate);
    if (dateFilter === "This Week") return isThisWeek(noteDate);
    if (dateFilter === "This Month") return isThisMonth(noteDate);
    return true;
  });

  function isToday(date: Date) {
    const now = new Date();
    return date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
  }
  function isThisWeek(date: Date) {
    const now = new Date();
    const firstDayOfWeek = new Date(now);
    firstDayOfWeek.setDate(now.getDate() - now.getDay());
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    return date >= firstDayOfWeek && date <= lastDayOfWeek;
  }
  function isThisMonth(date: Date) {
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  const openNoteInNewTab = (note: Note) => {
    const html = `<!DOCTYPE html><html><head><meta charset='utf-8'><title>${note.title}</title><style>
      body { font-family: Calibri, Arial, sans-serif; background: #f9fafb; color: #222; margin: 0; padding: 2rem; }
      .note-title { color: #0a1e50; font-size: 2rem; font-weight: bold; margin-bottom: 0.5em; }
      .note-date { color: #888; font-size: 0.9rem; margin-bottom: 1em; }
      .note-content { max-width: 700px; background: #fff; border-radius: 10px; box-shadow: 0 2px 8px #0001; padding: 2rem; }
      h1, h2, h3 { margin-top: 1.5em; }
      h1 { color: #0a1e50; font-size: 1.5rem; }
      h2 { color: #228b22; font-size: 1.2rem; }
      h3 { color: #db2777; font-size: 1.1rem; }
      mark { background: #fff9c4; border-radius: 4px; padding: 0 4px; }
      ul { margin-left: 1.5em; }
      li { margin-bottom: 0.3em; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
      td { border: 1px solid #bbb; padding: 6px 8px; font-size: 1rem; }
      tr:first-child td { font-weight: bold; background: #f5f5f5; }
      @media (max-width: 600px) { .note-content { padding: 1rem; } body { padding: 0.5rem; } }
    </style></head><body><div class='note-content'>
      <div class='note-title'>${note.title}</div>
      <div class='note-date'>Created: ${new Date(note.created_at).toLocaleDateString()}</div>
      <hr style="border:1px solid #eee; margin:12px 0;"/>
      <div>${formatNotesForDisplay(note.content)}</div>
    </div></body></html>`;
    const newTab = window.open();
    if (newTab) {
      newTab.document.write(html);
      newTab.document.close();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading notes...</div>
        </CardContent>
      </Card>
    );
  }

  if (notes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Saved Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
          <p className="text-muted-foreground">
            Generate your first structured notes to see them here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="border-b pb-4 mb-2 bg-white/80 sticky top-0 z-10">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <FileText className="w-5 h-5 text-blue-600" />
          Saved Notes <span className="text-gray-400 font-normal">({filteredNotes.length})</span>
        </CardTitle>
        <div className="mt-2 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
          <div className="relative w-full max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" /></svg>
            </span>
            <input
              type="text"
              placeholder="Search notes by title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-3 py-2 rounded-full border bg-gray-50 text-gray-900 border-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors shadow-sm outline-none"
            />
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="border rounded px-2 py-1 text-sm w-full max-w-xs bg-gray-50 text-gray-900 border-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            >
              <option value="All">All Dates</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-0">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText className="w-12 h-12 mb-2" />
            <div className="text-base font-medium">No notes found</div>
            <div className="text-sm">Try a different search or date filter.</div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredNotes.map((note) => (
              <li key={note.id} className="group flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="font-medium text-gray-900 truncate max-w-xs group-hover:underline">{note.title}</span>
                  </div>
                </div>
                <div className="flex gap-1 ml-4">
                  <Button 
                    onClick={() => generateMCQsFromNote(note)}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-purple-50"
                    title="Generate MCQs from this note"
                    disabled={generatingMCQs[note.id]}
                  >
                    {generatingMCQs[note.id] ? (
                      <svg className="w-5 h-5 animate-spin text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                    ) : (
                      <Brain className="w-5 h-5 text-purple-600" />
                    )}
                  </Button>
                  <Button 
                    onClick={() => openNoteInNewTab(note)}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-blue-50"
                    title="Open note in new tab"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1.5 12s3.5-7 10.5-7 10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3" /></svg>
                  </Button>
                  <Button 
                    onClick={() => exportToPDF(note)}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-red-50"
                    title="Export as structured PDF"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v12m0 0l-4-4m4 4l4-4" /><rect x="4" y="18" width="16" height="2" rx="1" fill="currentColor" /></svg>
                  </Button>
                  <Button 
                    onClick={() => exportToDoc(note)}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-blue-50"
                    title="Export as structured DOC"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v12m0 0l-4-4m4 4l4-4" /><rect x="4" y="18" width="16" height="2" rx="1" fill="currentColor" /></svg>
                  </Button>
                  <Button 
                    onClick={() => deleteNote(note.id)}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-red-50"
                    title="Delete note"
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default SavedNotes;
