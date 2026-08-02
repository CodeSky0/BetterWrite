'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RoleGuard } from '@/components/layout/role-guard';
import { ChecklistGuard } from '@/components/student/checklist-guard';
import { TimeLimitAlert } from '@/components/student/time-limit-alert';
import { WritingEditor } from '@/components/student/writing-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fetcher } from '@/lib/api/fetcher';
import { ESSAY_CHECKLIST_ITEMS, useEssayDraft } from '@/lib/hooks/use-essay-draft';
import { UserRole, formatDuration } from '@betterwrite/shared';
import { AlertCircle, Clock, PenLine, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const STANDALONE_TASK_ID = 'standalone';
const WORD_LIMIT_MIN = 80;
const WORD_LIMIT_MAX = 125;
const TIME_LIMIT_MINUTES = 15; // Default time limit for exam simulation

export default function FreeWritingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [isDistractionFree, setIsDistractionFree] = useState(false);
  const [showTimeLimit, setShowTimeLimit] = useState(false);

  const draft = useEssayDraft({
    taskId: STANDALONE_TASK_ID,
    wordLimitMin: WORD_LIMIT_MIN,
    wordLimitMax: WORD_LIMIT_MAX,
  });

  const handleManualSave = async () => {
    await draft.saveDraft();
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 2000);
  };

  const handleSubmit = async () => {
    if (!draft.isReady) {
      setSubmitError('请完成自查清单后再提交');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetcher.submitEssay({ content: draft.content, title: '自由写作' });
      if (res.success && res.data) {
        await draft.clearDraft();
        router.push(`/student/essays/${res.data.id}`);
      } else {
        setSubmitError(res.error ?? '提交失败');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDistractionFree) {
    return (
      <RoleGuard allowedRoles={[UserRole.STUDENT]}>
        <WritingEditor
          value={draft.content}
          onChange={(value) => draft.setContent(value)}
          wordCount={draft.wordCount}
          wordLimitMin={WORD_LIMIT_MIN}
          wordLimitMax={WORD_LIMIT_MAX}
          isDistractionFree={true}
          onToggleDistractionFree={() => setIsDistractionFree(false)}
        />
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={[UserRole.STUDENT]}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Sticky Header with Word Count */}
          <div className="sticky top-0 z-10 bg-paper/95 backdrop-blur-sm border-b border-border pb-4 -mx-6 px-6 pt-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">自由写作</Badge>
                  <span className="text-copy-14 text-neutral-8 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(draft.durationMs)}
                  </span>
                  {draft.isSaving && (
                    <span className="text-label-12 text-neutral-7">保存中...</span>
                  )}
                  {justSaved && <span className="text-label-12 text-success">已保存</span>}
                </div>
                <h1 className="text-title-24 font-serif font-medium text-neutral-10">自由写作</h1>
                <p className="text-neutral-8 mt-2">请根据自己想练习的主题完成一篇英语作文。</p>
              </div>
              <div className="text-right bg-neutral-1 rounded-lg px-4 py-2 border border-neutral-3">
                <p className="text-title-28 font-medium text-neutral-10">{draft.wordCount}</p>
                <p className="text-copy-14 text-neutral-8">
                  词 / {WORD_LIMIT_MIN}-{WORD_LIMIT_MAX}
                </p>
              </div>
            </div>
          </div>

          {showTimeLimit && (
            <TimeLimitAlert
              durationMs={draft.durationMs}
              timeLimitMinutes={TIME_LIMIT_MINUTES}
              onWarning={() => {
                /* Could add sound notification */
              }}
            />
          )}

          <div className="animate-slide-in-top animate-delay-100">
            <WritingEditor
              value={draft.content}
              onChange={(value) => draft.setContent(value)}
              wordCount={draft.wordCount}
              wordLimitMin={WORD_LIMIT_MIN}
              wordLimitMax={WORD_LIMIT_MAX}
              isDistractionFree={false}
              onToggleDistractionFree={() => setIsDistractionFree(true)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 animate-slide-in-top animate-delay-200">
              <ChecklistGuard
                items={ESSAY_CHECKLIST_ITEMS}
                checked={draft.checklist}
                onToggle={draft.toggleCheck}
                wordCount={draft.wordCount}
                wordLimitMin={WORD_LIMIT_MIN}
                wordLimitMax={WORD_LIMIT_MAX}
              />
            </div>

            <Card className="lg:col-span-1 animate-slide-in-top animate-delay-300">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 text-neutral-10 font-medium">
                  <AlertCircle className="w-4 h-4 text-accent" />
                  字数提示
                </div>
                <p className="text-copy-14 text-neutral-8">
                  深圳中考英语作文建议词数为{' '}
                  <span className="font-medium text-neutral-10">100-125</span> 词，
                  {WORD_LIMIT_MIN} 词为底线。
                </p>
                <div className="h-2 bg-neutral-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-normal ease-yohaku ${
                      draft.wordCount < WORD_LIMIT_MIN
                        ? 'bg-error'
                        : draft.wordCount <= WORD_LIMIT_MAX
                          ? 'bg-success'
                          : 'bg-warning'
                    }`}
                    style={{ width: `${Math.min(100, (draft.wordCount / 150) * 100)}%` }}
                  />
                </div>
                <p className="text-label-12 text-neutral-7">
                  {draft.wordCount < WORD_LIMIT_MIN && '字数偏少，建议补充内容'}
                  {draft.wordCount >= WORD_LIMIT_MIN &&
                    draft.wordCount <= WORD_LIMIT_MAX &&
                    '字数适宜'}
                  {draft.wordCount > WORD_LIMIT_MAX && '字数偏多，注意控制'}
                </p>
              </CardContent>
            </Card>
          </div>

          {submitError && <p className="text-error text-copy-14">{submitError}</p>}

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={handleManualSave} disabled={draft.isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {draft.isSaving ? '保存中...' : justSaved ? '已保存' : '保存草稿'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowTimeLimit(!showTimeLimit)}>
                <Clock className="w-4 h-4 mr-2" />
                {showTimeLimit ? '隐藏计时' : '显示计时'}
              </Button>
            </div>
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting || !draft.isReady}
              title={!draft.isReady ? '请完成自查清单' : undefined}
            >
              <PenLine className="w-4 h-4 mr-2" />
              {isSubmitting ? '提交中...' : '提交作文'}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
