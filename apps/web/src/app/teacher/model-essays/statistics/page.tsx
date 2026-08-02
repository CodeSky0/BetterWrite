'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RoleGuard } from '@/components/layout/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetcher } from '@/lib/api/fetcher';
import {
  TeachingResourceDifficultyLabels,
  type TeachingResourceWithCreator,
  TopicTypeLabels,
  UserRole,
} from '@betterwrite/shared';
import { BarChart3, BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function TeacherModelEssayStatisticsPage() {
  const [essays, setEssays] = useState<TeachingResourceWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetcher
      .listResources({ type: 'sample' })
      .then((res) => {
        if (res.success && res.data) {
          setEssays(res.data);
        } else {
          setError(res.error ?? '获取范文列表失败');
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '获取范文列表失败');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <RoleGuard allowedRoles={[UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-title-24 font-serif font-medium text-neutral-10">范文统计</h1>
            <p className="text-copy-14 text-neutral-8 mt-1">
              查看学生仿写提交数量、平均分与详细反馈
            </p>
          </div>

          {loading && <p className="text-neutral-8">加载中...</p>}
          {error && <p className="text-error">{error}</p>}

          {!loading && essays.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="w-10 h-10 text-neutral-7 mx-auto mb-3" />
                <p className="text-neutral-8">暂无范文资源</p>
                <Link href="/teacher/resources/sample" className="inline-block mt-3">
                  <Button variant="secondary">前往范文库</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4">
            {essays.map((essay) => (
              <Card key={essay.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {essay.topicType ? (
                          <Badge variant="outline">
                            {TopicTypeLabels[essay.topicType as keyof typeof TopicTypeLabels] ??
                              essay.topicType}
                          </Badge>
                        ) : null}
                        <Badge variant="outline">
                          {TeachingResourceDifficultyLabels[essay.difficulty] ?? essay.difficulty}
                        </Badge>
                        {essay.analysis ? (
                          <Badge variant="secondary">已解析</Badge>
                        ) : (
                          <Badge variant="outline">未解析</Badge>
                        )}
                      </div>
                      <CardTitle className="text-title-18 font-medium">{essay.title}</CardTitle>
                    </div>
                    <Link href={`/teacher/model-essays/statistics/${essay.id}`}>
                      <Button variant="ghost" size="icon" aria-label="查看统计">
                        <ChevronRight className="w-4 h-4 text-neutral-7" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-copy-16 text-neutral-10 leading-relaxed font-serif line-clamp-2">
                    {essay.content}
                  </p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-1 text-copy-14 text-neutral-8">
                      <BarChart3 className="w-4 h-4" />
                      查看学生仿写统计
                    </div>
                    {!essay.analysis && (
                      <div className="flex items-center gap-1 text-copy-14 text-warning">
                        <Sparkles className="w-4 h-4" />
                        建议先解析范文
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
