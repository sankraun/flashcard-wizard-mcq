
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  Brain, 
  FileText, 
  History, 
  Target, 
  Presentation, 
  Timer, 
  Zap, 
  BookOpen,
  Plus,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AvatarDropdown from './AvatarDropdown';

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AppSidebar = ({ activeTab, onTabChange }: AppSidebarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();

  const practiceItems = [
    {
      id: 'practice',
      label: 'MCQ Practice',
      icon: Target,
      action: () => navigate('/mcq-practice'),
      description: 'Test your knowledge'
    },
    {
      id: 'practice-flashcards',
      label: 'Study Session',
      icon: Timer,
      action: () => onTabChange('practice'),
      description: 'Practice flashcards'
    }
  ];

  const generateItems = [
    {
      id: 'mcqs',
      label: 'MCQ Generator',
      icon: Brain,
      action: () => onTabChange('mcqs'),
      description: 'Generate questions'
    },
    {
      id: 'notes-generator',
      label: 'Smart Notes',
      icon: FileText,
      action: () => onTabChange('notes-generator'),
      description: 'Create study notes'
    },
    {
      id: 'powerpoint',
      label: 'PowerPoint',
      icon: Presentation,
      action: () => onTabChange('powerpoint'),
      description: 'Create slides'
    },
    {
      id: 'flashcards',
      label: 'Flashcards',
      icon: Zap,
      action: () => onTabChange('flashcards'),
      description: 'Generate flashcards'
    }
  ];

  const libraryItems = [
    {
      id: 'saved-notes',
      label: 'Notes Library',
      icon: BookOpen,
      action: () => onTabChange('saved-notes'),
      description: 'View saved notes'
    },
    {
      id: 'presentations',
      label: 'Presentations',
      icon: History,
      action: () => onTabChange('presentations'),
      description: 'View presentations'
    }
  ];

  const isItemActive = (itemId: string) => {
    if (itemId === 'practice') {
      return location.pathname === '/mcq-practice';
    }
    return activeTab === itemId;
  };

  const renderMenuItem = (item: typeof practiceItems[0]) => (
    <SidebarMenuItem key={item.id}>
      <SidebarMenuButton
        onClick={item.action}
        isActive={isItemActive(item.id)}
        className="w-full justify-start"
      >
        <item.icon className="h-4 w-4" />
        {state === 'expanded' && <span>{item.label}</span>}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  const getNickname = () => {
    if (!user) return '';
    if (user.user_metadata && user.user_metadata.nickname) {
      return user.user_metadata.nickname;
    }
    if (user.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          {state === 'expanded' && (
            <span className="text-xl font-semibold text-foreground">Neutron AI</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Practice</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {practiceItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Generate</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {generateItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Library</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {libraryItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {user && (
          <div className="flex items-center gap-3">
            {state === 'expanded' ? (
              <AvatarDropdown user={user} onSignOut={signOut} />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center p-2"
                onClick={() => {}}
              >
                <User className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
