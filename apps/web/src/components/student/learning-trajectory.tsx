'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, BarChart3, Calendar, Target, TrendingUp } from 'lucide-react';

interface TrajectoryPoint {
  date: string;
  score: number;
  essayCount: number;
}

interface LearningTrajectoryProps {
  currentScore: number;
  targetScore: number;
  trajectory: TrajectoryPoint[];
  predictedScore: number;
  timeToTarget: string;
}

export function LearningTrajectory({
  currentScore,
  targetScore,
  trajectory,
  predictedScore,
  timeToTarget,
}: LearningTrajectoryProps) {
  const progress = ((currentScore / targetScore) * 100).toFixed(0);
  const isOnTrack = predictedScore >= targetScore;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="text-copy-14 text-neutral-7">Current Score</span>
            </div>
            <p className="text-title-28 font-medium text-neutral-10">{currentScore}</p>
            <Badge variant="outline" className="mt-2">
              /15
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-accent" />
              <span className="text-copy-14 text-neutral-7">Target Score</span>
            </div>
            <p className="text-title-28 font-medium text-neutral-10">{targetScore}</p>
            <Badge variant="outline" className="mt-2">
              Goal
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-accent" />
              <span className="text-copy-14 text-neutral-7">Predicted</span>
            </div>
            <p className="text-title-28 font-medium text-neutral-10">{predictedScore}</p>
            <Badge className={isOnTrack ? 'bg-success text-white' : 'bg-warning text-white'}>
              {isOnTrack ? 'On Track' : 'Needs Focus'}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-accent" />
              <span className="text-copy-14 text-neutral-7">Time to Target</span>
            </div>
            <p className="text-title-28 font-medium text-neutral-10">{timeToTarget}</p>
            <Badge variant="outline" className="mt-2">
              Estimate
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Trajectory Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Learning Trajectory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-copy-14 text-neutral-7">Progress to Target</span>
                <span className="text-copy-14 text-neutral-10">{progress}%</span>
              </div>
              <div className="w-full bg-neutral-3 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${isOnTrack ? 'bg-success' : 'bg-warning'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Trajectory Points */}
            <div className="space-y-3">
              <h3 className="font-medium text-neutral-10">Score History</h3>
              <div className="space-y-2">
                {trajectory.map((point, index) => (
                  <div
                    key={`${point.date}-${index}`}
                    className="flex items-center justify-between p-3 bg-neutral-1 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      <span className="text-copy-14 text-neutral-10">{point.date}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-copy-14 text-neutral-7">{point.essayCount} essays</span>
                      <Badge variant="outline">{point.score}/15</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights */}
            <div
              className={`p-4 rounded-lg ${isOnTrack ? 'bg-success/10 border border-success/20' : 'bg-warning/10 border border-warning/20'}`}
            >
              <h3 className="font-medium mb-2">AI Insights</h3>
              <p className="text-copy-14 text-neutral-8">
                {isOnTrack
                  ? `Based on your current progress, you're on track to reach your target score of ${targetScore} within ${timeToTarget}. Continue practicing with focus on grammar and vocabulary.`
                  : `To reach your target score of ${targetScore}, consider increasing practice frequency. Focus on improving weak areas identified in your error patterns.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Personalized Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-neutral-1 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium">
                1
              </div>
              <div>
                <p className="font-medium text-neutral-10">Focus on Grammar</p>
                <p className="text-copy-14 text-neutral-7">
                  Your recent essays show consistent grammar errors. Practice subject-verb agreement
                  and tense usage.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-neutral-1 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium">
                2
              </div>
              <div>
                <p className="font-medium text-neutral-10">Expand Vocabulary</p>
                <p className="text-copy-14 text-neutral-7">
                  Try using more varied vocabulary in your essays to improve content scores.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-neutral-1 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium">
                3
              </div>
              <div>
                <p className="font-medium text-neutral-10">Practice Timed Writing</p>
                <p className="text-copy-14 text-neutral-7">
                  Complete 2-3 timed exercises per week to improve writing speed and exam readiness.
                </p>
              </div>
            </div>
          </div>
          <Button className="w-full mt-4">View Detailed Analysis</Button>
        </CardContent>
      </Card>
    </div>
  );
}
