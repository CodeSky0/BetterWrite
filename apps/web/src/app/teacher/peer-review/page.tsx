'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RoleGuard } from '@/components/layout/role-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { type EssayTask, fetcher } from '@/lib/api/fetcher';
import { DefaultPeerReviewQuestions, UserRole } from '@betterwrite/shared';
import { RotateCcw, Settings2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TeacherClass {
  id: string;
  name: string;
  grade: string;
  studentCount: number;
}

export default function TeacherPeerReviewPage() {
  const [tasks, setTasks] = useState<EssayTask[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [summary, setSummary] = useState<{
    total: number;
    completed: number;
    pending: number;
    completionRate: number;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const [form, setForm] = useState({
    enabled: true,
    reviewsPerEssay: 2,
    reviewsPerStudent: 2,
    anonymous: true,
    aiWeight: 0.6,
    teacherWeight: 0.3,
    peerWeight: 0.1,
    dueDate: '',
    guidingQuestions: DefaultPeerReviewQuestions.map((q) => `${q.id}|${q.text}`).join('\n'),
  });

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [classesRes, tasksRes] = await Promise.all([
          fetcher.listTeacherClasses(),
          fetcher.listTasks(),
        ]);
        if (cancelled) return;
        if (classesRes.success && classesRes.data) setClasses(classesRes.data);
        if (tasksRes.success && tasksRes.data) setTasks(tasksRes.data);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedTaskId) return;
    let cancelled = false;
    const loadConfig = async () => {
      setError(null);
      try {
        const [configRes, summaryRes] = await Promise.all([
          fetcher.getPeerReviewConfig(selectedTaskId),
          fetcher.getPeerReviewTaskSummary(selectedTaskId),
        ]);
        if (cancelled) return;
        if (configRes.success) {
          const cfg = configRes.data;
          if (cfg) {
            setForm({
              enabled: cfg.enabled,
              reviewsPerEssay: cfg.reviewsPerEssay,
              reviewsPerStudent: cfg.reviewsPerStudent,
              anonymous: cfg.anonymous,
              aiWeight: cfg.weights.ai,
              teacherWeight: cfg.weights.teacher,
              peerWeight: cfg.weights.peer,
              dueDate: cfg.dueDate ? cfg.dueDate.slice(0, 16) : '',
              guidingQuestions: cfg.guidingQuestions.map((q) => `${q.id}|${q.text}`).join('\n'),
            });
          }
        }
        if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '加载配置失败');
      }
    };
    loadConfig();
    return () => {
      cancelled = true;
    };
  }, [selectedTaskId]);

  const getClassLabel = (classId: string) => {
    const cls = classes.find((c) => c.id === classId);
    return cls ? `${cls.grade} · ${cls.name}` : classId;
  };

  const handleSaveConfig = async () => {
    if (!selectedTaskId) return;
    const total = form.aiWeight + form.teacherWeight + form.peerWeight;
    if (Math.abs(total - 1) > 0.001) {
      setError('权重之和必须等于 1');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const questions = form.guidingQuestions
        .split('\n')
        .map((line) => {
          const [id, ...textParts] = line.split('|');
          return { id: id.trim(), text: textParts.join('|').trim() };
        })
        .filter((q) => q.id && q.text);
      const res = await fetcher.createPeerReviewConfig({
        taskId: selectedTaskId,
        enabled: form.enabled,
        reviewsPerEssay: form.reviewsPerEssay,
        reviewsPerStudent: form.reviewsPerStudent,
        anonymous: form.anonymous,
        weights: { ai: form.aiWeight, teacher: form.teacherWeight, peer: form.peerWeight },
        dueDate: form.dueDate || undefined,
        guidingQuestions: questions.length > 0 ? questions : DefaultPeerReviewQuestions,
      });
      if (!res.success) {
        setError(res.error ?? '保存失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedTaskId) return;
    setIsAssigning(true);
    setError(null);
    try {
      const res = await fetcher.assignPeerReviews(selectedTaskId);
      if (res.success && res.data) {
        const summaryRes = await fetcher.getPeerReviewTaskSummary(selectedTaskId);
        if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data);
      } else {
        setError(res.error ?? '分配失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '分配失败');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <RoleGuard allowedRoles={[UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-title-24 font-serif font-medium text-neutral-10">同伴互评管理</h1>
            <p className="text-copy-14 text-neutral-8 mt-1">为作文任务配置互评规则并监控完成情况</p>
          </div>

          {error && <p className="text-error text-copy-14">{error}</p>}

          <Card>
            <CardHeader>
              <CardTitle className="text-title-18 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-accent" />
                选择任务
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-neutral-8">加载中...</p>
              ) : (
                <select
                  value={selectedTaskId}
                  onChange={(e) => {
                    setSelectedTaskId(e.target.value);
                    setSummary(null);
                  }}
                  className="w-full h-10 rounded-md ring-1 ring-border bg-paper px-3 text-copy-14 text-neutral-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <option value="">选择要管理的作文任务</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title} · {getClassLabel(task.classId)}
                    </option>
                  ))}
                </select>
              )}
            </CardContent>
          </Card>

          {selectedTaskId && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-title-18">互评配置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enabled">启用同伴互评</Label>
                    <Checkbox
                      id="enabled"
                      checked={form.enabled}
                      onCheckedChange={(v: boolean) => setForm((prev) => ({ ...prev, enabled: v }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label>每篇作文被评次数</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={form.reviewsPerEssay}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, reviewsPerEssay: Number(e.target.value) }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>每名学生需评次数</Label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={form.reviewsPerStudent}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            reviewsPerStudent: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>互评截止时间</Label>
                      <Input
                        type="datetime-local"
                        value={form.dueDate}
                        onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="anonymous">匿名互评</Label>
                    <Checkbox
                      id="anonymous"
                      checked={form.anonymous}
                      onCheckedChange={(v: boolean) =>
                        setForm((prev) => ({ ...prev, anonymous: v }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>评分权重（三者之和须为 1）</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-label-12 text-neutral-7">AI 批改</Label>
                        <Input
                          type="number"
                          step={0.1}
                          min={0}
                          max={1}
                          value={form.aiWeight}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, aiWeight: Number(e.target.value) }))
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-label-12 text-neutral-7">教师评分</Label>
                        <Input
                          type="number"
                          step={0.1}
                          min={0}
                          max={1}
                          value={form.teacherWeight}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, teacherWeight: Number(e.target.value) }))
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-label-12 text-neutral-7">同伴互评</Label>
                        <Input
                          type="number"
                          step={0.1}
                          min={0}
                          max={1}
                          value={form.peerWeight}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, peerWeight: Number(e.target.value) }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>引导性问题（每行一个，格式：id|问题）</Label>
                    <Textarea
                      value={form.guidingQuestions}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, guidingQuestions: e.target.value }))
                      }
                      rows={5}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Button onClick={handleSaveConfig} disabled={isSaving}>
                      {isSaving ? '保存中...' : '保存配置'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleAssign}
                      disabled={isAssigning || !form.enabled}
                    >
                      <RotateCcw className={`w-4 h-4 mr-2 ${isAssigning ? 'animate-spin' : ''}`} />
                      {isAssigning ? '分配中...' : '重新分配互评'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-title-18 flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent" />
                      完成情况
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Stat label="总任务数" value={summary.total} />
                      <Stat label="已完成" value={summary.completed} />
                      <Stat label="待完成" value={summary.pending} />
                      <Stat label="完成率" value={`${summary.completionRate}%`} />
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

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-neutral-2 rounded-md p-3 text-center">
      <p className="text-label-12 text-neutral-7">{label}</p>
      <p className="text-title-24 font-medium text-neutral-10">{value}</p>
    </div>
  );
}
