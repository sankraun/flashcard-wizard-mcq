
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home,
  BookOpen,
  Brain,
  Target,
  FileText,
  History,
  Timer,
  Zap,
  Settings,
  Bell,
  User
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const AppLayout = () => {
  const { user, signOut } = useAuth();

  const sidebarItems = [
    { icon: Home, label: 'Home', active: true },
    { icon: BookOpen, label: 'Courses' },
    { icon: Brain, label: 'AI Tools' },
    { icon: Target, label: 'Practice' },
    { icon: History, label: 'Library' },
    { icon: Settings, label: 'Settings' },
  ];

  const getNickname = () => {
    if (!user) return 'User';
    if (user.user_metadata && user.user_metadata.nickname) {
      return user.user_metadata.nickname;
    }
    if (user.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getInitials = () => {
    const nickname = getNickname();
    return nickname.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex">
      {/* Left Sidebar */}
      <div className="w-20 bg-white/80 backdrop-blur-sm border-r border-gray-200/50 flex flex-col items-center py-6 space-y-4">
        {/* Logo */}
        <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center mb-6">
          <Brain className="w-6 h-6 text-white" />
        </div>

        {/* Navigation Icons */}
        {sidebarItems.map((item, index) => (
          <button
            key={index}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
              item.active 
                ? 'bg-gray-900 text-white shadow-lg' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <item.icon className="w-5 h-5" />
          </button>
        ))}

        {/* User Avatar at Bottom */}
        <div className="mt-auto">
          <Avatar className="w-12 h-12 border-2 border-white shadow-md">
            <AvatarImage src={user?.user_metadata?.picture} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white/60 backdrop-blur-sm border-b border-gray-200/50 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Invest in your education
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5 text-gray-600" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>

      {/* Right Sidebar - User Profile */}
      <div className="w-80 bg-white/60 backdrop-blur-sm border-l border-gray-200/50 p-6">
        <div className="text-center mb-6">
          <Avatar className="w-16 h-16 mx-auto mb-3 border-2 border-white shadow-lg">
            <AvatarImage src={user?.user_metadata?.picture} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-lg">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-gray-900 text-lg">{getNickname()}</h3>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mt-1">
            <User className="w-4 h-4" />
            <span>274 Friends</span>
          </div>
        </div>

        {/* Activity Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-700">Activity</h4>
            <span className="text-sm text-gray-500">Year</span>
          </div>
          <div className="bg-white/80 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900 mb-1">3.5h</div>
            <div className="text-sm text-yellow-600 flex items-center gap-1">
              <span className="text-yellow-500">⭐</span>
              Great result!
            </div>
            {/* Activity Chart Placeholder */}
            <div className="mt-4 h-20 bg-gradient-to-r from-pink-200 via-purple-200 to-green-200 rounded-lg opacity-60"></div>
          </div>
        </div>

        {/* My Courses Section */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3">My courses</h4>
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
                  <Brain className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-blue-700">IT & Software</span>
                <span className="ml-auto text-xs font-bold text-blue-800">4.9</span>
              </div>
              <h5 className="font-semibold text-gray-900 text-sm mb-1">
                Flutter Masterclass (Dart, APIs, Firebase & More)
              </h5>
              <p className="text-xs text-gray-600">9,530 students</p>
            </div>

            <div className="bg-gradient-to-r from-orange-100 to-orange-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
                  <Target className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-xs font-medium text-orange-700">Business</span>
                <span className="ml-auto text-xs font-bold text-orange-800">4.9</span>
              </div>
              <h5 className="font-semibold text-gray-900 text-sm">
                Business Strategy Course
              </h5>
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="mt-8">
          <Button 
            onClick={signOut}
            variant="outline" 
            className="w-full"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
