
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Presentation, Download, Trash2, Calendar, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PresentationSlide {
  title: string;
  bullets: string[];
}

interface PresentationContent {
  slides: PresentationSlide[];
}

interface Presentation {
  id: string;
  title: string;
  content: PresentationContent;
  file_url: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const SavedPresentations = () => {
  const { user } = useAuth();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPresentations();
    }
  }, [user]);

  const fetchPresentations = async () => {
    try {
      const { data, error } = await supabase
        .from('powerpoint_presentations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedPresentations: Presentation[] = data?.map(item => ({
        ...item,
        content: item.content as unknown as PresentationContent
      })) || [];

      setPresentations(typedPresentations);
    } catch (error) {
      console.error('Error fetching presentations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load presentations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePresentation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('powerpoint_presentations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPresentations(presentations.filter(p => p.id !== id));
      toast({
        title: 'Success',
        description: 'Presentation deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting presentation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete presentation',
        variant: 'destructive',
      });
    }
  };

  const downloadPresentation = async (presentation: Presentation) => {
    try {
      // Create a simple text representation for download
      const content = `# ${presentation.title}\n\n` + 
        presentation.content.slides.map((slide, index) => 
          `## Slide ${index + 1}: ${slide.title}\n${slide.bullets.map(bullet => `• ${bullet}`).join('\n')}\n`
        ).join('\n');

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${presentation.title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading presentation:', error);
      toast({
        title: 'Error',
        description: 'Failed to download presentation',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded"></div>
                  <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (presentations.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="text-center py-12">
          <CardContent>
            <Presentation className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <h3 className="text-xl font-semibold mb-2">No presentations yet</h3>
            <p className="text-slate-500 mb-6">
              Create your first PowerPoint presentation to see it here.
            </p>
            <Button variant="outline">
              Create Presentation
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Saved Presentations</h2>
        <p className="text-slate-600">
          Manage and download your generated PowerPoint presentations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {presentations.map((presentation) => (
          <Card key={presentation.id} className="hover:shadow-lg transition-shadow duration-300 group">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Presentation className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate group-hover:text-blue-600 transition-colors">
                    {presentation.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-500">
                      {format(new Date(presentation.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" />
                  {presentation.content.slides.length} slides
                </Badge>
              </div>
              
              <div className="text-sm text-slate-600">
                {presentation.content.slides.slice(0, 2).map((slide, idx) => (
                  <div key={idx} className="mb-1 truncate">
                    • {slide.title}
                  </div>
                ))}
                {presentation.content.slides.length > 2 && (
                  <div className="text-xs text-slate-400">
                    +{presentation.content.slides.length - 2} more slides
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => downloadPresentation(presentation)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deletePresentation(presentation.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SavedPresentations;
