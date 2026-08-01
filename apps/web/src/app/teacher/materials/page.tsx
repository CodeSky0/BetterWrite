'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RoleGuard } from '@/components/layout/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  EducationStage,
  type EducationStageValue,
  TopicTypeLabels,
  UserRole,
  type WritingMaterial,
  WritingMaterialDifficulty,
  WritingMaterialDifficultyLabels,
  type WritingMaterialDifficultyValue,
  WritingMaterialType,
  WritingMaterialTypeLabels,
  type WritingMaterialTypeValue,
} from '@betterwrite/shared';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const PAGE_SIZE = 20;

type FormData = {
  type: WritingMaterialTypeValue;
  title: string;
  content: string;
  topicType: string;
  stage: EducationStageValue;
  difficulty: WritingMaterialDifficultyValue;
  tags: string;
  source: string;
  isPublic: boolean;
};

const emptyForm: FormData = {
  type: WritingMaterialType.PHRASE,
  title: '',
  content: '',
  topicType: '',
  stage: EducationStage.JUNIOR,
  difficulty: WritingMaterialDifficulty.MEDIUM,
  tags: '',
  source: '',
  isPublic: true,
};

export default function TeacherMaterialsPage() {
  const [materials, setMaterials] = useState<WritingMaterial[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WritingMaterial | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadMaterials = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher
      .getWritingMaterials({
        keyword: keyword || undefined,
        type: type || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setMaterials(res.data.list);
          setTotal(res.data.total);
        } else {
          setError(res.error ?? '获取素材失败');
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '获取素材失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [keyword, type, page]);

  useEffect(() => {
    return loadMaterials();
  }, [loadMaterials]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (m: WritingMaterial) => {
    setEditing(m);
    setForm({
      type: m.type,
      title: m.title,
      content: m.content,
      topicType: m.topicType ?? '',
      stage: m.stage,
      difficulty: m.difficulty,
      tags: m.tags.join(', '),
      source: m.source ?? '',
      isPublic: m.isPublic,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      topicType: form.topicType || undefined,
      tags: form.tags
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean),
      source: form.source || undefined,
    };
    try {
      const res = editing
        ? await fetcher.updateWritingMaterial(editing.id, payload)
        : await fetcher.createWritingMaterial(payload);
      if (res.success) {
        setDialogOpen(false);
        loadMaterials();
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
      const res = await fetcher.deleteWritingMaterial(id);
      if (res.success) {
        loadMaterials();
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
            <h1 className="text-title-24 font-serif font-medium text-neutral-10">写作素材管理</h1>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              新建素材
            </Button>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="admin-material-type" className="text-label-12 text-neutral-7">
                    类型
                  </label>
                  <select
                    id="admin-material-type"
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      setPage(1);
                    }}
                    className="h-10 rounded-md ring-1 ring-border bg-paper px-3 text-copy-14 text-neutral-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <option value="">全部</option>
                    {Object.entries(WritingMaterialTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-[240px]">
                  <label htmlFor="admin-material-keyword" className="text-label-12 text-neutral-7">
                    关键词
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-7" />
                    <Input
                      id="admin-material-keyword"
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
              </div>
            </CardContent>
          </Card>

          {loading && <p className="text-neutral-8">加载中...</p>}
          {error && <p className="text-error">{error}</p>}

          {!loading && materials.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-neutral-8">暂无素材，点击右上角新建</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4">
            {materials.map((m) => (
              <Card key={m.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="secondary">
                          {WritingMaterialTypeLabels[m.type] ?? m.type}
                        </Badge>
                        {m.topicType ? (
                          <Badge variant="outline">
                            {TopicTypeLabels[m.topicType as keyof typeof TopicTypeLabels] ??
                              m.topicType}
                          </Badge>
                        ) : null}
                        <Badge variant="outline">
                          {WritingMaterialDifficultyLabels[m.difficulty] ?? m.difficulty}
                        </Badge>
                        {m.stage === 'senior' ? <Badge variant="outline">高中</Badge> : null}
                        {!m.isPublic ? <Badge variant="outline">私有</Badge> : null}
                      </div>
                      <CardTitle className="text-title-18 font-medium">{m.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                        <Pencil className="w-4 h-4 text-neutral-7" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(m.id)}
                        disabled={deletingId === m.id}
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-copy-16 text-neutral-10 leading-relaxed font-serif">
                    {m.content}
                  </p>
                  {m.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {m.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-label-12 text-neutral-7 bg-neutral-2 px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
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
                <DialogTitle>{editing ? '编辑素材' : '新建素材'}</DialogTitle>
                <DialogDescription>填写素材内容，学生可在素材库中查看和收藏。</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="form-type">类型</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, type: v as WritingMaterial['type'] }))
                    }
                  >
                    <SelectTrigger id="form-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(WritingMaterialTypeLabels).map(([value, label]) => (
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
                    placeholder="如：表达感谢的高级句式"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-topic">话题</Label>
                  <Select
                    value={form.topicType || 'none'}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, topicType: v === 'none' ? '' : v }))
                    }
                  >
                    <SelectTrigger id="form-topic">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">无</SelectItem>
                      {Object.entries(TopicTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-difficulty">难度</Label>
                  <Select
                    value={form.difficulty}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, difficulty: v as WritingMaterial['difficulty'] }))
                    }
                  >
                    <SelectTrigger id="form-difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(WritingMaterialDifficultyLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="form-source">来源（可选）</Label>
                  <Input
                    id="form-source"
                    value={form.source}
                    onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                    placeholder="如：高考真题范文"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="form-content">内容</Label>
                  <Textarea
                    id="form-content"
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    rows={5}
                    placeholder="请输入英语表达、句型或模板"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="form-tags">标签（用逗号分隔）</Label>
                  <Input
                    id="form-tags"
                    value={form.tags}
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                    placeholder="如：感谢信，高分表达"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2 flex items-center gap-2">
                  <input
                    id="form-public"
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
                    className="rounded border-border"
                  />
                  <Label htmlFor="form-public" className="cursor-pointer">
                    公开素材（学生可见）
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !form.title.trim() || !form.content.trim()}
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
