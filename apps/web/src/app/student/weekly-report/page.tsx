'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RoleGuard } from '@/components/layout/role-guard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetcher } from '@/lib/api/fetcher';
import { UserRole, type WeeklyReport, formatScore } from '@betterwrite/shared';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Calendar,
  FileText,
  Lightbulb,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function StudentWeeklyReportPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher
      .getWeeklyReports()
      .then((res) => {
        if (res.success && res.data) setReports(res.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const parseJson = <T,>(val: string | T[], fallback: T[]): T[] => {
    if (Array.isArray(val)) return val;
    try {
      return JSON.parse(val as string) as T[];
    } catch {
      return fallback;
    }
  };

  return (
    <RoleGuard allowedRoles={[UserRole.STUDENT]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-accent" />
            <h1 className="text-title-24 font-serif font-medium text-neutral-10">学习周报</h1>
          </div>

          {isLoading && <p className="text-neutral-8">加载中...</p>}

          {!isLoading && reports.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-neutral-6 mx-auto mb-3" />
                <p className="text-neutral-8 mb-2">还没有周报</p>
                <p className="text-label-12 text-neutral-7">系统每周一会自动生成你的学习周报</p>
              </CardContent>
            </Card>
          )}

          {reports.map((report) => {
            const errorsResolved = parseJson<string>(report.errorsResolved, []);
            const newErrors = parseJson<string>(report.newErrors, []);
            const scoreChange =
              report.averageScore != null && report.previousAverageScore != null
                ? report.averageScore - report.previousAverageScore
                : null;

            return (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-title-20">
                      {report.weekStart} ~ {report.weekEnd}
                    </CardTitle>
                    <Badge variant={report.status === 'generated' ? 'default' : 'secondary'}>
                      {report.status === 'generated' ? '已生成' : '生成中'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Key Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-md bg-neutral-2 p-3 text-center">
                      <p className="text-title-24 font-medium text-neutral-10">
                        {report.essaysSubmitted}
                      </p>
                      <p className="text-label-12 text-neutral-7">提交作文</p>
                    </div>
                    <div className="rounded-md bg-neutral-2 p-3 text-center">
                      <p className="text-title-24 font-medium text-neutral-10">
                        {report.averageScore != null ? formatScore(report.averageScore) : '-'}
                      </p>
                      <p className="text-label-12 text-neutral-7">本周均分</p>
                    </div>
                    <div className="rounded-md bg-success/5 p-3 text-center">
                      <p className="text-title-24 font-medium text-success">
                        {errorsResolved.length}
                      </p>
                      <p className="text-label-12 text-neutral-7">消灭错题类型</p>
                    </div>
                    <div className="rounded-md bg-warning/5 p-3 text-center">
                      <p className="text-title-24 font-medium text-warning">{newErrors.length}</p>
                      <p className="text-label-12 text-neutral-7">新增薄弱点</p>
                    </div>
                  </div>

                  {/* Score change */}
                  {scoreChange != null && (
                    <div className="flex items-center gap-2">
                      {scoreChange > 0 ? (
                        <TrendingUp className="w-4 h-4 text-success" />
                      ) : scoreChange < 0 ? (
                        <TrendingDown className="w-4 h-4 text-error" />
                      ) : (
                        <span className="w-4 h-4" />
                      )}
                      <span className="text-copy-14 text-neutral-8">
                        均分较上周{' '}
                        <strong
                          className={
                            scoreChange > 0
                              ? 'text-success'
                              : scoreChange < 0
                                ? 'text-error'
                                : 'text-neutral-7'
                          }
                        >
                          {scoreChange > 0 ? '提升' : scoreChange < 0 ? '下降' : '持平'}
                          {Math.abs(scoreChange).toFixed(1)} 分
                        </strong>
                      </span>
                    </div>
                  )}

                  {/* Errors resolved */}
                  {errorsResolved.length > 0 && (
                    <div>
                      <h4 className="text-copy-14 font-medium text-success flex items-center gap-1 mb-1">
                        <ArrowUp className="w-3 h-3" /> 已改善
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {errorsResolved.map((e) => (
                          <Badge key={e} variant="secondary" className="bg-success/10 text-success">
                            {e}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New errors */}
                  {newErrors.length > 0 && (
                    <div>
                      <h4 className="text-copy-14 font-medium text-error flex items-center gap-1 mb-1">
                        <ArrowDown className="w-3 h-3" /> 需关注
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {newErrors.map((e) => (
                          <Badge key={e} variant="secondary" className="bg-error/10 text-error">
                            {e}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Suggestion */}
                  {report.aiSuggestion && (
                    <div className="rounded-md bg-accent/5 border border-accent/20 p-4">
                      <h4 className="text-copy-14 font-medium text-accent flex items-center gap-1 mb-2">
                        <Lightbulb className="w-4 h-4" /> AI 建议
                      </h4>
                      <p className="text-copy-14 text-neutral-8 leading-relaxed">
                        {report.aiSuggestion}
                      </p>
                    </div>
                  )}

                  {/* Recommended exercises */}
                  {report.recommendedExercises && (
                    <div>
                      <h4 className="text-copy-14 font-medium text-neutral-10 flex items-center gap-1 mb-2">
                        <BookOpen className="w-4 h-4" /> 推荐练习
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {parseJson<string>(report.recommendedExercises, []).map((ex: string) => (
                          <Badge key={ex} variant="outline">
                            {ex}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
