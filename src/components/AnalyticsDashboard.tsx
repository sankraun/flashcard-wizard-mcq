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
        light: "#2563eb", // Blue-600
        dark: "#60a5fa",  // Blue-400
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

  // --- Achievements logic ---
  const allAchievements = [
    {
      key: "noob",
      label: "Noob",
      description: "Everyone starts somewhere!",
      icon: <Star className="w-4 h-4" />, // always unlocked
      unlocked: true,
    },
    {
      key: "streak5",
      label: "5-Day Streak",
      description: "Maintain a 5-day streak.",
      icon: <Flame className="w-4 h-4" />, // unlocked if streak >= 5
      unlocked: streak >= 5,
    },
    {
      key: "streak15",
      label: "15-Day Streak",
      description: "Maintain a 15-day streak.",
      icon: <Flame className="w-4 h-4 text-orange-600" />, // unlocked if streak >= 15
      unlocked: streak >= 15,
    },
    {
      key: "accuracy80",
      label: "Sharp Shooter",
      description: "Achieve 80%+ accuracy in a week.",
      icon: <BarChart className="w-4 h-4 text-blue-600" />, // unlocked if any accuracy >= 80
      unlocked: accuracyHistory.some(a => a.accuracy >= 80),
    },
    {
      key: "accuracy95",
      label: "Perfectionist",
      description: "Achieve 95%+ accuracy in a week.",
      icon: <Award className="w-4 h-4 text-yellow-600" />, // unlocked if any accuracy >= 95
      unlocked: accuracyHistory.some(a => a.accuracy >= 95),
    },
  ];

  const unlockedAchievements = allAchievements.filter(a => a.unlocked);
  const lockedAchievements = allAchievements.filter(a => !a.unlocked);

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 my-8">
      {/* Left: Streak & Focus Areas */}
      <div className="flex flex-col gap-6 md:col-span-1 lg:col-span-1">
        {/* Streak */}
        <Card className="shadow-none border-0 bg-gradient-to-br from-white to-blue-50 flex flex-col justify-between min-h-[160px]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <span className="flex items-center gap-2 text-base font-semibold text-blue-700">
              <Flame className="w-5 h-5 text-orange-500" /> Streak
            </span>
            <Tooltip>
              <TooltipTrigger><Info className="w-4 h-4 text-gray-400" /></TooltipTrigger>
              <TooltipContent>Keep practicing daily to maintain your streak!</TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent className="pt-0 flex flex-col gap-2">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-orange-600">{streak}</span>
              <span className="text-xs text-gray-500 mb-1">days</span>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Today's Progress</span>
                <span className="text-gray-400">{todayProgress} / {dailyGoal}</span>
              </div>
              <Progress value={(todayProgress / dailyGoal) * 100} className="h-2 bg-gray-100" indicatorClassName="bg-orange-500" />
            </div>
          </CardContent>
        </Card>
        {/* Focus Areas */}
        <Card className="shadow-none border-0 bg-gradient-to-br from-white to-purple-50 flex flex-col min-h-[160px]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <span className="flex items-center gap-2 text-base font-semibold text-purple-700">
              <TrendingUp className="w-5 h-5 text-purple-600" /> Focus Areas
            </span>
            <Tooltip>
              <TooltipTrigger><Info className="w-4 h-4 text-gray-400" /></TooltipTrigger>
              <TooltipContent>Topics that need more practice</TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent className="pt-0">
            {weakTopics.length === 0 ? (
              <div className="flex items-center justify-center h-full text-green-600 text-sm font-medium">Great job! No weak topics!</div>
            ) : (
              <ul className="space-y-1">
                {weakTopics.map((topic, idx) => (
                  <li key={topic} className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-semibold">{idx + 1}</span>
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Center: Achievements */}
      <div className="flex flex-col items-center justify-center md:col-span-1 lg:col-span-3">
        <Card className="shadow-none border-0 bg-gradient-to-br from-white to-yellow-50 flex flex-col min-h-[340px] w-full max-w-md mx-auto">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <span className="flex items-center gap-2 text-base font-semibold text-yellow-700">
              <Award className="w-5 h-5 text-yellow-500" /> Achievements
            </span>
            <Tooltip>
              <TooltipTrigger><Info className="w-4 h-4 text-gray-400" /></TooltipTrigger>
              <TooltipContent>Your earned badges and achievements</TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-2">
              {allAchievements.map((ach) => (
                <Tooltip key={ach.key}>
                  <TooltipTrigger asChild>
                    <div
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${ach.unlocked ? "bg-yellow-50 border-yellow-100" : "bg-gray-50 border-gray-200 opacity-60"}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ach.unlocked ? "bg-yellow-100" : "bg-gray-200"}`}>
                        {ach.icon}
                      </div>
                      <span className={`text-sm font-medium ${ach.unlocked ? "text-yellow-800" : "text-gray-400"}`}>{ach.label}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{ach.unlocked ? ach.description : `Locked: ${ach.description}`}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: Weekly Accuracy & Study Time */}
      <div className="flex flex-col gap-6 md:col-span-1 lg:col-span-1">
        {/* Weekly Accuracy */}
        <Card className="shadow-none border-0 bg-gradient-to-br from-white to-blue-50 flex flex-col min-h-[160px]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <span className="flex items-center gap-2 text-base font-semibold text-blue-700">
              <BarChart className="w-5 h-5 text-blue-600" /> Weekly Accuracy
            </span>
            <Tooltip>
              <TooltipTrigger><Info className="w-4 h-4 text-gray-400" /></TooltipTrigger>
              <TooltipContent>Your accuracy trend over the past 7 days</TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent className="pt-0">
            {accuracyChartData.length === 0 ? (
              <div className="flex items-center justify-center h-[120px] text-sm text-gray-400">No accuracy data yet.</div>
            ) : (
              <div className="h-[120px]">
                <Recharts.ResponsiveContainer width="100%" height={120}>
                  <Recharts.AreaChart data={accuracyChartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <Recharts.CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                    <Recharts.XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} tickMargin={8} />
                    <Recharts.YAxis fontSize={11} tickLine={false} axisLine={false} width={28} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <Recharts.Area type="monotone" dataKey="accuracy" stroke="#2563eb" fill="#2563eb" fillOpacity={0.08} strokeWidth={2} />
                    <Recharts.Tooltip content={({ active, payload }) => active && payload && payload.length ? (
                      <div className="rounded-lg bg-white p-2 shadow-lg border text-xs">
                        <div className="font-medium">{payload[0].payload.date}</div>
                        <div className="text-gray-500">Accuracy: {payload[0].value}%</div>
                      </div>
                    ) : null} />
                  </Recharts.AreaChart>
                </Recharts.ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Study Time by Topic */}
        <Card className="shadow-none border-0 bg-gradient-to-br from-white to-gray-50 flex flex-col min-h-[160px]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <span className="flex items-center gap-2 text-base font-semibold text-gray-700">
              <Clock className="w-5 h-5 text-gray-600" /> Study Time by Topic
            </span>
            <Tooltip>
              <TooltipTrigger><Info className="w-4 h-4 text-gray-400" /></TooltipTrigger>
              <TooltipContent>Time spent studying each topic</TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent className="pt-0">
            {studyTimeChartData.length === 0 ? (
              <div className="flex items-center justify-center h-[120px] text-sm text-gray-400">No study time data yet.</div>
            ) : (
              <div className="h-[120px]">
                <Recharts.ResponsiveContainer width="100%" height={120}>
                  <Recharts.BarChart data={studyTimeChartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <Recharts.CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                    <Recharts.XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tickMargin={8} />
                    <Recharts.YAxis fontSize={11} tickLine={false} axisLine={false} width={28} tickFormatter={v => `${v}m`} />
                    <Recharts.Bar dataKey="minutes" name="Study Time" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Recharts.Tooltip content={({ active, payload }) => active && payload && payload.length ? (
                      <div className="rounded-lg bg-white p-2 shadow-lg border text-xs">
                        <div className="font-medium">{payload[0].payload.name}</div>
                        <div className="text-gray-500">{payload[0].value} minutes</div>
                      </div>
                    ) : null} />
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
