
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
  Zap
} from 'lucide-react';

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
}

const AppSidebar = ({ activeTab, onTabChange }: AppSidebarProps) => {
  const { user } = useAuth();
  const { collapsed } = useSidebar();

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
      label: 'Study Session',
      icon: Target,
      description: 'Flashcard practice session'
    }
  ];

  const isActive = (itemId: string) => activeTab === itemId;

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg text-gray-900">Neutron AI</h1>
                <p className="text-xs text-gray-500">Study Assistant</p>
              </div>
            )}
          </div>
        </div>

        <SidebarContent className="flex-1">
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
              Main Features
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      className={`w-full text-left transition-all duration-200 ${
                        isActive(item.id)
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <item.icon className={`w-5 h-5 ${
                          isActive(item.id) ? 'text-blue-600' : 'text-gray-500'
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

        {/* User Section */}
        <div className="p-4 border-t mt-auto">
          {user && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{user.email}</div>
                  <div className="text-xs text-gray-500">Free Plan</div>
                </div>
              )}
              <AvatarDropdown />
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <div className="p-2 border-t">
          <SidebarTrigger className="w-full justify-center" />
        </div>
      </div>
    </Sidebar>
  );
};

export default AppSidebar;
