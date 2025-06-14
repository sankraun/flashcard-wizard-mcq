
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AchievementsPanel from './AchievementsPanel';
import ChallengesPanel from './ChallengesPanel';
import LearningPathsPanel from './LearningPathsPanel';
import LeaderboardPanel from './LeaderboardPanel';
import { useGamification } from '@/hooks/useGamification';

const GamificationTabs: React.FC = () => {
  const {
    achievements,
    challenges,
    learningPaths,
    leaderboard,
    startLearningPath
  } = useGamification();

  return (
    <Tabs defaultValue="achievements" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="achievements" className="flex items-center gap-2">
          🏆 <span className="hidden sm:inline">Achievements</span>
        </TabsTrigger>
        <TabsTrigger value="challenges" className="flex items-center gap-2">
          🎯 <span className="hidden sm:inline">Challenges</span>
        </TabsTrigger>
        <TabsTrigger value="paths" className="flex items-center gap-2">
          🗺️ <span className="hidden sm:inline">Paths</span>
        </TabsTrigger>
        <TabsTrigger value="leaderboard" className="flex items-center gap-2">
          📊 <span className="hidden sm:inline">Leaderboard</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="achievements" className="mt-4">
        <AchievementsPanel achievements={achievements} />
      </TabsContent>
      
      <TabsContent value="challenges" className="mt-4">
        <ChallengesPanel challenges={challenges} />
      </TabsContent>
      
      <TabsContent value="paths" className="mt-4">
        <LearningPathsPanel 
          learningPaths={learningPaths} 
          onStartPath={startLearningPath}
        />
      </TabsContent>
      
      <TabsContent value="leaderboard" className="mt-4">
        <LeaderboardPanel leaderboard={leaderboard} />
      </TabsContent>
    </Tabs>
  );
};

export default GamificationTabs;
