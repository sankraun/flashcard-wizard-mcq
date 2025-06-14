
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { User, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

const AvatarDropdown: React.FC<AvatarDropdownProps> = ({ user, onSignOut, showName }) => {
  const displayName = getUserDisplayName(user);
  const userEmail = user?.email || '';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-md">
          <Avatar className="w-9 h-9 border-2 border-blue-100 hover:border-blue-200 transition-colors">
            {user?.user_metadata?.avatar_url ? (
              <AvatarImage src={user.user_metadata.avatar_url} alt="avatar" />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                {getInitials(user)}
              </AvatarFallback>
            )}
          </Avatar>
          {showName && (
            <span className="text-sm font-medium text-gray-700 hidden lg:block">
              {displayName}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-64 bg-white border border-gray-200 shadow-lg rounded-xl p-2"
        sideOffset={8}
      >
        {/* User Profile Header */}
        <DropdownMenuLabel className="p-0">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-2">
            <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
              {user?.user_metadata?.avatar_url ? (
                <AvatarImage src={user.user_metadata.avatar_url} alt="avatar" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-lg">
                  {getInitials(user)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {displayName}
                </p>
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                  Pro
                </Badge>
              </div>
              <p className="text-xs text-gray-600 truncate">
                {userEmail}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        {/* Profile */}
        <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Profile</p>
            <p className="text-xs text-gray-500">Manage your account settings</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2 bg-gray-200" />

        {/* Sign Out */}
        <DropdownMenuItem 
          onClick={onSignOut} 
          className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-red-50 transition-colors text-red-600 hover:text-red-700"
        >
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <LogOut className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Sign Out</p>
            <p className="text-xs text-red-500">Sign out of your account</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AvatarDropdown;
