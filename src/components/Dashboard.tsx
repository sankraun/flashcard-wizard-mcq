import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import AnalyticsDashboard from './AnalyticsDashboard';
import { LoadingSkeleton } from './ui/loading-skeleton';

const Dashboard = () => {
  const { user } = useAuth();
  const analytics = useAnalytics();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please sign in</h2>
          <p className="text-gray-600">You need to be signed in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  if (analytics.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Analytics Dashboard</h1>
          <p className="text-gray-600">Track your progress, insights, and achievements</p>
        </div>
        
        <AnalyticsDashboard
          userId={user.id}
          streak={analytics.streak}
          dailyGoal={analytics.dailyGoal}
          todayProgress={analytics.todayProgress}
          accuracyHistory={analytics.accuracyHistory}
          weakTopics={analytics.weakTopics}
          studyTime={analytics.studyTime}
          badges={analytics.badges}
          onSetDailyGoal={analytics.setDailyGoal}
        />
      </div>
    </div>
  );
};

export default Dashboard;
