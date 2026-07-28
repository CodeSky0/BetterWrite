'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Calendar, Download, FileText, Mail, TrendingUp } from 'lucide-react';

interface StudentProgress {
  studentName: string;
  grade: string;
  currentScore: number;
  targetScore: number;
  improvement: number;
  totalEssays: number;
  averageScore: number;
  completionRate: number;
  strongAreas: string[];
  areasForImprovement: string[];
}

interface ParentProgressReportProps {
  progress: StudentProgress;
  onEmailReport: () => void;
}

export function ParentProgressReport({ progress, onEmailReport }: ParentProgressReportProps) {
  const scoreProgress = ((progress.currentScore / progress.targetScore) * 100).toFixed(0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-title-24">{progress.studentName}</CardTitle>
              <p className="text-copy-14 text-neutral-7 mt-1">{progress.grade} • Progress Report</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" size="sm" onClick={onEmailReport}>
                <Mail className="w-4 h-4 mr-2" />
                Email Report
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-accent" />
              <span className="text-copy-14 text-neutral-7">Current Score</span>
            </div>
            <p className="text-title-28 font-medium text-neutral-10">{progress.currentScore}</p>
            <Badge variant="outline" className="mt-2">
              /15
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-copy-14 text-neutral-7">Improvement</span>
            </div>
            <p
              className={`text-title-28 font-medium ${progress.improvement >= 0 ? 'text-success' : 'text-error'}`}
            >
              {progress.improvement >= 0 ? '+' : ''}
              {progress.improvement}
            </p>
            <Badge variant="outline" className="mt-2">
              points
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-accent" />
              <span className="text-copy-14 text-neutral-7">Total Essays</span>
            </div>
            <p className="text-title-28 font-medium text-neutral-10">{progress.totalEssays}</p>
            <Badge variant="outline" className="mt-2">
              completed
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-accent" />
              <span className="text-copy-14 text-neutral-7">Completion Rate</span>
            </div>
            <p className="text-title-28 font-medium text-neutral-10">{progress.completionRate}%</p>
            <Badge variant="outline" className="mt-2">
              of assigned tasks
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Progress to Target */}
      <Card>
        <CardHeader>
          <CardTitle>Progress to Target</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-copy-14 text-neutral-7">
                  Target Score: {progress.targetScore}
                </span>
                <span className="text-copy-14 text-neutral-10">{scoreProgress}% achieved</span>
              </div>
              <div className="w-full bg-neutral-3 rounded-full h-3">
                <div
                  className="bg-accent h-3 rounded-full transition-all"
                  style={{ width: `${scoreProgress}%` }}
                />
              </div>
            </div>
            <p className="text-copy-14 text-neutral-8">
              {progress.currentScore >= progress.targetScore
                ? 'Congratulations! Your child has reached their target score.'
                : `Your child is making good progress toward their target score of ${progress.targetScore}.`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Strengths and Areas for Improvement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-success" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {progress.strongAreas.map((area) => (
                <div key={area} className="flex items-center gap-2 p-2 bg-success/10 rounded">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-copy-14 text-neutral-10">{area}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-warning" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {progress.areasForImprovement.map((area) => (
                <div key={area} className="flex items-center gap-2 p-2 bg-warning/10 rounded">
                  <div className="w-2 h-2 rounded-full bg-warning" />
                  <span className="text-copy-14 text-neutral-10">{area}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-neutral-1 rounded-lg">
              <div>
                <p className="font-medium text-neutral-10">Essay: "My Summer Vacation"</p>
                <p className="text-copy-14 text-neutral-7">Submitted 2 days ago</p>
              </div>
              <Badge>Score: 12/15</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-neutral-1 rounded-lg">
              <div>
                <p className="font-medium text-neutral-10">Essay: "Environmental Protection"</p>
                <p className="text-copy-14 text-neutral-7">Submitted 5 days ago</p>
              </div>
              <Badge>Score: 11/15</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-neutral-1 rounded-lg">
              <div>
                <p className="font-medium text-neutral-10">Essay: "My Best Friend"</p>
                <p className="text-copy-14 text-neutral-7">Submitted 1 week ago</p>
              </div>
              <Badge>Score: 13/15</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teacher Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-10 leading-relaxed">
            {progress.studentName} has shown consistent improvement in writing skills over the past
            month. Grammar has improved significantly, with fewer subject-verb agreement errors.
            Vocabulary usage is becoming more varied and appropriate. Encourage continued practice
            with timed writing exercises to build exam confidence.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
