'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Award, Clock, Download, FileText, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';

interface SchoolMetrics {
  totalStudents: number;
  totalTeachers: number;
  totalEssays: number;
  averageScore: number;
  completionRate: number;
  activeClasses: number;
  pendingTasks: number;
  aiUsage: number;
}

interface ClassPerformance {
  id: string;
  name: string;
  grade: string;
  studentCount: number;
  averageScore: number;
  totalEssays: number;
  completionRate: number;
  trend: 'up' | 'down' | 'stable';
}

interface SchoolAnalyticsProps {
  onClose: () => void;
}

export function SchoolAnalytics({ onClose }: SchoolAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'classes' | 'usage'>('overview');

  const mockMetrics: SchoolMetrics = {
    totalStudents: 1247,
    totalTeachers: 45,
    totalEssays: 8934,
    averageScore: 11.2,
    completionRate: 87,
    activeClasses: 32,
    pendingTasks: 15,
    aiUsage: 45678,
  };

  const mockClassPerformance: ClassPerformance[] = [
    {
      id: '1',
      name: 'Class 7A',
      grade: 'Grade 7',
      studentCount: 35,
      averageScore: 11.5,
      totalEssays: 245,
      completionRate: 92,
      trend: 'up',
    },
    {
      id: '2',
      name: 'Class 8B',
      grade: 'Grade 8',
      studentCount: 32,
      averageScore: 10.8,
      totalEssays: 198,
      completionRate: 85,
      trend: 'stable',
    },
    {
      id: '3',
      name: 'Class 9A',
      grade: 'Grade 9',
      studentCount: 38,
      averageScore: 11.3,
      totalEssays: 312,
      completionRate: 88,
      trend: 'up',
    },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-error rotate-180" />;
      default:
        return <Clock className="w-4 h-4 text-neutral-7" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              School Analytics
            </CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | 'quarter')}
                className="px-3 py-2 border border-neutral-3 rounded-md bg-neutral-1 text-neutral-10"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <div className="space-y-6">
            {/* Overview Tab */}
            {selectedTab === 'overview' && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-accent" />
                        <span className="text-copy-14 text-neutral-7">Total Students</span>
                      </div>
                      <p className="text-title-28 font-medium text-neutral-10">
                        {mockMetrics.totalStudents}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        +12% from last month
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-accent" />
                        <span className="text-copy-14 text-neutral-7">Total Essays</span>
                      </div>
                      <p className="text-title-28 font-medium text-neutral-10">
                        {mockMetrics.totalEssays}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        +8% from last month
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-accent" />
                        <span className="text-copy-14 text-neutral-7">Avg Score</span>
                      </div>
                      <p className="text-title-28 font-medium text-neutral-10">
                        {mockMetrics.averageScore}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        +0.3 from last month
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-accent" />
                        <span className="text-copy-14 text-neutral-7">Completion Rate</span>
                      </div>
                      <p className="text-title-28 font-medium text-neutral-10">
                        {mockMetrics.completionRate}%
                      </p>
                      <Badge variant="outline" className="mt-2">
                        +5% from last month
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                {/* Alerts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-warning" />
                      Alerts & Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-warning/10 border border-warning/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-4 h-4 text-warning" />
                          <div>
                            <p className="font-medium text-neutral-10">
                              {mockMetrics.pendingTasks} tasks pending review
                            </p>
                            <p className="text-copy-14 text-neutral-7">
                              Some tasks have been pending for over 24 hours
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-neutral-1 border border-neutral-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Users className="w-4 h-4 text-neutral-7" />
                          <div>
                            <p className="font-medium text-neutral-10">
                              3 classes below average performance
                            </p>
                            <p className="text-copy-14 text-neutral-7">
                              Consider additional support for these classes
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Classes Tab */}
            {selectedTab === 'classes' && (
              <Card>
                <CardHeader>
                  <CardTitle>Class Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockClassPerformance.map((cls) => (
                      <div
                        key={cls.id}
                        className="flex items-center justify-between p-4 border border-neutral-3 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-neutral-10">{cls.name}</h3>
                              <Badge variant="outline">{cls.grade}</Badge>
                            </div>
                            <p className="text-copy-14 text-neutral-7">
                              {cls.studentCount} students
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-title-20 font-medium text-neutral-10">
                              {cls.averageScore}
                            </p>
                            <p className="text-copy-14 text-neutral-7">Avg Score</p>
                          </div>
                          <div className="text-center">
                            <p className="text-title-20 font-medium text-neutral-10">
                              {cls.completionRate}%
                            </p>
                            <p className="text-copy-14 text-neutral-7">Completion</p>
                          </div>
                          <div className="text-center">
                            <p className="text-title-20 font-medium text-neutral-10">
                              {cls.totalEssays}
                            </p>
                            <p className="text-copy-14 text-neutral-7">Essays</p>
                          </div>
                          <div>{getTrendIcon(cls.trend)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Usage Tab */}
            {selectedTab === 'usage' && (
              <Card>
                <CardHeader>
                  <CardTitle>System Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-neutral-10 font-medium">AI API Calls</span>
                        <span className="text-neutral-7">
                          {mockMetrics.aiUsage.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-neutral-3 rounded-full h-2">
                        <div className="bg-accent h-2 rounded-full" style={{ width: '72%' }} />
                      </div>
                      <p className="text-copy-14 text-neutral-7 mt-1">72% of monthly quota</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-neutral-10 font-medium">Storage Used</span>
                        <span className="text-neutral-7">45.2 GB / 100 GB</span>
                      </div>
                      <div className="w-full bg-neutral-3 rounded-full h-2">
                        <div className="bg-success h-2 rounded-full" style={{ width: '45%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-neutral-10 font-medium">Active Users (24h)</span>
                        <span className="text-neutral-7">847</span>
                      </div>
                      <div className="w-full bg-neutral-3 rounded-full h-2">
                        <div className="bg-warning h-2 rounded-full" style={{ width: '68%' }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tab Navigation */}
            <div className="flex justify-center gap-2">
              <Button
                variant={selectedTab === 'overview' ? 'default' : 'outline'}
                onClick={() => setSelectedTab('overview')}
              >
                Overview
              </Button>
              <Button
                variant={selectedTab === 'classes' ? 'default' : 'outline'}
                onClick={() => setSelectedTab('classes')}
              >
                Classes
              </Button>
              <Button
                variant={selectedTab === 'usage' ? 'default' : 'outline'}
                onClick={() => setSelectedTab('usage')}
              >
                Usage
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
