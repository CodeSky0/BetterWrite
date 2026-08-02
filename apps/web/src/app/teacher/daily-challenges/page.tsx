'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RoleGuard } from '@/components/layout/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { fetcher } from '@/lib/api/fetcher';
import {
  type DailyChallenge,
  DailyChallengeType,
  DailyChallengeTypeLabels,
  EducationStage,
  UserRole,
} from '@betterwrite/shared';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const PAGE_SIZE = 20;

type FormData = {
  challengeDate: string;
  stage: 'junior' | 'senior';
  type: string;
  title: string;
  instruction: string;
  content: string;
  referenceAnswer: string;
  suggestedWords: string;
  difficulty: string;
  topicType: string;
  topicCategory: string;
  isActive: boolean;
};

const emptyForm: FormData = {
  challengeDate: new Date().toISOString().slice(0, 10),
  stage: EducationStage.JUNIOR,
  type: DailyChallengeType.FREE_WRITE,
  title: '',
  instruction: '',
  content: '',
  referenceAnswer: '',
  suggestedWords: '50',
  difficulty: '1',
  topicType: '',
  topicCategory: '',
  isActive: true,
};

export default function TeacherDailyChallengesPage() {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [stage, setStage] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DailyChallenge | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadChallenges = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher
      .getTeacherDailyChallenges({
        stage: stage || undefined,
        type: type || undefined,
        keyword: keyword || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setChallenges(res.data.list);
          setTotal(res.data.total);
        } else {
          setError(res.error ?? '获取挑战列表失败');
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '获取挑战列表失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stage, type, keyword, page]);

  useEffect(() => {
    return loadChallenges();
  }, [loadChallenges]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (challenge: DailyChallenge) => {
    setEditing(challenge);
    setForm({
      challengeDate: challenge.challengeDate,
      stage: challenge.stage,
      type: challenge.type,
      title: challenge.title,
      instruction: challenge.instruction,
      content: challenge.content,
      referenceAnswer: challenge.referenceAnswer ?? '',
      suggestedWords: String(challenge.suggestedWords ?? 50),
      difficulty: String(challenge.difficulty ?? 1),
      topicType: challenge.topicType ?? '',
      topicCategory: challenge.topicCategory ?? '',
      isActive: challenge.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim() || !form.challengeDate) return;
    setSaving(true);
    setError(null);
    const payload = {
      ...form,
      suggestedWords: Number(form.suggestedWords) || 50,
      difficulty: Number(form.difficulty) || 1,
      referenceAnswer: form.referenceAnswer.trim() || undefined,
      topicType: form.topicType.trim() || undefined,
      topicCategory: form.topicCategory.trim() || undefined,
    };
    try {
      const res = editing
        ? await fetcher.updateDailyChallenge(editing.id, payload)
        : await fetcher.createDailyChallenge(payload);
      if (res.success) {
        setDialogOpen(false);
        loadChallenges();
      } else {
        setError(res.error ?? '保存失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetcher.deleteDailyChallenge(id);
      if (res.success) {
        loadChallenges();
      } else {
        setError(res.error ?? '删除失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <RoleGuard allowedRoles={[UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-title-24 font-serif font-medium text-neutral-10">每日挑战管理</h1>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              新建挑战
            </Button>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="admin-challenge-stage" className="text-label-12 text-neutral-7">
                    学段
                  </label>
                  <select
                    id="admin-challenge-stage"
                    value={stage}
                    onChange={(e) => {
                      setStage(e.target.value);
                      setPage(1);
                    }}
                    className="h-10 rounded-md ring-1 ring-border bg-paper px-3 text-copy-14 text-neutral-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <option value="">全部</option>
                    <option value="junior">初中</option>
                    <option value="senior">高中</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="admin-challenge-type" className="text-label-12 text-neutral-7">
                    类型
                  </label>
                  <select
                    id="admin-challenge-type"
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      setPage(1);
                    }}
                    className="h-10 rounded-md ring-1 ring-border bg-paper px-3 text-copy-14 text-neutral-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <option value="">全部</option>
                    {Object.entries(DailyChallengeTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                  <label htmlFor="admin-challenge-keyword" className="text-label-12 text-neutral-7">
                    关键词
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-7" />
                    <Input
                      id="admin-challenge-keyword"
                      value={keyword}
                      onChange={(e) => {
                        setKeyword(e.target.value);
                        setPage(1);
                      }}
                      placeholder="搜索标题、内容"
                      className="pl-9"
                    />
                  </div>
                </div>
                {(stage || type || keyword) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStage('');
                      setType('');
                      setKeyword('');
                      setPage(1);
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    重置
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {loading && <p className="text-neutral-8">加载中...</p>}
          {error && <p className="text-error">{error}</p>}

          {!loading && challenges.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-neutral-8">暂无挑战题目，点击右上角新建</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4">
            {challenges.map((challenge) => (
              <Card key={challenge.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="secondary">
                          {DailyChallengeTypeLabels[challenge.type] ?? challenge.type}
                        </Badge>
                        {challenge.stage === 'senior' ? (
                          <Badge variant="outline">高中</Badge>
                        ) : (
                          <Badge variant="outline">初中</Badge>
                        )}
                        <Badge variant="outline">难度 {challenge.difficulty}</Badge>
                        <Badge variant="outline">{challenge.suggestedWords} 词</Badge>
                        {!challenge.isActive ? <Badge variant="destructive">已停用</Badge> : null}
                      </div>
                      <CardTitle className="text-title-18 font-medium">{challenge.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(challenge)}>
                        <Pencil className="w-4 h-4 text-neutral-7" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(challenge.id)}
                        disabled={deletingId === challenge.id}
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <p className="text-copy-14 text-neutral-8">{challenge.instruction}</p>
                  <p className="text-copy-16 text-neutral-10 leading-relaxed font-serif">
                    {challenge.content}
                  </p>
                  {challenge.referenceAnswer ? (
                    <div className="bg-neutral-2 rounded p-3">
                      <p className="text-label-12 text-neutral-7 mb-1">参考答案</p>
                      <p className="text-copy-14 text-neutral-10">{challenge.referenceAnswer}</p>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between text-label-12 text-neutral-7">
                    <span>日期 {challenge.challengeDate}</span>
                    <span>话题 {challenge.topicType ?? '—'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 pt-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                上一页
              </Button>
              <span className="text-copy-14 text-neutral-8">
                第 {page} / {totalPages} 页，共 {total} 条
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                下一页
              </Button>
            </div>
          )}

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? '编辑挑战' : '新建挑战'}</DialogTitle>
                <DialogDescription>配置每日写作挑战题目，学生将在对应日期看到。</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="form-date">挑战日期</Label>
                  <Input
                    id="form-date"
                    type="date"
                    value={form.challengeDate}
                    onChange={(e) => setForm((f) => ({ ...f, challengeDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-stage">学段</Label>
                  <Select
                    value={form.stage}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, stage: v as 'junior' | 'senior' }))
                    }
                  >
                    <SelectTrigger id="form-stage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="junior">初中</SelectItem>
                      <SelectItem value="senior">高中</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-type">类型</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                  >
                    <SelectTrigger id="form-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DailyChallengeTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-title">标题</Label>
                  <Input
                    id="form-title"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="如：今日自由写作"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="form-instruction">说明</Label>
                  <Textarea
                    id="form-instruction"
                    value={form.instruction}
                    onChange={(e) => setForm((f) => ({ ...f, instruction: e.target.value }))}
                    rows={2}
                    placeholder="请根据下面的提示，写一段约 50 词的英文。"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="form-content">题目内容</Label>
                  <Textarea
                    id="form-content"
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    rows={4}
                    placeholder="Describe your favorite school activity and explain why you like it."
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="form-reference">参考答案（可选）</Label>
                  <Textarea
                    id="form-reference"
                    value={form.referenceAnswer}
                    onChange={(e) => setForm((f) => ({ ...f, referenceAnswer: e.target.value }))}
                    rows={3}
                    placeholder="输入参考答案或范文"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-words">建议词数</Label>
                  <Input
                    id="form-words"
                    type="number"
                    min={1}
                    max={500}
                    value={form.suggestedWords}
                    onChange={(e) => setForm((f) => ({ ...f, suggestedWords: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-difficulty">难度 1-5</Label>
                  <Input
                    id="form-difficulty"
                    type="number"
                    min={1}
                    max={5}
                    value={form.difficulty}
                    onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-topic">话题类型（可选）</Label>
                  <Input
                    id="form-topic"
                    value={form.topicType}
                    onChange={(e) => setForm((f) => ({ ...f, topicType: e.target.value }))}
                    placeholder="如：school_life"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-category">话题分类（可选）</Label>
                  <Input
                    id="form-category"
                    value={form.topicCategory}
                    onChange={(e) => setForm((f) => ({ ...f, topicCategory: e.target.value }))}
                    placeholder="如：校园生活"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2 flex items-center gap-3">
                  <Checkbox
                    id="form-active"
                    checked={form.isActive}
                    onCheckedChange={(checked) =>
                      setForm((f) => ({ ...f, isActive: checked === true }))
                    }
                  />
                  <Label htmlFor="form-active" className="cursor-pointer">
                    启用（学生可见）
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={
                    saving ||
                    !form.title.trim() ||
                    !form.content.trim() ||
                    !form.instruction.trim() ||
                    !form.challengeDate
                  }
                >
                  {saving ? '保存中...' : '保存'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
