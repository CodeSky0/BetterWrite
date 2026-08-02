'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetcher } from '@/lib/api/fetcher';
import { clientLogger } from '@/lib/client-logger';
import {
  type EducationStageValue,
  TopicTypeLabels,
  type TopicTypeValue,
  type WritingMaterial,
  WritingMaterialDifficultyLabels,
  type WritingMaterialDifficultyValue,
  WritingMaterialTypeLabels,
  type WritingMaterialTypeValue,
} from '@betterwrite/shared';
import { Bookmark, Copy, Heart, Loader2, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface MaterialPanelProps {
  stage?: EducationStageValue;
  topicType?: TopicTypeValue;
  onInsert?: (content: string) => void;
}

const PAGE_SIZE = 20;

export function MaterialPanel({ stage, topicType, onInsert }: MaterialPanelProps) {
  const [materials, setMaterials] = useState<WritingMaterial[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState<WritingMaterialTypeValue | ''>('');
  const [difficulty, setDifficulty] = useState<WritingMaterialDifficultyValue | ''>('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher.getWritingMaterials({
        type: type || undefined,
        topicType,
        stage,
        difficulty: difficulty || undefined,
        keyword: keyword || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      if (res.success && res.data) {
        setMaterials(res.data.list);
        setTotal(res.data.total);
      } else {
        setError(res.error ?? '获取素材失败');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取素材失败';
      clientLogger.error('[MaterialPanel] load error:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [type, topicType, stage, difficulty, keyword, page]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

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
      clientLogger.error('[MaterialPanel] favorite error:', err);
    }
  };

  const handleInsert = (material: WritingMaterial) => {
    if (onInsert) {
      onInsert(material.content);
    } else {
      void navigator.clipboard.writeText(material.content);
      setCopiedId(material.id);
      window.setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const hasMore = page * PAGE_SIZE < total;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-title-18 flex items-center gap-2">
          <Search className="w-4 h-4 text-accent" />
          写作素材库
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-6" />
            <Input
              placeholder="搜索素材..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v as WritingMaterialTypeValue);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="类型" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(WritingMaterialTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={difficulty}
              onValueChange={(v) => {
                setDifficulty(v as WritingMaterialDifficultyValue);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="难度" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(WritingMaterialDifficultyLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-2 min-h-0">
          {loading && materials.length === 0 && (
            <div className="flex items-center justify-center py-8 text-neutral-6">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              加载中...
            </div>
          )}

          {!loading && error && <div className="text-error text-copy-14 py-4">{error}</div>}

          {!loading && !error && materials.length === 0 && (
            <div className="text-neutral-6 text-copy-14 py-8 text-center">暂无素材</div>
          )}

          {materials.map((material) => (
            <div
              key={material.id}
              className="group p-3 rounded-lg border border-neutral-3 bg-neutral-1 hover:border-accent/50 hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="secondary" className="text-label-10">
                    {WritingMaterialTypeLabels[material.type]}
                  </Badge>
                  {material.difficulty && (
                    <Badge variant="outline" className="text-label-10">
                      {WritingMaterialDifficultyLabels[material.difficulty]}
                    </Badge>
                  )}
                  {material.topicType && (
                    <Badge variant="outline" className="text-label-10">
                      {TopicTypeLabels[material.topicType as keyof typeof TopicTypeLabels]}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => toggleFavorite(material)}
                  title={material.isFavorited ? '取消收藏' : '收藏'}
                >
                  <Heart
                    className={`w-4 h-4 ${material.isFavorited ? 'fill-error text-error' : 'text-neutral-6'}`}
                  />
                </Button>
              </div>
              <p className="text-copy-14 text-neutral-10 mb-1.5 line-clamp-3">{material.content}</p>
              {material.title && (
                <p className="text-label-12 text-neutral-6 mb-1.5">{material.title}</p>
              )}
              <div className="flex items-center justify-between">
                {material.tags && material.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {material.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-label-10 text-neutral-6">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-accent hover:text-accent ml-auto"
                  onClick={() => handleInsert(material)}
                >
                  {onInsert ? (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      插入
                    </>
                  ) : copiedId === material.id ? (
                    '已复制'
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5 mr-1" />
                      复制
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between pt-2 border-t border-neutral-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              上一页
            </Button>
            <span className="text-label-12 text-neutral-6">
              {page} / {Math.ceil(total / PAGE_SIZE)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              下一页
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
