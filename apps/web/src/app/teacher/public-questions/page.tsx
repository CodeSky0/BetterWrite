'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RoleGuard } from '@/components/layout/role-guard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetcher } from '@/lib/api/fetcher';
import {
  PracticeDifficultyLabels,
  type PublicQuestionWithStats,
  TopicCategoryLabels,
  TopicTypeLabels,
  UserRole,
} from '@betterwrite/shared';
import { Library, MessageSquare, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TeacherPublicQuestionsPage() {
  const [questions, setQuestions] = useState<PublicQuestionWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [topicType, setTopicType] = useState('');
  const [difficulty, setDifficulty] = useState('');

  useEffect(() => {
    setIsLoading(true);
    const params: { topicType?: string; difficulty?: string; limit: number } = { limit: 50 };
    if (topicType) params.topicType = topicType;
    if (difficulty) params.difficulty = difficulty;
    fetcher
      .getPublicQuestions(params)
      .then((res) => {
        if (res.success && res.data) setQuestions(res.data);
      })
      .finally(() => setIsLoading(false));
  }, [topicType, difficulty]);

  return (
    <RoleGuard allowedRoles={[UserRole.TEACHER, UserRole.SCHOOL_ADMIN]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Library className="w-6 h-6 text-accent" />
            <h1 className="text-title-24 font-serif font-medium text-neutral-10">公共题库</h1>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="topicType" className="text-label-12 text-neutral-7">
                话题类型
              </label>
              <select
                id="topicType"
                value={topicType}
                onChange={(e) => setTopicType(e.target.value)}
                className="h-10 rounded-md ring-1 ring-border bg-paper px-3 text-copy-14 text-neutral-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <option value="">全部</option>
                {Object.entries(TopicTypeLabels).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="difficulty" className="text-label-12 text-neutral-7">
                难度
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="h-10 rounded-md ring-1 ring-border bg-paper px-3 text-copy-14 text-neutral-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <option value="">全部</option>
                {Object.entries(PracticeDifficultyLabels).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading && <p className="text-neutral-8">加载中...</p>}

          {!isLoading && questions.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-neutral-8">暂无符合条件的题目</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questions.map((q) => (
              <Card key={q.id} className="hover:ring-2 hover:ring-accent transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {TopicTypeLabels[q.topicType as keyof typeof TopicTypeLabels] ??
                          q.topicType}
                      </Badge>
                      <Badge variant="outline">
                        {PracticeDifficultyLabels[
                          q.difficulty as keyof typeof PracticeDifficultyLabels
                        ] ?? q.difficulty}
                      </Badge>
                    </div>
                    {q.avgRating != null && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-warning fill-warning" />
                        <span className="text-label-12 text-neutral-7">
                          {q.avgRating} ({q.ratingCount})
                        </span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-title-20">{q.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-copy-14 text-neutral-8 line-clamp-2">{q.requirements}</p>

                  {q.keyPoints?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {q.keyPoints.slice(0, 3).map((kp) => (
                        <Badge key={kp} variant="outline" className="text-label-12">
                          {kp}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-label-12 text-neutral-7 pt-2 border-t border-border">
                    <span>出题人: {q.creatorName}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" /> {q.ratingCount} 评分
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {q.commentCount} 评论
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-label-12 text-neutral-7">
                    <span>
                      {q.wordLimitMin}-{q.wordLimitMax} 词
                    </span>
                    {q.topicCategory && (
                      <>
                        <span>·</span>
                        <span>
                          {TopicCategoryLabels[
                            q.topicCategory as keyof typeof TopicCategoryLabels
                          ] ?? q.topicCategory}
                        </span>
                      </>
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
