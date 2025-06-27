
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Target, AlertCircle, Lightbulb, Star } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SmartInsightsProps {
  streak: number;
  todayProgress: number;
  dailyGoal: number;
  accuracyHistory: Array<{ date: string; accuracy: number }>;
  weakTopics: string[];
  studyTime: Array<{ topic: string; minutes: number }>;
}

const SmartInsights: React.FC<SmartInsightsProps> = ({
  streak,
  todayProgress,
  dailyGoal,
  accuracyHistory,
  weakTopics,
  studyTime
}) => {
  // Generate AI-powered insights
  const generateInsights = () => {
    const insights = [];
    const recentAccuracy = accuracyHistory.slice(-7);
    const avgAccuracy = recentAccuracy.length > 0 ? 
      recentAccuracy.reduce((sum, day) => sum + day.accuracy, 0) / recentAccuracy.length : 0;
    
    // Streak insights
    if (streak >= 7) {
      insights.push({
        type: 'success',
        icon: <Star className="w-4 h-4" />,
        title: 'Excellent Consistency!',
        message: `Your ${streak}-day streak shows great dedication. Keep this momentum going!`,
        priority: 'high'
      });
    } else if (streak === 0) {
      insights.push({
        type: 'warning',
        icon: <Target className="w-4 h-4" />,
        title: 'Time to Build Momentum',
        message: 'Start a new streak today! Even 5 minutes of practice can make a difference.',
        priority: 'high'
      });
    }

    // Progress insights
    if (todayProgress < dailyGoal * 0.5) {
      insights.push({
        type: 'info',
        icon: <AlertCircle className="w-4 h-4" />,
        title: 'Daily Goal Progress',
        message: `You're ${dailyGoal - todayProgress} questions away from today's goal. You've got this!`,
        priority: 'medium'
      });
    }

    // Accuracy insights
    if (avgAccuracy >= 85) {
      insights.push({
        type: 'success',
        icon: <TrendingUp className="w-4 h-4" />,
        title: 'Outstanding Performance',
        message: `Your average accuracy of ${Math.round(avgAccuracy)}% is excellent! Consider increasing difficulty.`,
        priority: 'medium'
      });
    } else if (avgAccuracy < 70 && avgAccuracy > 0) {
      insights.push({
        type: 'warning',
        icon: <Lightbulb className="w-4 h-4" />,
        title: 'Room for Improvement',
        message: 'Focus on understanding concepts deeply rather than speed. Quality over quantity!',
        priority: 'high'
      });
    }

    // Study pattern insights
    const totalStudyTime = studyTime.reduce((sum, topic) => sum + topic.minutes, 0);
    if (totalStudyTime > 120) {
      insights.push({
        type: 'success',
        icon: <Brain className="w-4 h-4" />,
        title: 'Dedicated Learner',
        message: 'Your study time shows real commitment. Remember to take breaks for better retention!',
        priority: 'low'
      });
    }

    // Weak topics insights
    if (weakTopics.length > 0) {
      insights.push({
        type: 'info',
        icon: <Target className="w-4 h-4" />,
        title: 'Focus Areas Identified',
        message: `Concentrate on ${weakTopics[0]} for maximum improvement. Small, consistent effort yields big results.`,
        priority: 'medium'
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
    });
  };

  const insights = generateInsights();

  const getInsightStyle = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-soft">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-heading-2">Smart Insights</CardTitle>
            <p className="text-body-sm text-slate-600">AI-powered recommendations for your learning journey</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Complete more practice sessions to get personalized insights!</p>
          </div>
        ) : (
          insights.map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-card ${getInsightStyle(insight.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${getIconColor(insight.type)}`}>
                  {insight.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-800">{insight.title}</h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        insight.priority === 'high' ? 'border-red-300 text-red-700' :
                        insight.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                        'border-gray-300 text-gray-600'
                      }`}
                    >
                      {insight.priority}
                    </Badge>
                  </div>
                  <p className="text-body-sm text-slate-600 leading-relaxed">{insight.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default SmartInsights;
