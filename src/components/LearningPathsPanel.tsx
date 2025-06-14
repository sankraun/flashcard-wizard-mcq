
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LearningPath } from '@/hooks/useGamification';

interface LearningPathsPanelProps {
  learningPaths: LearningPath[];
  onStartPath: (pathId: string) => void;
}

const LearningPathsPanel: React.FC<LearningPathsPanelProps> = ({ learningPaths, onStartPath }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPathProgress = (path: LearningPath) => {
    if (!path.started_at) return 0;
    const completed = path.topics_completed?.length || 0;
    const total = path.topics.length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const getPathIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '🌱';
      case 'intermediate': return '🚀';
      case 'advanced': return '🎓';
      default: return '📚';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🗺️ Learning Paths
        </CardTitle>
        <CardDescription>
          Follow structured learning sequences for systematic improvement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {learningPaths.map((path) => {
            const progress = getPathProgress(path);
            const isStarted = !!path.started_at;
            const isCompleted = !!path.completed_at;
            
            return (
              <div
                key={path.id}
                className={`p-4 rounded-lg border ${
                  isCompleted
                    ? 'bg-green-50 border-green-200'
                    : isStarted
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getPathIcon(path.difficulty)}</span>
                    <div>
                      <h3 className="font-semibold">{path.name}</h3>
                      <p className="text-sm text-gray-600">{path.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={`text-white ${getDifficultyColor(path.difficulty)}`}
                    >
                      {path.difficulty}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      ~{path.estimated_duration_hours}h
                    </p>
                  </div>
                </div>

                {isStarted && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{Math.round(progress)}% Complete</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                <div className="mb-3">
                  <h4 className="text-sm font-medium mb-2">Topics ({path.topics.length}):</h4>
                  <div className="flex flex-wrap gap-1">
                    {path.topics.map((topic, index) => {
                      const isTopicCompleted = path.topics_completed?.includes(topic);
                      const isCurrentTopic = index === (path.current_topic_index || 0);
                      
                      return (
                        <Badge
                          key={topic}
                          variant={
                            isTopicCompleted
                              ? 'default'
                              : isCurrentTopic && isStarted
                              ? 'secondary'
                              : 'outline'
                          }
                          className={`text-xs ${
                            isTopicCompleted
                              ? 'bg-green-500'
                              : isCurrentTopic && isStarted
                              ? 'bg-blue-500 text-white'
                              : ''
                          }`}
                        >
                          {isTopicCompleted && '✓ '}
                          {isCurrentTopic && isStarted && !isTopicCompleted && '→ '}
                          {topic}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {path.prerequisites.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium mb-1">Prerequisites:</h4>
                    <div className="flex flex-wrap gap-1">
                      {path.prerequisites.map((prereq) => (
                        <Badge key={prereq} variant="outline" className="text-xs">
                          {prereq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {isCompleted && (
                      <span className="text-green-600 font-medium">✅ Completed!</span>
                    )}
                    {isStarted && !isCompleted && (
                      <span className="text-blue-600 font-medium">
                        📚 In Progress - Topic {(path.current_topic_index || 0) + 1} of {path.topics.length}
                      </span>
                    )}
                  </div>
                  
                  {!isStarted && (
                    <Button
                      onClick={() => onStartPath(path.id)}
                      size="sm"
                      variant="outline"
                    >
                      Start Path
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {learningPaths.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No learning paths available.</p>
              <p className="text-sm">Learning paths help you follow a structured approach to mastering topics.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LearningPathsPanel;
