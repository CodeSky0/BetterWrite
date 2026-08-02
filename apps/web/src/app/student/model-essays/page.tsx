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
import { BookOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function StudentModelEssaysPage() {
  const [essays, setEssays] = useState<TeachingResourceWithCreator[]>([]);
  const [topicType, setTopicType] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetcher
      .listStudentModelEssays({ topicType, difficulty })
      .then((res) => {
        if (res.success && res.data) {
          setEssays(res.data);
        } else {
          setError(res.error ?? '获取范文失败');
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '获取范文失败');
      })
      .finally(() => setLoading(false));
  }, [topicType, difficulty]);

  return (
    <RoleGuard allowedRoles={[UserRole.STUDENT]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-title-24 font-serif font-medium text-neutral-10">范文精读</h1>
              <p className="text-copy-14 text-neutral-8 mt-1">精读优质范文，学习结构、表达与技巧</p>
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="model-topic" className="text-label-12 text-neutral-7">
                    话题
                  </label>
                  <select
                    id="model-topic"
                    value={topicType}
                    onChange={(e) => setTopicType(e.target.value)}
                    className="h-10 rounded-md ring-1 ring-border bg-paper px-3 text-copy-14 text-neutral-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all duration-fast ease-yohaku"
                  >
                    <option value="">全部</option>
                    {Object.entries(TopicTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="model-difficulty" className="text-label-12 text-neutral-7">
                    难度
                  </label>
                  <select
                    id="model-difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="h-10 rounded-md ring-1 ring-border bg-paper px-3 text-copy-14 text-neutral-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all duration-fast ease-yohaku"
                  >
                    <option value="">全部</option>
                    {Object.entries(TeachingResourceDifficultyLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading && <p className="text-neutral-8">加载中...</p>}
          {error && <p className="text-error">{error}</p>}

          {!loading && essays.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="w-10 h-10 text-neutral-7 mx-auto mb-3" />
                <p className="text-neutral-8">暂无符合条件的范文</p>
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
                    <Link href={`/student/model-essays/${essay.id}`}>
                      <Button variant="ghost" size="icon" aria-label="查看详情">
                        <ChevronRight className="w-4 h-4 text-neutral-7" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-copy-16 text-neutral-10 leading-relaxed font-serif line-clamp-3">
                    {essay.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
