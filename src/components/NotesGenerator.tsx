import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Zap, FileText, Save, Download, Copy, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const NotesGenerator = () => {
  const [inputText, setInputText] = useState('');
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
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

  const generateFlashcards = async () => {
    if (!generatedNotes.trim()) {
      toast({
        title: "Error",
        description: "Please generate notes first before creating flashcards",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to save flashcards",
        variant: "destructive"
      });
      return;
    }

    setGeneratingFlashcards(true);
    try {
      console.log('=== FLASHCARD GENERATION DEBUG ===');
      console.log('User object:', user);
      console.log('User ID:', user.id);
      console.log('User email:', user.email);
      
      // Check current session
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session:', session);
      console.log('Session error:', sessionError);
      
      // Test database connection with a simple query
      const { data: testQuery, error: testError } = await supabase
        .from('flashcards')
        .select('count')
        .eq('user_id', user.id);
      
      console.log('Test query result:', testQuery);
      console.log('Test query error:', testError);
      
      // Mock AI flashcard generation - create multiple flashcards from notes
      const mockFlashcards = [
        {
          front: "What are the main key points covered in these notes?",
          back: "The key points include the main ideas extracted from the original text, organized into clear and actionable notes.",
          category: "Summary"
        },
        {
          front: "What is the purpose of generating structured notes?",
          back: "To organize information into clear, actionable formats that make studying and review more effective.",
          category: "Concepts"
        },
        {
          front: "What elements are typically included in well-structured notes?",
          back: "Key points, summary sections, important concepts, terminology, definitions, and critical insights.",
          category: "Structure"
        }
      ];

      console.log('Generated flashcards:', mockFlashcards);

      // Prepare flashcards for insertion with explicit user_id
      const flashcardsToInsert = mockFlashcards.map(card => ({
        front: card.front,
        back: card.back,
        category: card.category,
        original_text: generatedNotes,
        user_id: user.id
      }));

      console.log('Flashcards to insert:', flashcardsToInsert);

      // Try inserting all at once first
      console.log('Attempting bulk insert...');
      const { data: bulkData, error: bulkError } = await supabase
        .from('flashcards')
        .insert(flashcardsToInsert)
        .select();

      if (bulkError) {
        console.error('Bulk insert failed:', bulkError);
        console.log('Attempting individual inserts...');
        
        // Insert flashcards one by one to better handle errors
        const insertedFlashcards = [];
        for (let i = 0; i < flashcardsToInsert.length; i++) {
          const flashcard = flashcardsToInsert[i];
          console.log(`Inserting flashcard ${i + 1}:`, flashcard);
          
          const { data, error } = await supabase
            .from('flashcards')
            .insert([flashcard])
            .select();

          console.log(`Insert result for flashcard ${i + 1}:`, { data, error });

          if (error) {
            console.error(`Error inserting flashcard ${i + 1}:`, error);
            console.error('Error details:', {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            });
            throw error;
          }

          if (data && data.length > 0) {
            insertedFlashcards.push(data[0]);
            console.log(`Successfully inserted flashcard ${i + 1}:`, data[0]);
          }
        }

        console.log('All flashcards inserted successfully:', insertedFlashcards);
        
        toast({
          title: "Success",
          description: `Generated and saved ${insertedFlashcards.length} flashcards!`
        });
      } else {
        console.log('Bulk insert successful:', bulkData);
        toast({
          title: "Success",
          description: `Generated and saved ${bulkData.length} flashcards!`
        });
      }

      // Verify the data was actually inserted by querying back
      console.log('Verifying inserted data...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      console.log('Verification query result:', verifyData);
      console.log('Verification query error:', verifyError);
      
    } catch (error) {
      console.error('Error generating flashcards:', error);
      console.error('Error stack:', error.stack);
      toast({
        title: "Error",
        description: `Failed to generate flashcards: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setGeneratingFlashcards(false);
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
                  onClick={generateFlashcards} 
                  disabled={generatingFlashcards || !user}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {generatingFlashcards ? 'Creating...' : 'Create Flashcards'}
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
                  Please log in to save notes and create flashcards
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
