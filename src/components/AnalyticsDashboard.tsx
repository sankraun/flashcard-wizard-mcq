import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, Flame, Award, Clock, TrendingUp, Star, Info, TrendingDown, ArrowUp, ArrowDown, Target, BookOpen, BarChart3 } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import * as Recharts from 'recharts';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AnalyticsDashboardProps {
  userId: string;
  streak: number;
  dailyGoal: number;
  todayProgress: number;
  accuracyHistory: Array<{ date: string; accuracy: number }>;
  weakTopics: string[];
  studyTime: Array<{ topic: string; minutes: number }>;
  badges: string[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  streak,
  dailyGoal,
  todayProgress,
  accuracyHistory,
  weakTopics,
  studyTime,
  badges,
}) => {
  const [selectedChart, setSelectedChart] = useState<'accuracy' | 'study' | null>(null);

  // Enhanced chart configurations
  const chartConfig = {
    accuracy: {
      label: "Accuracy",
      color: "#2563eb",
    },
    previousAccuracy: {
      label: "Previous Week",
      color: "#94a3b8",
    },
    studyTime: {
      label: "Study Time",
      color: "#8B5CF6",
    },
    target: {
      label: "Target",
      color: "#10b981",
    },
  };

  // Calculate comparative analytics
  const compareData = useMemo(() => {
    const currentWeek = accuracyHistory.slice(-7);
    const previousWeek = accuracyHistory.slice(-14, -7);
    
    const currentAvg = currentWeek.length > 0 ? 
      currentWeek.reduce((sum, item) => sum + (item.accuracy || 0), 0) / currentWeek.length : 0;
    const previousAvg = previousWeek.length > 0 ? 
      previousWeek.reduce((sum, item) => sum + (item.accuracy || 0), 0) / previousWeek.length : 0;
    
    const weekOverWeekChange = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;
    
    return {
      currentWeek: Math.round(currentAvg),
      previousWeek: Math.round(previousAvg),
      weekOverWeekChange: Math.round(weekOverWeekChange * 10) / 10,
      isImproving: weekOverWeekChange > 0
    };
  }, [accuracyHistory]);

  // Enhanced chart data with comparative analytics
  const enhancedAccuracyData = useMemo(() => {
    const current = accuracyHistory.slice(-7);
    const previous = accuracyHistory.slice(-14, -7);
    
    return current.map((item, index) => ({
      date: item.date.slice(5),
      accuracy: Math.round(item.accuracy || 0),
      previousAccuracy: previous[index] ? Math.round(previous[index].accuracy || 0) : 0,
      target: 80 // Target accuracy line
    }));
  }, [accuracyHistory]);

  const enhancedStudyData = useMemo(() => {
    return studyTime.map(item => ({
      name: item.topic,
      minutes: item.minutes,
      target: 30, // Target study time per topic
      efficiency: Math.min(100, (item.minutes / 30) * 100)
    }));
  }, [studyTime]);

  // Professional achievements with enhanced design
  const allAchievements = [
    {
      key: "noob",
      label: "Getting Started",
      description: "Welcome to your learning journey!",
      icon: <Star className="w-4 h-4" />,
      unlocked: true,
      gradient: "from-green-400 to-green-600",
    },
    {
      key: "streak5",
      label: "Consistent Learner",
      description: "Maintain a 5-day streak.",
      icon: <Flame className="w-4 h-4" />,
      unlocked: streak >= 5,
      gradient: "from-orange-400 to-red-500",
    },
    {
      key: "streak15",
      label: "Dedication Master",
      description: "Maintain a 15-day streak.",
      icon: <Flame className="w-4 h-4" />,
      unlocked: streak >= 15,
      gradient: "from-red-500 to-pink-600",
    },
    {
      key: "accuracy80",
      label: "Sharp Shooter",
      description: "Achieve 80%+ accuracy in a week.",
      icon: <BarChart className="w-4 h-4" />,
      unlocked: accuracyHistory.some(a => a.accuracy >= 80),
      gradient: "from-blue-400 to-blue-600",
    },
    {
      key: "accuracy95",
      label: "Perfectionist",
      description: "Achieve 95%+ accuracy in a week.",
      icon: <Award className="w-4 h-4" />,
      unlocked: accuracyHistory.some(a => a.accuracy >= 95),
      gradient: "from-yellow-400 to-yellow-600",
    },
  ];

  // Professional Empty State Component
  const EmptyState = ({ 
    icon: IconComponent, 
    title, 
    subtitle, 
    actionText 
  }: { 
    icon: React.ComponentType<any>, 
    title: string, 
    subtitle: string, 
    actionText?: string 
  }) => (
    <div className="flex flex-col items-center justify-center h-32 text-center space-y-3">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
        <IconComponent className="w-6 h-6 text-slate-400" />
      </div>
      <div>
        <div className="text-body font-medium text-slate-700">{title}</div>
        <div className="text-body-sm text-slate-500">{subtitle}</div>
      </div>
      {actionText && (
        <button className="text-body-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
          {actionText}
        </button>
      )}
    </div>
  );

  const handleChartClick = (chartType: 'accuracy' | 'study') => {
    setSelectedChart(selectedChart === chartType ? null : chartType);
  };

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 my-8">
      {/* Left: Enhanced Streak & Focus Areas */}
      <div className="flex flex-col gap-6 md:col-span-1 lg:col-span-1">
        {/* Enhanced Streak Card with Comparative Data */}
        <Card className="card-interactive bg-gradient-to-br from-orange-50 to-red-50 border-orange-100 hover:shadow-elevated transition-all duration-300 min-h-[200px]">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-soft">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="text-heading-3 text-orange-700 font-semibold">Streak</span>
            </div>
            <Tooltip>
              <TooltipTrigger><Info className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" /></TooltipTrigger>
              <TooltipContent>Keep practicing daily to maintain your streak!</TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-orange-600 tracking-tight">{streak}</span>
              <span className="text-body-sm text-slate-500 mb-1">days</span>
            </div>
            
            {/* Weekly Progress Comparison */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-label text-slate-700">Today's Progress</span>
                <span className="text-body-sm text-slate-500 font-medium">{todayProgress} / {dailyGoal}</span>
              </div>
              <Progress 
                value={(todayProgress / dailyGoal) * 100} 
                className="h-2 bg-orange-100" 
                indicatorClassName="bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-300" 
              />
              
              {/* Weekly comparison */}
              {compareData.currentWeek > 0 && (
                <div className="flex items-center gap-2 text-body-sm">
                  <div className={`flex items-center gap-1 ${compareData.isImproving ? 'text-success-600' : 'text-error-600'}`}>
                    {compareData.isImproving ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    <span className="font-medium">{Math.abs(compareData.weekOverWeekChange)}%</span>
                  </div>
                  <span className="text-slate-500">vs last week</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Focus Areas Card */}
        <Card className="card-interactive bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100 hover:shadow-elevated transition-all duration-300 min-h-[200px]">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-soft">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-heading-3 text-purple-700 font-semibold">Focus Areas</span>
            </div>
            <Tooltip>
              <TooltipTrigger><Info className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" /></TooltipTrigger>
              <TooltipContent>Topics that need more practice</TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent className="pt-0">
            {weakTopics.length === 0 ? (
              <EmptyState
                icon={Award}
                title="Great job!"
                subtitle="No weak topics found"
                actionText="Continue practicing"
              />
            ) : (
              <div className="space-y-3">
                {weakTopics.slice(0, 3).map((topic, idx) => (
                  <div key={topic} className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-semibold">
                      {idx + 1}
                    </span>
                    <span className="text-slate-700 font-medium flex-1">{topic}</span>
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  </div>
                ))}
                {weakTopics.length > 3 && (
                  <div className="text-center pt-2">
                    <button className="text-body-sm text-purple-600 hover:text-purple-700 font-medium transition-colors">
                      View all ({weakTopics.length}) topics
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Center: Enhanced Achievements */}
      <div className="flex flex-col items-center justify-center md:col-span-1 lg:col-span-3">
        <Card className="card-elevated bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-100 min-h-[400px] w-full max-w-2xl mx-auto">
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-soft">
                <Award className="w-5 h-5 text-white" />
              </div>
              <span className="text-heading-2 text-yellow-700 font-semibold">Achievements</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                {allAchievements.filter(a => a.unlocked).length} / {allAchievements.length}
              </Badge>
              <Tooltip>
                <TooltipTrigger><Info className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" /></TooltipTrigger>
                <TooltipContent>Your earned badges and achievements</TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allAchievements.map((ach) => (
                <Tooltip key={ach.key}>
                  <TooltipTrigger asChild>
                    <div
                      className={`group p-4 rounded-xl border transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                        ach.unlocked 
                          ? "bg-white border-yellow-200 hover:shadow-card hover:border-yellow-300 hover:-translate-y-1" 
                          : "bg-slate-50 border-slate-200 opacity-60"
                      }`}
                    >
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                          ach.unlocked 
                            ? `bg-gradient-to-br ${ach.gradient} shadow-soft group-hover:shadow-elevated` 
                            : "bg-slate-200"
                        }`}>
                          <div className={ach.unlocked ? "text-white" : "text-slate-400"}>
                            {ach.icon}
                          </div>
                        </div>
                        <div>
                          <div className={`text-body font-semibold ${ach.unlocked ? "text-slate-800" : "text-slate-400"}`}>
                            {ach.label}
                          </div>
                          {ach.unlocked && (
                            <div className="w-2 h-2 rounded-full bg-green-400 mx-auto mt-1"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <div className="font-medium">{ach.label}</div>
                      <div className="text-slate-600">{ach.unlocked ? ach.description : `Locked: ${ach.description}`}</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: Enhanced Interactive Charts */}
      <div className="flex flex-col gap-6 md:col-span-1 lg:col-span-1">
        {/* Enhanced Weekly Accuracy with Comparative Analytics */}
        <Card className={`card-interactive bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 hover:shadow-elevated transition-all duration-300 min-h-[200px] ${selectedChart === 'accuracy' ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-soft">
                <BarChart className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-heading-3 text-blue-700 font-semibold">Weekly Accuracy</span>
                {compareData.currentWeek > 0 && (
                  <div className="flex items-center gap-1 text-body-sm">
                    <span className="text-slate-600">{compareData.currentWeek}%</span>
                    <div className={`flex items-center gap-1 ${compareData.isImproving ? 'text-success-600' : 'text-error-600'}`}>
                      {compareData.isImproving ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      <span>{Math.abs(compareData.weekOverWeekChange)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger><Info className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" /></TooltipTrigger>
              <TooltipContent>Click to view detailed accuracy trends</TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent className="pt-0">
            {enhancedAccuracyData.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No data yet"
                subtitle="Start practicing to see your accuracy trends"
                actionText="Begin practice"
              />
            ) : (
              <div className="h-[120px] cursor-pointer" onClick={() => handleChartClick('accuracy')}>
                <ChartContainer config={chartConfig}>
                  <Recharts.ResponsiveContainer width="100%" height={120}>
                    <Recharts.ComposedChart data={enhancedAccuracyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                      <Recharts.CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                      <Recharts.XAxis 
                        dataKey="date" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        tickMargin={8}
                        tick={{ fill: '#64748b' }}
                      />
                      <Recharts.YAxis 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        width={28} 
                        domain={[0, 100]} 
                        tickFormatter={v => `${v}%`}
                        tick={{ fill: '#64748b' }}
                      />
                      
                      {/* Target line */}
                      <Recharts.Line 
                        type="monotone" 
                        dataKey="target" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                        name="Target"
                      />
                      
                      {/* Previous week (background) */}
                      <Recharts.Area 
                        type="monotone" 
                        dataKey="previousAccuracy" 
                        stroke="#94a3b8" 
                        fill="#94a3b8" 
                        fillOpacity={0.1}
                        strokeWidth={1}
                        dot={false}
                        name="Previous Week"
                      />
                      
                      {/* Current week (primary) */}
                      <Recharts.Area 
                        type="monotone" 
                        dataKey="accuracy" 
                        stroke="#2563eb" 
                        fill="#2563eb" 
                        fillOpacity={0.2}
                        strokeWidth={3}
                        dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#2563eb', strokeWidth: 2 }}
                        name="This Week"
                      />
                      
                      <ChartTooltip 
                        content={<ChartTooltipContent 
                          labelFormatter={(value) => `Day: ${value}`}
                          formatter={(value, name) => [
                            `${value}%`,
                            name === 'accuracy' ? 'Current' : 
                            name === 'previousAccuracy' ? 'Previous' : 'Target'
                          ]}
                        />}
                      />
                    </Recharts.ComposedChart>
                  </Recharts.ResponsiveContainer>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Study Time with Efficiency Metrics */}
        <Card className={`card-interactive bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200 hover:shadow-elevated transition-all duration-300 min-h-[200px] ${selectedChart === 'study' ? 'ring-2 ring-purple-500 ring-opacity-50' : ''}`}>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-gray-500 flex items-center justify-center shadow-soft">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-heading-3 text-slate-700 font-semibold">Study Time</span>
                <div className="text-body-sm text-slate-500">
                  {studyTime.reduce((sum, item) => sum + item.minutes, 0)} min total
                </div>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger><Info className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" /></TooltipTrigger>
              <TooltipContent>Click to view detailed study time breakdown</TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent className="pt-0">
            {enhancedStudyData.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No study time yet"
                subtitle="Start studying to track your progress"
                actionText="Start studying"
              />
            ) : (
              <div className="h-[120px] cursor-pointer" onClick={() => handleChartClick('study')}>
                <ChartContainer config={chartConfig}>
                  <Recharts.ResponsiveContainer width="100%" height={120}>
                    <Recharts.ComposedChart data={enhancedStudyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                      <Recharts.CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                      <Recharts.XAxis 
                        dataKey="name" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        tickMargin={8}
                        tick={{ fill: '#64748b' }}
                      />
                      <Recharts.YAxis 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false} 
                        width={28} 
                        tickFormatter={v => `${v}m`}
                        tick={{ fill: '#64748b' }}
                      />
                      
                      {/* Target line */}
                      <Recharts.Line 
                        type="monotone" 
                        dataKey="target" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                        name="Target"
                      />
                      
                      {/* Study time bars with efficiency coloring */}
                      <Recharts.Bar 
                        dataKey="minutes" 
                        name="Study Time" 
                        fill="#8B5CF6"
                        radius={[6, 6, 0, 0]} 
                        maxBarSize={32}
                      />
                      
                      <ChartTooltip 
                        content={<ChartTooltipContent 
                          labelFormatter={(value) => `Topic: ${value}`}
                          formatter={(value, name, props) => {
                            if (name === 'minutes') {
                              const efficiency = props?.payload?.efficiency || 0;
                              return [
                                `${value} minutes`,
                                `Efficiency: ${Math.round(efficiency)}%`
                              ];
                            }
                            return [`${value} minutes`, name];
                          }}
                        />}
                      />
                    </Recharts.ComposedChart>
                  </Recharts.ResponsiveContainer>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AnalyticsDashboard;
