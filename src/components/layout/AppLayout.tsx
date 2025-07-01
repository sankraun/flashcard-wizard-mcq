
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu';
import { Brain, FileText, BookOpen, Target, Presentation, Zap, History, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import AvatarDropdown from '@/components/AvatarDropdown';

const AppLayout = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Neutron AI
                </span>
              </div>
            </div>

            {/* Navigation */}
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="gap-2 text-slate-700 hover:text-blue-600">
                    <Target className="w-4 h-4" />
                    Practice
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-6 w-80">
                      <NavigationMenuLink className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Target className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">MCQ Practice</div>
                          <div className="text-sm text-slate-500">Test your knowledge with quizzes</div>
                        </div>
                      </NavigationMenuLink>
                      <NavigationMenuLink className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <Timer className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">Flashcard Practice</div>
                          <div className="text-sm text-slate-500">Study with spaced repetition</div>
                        </div>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="gap-2 text-slate-700 hover:text-blue-600">
                    <FileText className="w-4 h-4" />
                    Generate
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-6 w-80">
                      <NavigationMenuLink className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Brain className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">MCQ Generator</div>
                          <div className="text-sm text-slate-500">Create multiple choice questions</div>
                        </div>
                      </NavigationMenuLink>
                      <NavigationMenuLink className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">Smart Notes</div>
                          <div className="text-sm text-slate-500">Generate comprehensive notes</div>
                        </div>
                      </NavigationMenuLink>
                      <NavigationMenuLink className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Presentation className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">PowerPoint</div>
                          <div className="text-sm text-slate-500">Create professional slides</div>
                        </div>
                      </NavigationMenuLink>
                      <NavigationMenuLink className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <Zap className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">Flashcards</div>
                          <div className="text-sm text-slate-500">Generate study flashcards</div>
                        </div>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="gap-2 text-slate-700 hover:text-blue-600">
                    <History className="w-4 h-4" />
                    Library
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-6 w-80">
                      <NavigationMenuLink className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">Notes Library</div>
                          <div className="text-sm text-slate-500">Access saved notes</div>
                        </div>
                      </NavigationMenuLink>
                      <NavigationMenuLink className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <History className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">Presentations</div>
                          <div className="text-sm text-slate-500">View saved presentations</div>
                        </div>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* User Profile */}
            <div className="flex items-center gap-4">
              {user && (
                <AvatarDropdown 
                  user={user} 
                  onSignOut={signOut}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
