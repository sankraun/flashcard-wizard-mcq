import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface AvatarDropdownProps {
  user: any;
  onSignOut: () => void;
  showName?: boolean;
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

const AvatarDropdown: React.FC<AvatarDropdownProps> = ({ user, onSignOut, showName }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer">
          <Avatar className="w-8 h-8 border border-blue-200">
            {/* Optionally use user image if available */}
            {user?.user_metadata?.avatar_url ? (
              <AvatarImage src={user.user_metadata.avatar_url} alt="avatar" />
            ) : (
              <AvatarFallback>{getInitials(user)}</AvatarFallback>
            )}
          </Avatar>
          {/* Removed username next to avatar */}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem className="text-xs text-blue-900/80 cursor-default select-text">
          {user?.user_metadata?.nickname || user?.email?.split('@')[0] || 'User'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSignOut} className="text-red-600 cursor-pointer">
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AvatarDropdown;
