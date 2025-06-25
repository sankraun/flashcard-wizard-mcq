import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, BarChart3, Calendar, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportCapabilitiesProps {
  analyticsData: {
    streak: number;
    dailyGoal: number;
    todayProgress: number;
    accuracyHistory: Array<{ date: string; accuracy: number }>;
    weakTopics: string[];
    studyTime: Array<{ topic: string; minutes: number }>;
    badges: string[];
  };
}

const ExportCapabilities: React.FC<ExportCapabilitiesProps> = ({ analyticsData }) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');
  const [exportType, setExportType] = useState<'summary' | 'detailed' | 'analytics'>('summary');
  const [isExporting, setIsExporting] = useState(false);

  const generateCSVData = (type: string) => {
    switch (type) {
      case 'summary':
        return [
          ['Metric', 'Value'],
          ['Current Streak', analyticsData.streak.toString()],
          ['Daily Goal', analyticsData.dailyGoal.toString()],
          ['Today\'s Progress', analyticsData.todayProgress.toString()],
          ['Total Study Time', analyticsData.studyTime.reduce((sum, topic) => sum + topic.minutes, 0).toString()],
          ['Active Badges', analyticsData.badges.length.toString()]
        ];
      
      case 'detailed':
        return [
          ['Date', 'Accuracy', 'Questions Completed'],
          ...analyticsData.accuracyHistory.map(day => [
            day.date,
            day.accuracy.toString(),
            day.accuracy > 0 ? '10' : '0' // Estimate based on accuracy
          ])
        ];
      
      case 'analytics':
        return [
          ['Topic', 'Study Time (minutes)', 'Performance Status'],
          ...analyticsData.studyTime.map(topic => [
            topic.topic,
            topic.minutes.toString(),
            analyticsData.weakTopics.includes(topic.topic) ? 'Needs Improvement' : 'Good'
          ])
        ];
      
      default:
        return [];
    }
  };

  const downloadCSV = (data: string[][], filename: string) => {
    const csvContent = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const generatePDFReport = async (type: string) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    let yPosition = margin;

    // Add header
    pdf.setFontSize(20);
    pdf.text('Learning Analytics Report', margin, yPosition);
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 20;

    // Add content based on type
    switch (type) {
      case 'summary':
        pdf.setFontSize(16);
        pdf.text('Performance Summary', margin, yPosition);
        yPosition += 15;

        pdf.setFontSize(12);
        const summaryData = [
          `Current Streak: ${analyticsData.streak} days`,
          `Daily Goal: ${analyticsData.dailyGoal} questions`,
          `Today's Progress: ${analyticsData.todayProgress} questions`,
          `Total Study Time: ${analyticsData.studyTime.reduce((sum, topic) => sum + topic.minutes, 0)} minutes`,
          `Badges Earned: ${analyticsData.badges.length}`,
          `Average Accuracy: ${Math.round(analyticsData.accuracyHistory.reduce((sum, day) => sum + day.accuracy, 0) / Math.max(analyticsData.accuracyHistory.length, 1))}%`
        ];

        summaryData.forEach(line => {
          pdf.text(line, margin, yPosition);
          yPosition += 10;
        });
        break;

      case 'detailed':
        pdf.setFontSize(16);
        pdf.text('Detailed Performance History', margin, yPosition);
        yPosition += 15;

        pdf.setFontSize(10);
        analyticsData.accuracyHistory.slice(-20).forEach(day => {
          pdf.text(`${day.date}: ${day.accuracy}% accuracy`, margin, yPosition);
          yPosition += 8;
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = margin;
          }
        });
        break;

      case 'analytics':
        pdf.setFontSize(16);
        pdf.text('Topic Analysis', margin, yPosition);
        yPosition += 15;

        pdf.setFontSize(12);
        pdf.text('Study Time by Topic:', margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        analyticsData.studyTime.forEach(topic => {
          const status = analyticsData.weakTopics.includes(topic.topic) ? ' (Needs Improvement)' : ' (Good)';
          pdf.text(`${topic.topic}: ${topic.minutes} minutes${status}`, margin, yPosition);
          yPosition += 8;
        });
        break;
    }

    return pdf;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `learning-analytics-${exportType}-${timestamp}`;

      if (exportFormat === 'csv') {
        const csvData = generateCSVData(exportType);
        downloadCSV(csvData, `${filename}.csv`);
      } else {
        const pdf = await generatePDFReport(exportType);
        pdf.save(`${filename}.pdf`);
      }

      toast({
        title: 'Export Successful',
        description: `Your ${exportType} report has been downloaded as ${exportFormat.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'There was an error generating your report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportOptions = [
    { value: 'summary', label: 'Performance Summary', description: 'Key metrics and achievements' },
    { value: 'detailed', label: 'Detailed History', description: 'Day-by-day performance data' },
    { value: 'analytics', label: 'Topic Analytics', description: 'Study time and weak areas analysis' }
  ];

  const formatOptions = [
    { value: 'pdf', label: 'PDF Report', icon: <FileText className="w-4 h-4" /> },
    { value: 'csv', label: 'CSV Data', icon: <BarChart3 className="w-4 h-4" /> }
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-soft">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-heading-2">Export Reports</CardTitle>
            <p className="text-body-sm text-slate-600">Download your learning analytics and progress data</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Type Selection */}
        <div>
          <label className="text-body font-medium text-slate-700 mb-3 block">Report Type</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {exportOptions.map(option => (
              <div
                key={option.value}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  exportType === option.value 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setExportType(option.value as any)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  <span className="font-medium text-slate-800">{option.label}</span>
                </div>
                <p className="text-body-sm text-slate-600">{option.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="text-body font-medium text-slate-700 mb-3 block">Export Format</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {formatOptions.map(format => (
              <div
                key={format.value}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  exportFormat === format.value 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setExportFormat(format.value as any)}
              >
                <div className="flex items-center gap-2">
                  {format.icon}
                  <span className="font-medium text-slate-800">{format.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 bg-slate-50 rounded-xl">
          <h4 className="font-medium text-slate-700 mb-2">Export Preview</h4>
          <div className="flex items-center gap-2 text-body-sm text-slate-600">
            <Badge variant="outline">{exportOptions.find(opt => opt.value === exportType)?.label}</Badge>
            <span>•</span>
            <Badge variant="outline">{formatOptions.find(fmt => fmt.value === exportFormat)?.label}</Badge>
            <span>•</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Export Button */}
        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          className="w-full gap-2"
          size="lg"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export {exportFormat.toUpperCase()} Report
            </>
          )}
        </Button>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
          <div className="text-center">
            <div className="text-lg font-bold text-slate-800">{analyticsData.accuracyHistory.length}</div>
            <div className="text-body-sm text-slate-600">Days Tracked</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-slate-800">{analyticsData.studyTime.length}</div>
            <div className="text-body-sm text-slate-600">Topics Studied</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-slate-800">{analyticsData.badges.length}</div>
            <div className="text-body-sm text-slate-600">Badges Earned</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-slate-800">{analyticsData.studyTime.reduce((sum, topic) => sum + topic.minutes, 0)}</div>
            <div className="text-body-sm text-slate-600">Total Minutes</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportCapabilities;
