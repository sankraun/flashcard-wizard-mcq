
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Play, Library } from 'lucide-react';
import SavedFlashcards from '@/components/SavedFlashcards';
import FlashcardPractice from '@/components/FlashcardPractice';

const Flashcards = () => {
  const [activeTab, setActiveTab] = useState('library');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Zap className="w-10 h-10 text-orange-600" />
            Flashcards
          </h1>
          <p className="text-gray-600 text-lg">
            Review your saved flashcards and practice to improve your learning
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Library className="w-4 h-4" />
              Flashcard Library
            </TabsTrigger>
            <TabsTrigger value="practice" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Practice Mode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-6">
            <SavedFlashcards />
          </TabsContent>

          <TabsContent value="practice" className="space-y-6">
            <FlashcardPractice />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Flashcards;
