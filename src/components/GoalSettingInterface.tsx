import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Target, Calendar, Trophy, Plus, X, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Goal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  deadline: string;
  category: 'daily' | 'weekly' | 'monthly' | 'custom';
  status: 'active' | 'completed' | 'paused';
  priority: 'low' | 'medium' | 'high';
}

interface GoalSettingInterfaceProps {
  onSetDailyGoal: (goal: number) => void;
  currentDailyGoal: number;
}

const GoalSettingInterface: React.FC<GoalSettingInterfaceProps> = ({
  onSetDailyGoal,
  currentDailyGoal
}) => {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Daily Practice',
      description: 'Complete daily question target',
      targetValue: currentDailyGoal,
      currentValue: 0,
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: 'daily',
      status: 'active',
      priority: 'high'
    }
  ]);

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetValue: 10,
    deadline: '',
    category: 'weekly' as Goal['category'],
    priority: 'medium' as Goal['priority']
  });

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.deadline) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description,
      targetValue: newGoal.targetValue,
      currentValue: 0,
      deadline: newGoal.deadline,
      category: newGoal.category,
      status: 'active',
      priority: newGoal.priority
    };

    setGoals([...goals, goal]);
    setNewGoal({
      title: '',
      description: '',
      targetValue: 10,
      deadline: '',
      category: 'weekly',
      priority: 'medium'
    });
    setShowAddGoal(false);

    toast({
      title: 'Goal Created',
      description: `${goal.title} has been added to your goals.`,
    });
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id));
    toast({
      title: 'Goal Removed',
      description: 'Goal has been deleted successfully.',
    });
  };

  const handleCompleteGoal = (id: string) => {
    setGoals(goals.map(goal => 
      goal.id === id ? { ...goal, status: 'completed' as const } : goal
    ));
    toast({
      title: 'Goal Completed! 🎉',
      description: 'Congratulations on achieving your goal!',
    });
  };

  const handleDailyGoalChange = (value: string) => {
    const newDailyGoal = parseInt(value);
    if (newDailyGoal > 0 && newDailyGoal <= 100) {
      onSetDailyGoal(newDailyGoal);
      setGoals(goals.map(goal => 
        goal.category === 'daily' ? { ...goal, targetValue: newDailyGoal } : goal
      ));
    }
  };

  const getCategoryIcon = (category: Goal['category']) => {
    switch (category) {
      case 'daily': return <Calendar className="w-4 h-4" />;
      case 'weekly': return <Target className="w-4 h-4" />;
      case 'monthly': return <Trophy className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: Goal['priority']) => {
    switch (priority) {
      case 'high': return 'border-red-300 text-red-700 bg-red-50';
      case 'medium': return 'border-yellow-300 text-yellow-700 bg-yellow-50';
      case 'low': return 'border-green-300 text-green-700 bg-green-50';
    }
  };

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'active': return 'border-blue-300 text-blue-700 bg-blue-50';
      case 'completed': return 'border-green-300 text-green-700 bg-green-50';
      case 'paused': return 'border-gray-300 text-gray-700 bg-gray-50';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-soft">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-heading-2">Goal Management</CardTitle>
              <p className="text-body-sm text-slate-600">Set and track your learning objectives</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowAddGoal(!showAddGoal)}
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Daily Goal Setting */}
        <div className="p-4 bg-slate-50 rounded-xl">
          <Label htmlFor="daily-goal" className="text-body font-medium text-slate-700 mb-2 block">
            Daily Questions Goal
          </Label>
          <div className="flex items-center gap-3">
            <Input
              id="daily-goal"
              type="number"
              value={currentDailyGoal}
              onChange={(e) => handleDailyGoalChange(e.target.value)}
              min="1"
              max="100"
              className="w-24"
            />
            <span className="text-body-sm text-slate-600">questions per day</span>
          </div>
        </div>

        {/* Add Goal Form */}
        {showAddGoal && (
          <div className="p-4 border border-slate-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-800">Create New Goal</h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAddGoal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="goal-title">Goal Title *</Label>
                <Input
                  id="goal-title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  placeholder="e.g., Weekly Accuracy Target"
                />
              </div>
              
              <div>
                <Label htmlFor="goal-deadline">Deadline *</Label>
                <Input
                  id="goal-deadline"
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="goal-target">Target Value</Label>
                <Input
                  id="goal-target"
                  type="number"
                  value={newGoal.targetValue}
                  onChange={(e) => setNewGoal({...newGoal, targetValue: parseInt(e.target.value)})}
                  min="1"
                />
              </div>
              
              <div>
                <Label htmlFor="goal-category">Category</Label>
                <Select 
                  value={newGoal.category} 
                  onValueChange={(value: Goal['category']) => setNewGoal({...newGoal, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="goal-description">Description</Label>
              <Input
                id="goal-description"
                value={newGoal.description}
                onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                placeholder="Optional description..."
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddGoal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddGoal}>
                Create Goal
              </Button>
            </div>
          </div>
        )}

        {/* Goals List */}
        <div className="space-y-3">
          {goals.map((goal) => (
            <div key={goal.id} className="p-4 border border-slate-200 rounded-xl hover:shadow-card transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-slate-600 mt-1">
                    {getCategoryIcon(goal.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-800">{goal.title}</h4>
                      <Badge className={`text-xs ${getPriorityColor(goal.priority)}`}>
                        {goal.priority}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(goal.status)}`}>
                        {goal.status}
                      </Badge>
                    </div>
                    {goal.description && (
                      <p className="text-body-sm text-slate-600 mb-2">{goal.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-body-sm text-slate-500">
                      <span>Target: {goal.targetValue}</span>
                      <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                      <span>Progress: {goal.currentValue}/{goal.targetValue}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {goal.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCompleteGoal(goal.id)}
                      className="gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Complete
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteGoal(goal.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalSettingInterface;
