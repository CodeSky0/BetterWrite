'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, BookOpen, CheckCircle2, Flame, Target, TrendingUp } from 'lucide-react';

interface ErrorProgress {
  type: string;
  count: number;
  trend: 'improving' | 'stable' | 'worsening';
  lastSeen: string;
}

interface LearningProgressProps {
  totalEssays: number;
  averageScore: number | null;
  errorProgress: ErrorProgress[];
  streak: number;
  achievements: string[];
}

export function LearningProgress({
  totalEssays,
  averageScore,
  errorProgress,
  streak,
  achievements,
}: LearningProgressProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'worsening':
        return <TrendingUp className="w-4 h-4 text-error rotate-180" />;
      default:
        return <Target className="w-4 h-4 text-neutral-7" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-success';
      case 'worsening':
        return 'text-error';
      default:
        return 'text-neutral-7';
    }
  };

  const achievementBadges = [
    { code: 'essay_10', label: '10 Essays', icon: BookOpen },
    { code: 'essay_50', label: '50 Essays', icon: BookOpen },
    { code: 'essay_100', label: '100 Essays', icon: BookOpen },
    { code: 'perfect_score', label: 'Perfect Score', icon: Award },
    { code: 'progress_streak', label: 'Progress Streak', icon: Flame },
    { code: 'first_tier_regular', label: 'Top Tier', icon: Target },
    { code: 'grammar_master', label: 'Grammar Master', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-title-28 font-medium text-neutral-10">{totalEssays}</p>
              <p className="text-copy-14 text-neutral-8">Total Essays</p>
            </div>
            <div className="text-center">
              <p className="text-title-28 font-medium text-neutral-10">
                {averageScore ? averageScore.toFixed(1) : '-'}
              </p>
              <p className="text-copy-14 text-neutral-8">Avg Score</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-5 h-5 text-warning" />
                <p className="text-title-28 font-medium text-neutral-10">{streak}</p>
              </div>
              <p className="text-copy-14 text-neutral-8">Day Streak</p>
            </div>
            <div className="text-center">
              <p className="text-title-28 font-medium text-neutral-10">{achievements.length}</p>
              <p className="text-copy-14 text-neutral-8">Achievements</p>
            </div>
          </div>

          {averageScore && (
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-copy-14 text-neutral-8">Score Progress</span>
                <span className="text-copy-14 text-neutral-10">{averageScore.toFixed(1)}/15</span>
              </div>
              <Progress value={(averageScore / 15) * 100} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Progress */}
      {errorProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" />
              Error Type Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {errorProgress.map((error, index) => (
                <div
                  key={`${error.type}-${index}`}
                  className="flex items-center justify-between p-3 bg-neutral-1 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getTrendIcon(error.trend)}
                    <div>
                      <p className="text-neutral-10 font-medium">{error.type}</p>
                      <p className="text-copy-14 text-neutral-7">Last seen: {error.lastSeen}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-title-20 font-medium ${getTrendColor(error.trend)}`}>
                      {error.count}
                    </p>
                    <p className="text-copy-14 text-neutral-7">occurrences</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-warning" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {achievementBadges.map((badge) => {
              const Icon = badge.icon;
              const isUnlocked = achievements.includes(badge.code);
              return (
                <div
                  key={badge.code}
                  className={`p-4 rounded-lg border text-center ${
                    isUnlocked
                      ? 'bg-warning/10 border-warning text-neutral-10'
                      : 'bg-neutral-1 border-neutral-3 text-neutral-7'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 mx-auto mb-2 ${isUnlocked ? 'text-warning' : 'text-neutral-5'}`}
                  />
                  <p className="text-copy-14 font-medium">{badge.label}</p>
                  {isUnlocked && <Badge className="mt-2 bg-success text-white">Unlocked</Badge>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
