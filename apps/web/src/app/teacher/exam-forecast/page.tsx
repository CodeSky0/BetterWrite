'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RoleGuard } from '@/components/layout/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetcher } from '@/lib/api/fetcher';
import {
  type ExamForecast,
  type PredictedTopic,
  TopicCategoryLabels,
  type TopicTrend,
  UserRole,
} from '@betterwrite/shared';
import {
  AlertCircle,
  BarChart3,
  LineChart,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

export default function TeacherExamForecastPage() {
  const [classId, setClassId] = useState('');
  const [forecast, setForecast] = useState<ExamForecast | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadForecast = async () => {
    if (!classId) return;
    setIsLoading(true);
    try {
      const res = await fetcher.getExamForecast(classId);
      if (res.success && res.data) setForecast(res.data);
    } finally {
      setIsLoading(false);
    }
  };

  const trendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-error" />;
      default:
        return <LineChart className="w-4 h-4 text-neutral-7" />;
    }
  };

  const trendLabel = (trend: string) => {
    switch (trend) {
      case 'rising':
        return '上升';
      case 'declining':
        return '下降';
      default:
        return '稳定';
    }
  };

  return (
    <RoleGuard allowedRoles={[UserRole.TEACHER, UserRole.SCHOOL_ADMIN]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-accent" />
            <h1 className="text-title-24 font-serif font-medium text-neutral-10">中考备考对标</h1>
          </div>

          {/* Class selector */}
          <div className="flex items-center gap-3">
            <label htmlFor="classId" className="text-copy-14 text-neutral-7">
              选择班级:
            </label>
            <input
              id="classId"
              type="text"
              placeholder="输入班级 ID"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="h-10 w-64 rounded-md ring-1 ring-border bg-paper px-3 text-copy-14 text-neutral-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <Button onClick={loadForecast} disabled={isLoading || !classId}>
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : '生成报告'}
            </Button>
          </div>

          {!forecast && !isLoading && (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="w-12 h-12 text-neutral-6 mx-auto mb-3" />
                <p className="text-neutral-8">输入班级 ID 生成备考对标报告</p>
              </CardContent>
            </Card>
          )}

          {forecast && (
            <>
              {/* Topic Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-title-20 flex items-center gap-2">
                    <LineChart className="w-4 h-4 text-accent" />
                    话题趋势分析（近10年真题）
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {forecast.topicTrends.map((trend: TopicTrend) => (
                      <div
                        key={trend.category}
                        className="flex items-center justify-between rounded-md bg-neutral-2 p-3"
                      >
                        <div className="flex items-center gap-3">
                          {trendIcon(trend.trend)}
                          <span className="font-medium text-neutral-10">
                            {TopicCategoryLabels[
                              trend.category as keyof typeof TopicCategoryLabels
                            ] ?? trend.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-label-12 text-neutral-7">
                          <span>出现 {trend.frequency} 次</span>
                          <Badge variant="outline">{trendLabel(trend.trend)}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Predicted Topics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-title-20 flex items-center gap-2">
                    <Target className="w-4 h-4 text-warning" />
                    预测话题方向
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {forecast.predictedTopics.length > 0 ? (
                    <div className="space-y-3">
                      {forecast.predictedTopics.map((topic: PredictedTopic) => (
                        <div
                          key={topic.category}
                          className="rounded-md border border-warning/20 bg-warning/5 p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-neutral-10">
                              {TopicCategoryLabels[
                                topic.category as keyof typeof TopicCategoryLabels
                              ] ?? topic.category}
                            </h3>
                            <Badge variant="outline">
                              置信度 {Math.round(topic.confidence * 100)}%
                            </Badge>
                          </div>
                          <p className="text-copy-14 text-neutral-8">{topic.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-copy-14 text-neutral-7">各话题分布均匀，建议全面复习。</p>
                  )}
                </CardContent>
              </Card>

              {/* Preparation Advice */}
              <Card className="border-accent/20 bg-accent/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <p className="text-copy-14 text-neutral-9 leading-relaxed">
                      {forecast.preparationAdvice}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Class Benchmark */}
              {forecast.classBenchmark && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-title-20 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-accent" />
                      班级对标分析 — {forecast.classBenchmark.className}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-md bg-neutral-2 p-3 text-center">
                        <p className="text-title-24 font-medium text-neutral-10">
                          {forecast.classBenchmark.currentLevel}
                        </p>
                        <p className="text-label-12 text-neutral-7">当前均分</p>
                      </div>
                      <div className="rounded-md bg-accent/5 p-3 text-center">
                        <p className="text-title-24 font-medium text-accent">
                          {forecast.classBenchmark.targetLevel}
                        </p>
                        <p className="text-label-12 text-neutral-7">目标分数</p>
                      </div>
                      <div
                        className={`rounded-md p-3 text-center ${
                          forecast.classBenchmark.gap > 0 ? 'bg-warning/5' : 'bg-success/5'
                        }`}
                      >
                        <p
                          className={`text-title-24 font-medium ${
                            forecast.classBenchmark.gap > 0 ? 'text-warning' : 'text-success'
                          }`}
                        >
                          {forecast.classBenchmark.gap > 0 ? '+' : ''}
                          {forecast.classBenchmark.gap}
                        </p>
                        <p className="text-label-12 text-neutral-7">差距</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
