'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

interface ErrorHighlight {
  type: string;
  original: string;
  corrected: string;
  explanation: string;
  position: { start: number; end: number };
  category: string;
  priority?: 'high' | 'medium' | 'low';
}

interface Suggestion {
  priority: 'high' | 'medium' | 'low';
  category: string;
  suggestion: string;
}

interface InteractiveFeedbackProps {
  errors: ErrorHighlight[];
  suggestions: Suggestion[];
  originalEssay: string;
  revisedEssay: string;
  highlights: Array<{ sentence: string; type: string; comment: string }>;
}

export function InteractiveFeedback({
  errors,
  suggestions,
  originalEssay,
  revisedEssay,
  highlights,
}: InteractiveFeedbackProps) {
  const [_selectedError, _setSelectedError] = useState<ErrorHighlight | null>(null);
  const [_showComparison, _setShowComparison] = useState(false);
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());

  const toggleError = (index: number) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedErrors(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-error text-white border-error';
      case 'medium':
        return 'bg-warning text-white border-warning';
      case 'low':
        return 'bg-neutral-5 text-neutral-10 border-neutral-5';
      default:
        return 'bg-neutral-5 border-neutral-5';
    }
  };

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-error/5 border-error/20';
      case 'medium':
        return 'bg-warning/5 border-warning/20';
      case 'low':
        return 'bg-neutral-1 border-neutral-3';
      default:
        return 'bg-neutral-1 border-neutral-3';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <Lightbulb className="w-4 h-4" />;
      case 'low':
        return <BookOpen className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const escapeHtml = (str: string): string =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const _renderHighlightedText = (text: string, highlightsList: typeof highlights) => {
    // Bug #SEC-1.1: 必须先对原始作文文本做完整 HTML 转义，防止学生作文中的
    // <script>/<img onerror> 等标签通过 dangerouslySetInnerHTML 执行 XSS。
    const escapedText = escapeHtml(text);

    if (highlightsList.length === 0) return escapedText;

    let result = escapedText;
    for (const highlight of highlightsList) {
      // 对 sentence 也做转义后再在已转义的文本中查找（保证 split 匹配）
      const escapedSentence = escapeHtml(highlight.sentence);
      const escapedComment = escapeHtml(highlight.comment);
      const parts = result.split(escapedSentence);
      if (parts.length > 1) {
        result = parts.join(
          `<mark class="bg-accent/20 px-1 rounded cursor-pointer hover:bg-accent/30" title="${escapedComment}">${escapedSentence}</mark>`,
        );
      }
    }

    // 所有动态内容（原文、sentence、comment）均已 HTML 转义，仅注入静态 mark 标签。
    // biome-ignore lint/security/noDangerouslySetInnerHtml: all dynamic content is HTML-escaped above
    return <div dangerouslySetInnerHTML={{ __html: result }} className="leading-relaxed" />;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="errors" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-neutral-1 p-1 rounded-lg">
          <TabsTrigger
            value="errors"
            className="data-[state=active]:bg-accent data-[state=active]:text-white"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Errors ({errors.length})
          </TabsTrigger>
          <TabsTrigger
            value="suggestions"
            className="data-[state=active]:bg-accent data-[state=active]:text-white"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Suggestions ({suggestions.length})
          </TabsTrigger>
          <TabsTrigger
            value="highlights"
            className="data-[state=active]:bg-accent data-[state=active]:text-white"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Highlights ({highlights.length})
          </TabsTrigger>
          <TabsTrigger
            value="comparison"
            className="data-[state=active]:bg-accent data-[state=active]:text-white"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Comparison
          </TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          {errors.length === 0 ? (
            <Card className="hover:ring-neutral-4 transition-all duration-fast ease-yohaku animate-scale-in">
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
                <p className="text-neutral-10 font-medium">No errors found!</p>
                <p className="text-neutral-8 text-copy-14 mt-1">
                  Great job on your grammar and spelling.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="hover:ring-neutral-4 transition-all duration-fast ease-yohaku animate-slide-in-top">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  Grammar & Spelling Errors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {errors.map((error, index) => (
                  <div
                    key={`${error.category}-${error.original}-${index}`}
                    className={`border rounded-lg overflow-hidden transition-all duration-fast ease-yohaku ${getPriorityBg(error.priority || 'medium')} animate-slide-in-top ${
                      index === 0
                        ? ''
                        : index === 1
                          ? 'animate-delay-100'
                          : index === 2
                            ? 'animate-delay-200'
                            : 'animate-delay-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleError(index)}
                      className="w-full flex items-center justify-between p-4 hover:bg-neutral-2/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Badge className={getPriorityColor(error.priority || 'medium')}>
                          {error.category}
                        </Badge>
                        <span className="text-neutral-10">
                          <span className="text-error line-through mr-2">{error.original}</span>
                          <span className="text-success">→ {error.corrected}</span>
                        </span>
                      </div>
                      {expandedErrors.has(index) ? (
                        <ChevronDown className="w-4 h-4 text-neutral-7" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-neutral-7" />
                      )}
                    </button>
                    {expandedErrors.has(index) && (
                      <div className="p-4 pt-0 border-t border-neutral-3 bg-neutral-1 animate-in slide-in-from-top-2 duration-300">
                        <p className="text-copy-14 text-neutral-8">{error.explanation}</p>
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" variant="outline" className="hover:bg-accent/10">
                            Learn More
                          </Button>
                          <Button size="sm" variant="ghost" className="hover:bg-accent/10">
                            Add to Practice
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          {suggestions.length === 0 ? (
            <Card className="hover:ring-neutral-4 transition-all duration-fast ease-yohaku animate-scale-in">
              <CardContent className="py-12 text-center">
                <Lightbulb className="w-12 h-12 text-accent mx-auto mb-3" />
                <p className="text-neutral-10 font-medium">No suggestions</p>
                <p className="text-neutral-8 text-copy-14 mt-1">Your essay looks great!</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="hover:ring-neutral-4 transition-all duration-fast ease-yohaku animate-slide-in-top">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-accent" />
                  Improvement Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.category}-${suggestion.priority}-${index}`}
                    className={`flex items-start gap-3 p-4 border rounded-lg hover:bg-neutral-2/50 transition-colors ${getPriorityBg(suggestion.priority)} animate-slide-in-top ${
                      index === 0
                        ? ''
                        : index === 1
                          ? 'animate-delay-100'
                          : index === 2
                            ? 'animate-delay-200'
                            : 'animate-delay-300'
                    }`}
                  >
                    <div className="mt-0.5">{getPriorityIcon(suggestion.priority)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getPriorityColor(suggestion.priority)}>
                          {suggestion.priority}
                        </Badge>
                        <span className="text-copy-14 text-neutral-7">{suggestion.category}</span>
                      </div>
                      <p className="text-neutral-10">{suggestion.suggestion}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="highlights" className="space-y-4">
          {highlights.length === 0 ? (
            <Card className="hover:ring-neutral-4 transition-all duration-fast ease-yohaku animate-scale-in">
              <CardContent className="py-12 text-center">
                <BookOpen className="w-12 h-12 text-accent mx-auto mb-3" />
                <p className="text-neutral-10 font-medium">No highlights</p>
                <p className="text-neutral-8 text-copy-14 mt-1">
                  Continue writing to see highlights.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="hover:ring-neutral-4 transition-all duration-fast ease-yohaku animate-slide-in-top">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-accent" />
                  Sentence Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {highlights.map((highlight, index) => (
                    <div
                      key={`${highlight.sentence}-${index}`}
                      className={`p-3 bg-accent/10 border border-accent/20 rounded-lg hover:bg-accent/15 transition-colors animate-slide-in-top ${
                        index === 0
                          ? ''
                          : index === 1
                            ? 'animate-delay-100'
                            : index === 2
                              ? 'animate-delay-200'
                              : 'animate-delay-300'
                      }`}
                    >
                      <p className="text-neutral-10 mb-2">{highlight.sentence}</p>
                      <p className="text-copy-14 text-neutral-8">{highlight.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card className="hover:ring-neutral-4 transition-all duration-fast ease-yohaku animate-slide-in-top">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                Before & After Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium text-neutral-10 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-error" />
                    Original
                  </h3>
                  <div className="p-4 bg-neutral-1 rounded-lg text-copy-14 leading-relaxed whitespace-pre-wrap border border-neutral-3">
                    {originalEssay}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-neutral-10 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    Revised
                  </h3>
                  <div className="p-4 bg-success/10 rounded-lg text-copy-14 leading-relaxed whitespace-pre-wrap border border-success/20">
                    {revisedEssay}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
