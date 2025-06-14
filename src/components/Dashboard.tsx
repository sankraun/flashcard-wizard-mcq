
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, Brain, BarChart3, TrendingUp, Settings } from "lucide-react";

const DashboardContent = () => {
  const [activeTab, setActiveTab] = useState("notes");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="space-x-4">
            <Button variant="outline">New Note</Button>
            <Button>New MCQ</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button className="bg-green-600 hover:bg-green-700">Create Notes from Text</Button>
            <Button className="bg-blue-600 hover:bg-blue-700">Generate MCQs from Text</Button>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="notes">
              <FileText className="w-4 h-4 mr-2" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="mcqs">
              <Brain className="w-4 h-4 mr-2" />
              MCQs
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="insights">
              <TrendingUp className="w-4 h-4 mr-2" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Notes</h2>
            <Card>
              <CardContent>
                Notes content goes here.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mcqs" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Your MCQs</h2>
            <Card>
              <CardContent>
                MCQs content goes here.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
            <Card>
              <CardContent>
                Analytics content goes here.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Insights</h2>
            <Card>
              <CardContent>
                Insights content goes here.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <Card>
              <CardContent>
                Settings content goes here.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const Dashboard = () => {
  return (
    <DashboardContent />
  );
};

export default Dashboard;
