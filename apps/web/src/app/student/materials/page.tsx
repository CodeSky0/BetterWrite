'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RoleGuard } from '@/components/layout/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { fetcher } from '@/lib/api/fetcher';
import {
  TopicTypeLabels,
  UserRole,
  type WritingMaterial,
  WritingMaterialDifficultyLabels,
  WritingMaterialTypeLabels,
} from '@betterwrite/shared';
import { Bookmark, Copy, Heart, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

const PAGE_SIZE = 20;

export default function StudentMaterialsPage() {
  const [materials, setMaterials] = useState<WritingMaterial[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState<string>('');
  const [topicType, setTopicType] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetcher
      .getWritingMaterials({
        type,
        topicType,
        difficulty,
        keyword: keyword || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      .then((res) => {
        if (res.success && res.data) {
          setMaterials(res.data.list);
          setTotal(res.data.total);
        } else {
          setError(res.error ?? '获取素材失败');
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '获取素材失败');
      })
      .finally(() => setLoading(false));
  }, [type, topicType, difficulty, keyword, page]);

  const toggleFavorite = async (material: WritingMaterial) => {
    try {
      const res = material.isFavorited
        ? await fetcher.unfavoriteWritingMaterial(material.id)
        : await fetcher.favoriteWritingMaterial(material.id);
      if (res.success && res.data) {
        const nextFavorited = res.data.isFavorited;
        setMaterials((prev) =>
          prev.map((m) => (m.id === material.id ? { ...m, isFavorited: nextFavorited } : m)),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const copyContent = async (material: WritingMaterial) => {
    try {
      await navigator.clipboard.writeText(material.content);
      setCopiedId(material.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <RoleGuard allowedRoles={[UserRole.STUDENT]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-title-24 font-serif font-medium text-neutral-10">写作素材库</h1>
            <p className="text-copy-14 text-neutral-8">按话题、类型、难度筛选并收藏高分表达</p>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="material-type" className="text-label-12 text-neutral-7">
                    类型
                  </label>
                  <select
                    id="material-type"
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      setPage(1);
                    }}
                    className="h-10 rounded-md ring-1 ring-border bg-paper px-3 text-copy-14 text-neutral-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all duration-fast ease-yohaku"
                  >
                    <option value="">全部</option>
                    {Object.entries(WritingMaterialTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="material-topic" className="text-label-12 text-neutral-7">
                    话题
                  </label>
                  <select
                    id="material-topic"
                    value={topicType}
                    onChange={(e) => {
                      setTopicType(e.target.value);
                      setPage(1);
                    }}
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
                  <label htmlFor="material-difficulty" className="text-label-12 text-neutral-7">
                    难度
                  </label>
                  <select
                    id="material-difficulty"
                    value={difficulty}
                    onChange={(e) => {
                      setDifficulty(e.target.value);
                      setPage(1);
                    }}
                    className="h-10 rounded-md ring-1 ring-border bg-paper px-3 text-copy-14 text-neutral-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all duration-fast ease-yohaku"
                  >
                    <option value="">全部</option>
                    {Object.entries(WritingMaterialDifficultyLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                  <label htmlFor="material-keyword" className="text-label-12 text-neutral-7">
                    关键词
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-7" />
                    <Input
                      id="material-keyword"
                      value={keyword}
                      onChange={(e) => {
                        setKeyword(e.target.value);
                        setPage(1);
                      }}
                      placeholder="搜索标题、内容、标签"
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
                <p className="text-neutral-8">暂无符合条件的素材</p>
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
                      </div>
                      <CardTitle className="text-title-18 font-medium">{m.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorite(m)}
                        aria-label={m.isFavorited ? '取消收藏' : '收藏'}
                      >
                        <Heart
                          className={`w-4 h-4 ${m.isFavorited ? 'fill-error text-error' : 'text-neutral-7'}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyContent(m)}
                        aria-label="复制"
                      >
                        {copiedId === m.id ? (
                          <Bookmark className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4 text-neutral-7" />
                        )}
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
                  {m.source ? (
                    <p className="text-label-12 text-neutral-7 mt-3">来源：{m.source}</p>
                  ) : null}
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
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
