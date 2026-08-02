'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RoleGuard } from '@/components/layout/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetcher } from '@/lib/api/fetcher';
import {
  type ModelEssayImitation,
  type ModelEssayImitationFeedback,
  ModelEssayImitationStatusLabels,
  TeachingResourceDifficultyLabels,
  type TeachingResourceWithCreator,
  TopicTypeLabels,
  UserRole,
} from '@betterwrite/shared';
import { ArrowLeft, BarChart3, BookOpen, RefreshCw, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TeacherModelEssayStatisticsDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [resource, setResource] = useState<TeachingResourceWithCreator | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    completed: number;
    correcting: number;
    failed: number;
    averageScore: number | null;
    submissions: Array<
      ModelEssayImitation & {
        student?: { id: string; name: string; studentNo: string | null } | null;
      }
    >;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetcher.analyzeModelEssayResource(id);
      if (res.success && res.data) {
        setResource(res.data);
      } else {
        setError(res.error ?? '解析失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析失败');
    } finally {
      setAnalyzing(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey 用于手动触发重新加载
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetcher.getTeacherModelEssayStatistics(id);
        if (cancelled) return;
        if (res.success && res.data) {
          setResource(res.data.resource);
          setStats(res.data);
        } else {
          setError(res.error ?? '获取统计失败');
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '获取统计失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, refreshKey]);

  return (
    <RoleGuard allowedRoles={[UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN]}>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-2">
            <Link href="/teacher/model-essays/statistics">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                返回列表
              </Button>
            </Link>
          </div>

          {loading ? (
            <p className="text-neutral-8">加载中...</p>
          ) : error && !resource ? (
            <div className="space-y-4">
              <p className="text-error">{error}</p>
              <Button variant="secondary" onClick={() => setRefreshKey((k) => k + 1)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                重试
              </Button>
            </div>
          ) : resource ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {resource.topicType ? (
                      <Badge variant="outline">
                        {TopicTypeLabels[resource.topicType as keyof typeof TopicTypeLabels] ??
                          resource.topicType}
                      </Badge>
                    ) : null}
                    <Badge variant="outline">
                      {TeachingResourceDifficultyLabels[resource.difficulty] ?? resource.difficulty}
                    </Badge>
                    {resource.analysis ? (
                      <Badge variant="secondary">已解析</Badge>
                    ) : (
                      <Badge variant="outline">未解析</Badge>
                    )}
                  </div>
                  <h1 className="text-title-24 font-serif font-medium text-neutral-10">
                    {resource.title}
                  </h1>
                  <p className="text-copy-14 text-neutral-8 mt-1">
                    创建者：{resource.creator?.name ?? resource.createdBy ?? '-'}
                  </p>
                </div>
                {!resource.analysis && (
                  <Button onClick={handleAnalyze} disabled={analyzing}>
                    {analyzing ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    AI 解析范文
                  </Button>
                )}
              </div>

              {stats ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="总提交" value={stats.total} />
                    <StatCard label="已完成" value={stats.completed} />
                    <StatCard label="批改中" value={stats.correcting} />
                    <StatCard
                      label="平均分"
                      value={stats.averageScore !== null ? `${stats.averageScore}` : '-'}
                    />
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-title-20 flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        范文原文
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-copy-16 text-neutral-10 leading-relaxed whitespace-pre-wrap font-serif">
                        {resource.content}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-title-20 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        学生仿写记录
                        <span className="text-neutral-8 text-copy-14 font-normal">
                          共 {stats.submissions.length} 条
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {stats.submissions.length === 0 ? (
                        <p className="text-neutral-8 text-center py-8">暂无学生提交仿写</p>
                      ) : (
                        stats.submissions.map((submission) => (
                          <SubmissionCard key={submission.id} submission={submission} />
                        ))
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : null}
            </>
          ) : null}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-title-24 font-medium text-neutral-10">{value}</p>
        <p className="text-label-12 text-neutral-7 mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function SubmissionCard({
  submission,
}: {
  submission: ModelEssayImitation & {
    student?: { id: string; name: string; studentNo: string | null } | null;
  };
}) {
  const feedback = submission.feedback as ModelEssayImitationFeedback | null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-title-18 font-medium">
              {submission.student?.name ?? submission.studentId}
              {submission.student?.studentNo ? (
                <span className="text-neutral-8 text-copy-14 font-normal ml-2">
                  （{submission.student.studentNo}）
                </span>
              ) : null}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1 text-label-12 text-neutral-7">
              <span>{new Date(submission.createdAt).toLocaleString()}</span>
              <Badge variant={submission.status === 'completed' ? 'secondary' : 'outline'}>
                {ModelEssayImitationStatusLabels[submission.status] ?? submission.status}
              </Badge>
            </div>
          </div>
          {submission.score !== null ? (
            <div className="text-right">
              <p className="text-title-24 font-medium text-accent">{submission.score}</p>
              <p className="text-label-12 text-neutral-7">分</p>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <p className="text-copy-16 text-neutral-10 leading-relaxed whitespace-pre-wrap font-serif">
          {submission.content}
        </p>
        <p className="text-copy-14 text-neutral-7">词数：{submission.wordCount}</p>

        {submission.status === 'completed' && feedback ? (
          <div className="p-4 bg-neutral-2 rounded-md space-y-3">
            <p className="text-copy-16 font-medium text-neutral-10">{feedback.overallComment}</p>
            {feedback.strengths.length > 0 ? (
              <div>
                <p className="text-label-12 text-neutral-7 mb-1">优点</p>
                <ul className="list-disc list-inside text-copy-14 text-neutral-9 space-y-1">
                  {feedback.strengths.map((s, idx) => (
                    <li key={`strength-${idx}-${s.slice(0, 20)}`}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {feedback.weaknesses.length > 0 ? (
              <div>
                <p className="text-label-12 text-neutral-7 mb-1">不足</p>
                <ul className="list-disc list-inside text-copy-14 text-neutral-9 space-y-1">
                  {feedback.weaknesses.map((s, idx) => (
                    <li key={`weak-${idx}-${s.slice(0, 20)}`}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {feedback.suggestions.length > 0 ? (
              <div>
                <p className="text-label-12 text-neutral-7 mb-1">改进建议</p>
                <ul className="list-disc list-inside text-copy-14 text-neutral-9 space-y-1">
                  {feedback.suggestions.map((s, idx) => (
                    <li key={`suggest-${idx}-${s.slice(0, 20)}`}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {feedback.dimensionScores ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {Object.entries(feedback.dimensionScores).map(([key, score]) => (
                  <div key={key} className="p-2 bg-paper rounded border border-border text-center">
                    <p className="text-title-18 font-medium text-neutral-10">{score}</p>
                    <p className="text-label-12 text-neutral-7">{getDimensionLabel(key)}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {submission.status === 'failed' ? (
          <p className="text-error text-copy-14">批改失败</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function getDimensionLabel(key: string) {
  const labels: Record<string, string> = {
    content: '内容',
    language: '语言',
    structure: '结构',
    imitation: '仿写',
  };
  return labels[key] ?? key;
}
