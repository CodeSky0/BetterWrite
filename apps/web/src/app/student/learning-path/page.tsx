'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RoleGuard } from '@/components/layout/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetcher } from '@/lib/api/fetcher';
import {
  type LearningPath,
  type LearningPathRecommendation,
  LearningPathRecommendationTypeLabels,
  UserRole,
} from '@betterwrite/shared';
import {
  BookOpen,
  CheckCircle2,
  Compass,
  Lightbulb,
  MapPin,
  RefreshCw,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

export default function StudentLearningPathPage() {
  const [path, setPath] = useState<LearningPath | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completingIndex, setCompletingIndex] = useState<number | null>(null);

  const loadPath = useCallback(() => {
    setIsLoading(true);
    fetcher
      .getLearningPath()
      .then((res) => {
        if (res.success && res.data) setPath(res.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadPath();
  }, [loadPath]);

  const handleComplete = useCallback(async (index: number) => {
    setCompletingIndex(index);
    try {
      const res = await fetcher.completeLearningPathRecommendation(index);
      if (res.success && res.data) {
        setPath(res.data);
      }
    } finally {
      setCompletingIndex(null);
    }
  }, []);

  function getRecommendationLink(rec: LearningPathRecommendation): string | null {
    switch (rec.type) {
      case 'error_practice':
        return `/student/errors/${encodeURIComponent(rec.id)}`;
      case 'micro_skill':
        return '/student/micro-skills';
      case 'question_bank':
        return `/student/practice/${rec.id}`;
      case 'reading':
        return `/student/model-essays/${rec.id}`;
      default:
        return null;
    }
  }

  const parseRecommendations = (val: string | LearningPathRecommendation[]) => {
    if (Array.isArray(val)) return val;
    try {
      return JSON.parse(val as string) as LearningPathRecommendation[];
    } catch {
      return [];
    }
  };

  const parseWeakPoints = (val: string | string[]) => {
    if (Array.isArray(val)) return val;
    try {
      return JSON.parse(val as string) as string[];
    } catch {
      return [];
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'high':
        return 'text-error bg-error/10 border-error/20';
      case 'medium':
        return 'text-warning bg-warning/10 border-warning/20';
      default:
        return 'text-neutral-7 bg-neutral-2 border-border';
    }
  };

  const priorityLabel = (p: string) => {
    switch (p) {
      case 'high':
        return '优先';
      case 'medium':
        return '中等';
      default:
        return '可选';
    }
  };

  return (
    <RoleGuard allowedRoles={[UserRole.STUDENT]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Compass className="w-6 h-6 text-accent" />
              <div>
                <h1 className="text-title-24 font-serif font-medium text-neutral-10">
                  本周学习路径
                </h1>
                {path && (
                  <p className="text-label-12 text-neutral-7">
                    {path.weekStart} ~ {path.weekEnd}
                  </p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={loadPath}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {isLoading && <p className="text-neutral-8">加载中...</p>}

          {!isLoading && !path && (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="w-12 h-12 text-neutral-6 mx-auto mb-3" />
                <p className="text-neutral-8">暂无学习路径</p>
              </CardContent>
            </Card>
          )}

          {path && (
            <>
              {/* Weak Points */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-title-20 flex items-center gap-2">
                    <Target className="w-4 h-4 text-warning" />
                    本周薄弱点
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {parseWeakPoints(path.weakPoints).map((wp) => (
                      <Badge key={wp} variant="outline" className="text-copy-14">
                        {wp}
                      </Badge>
                    ))}
                    {parseWeakPoints(path.weakPoints).length === 0 && (
                      <p className="text-copy-14 text-neutral-7">你的写作水平很均衡，继续保持！</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* AI Advice */}
              {path.aiAdvice && (
                <Card className="border-accent/20 bg-accent/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <p className="text-copy-14 text-neutral-9 leading-relaxed">{path.aiAdvice}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-title-20 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-accent" />
                      推荐练习
                    </CardTitle>
                    <Badge variant="outline">
                      {path.completedCount}/{path.totalRecommendations} 已完成
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {parseRecommendations(path.recommendations).map((rec, index) => {
                    const link = getRecommendationLink(rec);
                    const cardClass = `flex items-center justify-between rounded-md border p-4 ${
                      rec.isCompleted
                        ? 'bg-success/5 border-success/20'
                        : priorityColor(rec.priority)
                    }`;

                    const content = (
                      <>
                        <div className="flex items-center gap-3 min-w-0">
                          {rec.isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                          ) : (
                            <MapPin className="w-5 h-5 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium text-neutral-10">{rec.title}</h3>
                              <Badge variant="outline" className="text-label-12">
                                {LearningPathRecommendationTypeLabels[rec.type] ?? rec.type}
                              </Badge>
                            </div>
                            <p className="text-label-12 text-neutral-7 mt-0.5">{rec.reason}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <Badge className={`text-label-12 ${priorityColor(rec.priority)}`}>
                            {priorityLabel(rec.priority)}
                          </Badge>
                        </div>
                      </>
                    );

                    return (
                      <div key={`${rec.type}-${rec.id}-${index}`} className={cardClass}>
                        {link ? (
                          <Link
                            href={link}
                            className="flex items-center justify-between flex-1 min-w-0"
                          >
                            {content}
                          </Link>
                        ) : (
                          <div className="flex items-center justify-between flex-1 min-w-0">
                            {content}
                          </div>
                        )}
                        {!rec.isCompleted && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 ml-2 h-8 text-label-12"
                            disabled={completingIndex === index}
                            onClick={() => handleComplete(index)}
                          >
                            {completingIndex === index ? '标记中...' : '标记完成'}
                          </Button>
                        )}
                      </div>
                    );
                  })}

                  {parseRecommendations(path.recommendations).length === 0 && (
                    <p className="text-center text-neutral-7 py-4">暂无推荐</p>
                  )}
                </CardContent>
              </Card>

              {/* Progress bar */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-copy-14 text-neutral-7">本周完成进度</span>
                    <span className="text-copy-14 font-medium text-neutral-10">
                      {path.totalRecommendations > 0
                        ? Math.round((path.completedCount / path.totalRecommendations) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-neutral-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{
                        width: `${
                          path.totalRecommendations > 0
                            ? (path.completedCount / path.totalRecommendations) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
