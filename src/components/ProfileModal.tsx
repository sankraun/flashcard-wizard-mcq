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
import { LogOut } from 'lucide-react';
import { getGeminiUsage } from '@/lib/geminiUsage';

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
  // --- API Token Usage Section ---
  // For demonstration, use static values. Replace with real values if available.
  const { used: apiTokenUsed, limit: apiTokenLimit, left: apiTokenLeft } = getGeminiUsage();

  const displayName = getUserDisplayName(user);
  const userEmail = user?.email || '';

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

          {/* API Token Usage Section */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-700">API Token Usage</span>
            </div>
            <p className="text-sm font-semibold text-gray-800">
              Used: <span className="text-blue-700">{apiTokenUsed}</span> / <span className="text-gray-700">{apiTokenLimit}</span>
              <span className="ml-2 text-xs text-green-700">({apiTokenLeft} left)</span>
            </p>
          </div>

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
