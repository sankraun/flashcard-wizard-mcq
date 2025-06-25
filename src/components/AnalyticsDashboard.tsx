import React from 'react';

interface AnalyticsDashboardProps {
  userId: string;
  streak: number;
  dailyGoal: number;
  todayProgress: number;
  accuracyHistory: Array<{ date: string; accuracy: number }>;
  weakTopics: string[];
  studyTime: Array<{ topic: string; minutes: number }>;
  badges: string[];
  onSetDailyGoal: (goal: number) => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  streak,
  dailyGoal,
  todayProgress,
  accuracyHistory,
  weakTopics,
  studyTime,
  badges,
  onSetDailyGoal,
}) => {
  return (
    <div className="w-full space-y-6">
      {/* Main Dashboard with Tabs */}
      {/* Content removed as per the code change request */}
    </div>
  );
};

export default AnalyticsDashboard;
