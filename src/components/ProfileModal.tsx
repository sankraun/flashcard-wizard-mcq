
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Trophy, Target, Calendar, Award, LogOut } from 'lucide-react';
import { useAnalytics } from '@/contexts/AnalyticsContext';

interface ProfileModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
}

const getInitials = (user: any) => {
  if (!user) return '';
  if (user.user_metadata && user.user_metadata.nickname) {
    return user.user_metadata.nickname.slice(0, 2).toUpperCase();
  }
  if (user.email) {
    return user.email[0].toUpperCase();
  }
  return 'U';
};

const getUserDisplayName = (user: any) => {
  if (!user) return 'User';
  if (user.user_metadata?.nickname) {
    return user.user_metadata.nickname;
  }
  if (user.user_metadata?.full_name) {
    return user.user_metadata.full_name;
  }
  if (user.email) {
    return user.email.split('@')[0];
  }
  return 'User';
};

const ProfileModal: React.FC<ProfileModalProps> = ({ user, isOpen, onClose, onSignOut }) => {
  const {
    streak,
    dailyGoal,
    todayProgress,
    accuracyHistory,
    weakTopics,
    studyTime,
    badges
  } = useAnalytics();

  const displayName = getUserDisplayName(user);
  const userEmail = user?.email || '';
  const averageAccuracy = accuracyHistory.length > 0 
    ? Math.round(accuracyHistory.reduce((sum, acc) => sum + acc, 0) / accuracyHistory.length)
    : 0;

  const totalStudyHours = Math.floor(studyTime / 60);
  const totalStudyMinutes = studyTime % 60;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info Section */}
          <div className="flex flex-col items-center space-y-3">
            <Avatar className="w-20 h-20 border-4 border-blue-100">
              {user?.user_metadata?.avatar_url ? (
                <AvatarImage src={user.user_metadata.avatar_url} alt="avatar" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl font-semibold">
                  {getInitials(user)}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  Pro
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{userEmail}</p>
            </div>
          </div>

          <Separator />

          {/* Stats Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-600" />
              Your Stats
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Current Streak */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-medium text-orange-700">Current Streak</span>
                </div>
                <p className="text-lg font-bold text-orange-800">{streak} days</p>
              </div>

              {/* Daily Goal Progress */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Today's Goal</span>
                </div>
                <p className="text-lg font-bold text-green-800">{todayProgress}/{dailyGoal}</p>
              </div>

              {/* Average Accuracy */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-700">Accuracy</span>
                </div>
                <p className="text-lg font-bold text-purple-800">{averageAccuracy}%</p>
              </div>

              {/* Study Time */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">Study Time</span>
                </div>
                <p className="text-lg font-bold text-blue-800">
                  {totalStudyHours}h {totalStudyMinutes}m
                </p>
              </div>
            </div>
          </div>

          {/* Badges Section */}
          {badges.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-600" />
                  Achievements ({badges.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {badges.slice(0, 6).map((badge, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
                    >
                      {badge}
                    </Badge>
                  ))}
                  {badges.length > 6 && (
                    <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
                      +{badges.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Weak Topics Section */}
          {weakTopics.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Areas to Improve</h3>
                <div className="flex flex-wrap gap-2">
                  {weakTopics.slice(0, 4).map((topic, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="text-xs bg-red-50 text-red-700 border-red-200"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Sign Out Button */}
          <Button 
            onClick={onSignOut} 
            variant="outline"
            className="w-full flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
