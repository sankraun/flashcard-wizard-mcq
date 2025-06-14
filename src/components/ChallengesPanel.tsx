
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Challenge } from '@/hooks/useGamification';

interface ChallengesPanelProps {
  challenges: Challenge[];
}

const ChallengesPanel: React.FC<ChallengesPanelProps> = ({ challenges }) => {
  const getChallengeProgress = (challenge: Challenge) => {
    if (challenge.completed_at) return 100;
    
    const goals = challenge.goals;
    const progress = challenge.progress || {};
    
    if (goals.questions_target) {
      const completed = progress.questions_completed || 0;
      return Math.min((completed / goals.questions_target) * 100, 100);
    }
    
    return 0;
  };

  const formatTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'daily': return '📅';
      case 'weekly': return '📊';
      case 'special': return '⭐';
      default: return '🎯';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎯 Active Challenges
        </CardTitle>
        <CardDescription>
          Complete challenges to earn bonus points and badges
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {challenges.map((challenge) => {
            const progress = getChallengeProgress(challenge);
            const timeRemaining = formatTimeRemaining(challenge.end_date);
            
            return (
              <div
                key={challenge.id}
                className={`p-4 rounded-lg border ${
                  challenge.completed_at
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getChallengeIcon(challenge.type)}</span>
                    <div>
                      <h3 className="font-semibold text-sm">{challenge.name}</h3>
                      <p className="text-xs text-gray-600">{challenge.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={challenge.type === 'daily' ? 'default' : challenge.type === 'weekly' ? 'secondary' : 'outline'}
                    >
                      {challenge.type}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{timeRemaining}</p>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    {challenge.goals.questions_target && (
                      <span>
                        Target: {challenge.goals.questions_target} questions
                      </span>
                    )}
                    {challenge.goals.accuracy_target && (
                      <span>
                        Accuracy: {challenge.goals.accuracy_target}%+
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-medium">
                      🏆 {challenge.rewards?.points || 0} pts
                    </span>
                    {challenge.completed_at && (
                      <span className="text-green-600">✓ Completed</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {challenges.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No active challenges at the moment.</p>
              <p className="text-sm">Check back later for new challenges!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChallengesPanel;
