'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, BarChart3, Target, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';

interface StudentData {
  id: string;
  name: string;
  currentScore: number;
  previousScore: number;
  trend: 'up' | 'down' | 'stable';
  essayCount: number;
  completionRate: number;
}

interface ClassComparison {
  className: string;
  averageScore: number;
  studentCount: number;
  topPerformer: string;
  needsAttention: number;
}

interface ComparativeAnalyticsProps {
  onClose: () => void;
}

export function ComparativeAnalytics({ onClose }: ComparativeAnalyticsProps) {
  const [selectedView, setSelectedView] = useState<'students' | 'classes' | 'trends'>('students');

  const mockStudents: StudentData[] = [
    {
      id: '1',
      name: 'Zhang Wei',
      currentScore: 12.5,
      previousScore: 11.0,
      trend: 'up',
      essayCount: 15,
      completionRate: 95,
    },
    {
      id: '2',
      name: 'Li Ming',
      currentScore: 10.8,
      previousScore: 11.2,
      trend: 'down',
      essayCount: 12,
      completionRate: 88,
    },
    {
      id: '3',
      name: 'Wang Fang',
      currentScore: 13.2,
      previousScore: 12.8,
      trend: 'up',
      essayCount: 18,
      completionRate: 100,
    },
    {
      id: '4',
      name: 'Chen Hao',
      currentScore: 9.5,
      previousScore: 9.2,
      trend: 'stable',
      essayCount: 8,
      completionRate: 75,
    },
    {
      id: '5',
      name: 'Liu Yang',
      currentScore: 11.8,
      previousScore: 11.5,
      trend: 'up',
      essayCount: 14,
      completionRate: 92,
    },
  ];

  const mockClasses: ClassComparison[] = [
    {
      className: 'Class 7A',
      averageScore: 11.5,
      studentCount: 35,
      topPerformer: 'Wang Fang',
      needsAttention: 3,
    },
    {
      className: 'Class 7B',
      averageScore: 10.8,
      studentCount: 32,
      topPerformer: 'Zhang Wei',
      needsAttention: 5,
    },
    {
      className: 'Class 8A',
      averageScore: 12.2,
      studentCount: 38,
      topPerformer: 'Li Na',
      needsAttention: 2,
    },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-error" />;
      default:
        return <Target className="w-4 h-4 text-neutral-7" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-error';
      default:
        return 'text-neutral-7';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Comparative Analytics
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <div className="space-y-6">
            {/* View Selector */}
            <div className="flex gap-2">
              <Button
                variant={selectedView === 'students' ? 'default' : 'outline'}
                onClick={() => setSelectedView('students')}
              >
                <Users className="w-4 h-4 mr-2" />
                Students
              </Button>
              <Button
                variant={selectedView === 'classes' ? 'default' : 'outline'}
                onClick={() => setSelectedView('classes')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Classes
              </Button>
              <Button
                variant={selectedView === 'trends' ? 'default' : 'outline'}
                onClick={() => setSelectedView('trends')}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Trends
              </Button>
            </div>

            {/* Students View */}
            {selectedView === 'students' && (
              <Card>
                <CardHeader>
                  <CardTitle>Student Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-4 border border-neutral-3 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-neutral-10">{student.name}</h3>
                              {getTrendIcon(student.trend)}
                            </div>
                            <p className="text-copy-14 text-neutral-7">
                              {student.essayCount} essays
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-title-20 font-medium text-neutral-10">
                              {student.currentScore}
                            </p>
                            <p className="text-copy-14 text-neutral-7">Current</p>
                          </div>
                          <div className="text-center">
                            <p
                              className={`text-title-20 font-medium ${getTrendColor(student.trend)}`}
                            >
                              {student.previousScore}
                            </p>
                            <p className="text-copy-14 text-neutral-7">Previous</p>
                          </div>
                          <div className="text-center">
                            <p className="text-title-20 font-medium text-neutral-10">
                              {student.completionRate}%
                            </p>
                            <p className="text-copy-14 text-neutral-7">Completion</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Classes View */}
            {selectedView === 'classes' && (
              <Card>
                <CardHeader>
                  <CardTitle>Class Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockClasses.map((cls, index) => (
                      <div
                        key={`${cls.className}-${index}`}
                        className="p-4 border border-neutral-3 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-neutral-10">{cls.className}</h3>
                          <Badge variant="outline">{cls.studentCount} students</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-copy-14 text-neutral-7">Average Score</p>
                            <p className="text-title-20 font-medium text-neutral-10">
                              {cls.averageScore}
                            </p>
                          </div>
                          <div>
                            <p className="text-copy-14 text-neutral-7">Top Performer</p>
                            <p className="text-copy-14 text-neutral-10">{cls.topPerformer}</p>
                          </div>
                          <div>
                            <p className="text-copy-14 text-neutral-7">Needs Attention</p>
                            <p
                              className={`text-title-20 font-medium ${cls.needsAttention > 3 ? 'text-error' : 'text-success'}`}
                            >
                              {cls.needsAttention}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trends View */}
            {selectedView === 'trends' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-warning" />
                      Intervention Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-warning" />
                          <span className="font-medium text-neutral-10">
                            Class 7B - 5 Students Need Attention
                          </span>
                        </div>
                        <p className="text-copy-14 text-neutral-8 mb-2">
                          Average score declining over past 3 weeks. Consider additional practice
                          sessions.
                        </p>
                        <Button variant="outline" size="sm">
                          Create Intervention Plan
                        </Button>
                      </div>
                      <div className="p-4 bg-neutral-1 border border-neutral-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-success" />
                          <span className="font-medium text-neutral-10">
                            Class 8A - Excellent Progress
                          </span>
                        </div>
                        <p className="text-copy-14 text-neutral-8">
                          Consistent improvement across all students. Current strategies are
                          effective.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Error Pattern Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-neutral-1 rounded-lg">
                        <span className="text-neutral-10">Grammar: Subject-Verb Agreement</span>
                        <Badge className="bg-error text-white">High Frequency</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-neutral-1 rounded-lg">
                        <span className="text-neutral-10">Vocabulary: Word Choice</span>
                        <Badge className="bg-warning text-white">Medium Frequency</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-neutral-1 rounded-lg">
                        <span className="text-neutral-10">Structure: Paragraph Organization</span>
                        <Badge variant="outline">Low Frequency</Badge>
                      </div>
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      View Detailed Error Analysis
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
