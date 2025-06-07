import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, RefreshCw, Download, ExternalLink } from 'lucide-react';
import jsPDF from 'jspdf';

const NotesGenerator = () => {
  const [inputText, setInputText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const [apiKey] = useState('AIzaSyCElPVe4sj1H1phq_5wgbApQWkjllvfz3Y');

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
      const prompt = `
        Create well-structured, comprehensive notes from the following text. Format them with:
        - Clear headings and subheadings
        - Key points in bullet format
        - Important concepts highlighted
        - Logical flow and organization
        - Summary of main ideas
        
        Text: ${inputText}
        
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
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const generatedContent = data.candidates[0].content.parts[0].text;
      
      setGeneratedNotes(generatedContent);
      
      // Auto-generate title if not provided
      if (!noteTitle.trim()) {
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
        description: "Notes generated successfully",
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
      const { error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: noteTitle,
          content: generatedNotes,
          original_text: inputText
        });

      if (error) throw error;

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

    // Add title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    const title = noteTitle || 'Generated Notes';
    pdf.text(title, margin, yPosition);
    yPosition += lineHeight * 2;

    // Add content - clean up markdown syntax for PDF
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    const cleanedNotes = generatedNotes
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold markers
      .replace(/\*(.*?)\*/g, '$1')      // Remove italic markers
      .replace(/^#{1,3}\s+/gm, '')      // Remove heading markers
      .replace(/^-\s+/gm, '• ');        // Convert bullet points
    
    const lines = pdf.splitTextToSize(cleanedNotes, pageWidth - 2 * margin);
    
    for (let i = 0; i < lines.length; i++) {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
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
    // Clean up markdown for Google Docs
    const cleanedContent = generatedNotes
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold markers
      .replace(/\*(.*?)\*/g, '$1')      // Remove italic markers
      .replace(/^#{1,3}\s+/gm, '')      // Remove heading markers
      .replace(/^-\s+/gm, '• ');        // Convert bullet points
    
    const content = `${title}\n\n${cleanedContent}`;
    const encodedContent = encodeURIComponent(content);
    
    // Create a Google Docs URL with the content
    const googleDocsUrl = `https://docs.google.com/document/create?title=${encodeURIComponent(title)}&body=${encodedContent}`;
    
    window.open(googleDocsUrl, '_blank');
    
    toast({
      title: "Opening Google Docs",
      description: "Your notes will open in a new tab",
    });
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Structured Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note-title">Note Title (optional)</Label>
            <Input
              id="note-title"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Enter a title for your notes"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="input-text">Input Text</Label>
            <Textarea
              id="input-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your study material here (from PDFs, lectures, textbooks, etc.)..."
              className="min-h-[200px] text-base leading-relaxed"
            />
          </div>
          
          <Button 
            onClick={generateNotes} 
            disabled={isGenerating || !inputText.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating Notes...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Structured Notes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Notes Section */}
      {generatedNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated Notes</span>
              <div className="flex gap-2">
                <Button onClick={exportToPDF} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button onClick={openInGoogleDocs} variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Edit in Google Docs
                </Button>
                <Button 
                  onClick={saveNotes} 
                  disabled={isSaving || !user}
                  size="sm"
                >
                  {isSaving ? 'Saving...' : 'Save Notes'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
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
