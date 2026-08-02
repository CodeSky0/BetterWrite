'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RoleGuard } from '@/components/layout/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { fetcher } from '@/lib/api/fetcher';
import { clientLogger } from '@/lib/client-logger';
import {
  PeerReviewDimensionLabels,
  PeerReviewStatusLabels,
  type PeerReviewWithEssay,
  UserRole,
} from '@betterwrite/shared';
import { ArrowLeft, FileText, Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type ViewMode = 'list' | 'review';

const DIMENSION_KEYS = [
  { key: 'contentScore', label: PeerReviewDimensionLabels.content },
  { key: 'languageScore', label: PeerReviewDimensionLabels.language },
  { key: 'structureScore', label: PeerReviewDimensionLabels.structure },
  { key: 'handwritingScore', label: PeerReviewDimensionLabels.handwriting },
] as const;

export default function StudentPeerReviewPage() {
  const [mode, setMode] = useState<ViewMode>('list');
  const [reviews, setReviews] = useState<PeerReviewWithEssay[]>([]);
  const [selectedReview, setSelectedReview] = useState<PeerReviewWithEssay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [scores, setScores] = useState<Record<(typeof DIMENSION_KEYS)[number]['key'], number>>({
    contentScore: 80,
    languageScore: 80,
    structureScore: 80,
    handwritingScore: 80,
  });
  const [comment, setComment] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetcher.getPendingPeerReviews();
      if (res.success && res.data) {
        setReviews(res.data);
      } else {
        clientLogger.warn('[StudentPeerReview] load failed:', res.error);
        setError(res.error ?? '获取互评任务失败');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载失败';
      clientLogger.error('[StudentPeerReview] load error:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSelect = (review: PeerReviewWithEssay) => {
    setSelectedReview(review);
    setScores({
      contentScore: 80,
      languageScore: 80,
      structureScore: 80,
      handwritingScore: 80,
    });
    setComment('');
    setAnswers({});
    setMode('review');
  };

  const handleSubmit = async () => {
    if (!selectedReview) return;
    setSubmitting(true);
    try {
      const answerList = Object.entries(answers)
        .filter(([, v]) => v.trim())
        .map(([questionId, answer]) => ({ questionId, answer }));
      const res = await fetcher.submitPeerReview(selectedReview.id, {
        ...scores,
        comment,
        answers: answerList,
      });
      if (res.success) {
        setMode('list');
        setSelectedReview(null);
        await loadReviews();
      } else {
        setError(res.error ?? '提交失败');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '提交失败';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={[UserRole.STUDENT]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            {mode === 'review' && (
              <Button variant="ghost" size="sm" onClick={() => setMode('list')}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                返回列表
              </Button>
            )}
            <div>
              <h1 className="text-title-24 font-serif font-medium text-neutral-10">同伴互评</h1>
              {mode === 'list' && (
                <p className="text-copy-14 text-neutral-8 mt-1">
                  完成互评任务后方可查看他人对自己作文的评价
                </p>
              )}
            </div>
          </div>

          {error && <p className="text-error text-copy-14">{error}</p>}

          {mode === 'list' &&
            (isLoading ? (
              <p className="text-neutral-8 text-copy-14">加载中...</p>
            ) : reviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-neutral-8">暂无待评任务</p>
                  <p className="text-label-12 text-neutral-7 mt-2">
                    教师分配互评任务后将在此处显示
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <Card
                    key={review.id}
                    className="hover:ring-accent/30 transition-colors duration-fast ease-yohaku cursor-pointer"
                    onClick={() => handleSelect(review)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {PeerReviewStatusLabels[review.status]}
                            </Badge>
                            {review.essay.taskTitle ? (
                              <span className="text-label-12 text-neutral-7">
                                {review.essay.taskTitle}
                              </span>
                            ) : null}
                          </div>
                          <h3 className="text-copy-16 font-medium text-neutral-10 truncate">
                            {review.essay.title ?? '未命名作文'}
                          </h3>
                          <p className="text-copy-14 text-neutral-8 line-clamp-2">
                            {review.essay.content}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <FileText className="w-8 h-8 text-neutral-5" />
                          <p className="text-label-12 text-neutral-7 mt-1">
                            {review.essay.wordCount} 词
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}

          {mode === 'review' && selectedReview && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-title-18">待评作文</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedReview.essay.taskTitle ?? '自主练习'}</Badge>
                    <span className="text-label-12 text-neutral-7">
                      {selectedReview.essay.wordCount} 词
                    </span>
                  </div>
                  <h3 className="text-title-20 font-medium text-neutral-10">
                    {selectedReview.essay.title ?? '未命名作文'}
                  </h3>
                  <p className="text-copy-14 text-neutral-9 leading-relaxed whitespace-pre-wrap">
                    {selectedReview.essay.content}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-title-18">互评打分</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {DIMENSION_KEYS.map(({ key, label }) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>{label}（0-100）</Label>
                        <span className="text-title-20 font-medium text-accent">{scores[key]}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={scores[key]}
                        onChange={(e) =>
                          setScores((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                        }
                        className="w-full accent-accent"
                      />
                    </div>
                  ))}

                  <div className="space-y-2">
                    <Label htmlFor="comment">评语</Label>
                    <Textarea
                      id="comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="写下你对这篇作文的具体评价..."
                      rows={4}
                    />
                  </div>

                  {selectedReview.essay.taskId && (
                    <div className="space-y-3">
                      <Label>引导性问题</Label>
                      {[
                        { id: 'main_idea', text: '文章主旨是否明确？' },
                        { id: 'examples', text: '论据/例子是否充分支持观点？' },
                        { id: 'logic', text: '段落之间衔接是否自然？' },
                        { id: 'vocabulary', text: '有哪些值得学习的表达？' },
                        { id: 'suggestion', text: '给作者一个具体的改进建议。' },
                      ].map((q) => (
                        <div key={q.id} className="space-y-1">
                          <Label className="text-copy-14 text-neutral-8">{q.text}</Label>
                          <Textarea
                            value={answers[q.id] ?? ''}
                            onChange={(e) =>
                              setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                            }
                            placeholder="简要回答..."
                            rows={2}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
                    <Send className="w-4 h-4 mr-2" />
                    {submitting ? '提交中...' : '提交互评'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
