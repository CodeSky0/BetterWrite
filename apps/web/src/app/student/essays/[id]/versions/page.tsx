'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RoleGuard } from '@/components/layout/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetcher } from '@/lib/api/fetcher';
import type { EssayVersion } from '@betterwrite/shared';
import { formatScore } from '@betterwrite/shared';
import { ArrowUp, ChevronDown, ChevronUp, FileText, History, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface EssayVersionPageProps {
  params: { id: string };
}

export default function EssayVersionPage({ params }: EssayVersionPageProps) {
  const [versions, setVersions] = useState<EssayVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  useEffect(() => {
    fetcher
      .getEssayVersions(params.id)
      .then((res) => {
        if (res.success && res.data) {
          setVersions(res.data);
        }
      })
      .finally(() => setIsLoading(false));
  }, [params.id]);

  const getDiffSummary = (v: EssayVersion) => {
    try {
      return typeof v.diffSummary === 'string' ? JSON.parse(v.diffSummary) : v.diffSummary;
    } catch {
      return { added: [], removed: [], changedWords: 0, scoreDelta: null };
    }
  };

  return (
    <RoleGuard allowedRoles={['student', 'teacher']}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-accent" />
            <h1 className="text-title-24 font-serif font-medium text-neutral-10">作文升格记录</h1>
          </div>

          {isLoading && <p className="text-neutral-8">加载中...</p>}

          {!isLoading && versions.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-neutral-6 mx-auto mb-3" />
                <p className="text-neutral-8 mb-2">还没有修改版本</p>
                <p className="text-label-12 text-neutral-7">
                  根据批改反馈修改作文后提交新版本，系统会追踪你的进步轨迹
                </p>
              </CardContent>
            </Card>
          )}

          {/* Version Timeline */}
          <div className="space-y-4">
            {versions.map((version, idx) => {
              const diff = getDiffSummary(version);
              const _prevScore = idx > 0 ? getDiffSummary(versions[idx - 1]).scoreDelta : null;
              const isExpanded = expandedVersion === version.id;

              return (
                <Card key={version.id} className="relative">
                  {idx > 0 && (
                    <div className="absolute -top-4 left-6 flex items-center gap-1 text-label-12 text-neutral-7">
                      <ArrowUp className="w-3 h-3 text-success" />
                      <span>
                        较 V{version.versionNumber - 1} 修改了 {diff.changedWords} 处
                      </span>
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          V{version.versionNumber}
                        </Badge>
                        <span className="text-label-12 text-neutral-7">
                          {new Date(version.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {version.score != null && (
                          <div className="text-right">
                            <p className="text-title-20 font-medium text-neutral-10">
                              {formatScore(version.score)}
                            </p>
                            {diff.scoreDelta != null && diff.scoreDelta !== 0 && (
                              <p
                                className={`text-label-12 ${diff.scoreDelta > 0 ? 'text-success' : 'text-error'}`}
                              >
                                {diff.scoreDelta > 0 ? '+' : ''}
                                {diff.scoreDelta.toFixed(1)}
                              </p>
                            )}
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedVersion(isExpanded ? null : version.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0 space-y-4">
                      {/* Diff Summary */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-md bg-success/5 p-3 text-center">
                          <p className="text-title-20 font-medium text-success">
                            {diff.added?.length ?? 0}
                          </p>
                          <p className="text-label-12 text-neutral-7">新增词句</p>
                        </div>
                        <div className="rounded-md bg-error/5 p-3 text-center">
                          <p className="text-title-20 font-medium text-error">
                            {diff.removed?.length ?? 0}
                          </p>
                          <p className="text-label-12 text-neutral-7">删除词句</p>
                        </div>
                        <div className="rounded-md bg-info/5 p-3 text-center">
                          <p className="text-title-20 font-medium text-info">{version.wordCount}</p>
                          <p className="text-label-12 text-neutral-7">当前词数</p>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <div>
                        <h4 className="text-copy-14 font-medium text-neutral-10 mb-2">作文内容</h4>
                        <div className="rounded-md bg-neutral-2 p-4 text-copy-14 text-neutral-9 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                          {version.content}
                        </div>
                      </div>

                      {/* Added words */}
                      {diff.added?.length > 0 && (
                        <div>
                          <h4 className="text-label-12 text-neutral-7 mb-1">新增词汇</h4>
                          <div className="flex flex-wrap gap-1">
                            {diff.added.slice(0, 20).map((word: string) => (
                              <Badge
                                key={word}
                                variant="secondary"
                                className="text-success bg-success/10"
                              >
                                +{word}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Score Trend Chart */}
          {versions.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-title-20 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-accent" />
                  升格轨迹
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {versions.map((v) => (
                    <div key={v.id} className="flex-1 text-center">
                      <div
                        className="mx-auto rounded-full bg-accent/10 flex items-center justify-center mb-2"
                        style={{
                          width: `${40 + (v.score ?? 0) * 3}px`,
                          height: `${40 + (v.score ?? 0) * 3}px`,
                        }}
                      >
                        <span className="text-copy-14 font-medium text-accent">
                          {v.score != null ? formatScore(v.score) : '-'}
                        </span>
                      </div>
                      <p className="text-label-12 text-neutral-7">V{v.versionNumber}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
