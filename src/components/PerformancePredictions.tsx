import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, Calendar, Target, Brain } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import * as Recharts from 'recharts';

interface PerformancePredictionsProps {
  accuracyHistory: Array<{ date: string; accuracy: number }>;
  streak: number;
  studyTime: Array<{ topic: string; minutes: number }>;
  todayProgress: number;
  dailyGoal: number;
}

const PerformancePredictions: React.FC<PerformancePredictionsProps> = ({
  accuracyHistory,
  streak,
  studyTime,
  todayProgress,
  dailyGoal
}) => {
  const predictions = useMemo(() => {
    // Calculate trends and make predictions
    const recentData = accuracyHistory.slice(-14); // Last 2 weeks
    const firstWeek = recentData.slice(0, 7);
    const secondWeek = recentData.slice(7, 14);
    
    const firstWeekAvg = firstWeek.length > 0 ? 
      firstWeek.reduce((sum, day) => sum + day.accuracy, 0) / firstWeek.length : 0;
    const secondWeekAvg = secondWeek.length > 0 ? 
      secondWeek.reduce((sum, day) => sum + day.accuracy, 0) / secondWeek.length : 0;
    
    const accuracyTrend = secondWeekAvg - firstWeekAvg;
    const totalStudyMinutes = studyTime.reduce((sum, topic) => sum + topic.minutes, 0);
    
    // Generate predictions based on current trends
    const nextWeekPrediction = Math.max(0, Math.min(100, secondWeekAvg + accuracyTrend));
    const nextMonthPrediction = Math.max(0, Math.min(100, secondWeekAvg + (accuracyTrend * 4)));
    
    // Streak prediction based on current momentum
    const streakMomentum = streak > 0 ? 'positive' : 'neutral';
    const predictedStreakExtension = streak > 0 ? Math.min(streak * 1.5, 30) : 7;
    
    // Study efficiency prediction
    const studyEfficiency = totalStudyMinutes > 0 ? 
      (secondWeekAvg / totalStudyMinutes) * 100 : 0;
    
    return {
      accuracyTrend,
      nextWeekPrediction,
      nextMonthPrediction,
      streakMomentum,
      predictedStreakExtension,
      studyEfficiency,
      currentAccuracy: secondWeekAvg
    };
  }, [accuracyHistory, streak, studyTime]);

  // Generate forecast data for chart
  const forecastData = useMemo(() => {
    const lastSevenDays = accuracyHistory.slice(-7);
    const trend = predictions.accuracyTrend;
    
    return [
      ...lastSevenDays.map(day => ({
        date: day.date.slice(5),
        actual: day.accuracy,
        predicted: null,
        type: 'actual'
      })),
      ...Array.from({ length: 7 }, (_, i) => ({
        date: `+${i + 1}d`,
        actual: null,
        predicted: Math.max(0, Math.min(100, predictions.currentAccuracy + (trend * (i + 1) / 7))),
        type: 'predicted'
      }))
    ];
  }, [accuracyHistory, predictions]);

  const chartConfig = {
    actual: {
      label: "Actual",
      color: "#2563eb",
    },
    predicted: {
      label: "Predicted",
      color: "#8b5cf6",
    },
  };

  const getPredictionInsight = () => {
    if (predictions.accuracyTrend > 5) {
      return {
        type: 'positive',
        icon: <TrendingUp className="w-4 h-4" />,
        title: 'Strong Upward Trend',
        message: 'Your performance is improving rapidly! Keep up the excellent work.',
        color: 'text-green-600'
      };
    } else if (predictions.accuracyTrend < -5) {
      return {
        type: 'negative',
        icon: <TrendingDown className="w-4 h-4" />,
        title: 'Declining Performance',
        message: 'Consider reviewing your study methods or taking a short break.',
        color: 'text-red-600'
      };
    } else {
      return {
        type: 'stable',
        icon: <BarChart3 className="w-4 h-4" />,
        title: 'Stable Performance',
        message: 'Your performance is consistent. Try new challenges to push your limits.',
        color: 'text-blue-600'
      };
    }
  };

  const insight = getPredictionInsight();

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-soft">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-heading-2">Performance Predictions</CardTitle>
            <p className="text-body-sm text-slate-600">AI-powered forecasts based on your learning patterns</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trend Insight */}
        <div className={`p-4 rounded-xl border bg-gradient-to-r ${
          insight.type === 'positive' ? 'from-green-50 to-emerald-50 border-green-200' :
          insight.type === 'negative' ? 'from-red-50 to-pink-50 border-red-200' :
          'from-blue-50 to-indigo-50 border-blue-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className={insight.color}>
              {insight.icon}
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 mb-1">{insight.title}</h4>
              <p className="text-body-sm text-slate-600">{insight.message}</p>
            </div>
          </div>
        </div>

        {/* Prediction Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span className="text-label font-medium text-slate-700">Next Week</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-800">
                {Math.round(predictions.nextWeekPrediction)}%
              </span>
              <Badge variant="outline" className={`text-xs ${
                predictions.accuracyTrend > 0 ? 'text-green-600 border-green-300' : 
                predictions.accuracyTrend < 0 ? 'text-red-600 border-red-300' : 
                'text-gray-600 border-gray-300'
              }`}>
                {predictions.accuracyTrend > 0 ? '+' : ''}{Math.round(predictions.accuracyTrend)}%
              </Badge>
            </div>
            <p className="text-body-sm text-slate-500 mt-1">Predicted accuracy</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-label font-medium text-slate-700">Streak Forecast</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-800">
                {Math.round(predictions.predictedStreakExtension)}
              </span>
              <span className="text-body-sm text-slate-500 mb-1">days</span>
            </div>
            <p className="text-body-sm text-slate-500 mt-1">Potential streak length</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-indigo-600" />
              <span className="text-label font-medium text-slate-700">Study Efficiency</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-800">
                {Math.round(predictions.studyEfficiency)}
              </span>
              <span className="text-body-sm text-slate-500 mb-1">pts/min</span>
            </div>
            <p className="text-body-sm text-slate-500 mt-1">Accuracy per study minute</p>
          </div>
        </div>

        {/* Forecast Chart */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-3">7-Day Accuracy Forecast</h4>
          <div className="h-64">
            <ChartContainer config={chartConfig}>
              <Recharts.ResponsiveContainer width="100%" height="100%">
                <Recharts.ComposedChart data={forecastData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <Recharts.CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <Recharts.XAxis 
                    dataKey="date" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748b' }}
                  />
                  <Recharts.YAxis 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={v => `${v}%`}
                    tick={{ fill: '#64748b' }}
                  />
                  
                  {/* Actual performance line */}
                  <Recharts.Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                    connectNulls={false}
                    name="Actual Performance"
                  />
                  
                  {/* Predicted performance line */}
                  <Recharts.Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                    connectNulls={false}
                    name="Predicted Performance"
                  />
                  
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                      labelFormatter={(value) => `Date: ${value}`}
                      formatter={(value, name) => [
                        value ? `${Math.round(Number(value))}%` : 'No data',
                        name === 'actual' ? 'Actual' : 'Predicted'
                      ]}
                    />}
                  />
                </Recharts.ComposedChart>
              </Recharts.ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-4 bg-blue-50 rounded-xl">
          <h4 className="font-semibold text-blue-800 mb-2">Recommendations</h4>
          <ul className="space-y-1 text-body-sm text-blue-700">
            {predictions.accuracyTrend > 0 && (
              <li>• Your accuracy is improving! Consider tackling more challenging topics.</li>
            )}
            {predictions.accuracyTrend < 0 && (
              <li>• Focus on understanding concepts rather than speed to improve accuracy.</li>
            )}
            {streak === 0 && (
              <li>• Start building consistency with small daily goals to establish momentum.</li>
            )}
            {predictions.studyEfficiency < 1 && (
              <li>• Consider shorter, more focused study sessions for better retention.</li>
            )}
            <li>• Maintain your current pace to reach your predicted targets.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformancePredictions;
