
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
} from '@/components/ui/navigation-menu';
import { Brain, FileText, History, Target, Presentation, Timer, Zap, BookOpen } from 'lucide-react';
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
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Neutron AI
              </span>
            </div>

            {/* Navigation */}
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList className="gap-1">
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-9 px-3 gap-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 data-[state=open]:bg-blue-50/50">
                    <Target className="w-4 h-4" />
                    Practice
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-72 p-4">
                      <div className="grid gap-3">
                        <NavigationMenuLink className="group flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                            <Target className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-slate-900">MCQ Practice</div>
                            <div className="text-xs text-slate-500">Test your knowledge</div>
                          </div>
                        </NavigationMenuLink>
                        <NavigationMenuLink className="group flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                            <Timer className="w-4 h-4 text-yellow-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-slate-900">Flashcards</div>
                            <div className="text-xs text-slate-500">Spaced repetition</div>
                          </div>
                        </NavigationMenuLink>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-9 px-3 gap-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 data-[state=open]:bg-blue-50/50">
                    <FileText className="w-4 h-4" />
                    Generate
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-72 p-4">
                      <div className="grid gap-3">
                        <NavigationMenuLink className="group flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                            <Brain className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-slate-900">MCQ Generator</div>
                            <div className="text-xs text-slate-500">Create questions</div>
                          </div>
                        </NavigationMenuLink>
                        <NavigationMenuLink className="group flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                            <FileText className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-slate-900">Smart Notes</div>
                            <div className="text-xs text-slate-500">Generate notes</div>
                          </div>
                        </NavigationMenuLink>
                        <NavigationMenuLink className="group flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="w-8 h-8 bg-indigo-100 rounded-md flex items-center justify-center">
                            <Presentation className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-slate-900">PowerPoint</div>
                            <div className="text-xs text-slate-500">Create slides</div>
                          </div>
                        </NavigationMenuLink>
                        <NavigationMenuLink className="group flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                            <Zap className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-slate-900">Flashcards</div>
                            <div className="text-xs text-slate-500">Study cards</div>
                          </div>
                        </NavigationMenuLink>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-9 px-3 gap-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 data-[state=open]:bg-blue-50/50">
                    <History className="w-4 h-4" />
                    Library
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-72 p-4">
                      <div className="grid gap-3">
                        <NavigationMenuLink className="group flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="w-8 h-8 bg-indigo-100 rounded-md flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-slate-900">Notes</div>
                            <div className="text-xs text-slate-500">Saved notes</div>
                          </div>
                        </NavigationMenuLink>
                        <NavigationMenuLink className="group flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center">
                            <Presentation className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-slate-900">Presentations</div>
                            <div className="text-xs text-slate-500">Saved slides</div>
                          </div>
                        </NavigationMenuLink>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* User Profile */}
            <div className="flex items-center">
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
