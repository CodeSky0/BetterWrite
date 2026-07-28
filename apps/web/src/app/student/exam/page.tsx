'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RoleGuard } from '@/components/layout/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRole } from '@betterwrite/shared';
import { AlertTriangle, CheckCircle2, Clock, FileText, Play, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ExamPaper {
  id: string;
  title: string;
  year: number;
  type: 'official' | 'mock';
  duration: number;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
  score?: number;
  completedAt?: string;
}

export default function ExamPage() {
  const [exams, setExams] = useState<ExamPaper[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamPaper | null>(null);
  const [examMode, setExamMode] = useState<'list' | 'instructions' | 'active' | 'results'>('list');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [_isFullscreen, setIsFullscreen] = useState(false);

  const mockExams: ExamPaper[] = [
    {
      id: '1',
      title: '2024 Shenzhen Zhongkao English Writing',
      year: 2024,
      type: 'official',
      duration: 45,
      questionCount: 1,
      difficulty: 'medium',
      completed: false,
    },
    {
      id: '2',
      title: '2023 Shenzhen Zhongkao English Writing',
      year: 2023,
      type: 'official',
      duration: 45,
      questionCount: 1,
      difficulty: 'medium',
      completed: true,
      score: 12,
      completedAt: '2024-01-15',
    },
    {
      id: '3',
      title: 'Mock Exam #1 - Narrative Writing',
      year: 2024,
      type: 'mock',
      duration: 40,
      questionCount: 1,
      difficulty: 'easy',
      completed: true,
      score: 13,
      completedAt: '2024-01-10',
    },
    {
      id: '4',
      title: 'Mock Exam #2 - Argumentative Writing',
      year: 2024,
      type: 'mock',
      duration: 50,
      questionCount: 1,
      difficulty: 'hard',
      completed: false,
    },
  ];

  useEffect(() => {
    setExams(mockExams);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (examMode === 'active' && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [examMode, timeRemaining]);

  const startExam = (exam: ExamPaper) => {
    setSelectedExam(exam);
    setExamMode('instructions');
  };

  const beginExam = () => {
    if (!selectedExam) return;
    setTimeRemaining(selectedExam.duration * 60);
    setExamMode('active');
    try {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (_e) {
      console.log('Fullscreen not supported');
    }
  };

  const submitExam = () => {
    setExamMode('results');
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-success text-white';
      case 'medium':
        return 'bg-warning text-white';
      case 'hard':
        return 'bg-error text-white';
      default:
        return 'bg-neutral-5';
    }
  };

  return (
    <RoleGuard allowedRoles={[UserRole.STUDENT]}>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Exam List View */}
          {examMode === 'list' && (
            <>
              <div className="flex items-center justify-between">
                <h1 className="text-title-24 font-serif font-medium text-neutral-10">
                  Exam Simulation
                </h1>
                <Badge variant="outline">{exams.length} exams available</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exams.map((exam) => (
                  <Card
                    key={exam.id}
                    className="cursor-pointer hover:border-accent transition-colors"
                    onClick={() => startExam(exam)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getDifficultyColor(exam.difficulty)}>
                            {exam.difficulty}
                          </Badge>
                          <Badge variant={exam.type === 'official' ? 'default' : 'outline'}>
                            {exam.type === 'official' ? 'Official' : 'Mock'}
                          </Badge>
                        </div>
                        {exam.completed && <CheckCircle2 className="w-5 h-5 text-success" />}
                      </div>
                      <CardTitle className="text-title-20">{exam.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-4 text-copy-14 text-neutral-7">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {exam.duration} min
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            {exam.questionCount} question
                          </div>
                        </div>
                        {exam.completed && (
                          <div className="flex items-center justify-between p-2 bg-success/10 rounded">
                            <span className="text-copy-14 text-neutral-8">
                              Score: {exam.score}/15
                            </span>
                            <span className="text-copy-14 text-neutral-7">{exam.completedAt}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Exam Instructions */}
          {examMode === 'instructions' && selectedExam && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  Exam Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h2 className="text-title-20 font-medium mb-2">{selectedExam.title}</h2>
                  <div className="flex items-center gap-4 text-copy-14 text-neutral-7">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {selectedExam.duration} minutes
                    </div>
                    <Badge className={getDifficultyColor(selectedExam.difficulty)}>
                      {selectedExam.difficulty}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <h3 className="font-medium text-neutral-10">Important Rules:</h3>
                  <ul className="space-y-2 text-copy-14 text-neutral-8">
                    <li>• Fullscreen mode will be activated</li>
                    <li>• No hints or AI assistance available</li>
                    <li>• Timer will count down from {selectedExam.duration} minutes</li>
                    <li>• Auto-submit when time expires</li>
                    <li>• Cannot exit fullscreen during exam</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button onClick={beginExam} size="lg" className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    Start Exam
                  </Button>
                  <Button variant="outline" onClick={() => setExamMode('list')} size="lg">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Exam */}
          {examMode === 'active' && selectedExam && (
            <>
              {/* Timer Bar */}
              <Card className="border-accent">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-accent" />
                      <span className="text-title-20 font-medium">{formatTime(timeRemaining)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Fullscreen Mode</Badge>
                      <Button variant="outline" size="sm" onClick={submitExam}>
                        Submit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exam Content */}
              <Card>
                <CardHeader>
                  <CardTitle>{selectedExam.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-neutral-1 rounded-lg">
                      <h3 className="font-medium mb-2">Writing Prompt:</h3>
                      <p className="text-neutral-10 leading-relaxed">
                        Write an essay about a memorable experience that taught you an important
                        lesson. Your essay should be 80-125 words and include specific details about
                        the experience and what you learned from it.
                      </p>
                    </div>

                    <textarea
                      className="w-full h-64 p-4 border border-neutral-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="Start writing your essay here..."
                    />

                    <div className="flex items-center justify-between text-copy-14 text-neutral-7">
                      <span>Word count: 0 / 125</span>
                      <Button onClick={submitExam}>Submit Essay</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Exam Results */}
          {examMode === 'results' && selectedExam && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  Exam Completed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-success/10 rounded-lg text-center">
                    <p className="text-title-28 font-medium text-success">12</p>
                    <p className="text-copy-14 text-neutral-7">Your Score</p>
                  </div>
                  <div className="p-4 bg-neutral-1 rounded-lg text-center">
                    <p className="text-title-28 font-medium text-neutral-10">45</p>
                    <p className="text-copy-14 text-neutral-7">Minutes Used</p>
                  </div>
                </div>

                <div className="p-4 bg-neutral-1 rounded-lg">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Performance Analysis
                  </h3>
                  <div className="space-y-2 text-copy-14 text-neutral-8">
                    <p>• Your score is above average for this exam type</p>
                    <p>• Word count was within optimal range</p>
                    <p>• Grammar was excellent with minor errors</p>
                    <p>• Content organization was clear and logical</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => setExamMode('list')} className="flex-1">
                    Back to Exams
                  </Button>
                  <Button variant="outline">View Detailed Feedback</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
