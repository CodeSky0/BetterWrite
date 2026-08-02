'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RoleGuard } from '@/components/layout/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { fetcher } from '@/lib/api/fetcher';
import {
  type ModelEssayImitation,
  type ModelEssayImitationFeedback,
  ModelEssayImitationStatusLabels,
  TeachingResourceDifficultyLabels,
  type TeachingResourceWithCreator,
  TopicTypeLabels,
  UserRole,
} from '@betterwrite/shared';
import { ArrowLeft, Clock, PenLine, RefreshCw, Send, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function StudentModelEssayDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [resource, setResource] = useState<TeachingResourceWithCreator | null>(null);
  const [imitations, setImitations] = useState<ModelEssayImitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey 用于手动触发重新加载
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher
      .getStudentModelEssay(id)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setResource(res.data.resource);
          setImitations(res.data.myImitations);
        } else {
          setError(res.error ?? '获取范文失败');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '获取范文失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, refreshKey]);

  const hasCorrecting = imitations.some((i) => i.status === 'correcting');

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetcher.submitModelEssayImitation(id, {
        title: title.trim() || undefined,
        content: content.trim(),
      });
      if (res.success && res.data) {
        const submitted = res.data;
        setImitations((prev) => [submitted, ...prev]);
        setTitle('');
        setContent('');
      } else {
        setError(res.error ?? '提交失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={[UserRole.STUDENT]}>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-2">
            <Link href="/student/model-essays">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                返回列表
              </Button>
            </Link>
          </div>

          {loading ? (
            <p className="text-neutral-8">加载中...</p>
          ) : error && !resource ? (
            <p className="text-error">{error}</p>
          ) : resource ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {resource.topicType ? (
                      <Badge variant="outline">
                        {TopicTypeLabels[resource.topicType as keyof typeof TopicTypeLabels] ??
                          resource.topicType}
                      </Badge>
                    ) : null}
                    <Badge variant="outline">
                      {TeachingResourceDifficultyLabels[resource.difficulty] ?? resource.difficulty}
                    </Badge>
                    {resource.analysis ? <Badge variant="secondary">已解析</Badge> : null}
                  </div>
                  <h1 className="text-title-24 font-serif font-medium text-neutral-10">
                    {resource.title}
                  </h1>
                </div>
                {hasCorrecting && (
                  <Button variant="secondary" size="sm" onClick={() => setRefreshKey((k) => k + 1)}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    刷新状态
                  </Button>
                )}
              </div>

              <Tabs defaultValue="essay" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="essay">范文原文</TabsTrigger>
                  <TabsTrigger value="analysis" disabled={!resource.analysis}>
                    精读解析
                  </TabsTrigger>
                  <TabsTrigger value="imitate">仿写提交</TabsTrigger>
                </TabsList>

                <TabsContent value="essay" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-title-20">范文原文</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-copy-16 text-neutral-10 leading-relaxed whitespace-pre-wrap font-serif">
                        {resource.content}
                      </p>
                      {resource.highlights ? (
                        <div className="mt-4 p-3 bg-neutral-2 rounded-md">
                          <p className="text-label-12 text-neutral-7 mb-1">亮点</p>
                          <p className="text-copy-14 text-neutral-9">{resource.highlights}</p>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4">
                  {resource.analysis ? <AnalysisView analysis={resource.analysis} /> : null}
                </TabsContent>

                <TabsContent value="imitate" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-title-20 flex items-center gap-2">
                        <PenLine className="w-5 h-5" />
                        提交仿写
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="imitation-title" className="text-label-12 text-neutral-7">
                          标题（选填）
                        </label>
                        <Input
                          id="imitation-title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="给你的仿写作文起个标题"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="imitation-content" className="text-label-12 text-neutral-7">
                          仿写内容
                        </label>
                        <Textarea
                          id="imitation-content"
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="参考上方范文的结构和表达，写下你的仿写作文..."
                          rows={12}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-copy-14 text-neutral-8">
                          词数：<span className="font-medium">{countWords(content)}</span>
                        </p>
                        <Button onClick={handleSubmit} disabled={!content.trim() || submitting}>
                          {submitting ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          提交仿写
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {imitations.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-title-18 font-medium text-neutral-10">我的仿写记录</h2>
                      {imitations.map((imitation) => (
                        <ImitationCard key={imitation.id} imitation={imitation} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          ) : null}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}

function AnalysisView({
  analysis,
}: { analysis: NonNullable<TeachingResourceWithCreator['analysis']> }) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-title-20 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            解析总览
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysis.summary ? (
            <div>
              <p className="text-label-12 text-neutral-7 mb-1">概述</p>
              <p className="text-copy-16 text-neutral-10 leading-relaxed">{analysis.summary}</p>
            </div>
          ) : null}
          {analysis.structure ? (
            <div>
              <p className="text-label-12 text-neutral-7 mb-1">结构</p>
              <p className="text-copy-14 text-neutral-9 leading-relaxed">{analysis.structure}</p>
            </div>
          ) : null}
          {analysis.imitationTips && analysis.imitationTips.length > 0 ? (
            <div>
              <p className="text-label-12 text-neutral-7 mb-1">仿写建议</p>
              <ul className="list-disc list-inside text-copy-14 text-neutral-9 space-y-1">
                {analysis.imitationTips.map((tip, idx) => (
                  <li key={`tip-${idx}-${tip.slice(0, 20)}`}>{tip}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {analysis.paragraphs && analysis.paragraphs.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-title-20">段落解析</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.paragraphs.map((p) => (
              <div key={`para-${p.index}`} className="p-3 bg-neutral-2 rounded-md">
                <p className="text-copy-14 text-neutral-10 leading-relaxed font-serif">{p.text}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">{p.function}</Badge>
                  {p.keySentence ? (
                    <span className="text-label-12 text-neutral-7">关键句：{p.keySentence}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {analysis.highlights && analysis.highlights.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-title-20">亮点句</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.highlights.map((h, idx) => (
              <div
                key={`highlight-${idx}-${h.sentence.slice(0, 20)}`}
                className="p-3 bg-neutral-2 rounded-md"
              >
                <p className="text-copy-14 text-neutral-10 leading-relaxed font-serif">
                  {h.sentence}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">{h.technique}</Badge>
                </div>
                <p className="text-copy-14 text-neutral-8 mt-2">{h.comment}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {analysis.vocabulary && analysis.vocabulary.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-title-20">重点词汇</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analysis.vocabulary.map((v, idx) => (
                <div key={`vocab-${idx}-${v.word}`} className="p-3 bg-neutral-2 rounded-md">
                  <p className="text-copy-14 font-medium text-neutral-10">{v.word}</p>
                  <p className="text-label-12 text-neutral-7">{v.meaning}</p>
                  <p className="text-copy-14 text-neutral-8 mt-1">{v.usage}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {analysis.connectives && analysis.connectives.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-title-20">连接词</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analysis.connectives.map((c, idx) => (
                <div key={`conn-${idx}-${c.word}`} className="p-3 bg-neutral-2 rounded-md">
                  <p className="text-copy-14 font-medium text-neutral-10">{c.word}</p>
                  <p className="text-label-12 text-neutral-7">{c.function}</p>
                  <p className="text-copy-14 text-neutral-8 mt-1 italic">{c.example}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

function ImitationCard({ imitation }: { imitation: ModelEssayImitation }) {
  const feedback = imitation.feedback as ModelEssayImitationFeedback | null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-title-18 font-medium">
              {imitation.title ?? '未命名仿写'}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1 text-label-12 text-neutral-7">
              <Clock className="w-3.5 h-3.5" />
              {new Date(imitation.createdAt).toLocaleString()}
              <Badge variant={imitation.status === 'completed' ? 'secondary' : 'outline'}>
                {ModelEssayImitationStatusLabels[imitation.status] ?? imitation.status}
              </Badge>
            </div>
          </div>
          {imitation.score !== null ? (
            <div className="text-right">
              <p className="text-title-24 font-medium text-accent">{imitation.score}</p>
              <p className="text-label-12 text-neutral-7">分</p>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <p className="text-copy-16 text-neutral-10 leading-relaxed whitespace-pre-wrap font-serif">
          {imitation.content}
        </p>
        <p className="text-copy-14 text-neutral-7">词数：{imitation.wordCount}</p>

        {imitation.status === 'completed' && feedback ? (
          <div className="p-4 bg-neutral-2 rounded-md space-y-3">
            <p className="text-copy-16 font-medium text-neutral-10">{feedback.overallComment}</p>
            {feedback.strengths.length > 0 ? (
              <div>
                <p className="text-label-12 text-neutral-7 mb-1">优点</p>
                <ul className="list-disc list-inside text-copy-14 text-neutral-9 space-y-1">
                  {feedback.strengths.map((s, idx) => (
                    <li key={`strength-${idx}-${s.slice(0, 20)}`}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {feedback.weaknesses.length > 0 ? (
              <div>
                <p className="text-label-12 text-neutral-7 mb-1">不足</p>
                <ul className="list-disc list-inside text-copy-14 text-neutral-9 space-y-1">
                  {feedback.weaknesses.map((s, idx) => (
                    <li key={`weak-${idx}-${s.slice(0, 20)}`}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {feedback.suggestions.length > 0 ? (
              <div>
                <p className="text-label-12 text-neutral-7 mb-1">改进建议</p>
                <ul className="list-disc list-inside text-copy-14 text-neutral-9 space-y-1">
                  {feedback.suggestions.map((s, idx) => (
                    <li key={`suggest-${idx}-${s.slice(0, 20)}`}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {feedback.highlightedSentences.length > 0 ? (
              <div>
                <p className="text-label-12 text-neutral-7 mb-1">亮点/提升句子</p>
                <div className="space-y-2">
                  {feedback.highlightedSentences.map((h, idx) => (
                    <div
                      key={`hl-${idx}-${h.original.slice(0, 20)}`}
                      className="p-2 bg-paper rounded border border-border"
                    >
                      <p className="text-copy-14 text-neutral-9 line-through">{h.original}</p>
                      <p className="text-copy-14 text-accent">{h.upgraded}</p>
                      <p className="text-label-12 text-neutral-7 mt-1">{h.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {feedback.dimensionScores ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {Object.entries(feedback.dimensionScores).map(([key, score]) => (
                  <div key={key} className="p-2 bg-paper rounded border border-border text-center">
                    <p className="text-title-18 font-medium text-neutral-10">{score}</p>
                    <p className="text-label-12 text-neutral-7">{getDimensionLabel(key)}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {imitation.status === 'failed' ? (
          <p className="text-error text-copy-14">批改失败，请稍后重试</p>
        ) : null}
        {imitation.status === 'correcting' ? (
          <div className="flex items-center gap-2 text-neutral-8 text-copy-14">
            <RefreshCw className="w-4 h-4 animate-spin" />
            AI 批改中，请稍后刷新查看结果
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function getDimensionLabel(key: string) {
  const labels: Record<string, string> = {
    content: '内容',
    language: '语言',
    structure: '结构',
    imitation: '仿写',
  };
  return labels[key] ?? key;
}

function countWords(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}
