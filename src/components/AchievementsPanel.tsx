
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Achievement } from '@/hooks/useGamification';

interface AchievementsPanelProps {
  achievements: Achievement[];
}

const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ achievements }) => {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercentage = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏆 Achievements
          <Badge variant="secondary">{unlockedCount}/{totalCount}</Badge>
        </CardTitle>
        <CardDescription>
          Track your learning milestones and unlock rewards
        </CardDescription>
        <Progress value={progressPercentage} className="w-full" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border transition-all ${
                achievement.unlocked
                  ? 'bg-green-50 border-green-200 shadow-sm'
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{achievement.icon}</span>
                <Badge
                  className={`text-white ${getRarityColor(achievement.rarity)}`}
                >
                  {achievement.rarity}
                </Badge>
              </div>
              <h3 className="font-semibold text-sm mb-1">{achievement.name}</h3>
              <p className="text-xs text-gray-600 mb-2">{achievement.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-blue-600">
                  {achievement.points} pts
                </span>
                {achievement.unlocked && (
                  <span className="text-xs text-green-600">✓ Unlocked</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AchievementsPanel;
