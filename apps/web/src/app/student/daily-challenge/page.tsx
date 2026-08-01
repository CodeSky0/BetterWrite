'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RoleGuard } from '@/components/layout/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fetcher } from '@/lib/api/fetcher';
import type { ChallengeSubmission, DailyChallenge } from '@betterwrite/shared';
import { DailyChallengeTypeLabels, UserRole } from '@betterwrite/shared';
import { CheckCircle2, Flame, PenLine, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

const challengeTierLabels: Record<string, string> = {
  first: '优秀',
  second: '良好',
  third: '中等',
  fourth: '及格',
  fifth: '待提升',
};

export default function DailyChallengePage() {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [submission, setSubmission] = useState<ChallengeSubmission | null>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    score: number;
    scoreTier: string;
    feedback: string;
    streakDays: number;
  } | null>(null);

  const startTimeRef = useRef<number>(Date.now());

  const loadToday = useCallback(async () => {
    try {
      const res = await fetcher.getDailyChallengeToday();
      if (res.success && res.data) {
        setChallenge(res.data.challenge);
        setSubmission(res.data.submission);
        setStreak(res.data.streak);
        if (res.data.submission) {
          setContent(res.data.submission.content);
        }
      } else {
        setError(res.error ?? '获取今日挑战失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取今日挑战失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const isSubmitted = Boolean(submission || submitResult);

  const handleSubmit = async () => {
    if (!challenge) return;
    if (content.trim().length === 0) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const durationMs = Date.now() - startTimeRef.current;
      const res = await fetcher.submitDailyChallenge(challenge.id, {
        content: content.trim(),
        durationMs,
      });
      if (res.success && res.data) {
        setSubmitResult(res.data);
        setStreak(res.data.streakDays);
      } else {
        setError(res.error ?? '提交失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tierLabel = submitResult
    ? (challengeTierLabels[submitResult.scoreTier] ?? submitResult.scoreTier)
    : submission?.scoreTier
      ? (challengeTierLabels[submission.scoreTier] ?? submission.scoreTier)
      : null;

  return (
    <RoleGuard allowedRoles={[UserRole.STUDENT]}>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">每日挑战</Badge>
                {challenge && (
                  <Badge variant="outline">{DailyChallengeTypeLabels[challenge.type]}</Badge>
                )}
                <span className="text-copy-14 text-neutral-8 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-warning" />
                  当前连击 {streak} 天
                </span>
              </div>
              <h1 className="text-title-24 font-serif font-medium text-neutral-10">
                {challenge?.title ?? '每日写作挑战'}
              </h1>
              {challenge?.instruction && (
                <p className="text-neutral-8 mt-2">{challenge.instruction}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-title-28 font-medium text-neutral-10">{wordCount}</p>
              <p className="text-copy-14 text-neutral-8">
                词 / 建议 {challenge?.suggestedWords ?? 50} 词
              </p>
            </div>
          </div>

          {challenge?.content && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-title-18 font-medium text-neutral-10 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  题目
                </h3>
                <p className="text-copy-16 text-neutral-10 leading-relaxed whitespace-pre-wrap">
                  {challenge.content}
                </p>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <p className="text-neutral-8">加载中...</p>
          ) : error && !challenge ? (
            <p className="text-error">{error}</p>
          ) : (
            <>
              <Card>
                <CardContent className="pt-6">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="在此输入你的英语作答..."
                    disabled={isSubmitted}
                    className="w-full min-h-[280px] resize-y rounded-md ring-1 ring-border bg-paper p-4 text-copy-16 leading-relaxed text-neutral-10 placeholder:text-neutral-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all duration-fast ease-yohaku disabled:bg-neutral-2 disabled:text-neutral-7"
                    spellCheck={false}
                  />
                </CardContent>
              </Card>

              {(submitResult || submission) && (
                <Card className="border-success/30 bg-success/5">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-warning" />
                      <div>
                        <p className="text-title-20 font-medium text-neutral-10">
                          {(submitResult?.score ?? submission?.score ?? 0).toFixed(0)} 分
                          {tierLabel && (
                            <span className="ml-2 text-copy-14 text-neutral-8">({tierLabel})</span>
                          )}
                        </p>
                        <p className="text-copy-14 text-neutral-8">
                          连击 {submitResult?.streakDays ?? submission?.streakDays ?? streak} 天
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-label-12 text-neutral-8 mb-1">AI 点评</p>
                      <p className="text-copy-14 text-neutral-10">
                        {submitResult?.feedback ??
                          (typeof submission?.aiFeedback?.feedback === 'string'
                            ? submission.aiFeedback.feedback
                            : '—')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {error && <p className="text-error text-copy-14">{error}</p>}

              <div className="flex justify-between items-center">
                <Link href="/student/dashboard" passHref legacyBehavior>
                  <Button variant="secondary">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    返回仪表盘
                  </Button>
                </Link>
                {isSubmitted ? (
                  <Button disabled>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    今日已完成
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={handleSubmit}
                    disabled={isSubmitting || content.trim().length === 0}
                  >
                    <PenLine className="w-4 h-4 mr-2" />
                    {isSubmitting ? '提交中...' : '提交挑战'}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
