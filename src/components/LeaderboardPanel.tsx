
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaderboardEntry } from '@/hooks/useGamification';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardPanelProps {
  leaderboard: LeaderboardEntry[];
}

const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({ leaderboard }) => {
  const { user } = useAuth();

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  const formatLastActivity = (date: string) => {
    const now = new Date();
    const activity = new Date(date);
    const diffMs = now.getTime() - activity.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏆 Leaderboard
        </CardTitle>
        <CardDescription>
          See how you compare with other learners (anonymized)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.map((entry, index) => {
            const isCurrentUser = entry.id === user?.id;
            
            return (
              <div
                key={entry.id}
                className={`p-3 rounded-lg border transition-all ${
                  isCurrentUser
                    ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100'
                    : index < 3
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold min-w-[3rem] text-center">
                      {getRankIcon(index)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">
                          {entry.display_name}
                          {isCurrentUser && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              You
                            </Badge>
                          )}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>🎯 {entry.questions_answered} questions</span>
                        <span>📊 {entry.accuracy_percentage.toFixed(1)}% accuracy</span>
                        <span>🔥 {entry.current_streak} streak</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {entry.total_points.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      🏆 {entry.achievements_count} achievements
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatLastActivity(entry.last_activity)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {leaderboard.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No leaderboard data yet.</p>
              <p className="text-sm">Start practicing to see your ranking!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaderboardPanel;
