import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Trash2, Calendar, Filter, Brain, Download, Sparkles } from 'lucide-react';
import jsPDF from 'jspdf';

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
  const [generatingMCQs, setGeneratingMCQs] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("All");
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const { user } = useAuth();
  const [apiKey] = useState('AIzaSyCElPVe4sj1H1phq_5wgbApQWkjllvfz3Y');

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

  const generateMCQsFromNote = async (note: Note) => {
    if (!user) return;
    
    setGeneratingMCQs(note.id);
    
    try {
      const prompt = `Generate exactly 5 multiple-choice questions from the following notes. Each question should have 4 options (A, B, C, D) with only one correct answer. 

IMPORTANT: Use only these exact values for question_type: "factual", "conceptual", "application", "analytical"
IMPORTANT: Use only these exact values for difficulty: "Easy", "Medium", "Hard"

Format your response as a valid JSON array with this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Detailed explanation of why this is correct",
    "difficulty": "Easy",
    "question_type": "factual"
  }
]

Notes Title: ${note.title}
Notes Content: ${note.content}

Return ONLY the JSON array, no additional text or formatting.`;

      console.log('Generating MCQs with Gemini API...');

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
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, errorText);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Gemini API response:', data);
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from Gemini API');
      }
      
      const mcqsText = data.candidates[0].content.parts[0].text;
      console.log('Raw MCQs text:', mcqsText);
      
      // Clean the response to extract JSON
      let cleanedText = mcqsText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      let mcqs;
      try {
        mcqs = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse MCQs JSON:', parseError);
        console.log('Cleaned text:', cleanedText);
        throw new Error('Failed to parse generated MCQs');
      }

      if (!Array.isArray(mcqs) || mcqs.length === 0) {
        throw new Error('Invalid MCQs format received');
      }

      console.log('Parsed MCQs:', mcqs);

      // Validate and clean MCQ data before saving
      const validQuestionTypes = ['factual', 'conceptual', 'application', 'analytical'];
      const validDifficulties = ['Easy', 'Medium', 'Hard'];

      const mcqsToSave = mcqs.map((mcq: any) => {
        let questionType = mcq.question_type || 'factual';
        if (!validQuestionTypes.includes(questionType)) {
          questionType = 'factual';
        }

        let difficulty = mcq.difficulty || 'Medium';
        if (!validDifficulties.includes(difficulty)) {
          difficulty = 'Medium';
        }

        return {
          user_id: user.id,
          question: mcq.question,
          options: mcq.options,
          correct_answer: mcq.correct_answer,
          explanation: mcq.explanation,
          difficulty: difficulty,
          question_type: questionType,
          chapter: note.title,
          original_text: note.content
        };
      });

      console.log('MCQs to save:', mcqsToSave);

      const { error: insertError } = await supabase
        .from('mcqs')
        .insert(mcqsToSave);

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw insertError;
      }

      toast({
        title: "Success! ✨",
        description: `Generated ${mcqs.length} MCQs from "${note.title}"`,
      });

    } catch (error) {
      console.error('Error generating MCQs:', error);
      toast({
        title: "Error",
        description: "Failed to generate MCQs from note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGeneratingMCQs(null);
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

  // Function to format notes for display with proper HTML and custom styles
  const formatNotesForDisplay = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*$)/gm, '<h3 style="font-family: Calibri, Arial, sans-serif; font-size: 1.1rem;" class="text-lg font-bold mt-4 mb-2 text-pink-600">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 style="font-family: Calibri, Arial, sans-serif; font-size: 1.25rem;" class="text-xl font-bold mt-6 mb-3 text-green-700">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 style="font-family: Calibri, Arial, sans-serif; font-size: 1.5rem;" class="text-2xl font-bold mt-8 mb-4 text-blue-900">$1</h1>')
      .replace(/^- (.*$)/gm, '<li style="font-family: Calibri, Arial, sans-serif; font-size: 1rem;" class="ml-4">• <span class="bg-yellow-100 px-1 rounded">$1</span></li>')
      .replace(/\n\n/g, '</p><p class="mb-2" style="font-family: Calibri, Arial, sans-serif; font-size: 1rem;">')
      .replace(/\n/g, '<br/>');
  };

  const cleanMarkdownForExport = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^#{1,3}\s+/gm, '')
      .replace(/^-\s+/gm, '• ');
  };

  const exportToPDF = (note: Note) => {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    const lineHeight = 12;
    let yPosition = margin;
    let pageNumber = 1;
    const addPageNumber = () => {
      pdf.setFontSize(8);
      pdf.setTextColor(180, 180, 180);
      pdf.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 20, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
    };

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(10, 30, 80);
    pdf.text(note.title, margin, yPosition);
    yPosition += lineHeight * 2;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`Created: ${new Date(note.created_at).toLocaleDateString()}`, margin, yPosition);
    yPosition += lineHeight * 1.5;

    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += lineHeight * 0.7;

    const lines = note.content.split('\n');
    let inBulletList = false;
    let inTable = false;
    let tableRows = [];
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (/^\s*\|(.+)\|\s*$/.test(line)) {
        const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
        tableRows.push(cells);
        inTable = true;
        if (i + 1 >= lines.length || !/^\s*\|(.+)\|\s*$/.test(lines[i + 1])) {
          const colCount = tableRows[0].length;
          const colWidth = (pageWidth - margin * 2) / colCount;
          let tableY = yPosition;
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          tableRows.forEach((row, rowIdx) => {
            let x = margin;
            row.forEach((cell, colIdx) => {
              pdf.rect(x, tableY - 8, colWidth, lineHeight + 4);
              pdf.text(String(cell), x + 2, tableY);
              x += colWidth;
            });
            tableY += lineHeight * 1.2;
            if (tableY > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; tableY = margin; }
          });
          yPosition = tableY + lineHeight * 0.5;
          tableRows = [];
          inTable = false;
        }
        continue;
      } else if (inTable) {
        tableRows = [];
        inTable = false;
        yPosition += lineHeight * 0.5;
      }
      if (/^# (.*)/.test(line)) {
        if (inBulletList) { inBulletList = false; yPosition += lineHeight * 0.5; }
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(10, 30, 80);
        const h1Text = line.replace(/^# /, '');
        const splitLines = pdf.splitTextToSize(h1Text, pageWidth - margin * 2);
        for (const splitLine of splitLines) {
          pdf.text(splitLine, margin, yPosition);
          yPosition += lineHeight * 2;
          if (yPosition > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; yPosition = margin; }
        }
        yPosition += lineHeight * 0.5;
        continue;
      }
      if (/^## (.*)/.test(line)) {
        if (inBulletList) { inBulletList = false; yPosition += lineHeight * 0.5; }
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(34, 139, 34);
        const h2Text = line.replace(/^## /, '');
        const splitLines = pdf.splitTextToSize(h2Text, pageWidth - margin * 2 - 10);
        for (const splitLine of splitLines) {
          pdf.text(splitLine, margin + 10, yPosition);
          yPosition += lineHeight * 1.5;
          if (yPosition > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; yPosition = margin; }
        }
        yPosition += lineHeight * 0.5;
        continue;
      }
      if (/^### (.*)/.test(line)) {
        if (inBulletList) { inBulletList = false; yPosition += lineHeight * 0.5; }
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(219, 39, 119);
        const h3Text = line.replace(/^### /, '');
        const splitLines = pdf.splitTextToSize(h3Text, pageWidth - margin * 2 - 20);
        for (const splitLine of splitLines) {
          pdf.text(splitLine, margin + 20, yPosition);
          yPosition += lineHeight * 1.2;
          if (yPosition > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; yPosition = margin; }
        }
        yPosition += lineHeight * 0.3;
        continue;
      }
      if (/^(- |\* )(.+)/.test(line)) {
        if (!inBulletList) { inBulletList = true; yPosition += lineHeight * 0.3; }
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.setFillColor(255, 249, 196);
        pdf.rect(margin + 20, yPosition - 9, pageWidth - margin * 2 - 20, lineHeight + 2, 'F');
        let bulletText = line.replace(/^(- |\* )/, '\u2022 ');
        bulletText = bulletText.replace(/\*\*(.*?)\*\*/g, '$1');
        bulletText = bulletText.replace(/\*(.*?)\*/g, '$1');
        const splitLines = pdf.splitTextToSize(bulletText, pageWidth - margin * 2 - 25);
        for (const splitLine of splitLines) {
          pdf.text(splitLine, margin + 25, yPosition);
          yPosition += lineHeight * 1.15;
          if (yPosition > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; yPosition = margin; }
        }
        continue;
      } else if (inBulletList) {
        inBulletList = false;
        yPosition += lineHeight * 0.5;
      }
      if (/\*\*(.*?)\*\*/.test(line)) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.setFillColor(255, 249, 196);
        pdf.rect(margin, yPosition - 9, pageWidth - margin * 2, lineHeight + 2, 'F');
        const boldText = line.replace(/\*\*(.*?)\*\*/g, '$1');
        const splitLines = pdf.splitTextToSize(boldText, pageWidth - margin * 2);
        for (const splitLine of splitLines) {
          pdf.text(splitLine, margin, yPosition);
          yPosition += lineHeight * 1.15;
          if (yPosition > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; yPosition = margin; }
        }
        yPosition += lineHeight * 0.2;
        continue;
      }
      if (/\*(.*?)\*/.test(line)) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        const italicText = line.replace(/\*(.*?)\*/g, '$1');
        const splitLines = pdf.splitTextToSize(italicText, pageWidth - margin * 2);
        for (const splitLine of splitLines) {
          pdf.text(splitLine, margin, yPosition);
          yPosition += lineHeight * 1.1;
          if (yPosition > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; yPosition = margin; }
        }
        yPosition += lineHeight * 0.1;
        continue;
      }
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      const splitLines = pdf.splitTextToSize(line, pageWidth - margin * 2);
      for (const splitLine of splitLines) {
        pdf.text(splitLine, margin, yPosition);
        yPosition += lineHeight * 1.2;
        if (yPosition > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; yPosition = margin; }
      }
      yPosition += lineHeight * 0.2;
    }
    addPageNumber();
    pdf.save(`${note.title.replace(/[^\w\s]/gi, '')}.pdf`);
    toast({
      title: "Success!",
      description: "Note exported as PDF",
    });
  };

  const exportToDoc = (note: Note) => {
    let htmlContent = `<html><head><meta charset='utf-8'><title>${note.title}</title></head><body style="font-family:Calibri,Arial,sans-serif;">
      <h1 style="color:#0a1e50;font-size:1.5rem;margin-bottom:0.5em;">${note.title}</h1>
      <div style="color:#888;font-size:0.8rem;margin-bottom:0.5em;">Created: ${new Date(note.created_at).toLocaleDateString()}</div>
      <hr style="border:1px solid #ccc; margin:12px 0;"/>
    `;
    const lines = note.content.split('\n');
    let inList = false;
    let inTable = false;
    let tableRows = [];
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (/^\s*\|(.+)\|\s*$/.test(line)) {
        const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
        tableRows.push(cells);
        inTable = true;
        if ((i + 1 >= lines.length) || !/^\s*\|(.+)\|\s*$/.test(lines[i + 1])) {
          htmlContent += '<table style="border-collapse:collapse;width:100%;margin-bottom:1em;">';
          tableRows.forEach((row, rowIdx) => {
            htmlContent += '<tr>';
            row.forEach(cell => {
              htmlContent += `<td style="border:1px solid #bbb;padding:6px 8px;font-size:1rem;${rowIdx===0?'font-weight:bold;background:#f5f5f5;':''}">${cell}</td>`;
            });
            htmlContent += '</tr>';
          });
          htmlContent += '</table>';
          tableRows = [];
          inTable = false;
        }
        continue;
      } else if (inTable) {
        tableRows = [];
        inTable = false;
      }
      if (/^# (.*)/.test(line)) {
        if (inList) { htmlContent += '</ul>'; inList = false; }
        htmlContent += `<h2 style="color:#0a1e50;font-size:1.2rem;margin-top:1.5em;margin-bottom:0.5em;">${line.replace(/^# /, '')}</h2>`;
        continue;
      }
      if (/^## (.*)/.test(line)) {
        if (inList) { htmlContent += '</ul>'; inList = false; }
        htmlContent += `<h3 style="color:#228b22;font-size:1.1rem;margin-top:1.2em;margin-bottom:0.4em;">${line.replace(/^## /, '')}</h3>`;
        continue;
      }
      if (/^### (.*)/.test(line)) {
        if (inList) { htmlContent += '</ul>'; inList = false; }
        htmlContent += `<h4 style="color:#db2777;font-size:1rem;margin-top:1em;margin-bottom:0.3em;">${line.replace(/^### /, '')}</h4>`;
        continue;
      }
      if (/^(- |\* )(.+)/.test(line)) {
        if (!inList) { htmlContent += '<ul style="margin-bottom:0.5em;">'; inList = true; }
        let bulletText = line.replace(/^(- |\* )/, '');
        bulletText = bulletText.replace(/\*\*(.*?)\*\*/g, '<span style="font-weight:bold;background:#fff9c4;">$1</span>');
        bulletText = bulletText.replace(/\*(.*?)\*/g, '<span style="font-style:italic;">$1</span>');
        htmlContent += `<li style="margin-bottom:0.2em;font-size:1rem;">${bulletText}</li>`;
        continue;
      } else if (inList) {
        htmlContent += '</ul>';
        inList = false;
      }
      if (/\*\*(.*?)\*\*/.test(line)) {
        htmlContent += `<div style="font-weight:bold;background:#fff9c4;padding:2px 6px;border-radius:4px;display:inline-block;margin-bottom:0.2em;">${line.replace(/\*\*(.*?)\*\*/g, '$1')}</div><br/>`;
        continue;
      }
      if (/\*(.*?)\*/.test(line)) {
        htmlContent += `<span style="font-style:italic;">${line.replace(/\*(.*?)\*/g, '$1')}</span><br/>`;
        continue;
      }
      htmlContent += `<div style="font-size:1rem;margin-bottom:0.3em;">${line}</div>`;
    }
    if (inList) htmlContent += '</ul>';
    htmlContent += '</body></html>';
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^\w\s]/gi, '')}.doc`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    toast({
      title: "Success!",
      description: "Note exported as .doc file",
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

  if (loading) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-muted-foreground">Loading notes...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (notes.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Saved Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
          <p className="text-muted-foreground">
            Generate your first structured notes to see them here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Saved Notes ({filteredNotes.length})
          <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
        </CardTitle>
        <div className="mt-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search notes by title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 text-sm pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            <FileText className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
      <CardContent className="space-y-4">
        {filteredNotes.map((note) => (
          <div 
            key={note.id} 
            className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 animate-scale-in"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg truncate">{note.title}</h3>
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                {expandedNote === note.id && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg animate-fade-in">
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: formatNotesForDisplay(note.content.substring(0, 500) + (note.content.length > 500 ? '...' : ''))
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                  variant="outline"
                  size="sm"
                  className="hover-scale"
                >
                  {expandedNote === note.id ? 'Collapse' : 'Preview'}
                </Button>
                
                <Button 
                  onClick={() => generateMCQsFromNote(note)}
                  disabled={generatingMCQs === note.id}
                  variant="outline" 
                  size="sm"
                  className="hover-scale flex items-center gap-1"
                >
                  {generatingMCQs === note.id ? (
                    <>
                      <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" />
                      Generate MCQs
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={() => exportToPDF(note)} 
                  variant="outline" 
                  size="sm"
                  className="hover-scale flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  PDF
                </Button>
                
                <Button 
                  onClick={() => exportToDoc(note)} 
                  variant="outline" 
                  size="sm"
                  className="hover-scale flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  DOC
                </Button>
                
                <Button 
                  onClick={() => deleteNote(note.id)} 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 hover-scale"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SavedNotes;
