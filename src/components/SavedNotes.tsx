import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Download, Trash2, Calendar } from 'lucide-react';
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
  const { user } = useAuth();

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

  // Function to format notes for display with proper HTML and custom styles
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

  // Function to clean markdown for plain text (PDF and Google Docs)
  const cleanMarkdownForExport = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold markers but keep text
      .replace(/\*(.*?)\*/g, '$1')      // Remove italic markers but keep text
      .replace(/^#{1,3}\s+/gm, '')      // Remove heading markers
      .replace(/^-\s+/gm, '• ');        // Convert bullet points
  };

  const exportToPDF = (note: Note) => {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    const lineHeight = 12; // very small font and tight spacing
    let yPosition = margin;
    let pageNumber = 1;
    const addPageNumber = () => {
      pdf.setFontSize(8);
      pdf.setTextColor(180, 180, 180);
      pdf.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 20, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
    };

    // Title (H1)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(10, 30, 80);
    pdf.text(note.title, margin, yPosition);
    yPosition += lineHeight * 2;

    // Creation date
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`Created: ${new Date(note.created_at).toLocaleDateString()}`, margin, yPosition);
    yPosition += lineHeight * 1.5;

    // Divider
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += lineHeight * 0.7;

    // Content
    const lines = note.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      // H1
      if (/^# (.*)/.test(line)) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(10, 30, 80);
        pdf.text(line.replace(/^# /, ''), margin, yPosition);
        yPosition += lineHeight * 1.5;
        if (yPosition > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; yPosition = margin; }
        continue;
      }
      // H2
      if (/^## (.*)/.test(line)) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(34, 139, 34);
        pdf.text(line.replace(/^## /, ''), margin + 10, yPosition);
        yPosition += lineHeight * 1.3;
        if (yPosition > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; yPosition = margin; }
        continue;
      }
      // H3
      if (/^### (.*)/.test(line)) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(219, 39, 119);
        pdf.text(line.replace(/^### /, ''), margin + 20, yPosition);
        yPosition += lineHeight * 1.1;
        if (yPosition > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; yPosition = margin; }
        continue;
      }
      // Bullet points
      if (/^- (.*)/.test(line)) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        pdf.setFillColor(255, 249, 196);
        pdf.rect(margin + 20, yPosition - 9, pageWidth - margin * 2 - 20, lineHeight + 2, 'F');
        let bulletText = line.replace(/^- /, '\u2022 ');
        bulletText = bulletText.replace(/\*\*(.*?)\*\*/g, '$1');
        pdf.text(bulletText, margin + 25, yPosition);
        yPosition += lineHeight * 1.05;
        if (yPosition > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; yPosition = margin; }
        continue;
      }
      // Key points (bold)
      if (/\*\*(.*?)\*\*/.test(line)) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        pdf.setFillColor(255, 249, 196);
        pdf.rect(margin, yPosition - 9, pageWidth - margin * 2, lineHeight + 2, 'F');
        pdf.text(line.replace(/\*\*(.*?)\*\*/g, '$1'), margin, yPosition);
        yPosition += lineHeight * 1.05;
        if (yPosition > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; yPosition = margin; }
        continue;
      }
      // Italic
      if (/\*(.*?)\*/.test(line)) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        pdf.text(line.replace(/\*(.*?)\*/g, '$1'), margin, yPosition);
        yPosition += lineHeight * 1.05;
        if (yPosition > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; yPosition = margin; }
        continue;
      }
      // Normal text
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(60, 60, 60);
      const splitLines = pdf.splitTextToSize(line, pageWidth - margin * 2);
      for (const splitLine of splitLines) {
        pdf.text(splitLine, margin, yPosition);
        yPosition += lineHeight;
        if (yPosition > pageHeight - margin) { addPageNumber(); pdf.addPage(); pageNumber++; yPosition = margin; }
      }
    }
    addPageNumber();
    pdf.save(`${note.title.replace(/[^\w\s]/gi, '')}.pdf`);
    toast({
      title: "Success!",
      description: "Note exported as PDF",
    });
  };

  // Remove export to Google Docs, add export as .doc file
  const exportToDoc = (note: Note) => {
    // Build HTML content for the doc file
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Exported Notes</title></head>
      <body style="font-family:Calibri,Arial,sans-serif;">
        <h1 style="color:#0a1e50;font-size:1.5rem;">${note.title}</h1>
        <div style="color:#888;font-size:0.8rem;">Created: ${new Date(note.created_at).toLocaleDateString()}</div>
        <hr style="border:1px solid #ccc; margin:12px 0;"/>
        <div>${formatNotesForDisplay(note.content)}</div>
      </body>
      </html>
    `;
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Saved Notes ({notes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{note.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(note.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => exportToPDF(note)} 
                  variant="outline" 
                  size="sm"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={() => exportToDoc(note)} 
                  variant="outline" 
                  size="sm"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={() => deleteNote(note.id)} 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
              <div 
                className="prose prose-sm max-w-none leading-relaxed text-sm"
                dangerouslySetInnerHTML={{ 
                  __html: formatNotesForDisplay(note.content.substring(0, 400) + (note.content.length > 400 ? '...' : ''))
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SavedNotes;
