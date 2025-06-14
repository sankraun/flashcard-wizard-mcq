import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Zap, Trash2, Calendar, Filter, Eye, EyeOff, RefreshCw } from 'lucide-react';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string | null;
  original_text: string | null;
  created_at: string;
  updated_at: string;
}

const SavedFlashcards = () => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [flippedCards, setFlippedCards] = useState<{ [key: string]: boolean }>({});
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadFlashcards();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadFlashcards = async (showRefreshToast = false) => {
    try {
      console.log('Loading flashcards for user:', user?.id);
      
      if (showRefreshToast) {
        setRefreshing(true);
      }

      if (!user) {
        console.log('No user found, cannot load flashcards');
        setFlashcards([]);
        return;
      }

      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Flashcards query result:', { data, error, userId: user.id });

      if (error) {
        console.error('Error loading flashcards:', error);
        throw error;
      }

      console.log('Loaded flashcards:', data);
      setFlashcards(data || []);
      
      if (showRefreshToast) {
        toast({
          title: "Refreshed",
          description: `Loaded ${data?.length || 0} flashcards`
        });
      }
    } catch (error) {
      console.error('Error loading flashcards:', error);
      toast({
        title: "Error",
        description: "Failed to load flashcards",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const deleteFlashcard = async (flashcardId: string) => {
    try {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', flashcardId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setFlashcards(flashcards.filter(flashcard => flashcard.id !== flashcardId));
      toast({
        title: "Success",
        description: "Flashcard deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      toast({
        title: "Error",
        description: "Failed to delete flashcard",
        variant: "destructive"
      });
    }
  };

  const toggleFlashcard = (flashcardId: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [flashcardId]: !prev[flashcardId]
    }));
  };

  const getUniqueCategories = () => {
    const categories = flashcards
      .map(fc => fc.category)
      .filter((category, index, self) => category && self.indexOf(category) === index);
    return categories;
  };

  const filteredFlashcards = flashcards.filter(flashcard => {
    const matchesSearch = flashcard.front.toLowerCase().includes(search.toLowerCase()) ||
                         flashcard.back.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (categoryFilter !== "All" && flashcard.category !== categoryFilter) return false;
    
    if (dateFilter === "All") return true;
    
    const flashcardDate = new Date(flashcard.created_at);
    if (dateFilter === "Today") return isToday(flashcardDate);
    if (dateFilter === "This Week") return isThisWeek(flashcardDate);
    if (dateFilter === "This Month") return isThisMonth(flashcardDate);
    
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
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading flashcards...</div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Saved Flashcards
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-muted-foreground">
            Please log in to view your flashcards
          </div>
        </CardContent>
      </Card>
    );
  }

  if (flashcards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Saved Flashcards
            </span>
            <Button
              onClick={() => loadFlashcards(true)}
              variant="outline"
              size="sm"
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No flashcards yet</h3>
          <p className="text-muted-foreground mb-4">
            Generate flashcards from your notes to see them here
          </p>
          <Button
            onClick={() => loadFlashcards(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Check for new flashcards
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="border-b pb-4 mb-2 bg-white/80 sticky top-0 z-10">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Zap className="w-5 h-5 text-orange-600" />
            Saved Flashcards <span className="text-gray-400 font-normal">({filteredFlashcards.length})</span>
          </span>
          <Button
            onClick={() => loadFlashcards(true)}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
        
        <div className="mt-2 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
          <div className="relative w-full max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" /></svg>
            </span>
            <input
              type="text"
              placeholder="Search flashcards..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-3 py-2 rounded-full border bg-gray-50 text-gray-900 border-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors shadow-sm outline-none w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="border rounded px-2 py-1 text-sm bg-gray-50 text-gray-900 border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              {getUniqueCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              className="border rounded px-2 py-1 text-sm bg-gray-50 text-gray-900 border-gray-200 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors"
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
      <CardContent className="space-y-4 px-4">
        {filteredFlashcards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Zap className="w-12 h-12 mb-2" />
            <div className="text-base font-medium">No flashcards found</div>
            <div className="text-sm">Try a different search or filter.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFlashcards.map((flashcard) => (
              <Card key={flashcard.id} className="group hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-400">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                      {flashcard.category || 'General'}
                    </span>
                    <div className="flex gap-1">
                      <Button 
                        onClick={() => toggleFlashcard(flashcard.id)}
                        variant="ghost"
                        size="icon"
                        className="hover:bg-orange-50"
                        title={flippedCards[flashcard.id] ? "Show front" : "Show back"}
                      >
                        {flippedCards[flashcard.id] ? (
                          <EyeOff className="w-4 h-4 text-orange-600" />
                        ) : (
                          <Eye className="w-4 h-4 text-orange-600" />
                        )}
                      </Button>
                      <Button 
                        onClick={() => deleteFlashcard(flashcard.id)}
                        variant="ghost"
                        size="icon"
                        className="hover:bg-red-50"
                        title="Delete flashcard"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="min-h-[120px] flex flex-col justify-center">
                    {!flippedCards[flashcard.id] ? (
                      <div>
                        <div className="text-xs text-gray-500 mb-2">FRONT</div>
                        <div className="text-gray-900 font-medium">{flashcard.front}</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-xs text-gray-500 mb-2">BACK</div>
                        <div className="text-gray-700">{flashcard.back}</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t text-xs text-gray-400">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {new Date(flashcard.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SavedFlashcards;
