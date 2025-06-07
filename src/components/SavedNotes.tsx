
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Download, ExternalLink, Trash2, Calendar } from 'lucide-react';
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

  // Function to format notes for display with proper HTML
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

  // Function to clean markdown for plain text (PDF and Google Docs)
  const cleanMarkdownForExport = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold markers but keep text
      .replace(/\*(.*?)\*/g, '$1')      // Remove italic markers but keep text
      .replace(/^#{1,3}\s+/gm, '')      // Remove heading markers
      .replace(/^-\s+/gm, '• ');        // Convert bullet points
  };

  const exportToPDF = (note: Note) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;
    let yPosition = margin;

    // Add title with bold formatting
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(note.title, margin, yPosition);
    yPosition += lineHeight * 2;

    // Add creation date
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const createdDate = new Date(note.created_at).toLocaleDateString();
    pdf.text(`Created: ${createdDate}`, margin, yPosition);
    yPosition += lineHeight * 2;

    // Process content with basic formatting
    pdf.setFontSize(12);
    const cleanedContent = cleanMarkdownForExport(note.content);
    const lines = pdf.splitTextToSize(cleanedContent, pageWidth - 2 * margin);
    
    for (let i = 0; i < lines.length; i++) {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      
      // Check if line looks like a heading (was originally marked with #)
      const originalLine = note.content.split('\n')[i];
      if (originalLine && originalLine.match(/^#{1,3}\s+/)) {
        pdf.setFont('helvetica', 'bold');
      } else {
        pdf.setFont('helvetica', 'normal');
      }
      
      pdf.text(lines[i], margin, yPosition);
      yPosition += lineHeight;
    }

    pdf.save(`${note.title.replace(/[^\w\s]/gi, '')}.pdf`);
    
    toast({
      title: "Success!",
      description: "Note exported as PDF",
    });
  };

  const openInGoogleDocs = (note: Note) => {
    const cleanedContent = cleanMarkdownForExport(note.content);
    const fullContent = `${note.title}\n\n${cleanedContent}`;
    
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
    titleInput.value = note.title;
    form.appendChild(titleInput);
    
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
    
    toast({
      title: "Opening Google Docs",
      description: "Your note will open in a new tab",
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
                  onClick={() => openInGoogleDocs(note)} 
                  variant="outline" 
                  size="sm"
                >
                  <ExternalLink className="w-4 h-4" />
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
