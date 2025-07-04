
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AvatarDropdown from './AvatarDropdown';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  Sparkles, 
  BookOpen, 
  Brain, 
  Presentation, 
  Target,
  User,
  Zap,
  Crown
} from 'lucide-react';

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
}

const AppSidebar = ({ activeTab, onTabChange }: AppSidebarProps) => {
  const { user } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const menuItems = [
    {
      id: 'generator',
      label: 'AI Generator',
      icon: Sparkles,
      description: 'Generate MCQs, Notes, Flashcards & PPT'
    },
    {
      id: 'saved-notes',
      label: 'Notes Library',
      icon: BookOpen,
      description: 'View and manage your notes'
    },
    {
      id: 'mcq-practice',
      label: 'MCQ Practice',
      icon: Brain,
      description: 'Practice with generated MCQs'
    },
    {
      id: 'presentations',
      label: 'Presentations',
      icon: Presentation,
      description: 'View saved presentations'
    },
    {
      id: 'practice',
      label: 'Study Sessions',
      icon: Target,
      description: 'Flashcard practice session'
    }
  ];

  const isActive = (itemId: string) => activeTab === itemId;

  return (
    <Sidebar className={`${collapsed ? "w-16" : "w-64"} bg-gray-900 border-gray-800`} collapsible="icon">
      <div className="flex flex-col h-full bg-gray-900">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg text-white">Neutron AI</h1>
                <p className="text-xs text-gray-400">Study Assistant</p>
              </div>
            )}
          </div>
        </div>

        <SidebarContent className="flex-1 bg-gray-900">
          <SidebarGroup>
            <SidebarGroupLabel className={`${collapsed ? "sr-only" : ""} text-gray-400`}>
              Main Features
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      className={`w-full text-left transition-all duration-200 hover:bg-gray-800 ${
                        isActive(item.id)
                          ? 'bg-gray-800 text-white border-r-2 border-purple-500 font-medium'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <item.icon className={`w-5 h-5 ${
                          isActive(item.id) ? 'text-purple-400' : 'text-gray-400'
                        }`} />
                        {!collapsed && (
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{item.label}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {item.description}
                            </div>
                          </div>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Upgrade Plan Footer */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 rounded-lg border border-purple-500/20">
            <Crown className="w-5 h-5 text-purple-400" />
            {!collapsed && (
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Upgrade Plan</div>
                <div className="text-xs text-gray-400">Get Plus features</div>
              </div>
            )}
          </div>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-gray-800">
          {user && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-300" />
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate text-white">{user.email}</div>
                  <div className="text-xs text-gray-400">Free Plan</div>
                </div>
              )}
              <AvatarDropdown 
                user={user} 
                onSignOut={() => {/* handled by AvatarDropdown */}} 
              />
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <div className="p-2 border-t border-gray-800">
          <SidebarTrigger className="w-full justify-center text-gray-400 hover:text-white hover:bg-gray-800" />
        </div>
      </div>
    </Sidebar>
  );
};

export default AppSidebar;
