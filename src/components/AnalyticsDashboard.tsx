
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, Flame, Award, Clock, TrendingUp, Star, Info } from 'lucide-react';
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
  const chartConfig = {
    accuracy: {
      label: "Accuracy",
      theme: {
        light: "#2563eb",
        dark: "#60a5fa",
      },
    },
    studyTime: {
      label: "Study Time (minutes)",
      theme: {
        light: "#8B5CF6",
        dark: "#A78BFA",
      },
    },
  };

  const studyTimeChartData = studyTime.map(item => ({ name: item.topic, minutes: item.minutes }));
  const accuracyChartData = accuracyHistory.slice(-7).map(item => ({ date: item.date.slice(5), accuracy: Math.round(item.accuracy || 0) }));

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

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 my-8">
      {/* Left: Streak & Focus Areas */}
      <div className="flex flex-col gap-6 md:col-span-1 lg:col-span-1">
        {/* Enhanced Streak Card */}
        <Card className="card-interactive bg-gradient-to-br from-orange-50 to-red-50 border-orange-100 hover:shadow-elevated transition-all duration-300 min-h-[180px]">
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
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-label text-slate-700">Today's Progress</span>
                <span className="text-body-sm text-slate-500 font-medium">{todayProgress} / {dailyGoal}</span>
              </div>
              <Progress 
                value={(todayProgress / dailyGoal) * 100} 
                className="h-2 bg-orange-100" 
                indicatorClassName="bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-300" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Focus Areas Card */}
        <Card className="card-interactive bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100 hover:shadow-elevated transition-all duration-300 min-h-[180px]">
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
              <div className="flex items-center justify-center h-20 text-success-600 text-body font-medium">
                <div className="text-center">
                  <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-2">
                    <Award className="w-4 h-4 text-success-600" />
                  </div>
                  Great job! No weak topics!
                </div>
              </div>
            ) : (
              <ul className="space-y-2">
                {weakTopics.slice(0, 3).map((topic, idx) => (
                  <li key={topic} className="flex items-center gap-3 text-body-sm">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-semibold">
                      {idx + 1}
                    </span>
                    <span className="text-slate-700 font-medium">{topic}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Center: Enhanced Achievements */}
      <div className="flex flex-col items-center justify-center md:col-span-1 lg:col-span-3">
        <Card className="card-elevated bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-100 min-h-[380px] w-full max-w-2xl mx-auto">
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-soft">
                <Award className="w-5 h-5 text-white" />
              </div>
              <span className="text-heading-2 text-yellow-700 font-semibold">Achievements</span>
            </div>
            <Tooltip>
              <TooltipTrigger><Info className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" /></TooltipTrigger>
              <TooltipContent>Your earned badges and achievements</TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allAchievements.map((ach) => (
                <Tooltip key={ach.key}>
                  <TooltipTrigger asChild>
                    <div
                      className={`group p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
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

      {/* Right: Enhanced Charts */}
      <div className="flex flex-col gap-6 md:col-span-1 lg:col-span-1">
        {/* Enhanced Weekly Accuracy */}
        <Card className="card-interactive bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 hover:shadow-elevated transition-all duration-300 min-h-[180px]">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-soft">
                <BarChart className="w-5 h-5 text-white" />
              </div>
              <span className="text-heading-3 text-blue-700 font-semibold">Weekly Accuracy</span>
            </div>
            <Tooltip>
              <TooltipTrigger><Info className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" /></TooltipTrigger>
              <TooltipContent>Your accuracy trend over the past 7 days</TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent className="pt-0">
            {accuracyChartData.length === 0 ? (
              <div className="flex items-center justify-center h-[120px] text-body-sm text-slate-500">
                No accuracy data yet.
              </div>
            ) : (
              <div className="h-[120px]">
                <Recharts.ResponsiveContainer width="100%" height={120}>
                  <Recharts.AreaChart data={accuracyChartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
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
                    <Recharts.Area 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="#2563eb" 
                      fill="url(#accuracyGradient)" 
                      strokeWidth={3}
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#2563eb', strokeWidth: 2 }}
                    />
                    <defs>
                      <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <Recharts.Tooltip 
                      content={({ active, payload }) => active && payload && payload.length ? (
                        <div className="rounded-xl bg-white p-3 shadow-elevated border border-slate-200 text-body-sm">
                          <div className="font-semibold text-slate-800">{payload[0].payload.date}</div>
                          <div className="text-slate-600">Accuracy: {payload[0].value}%</div>
                        </div>
                      ) : null} 
                    />
                  </Recharts.AreaChart>
                </Recharts.ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Study Time */}
        <Card className="card-interactive bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200 hover:shadow-elevated transition-all duration-300 min-h-[180px]">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-gray-500 flex items-center justify-center shadow-soft">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <span className="text-heading-3 text-slate-700 font-semibold">Study Time</span>
            </div>
            <Tooltip>
              <TooltipTrigger><Info className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" /></TooltipTrigger>
              <TooltipContent>Time spent studying each topic</TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent className="pt-0">
            {studyTimeChartData.length === 0 ? (
              <div className="flex items-center justify-center h-[120px] text-body-sm text-slate-500">
                No study time data yet.
              </div>
            ) : (
              <div className="h-[120px]">
                <Recharts.ResponsiveContainer width="100%" height={120}>
                  <Recharts.BarChart data={studyTimeChartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
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
                    <Recharts.Bar 
                      dataKey="minutes" 
                      name="Study Time" 
                      fill="url(#barGradient)" 
                      radius={[6, 6, 0, 0]} 
                      maxBarSize={32}
                    />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.7}/>
                      </linearGradient>
                    </defs>
                    <Recharts.Tooltip 
                      content={({ active, payload }) => active && payload && payload.length ? (
                        <div className="rounded-xl bg-white p-3 shadow-elevated border border-slate-200 text-body-sm">
                          <div className="font-semibold text-slate-800">{payload[0].payload.name}</div>
                          <div className="text-slate-600">{payload[0].value} minutes</div>
                        </div>
                      ) : null} 
                    />
                  </Recharts.BarChart>
                </Recharts.ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AnalyticsDashboard;
