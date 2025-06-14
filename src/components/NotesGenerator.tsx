
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Zap, FileText, Save, Download, Copy } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const NotesGenerator = () => {
  const [inputText, setInputText] = useState('');
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const generateNotes = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to generate notes from",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Mock AI note generation for now
      const mockNotes = `# Generated Notes

## Key Points
${inputText.split('\n').map(line => line.trim()).filter(line => line).map(line => `- ${line}`).join('\n')}

## Summary
This is a summary of the provided content, organized into clear, actionable notes.

## Important Concepts
- Main ideas extracted from the text
- Key terminology and definitions
- Critical insights and takeaways`;

      setGeneratedNotes(mockNotes);
      setNoteTitle(`Notes - ${new Date().toLocaleDateString()}`);
      
      toast({
        title: "Success",
        description: "Notes generated successfully!"
      });
    } catch (error) {
      console.error('Error generating notes:', error);
      toast({
        title: "Error",
        description: "Failed to generate notes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
        description: "Please log in to save notes",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('notes')
        .insert({
          title: noteTitle,
          content: generatedNotes,
          original_text: inputText,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notes saved successfully!"
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const exportToPDF = async () => {
    if (!generatedNotes.trim()) {
      toast({
        title: "Error",
        description: "No notes to export",
        variant: "destructive"
      });
      return;
    }

    try {
      const element = document.getElementById('notes-content');
      if (!element) return;

      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${noteTitle || 'notes'}.pdf`);
      
      toast({
        title: "Success",
        description: "Notes exported to PDF successfully!"
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Error",
        description: "Failed to export PDF",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async () => {
    if (!generatedNotes.trim()) {
      toast({
        title: "Error",
        description: "No notes to copy",
        variant: "destructive"
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedNotes);
      toast({
        title: "Success",
        description: "Notes copied to clipboard!"
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Error",
        description: "Failed to copy notes",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Input Text
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your text here (documents, articles, lecture notes, etc.)"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-[300px] resize-none"
          />
          <Button 
            onClick={generateNotes} 
            disabled={loading}
            className="w-full flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {loading ? 'Generating...' : 'Generate Notes'}
          </Button>
        </CardContent>
      </Card>

      {/* Output Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generated Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {generatedNotes ? (
            <>
              <Input
                placeholder="Note title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="mb-4"
              />
              <div 
                id="notes-content"
                className="min-h-[300px] p-4 border rounded-lg bg-gray-50 whitespace-pre-wrap text-sm"
              >
                {generatedNotes}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={saveNotes} 
                  disabled={saving || !user}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Notes'}
                </Button>
                <Button 
                  onClick={exportToPDF} 
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </Button>
                <Button 
                  onClick={copyToClipboard} 
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
              </div>
              {!user && (
                <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                  Please log in to save notes
                </p>
              )}
            </>
          ) : (
            <div className="min-h-[300px] flex items-center justify-center text-gray-500">
              Generated notes will appear here
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotesGenerator;
