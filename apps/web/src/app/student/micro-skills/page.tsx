'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RoleGuard } from '@/components/layout/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetcher } from '@/lib/api/fetcher';
import {
  type MicroExercise,
  type MicroExerciseResult,
  type MicroSkill,
  MicroSkillCategoryLabels,
  UserRole,
} from '@betterwrite/shared';
import { BookOpen, CheckCircle2, ChevronRight, Lock, PenTool, Star, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';

type ViewMode = 'list' | 'exercise';

export default function StudentMicroSkillsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [skills, setSkills] = useState<Array<MicroSkill & { totalExercises: number }>>([]);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Array<MicroExercise & { isCompleted: boolean }>>([]);
  const [currentExercise, setCurrentExercise] = useState<number>(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<MicroExerciseResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetcher
      .getMicroSkills()
      .then((res) => {
        if (res.success && res.data) setSkills(res.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSelectSkill = (skillId: string) => {
    setSelectedSkill(skillId);
    setViewMode('exercise');
    setCurrentExercise(0);
    setResult(null);
    setAnswer('');
    fetcher.getMicroSkillExercises(skillId).then((res) => {
      if (res.success && res.data) setExercises(res.data);
    });
  };

  const handleSubmit = async () => {
    if (!selectedSkill || !exercises[currentExercise] || !answer.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetcher.submitMicroExercise(selectedSkill, exercises[currentExercise].id, {
        answer: answer.trim(),
      });
      if (res.success && res.data) {
        setResult(res.data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setAnswer('');
      setResult(null);
    }
  };

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case 'language':
        return <PenTool className="w-4 h-4" />;
      case 'structure':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const totalMastered = skills.filter((s) => s.isMastered).length;

  return (
    <RoleGuard allowedRoles={[UserRole.STUDENT]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-title-24 font-serif font-medium text-neutral-10">微技能闯关</h1>
              <p className="text-copy-14 text-neutral-7 mt-1">每次 2-3 分钟，逐步提升写作微技能</p>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-warning" />
              <span className="text-title-20 font-medium text-neutral-10">
                {totalMastered}/{skills.length}
              </span>
            </div>
          </div>

          {viewMode === 'list' && (
            <>
              {isLoading && <p className="text-neutral-8">加载中...</p>}

              {/* Category Groups */}
              {Object.entries(MicroSkillCategoryLabels).map(([cat, label]) => {
                const catSkills = skills.filter((s) => s.category === cat);
                if (catSkills.length === 0) return null;
                return (
                  <div key={cat} className="space-y-3">
                    <h2 className="text-title-20 font-medium text-neutral-10 flex items-center gap-2">
                      {categoryIcon(cat)}
                      {label}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {catSkills.map((skill) => {
                        const progress =
                          skill.totalExercises > 0
                            ? Math.round((skill.completedExercises / skill.totalExercises) * 100)
                            : 0;
                        return (
                          <Card
                            key={skill.id}
                            className="cursor-pointer hover:ring-2 hover:ring-accent transition-all"
                            onClick={() => handleSelectSkill(skill.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-neutral-10">{skill.name}</h3>
                                  {skill.isMastered && (
                                    <CheckCircle2 className="w-4 h-4 text-success" />
                                  )}
                                </div>
                                <ChevronRight className="w-4 h-4 text-neutral-7" />
                              </div>
                              <p className="text-label-12 text-neutral-7 mb-3 line-clamp-1">
                                {skill.description}
                              </p>
                              {/* Progress bar */}
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 rounded-full bg-neutral-3 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-accent transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-label-12 text-neutral-7">{progress}%</span>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-label-12">
                                  Lv.{skill.currentLevel}
                                </Badge>
                                <span className="text-label-12 text-neutral-7">
                                  {skill.completedExercises}/{skill.totalExercises} 题
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {viewMode === 'exercise' && selectedSkill && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className="mb-2"
              >
                &larr; 返回技能列表
              </Button>

              {exercises.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Lock className="w-12 h-12 text-neutral-6 mx-auto mb-3" />
                    <p className="text-neutral-8">该等级的练习尚未解锁</p>
                  </CardContent>
                </Card>
              )}

              {exercises.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-title-20">
                        {exercises[currentExercise]?.title}
                      </CardTitle>
                      <Badge variant="outline">
                        {currentExercise + 1}/{exercises.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Exercise instruction */}
                    <div className="rounded-md bg-neutral-2 p-4">
                      <p className="text-copy-14 text-neutral-9 leading-relaxed">
                        {exercises[currentExercise]?.instruction}
                      </p>
                    </div>

                    {/* Exercise content */}
                    {exercises[currentExercise] && (
                      <div className="space-y-3">
                        {exercises[currentExercise].type === 'choice' ? (
                          <ChoiceExercise
                            exercise={exercises[currentExercise]}
                            answer={answer}
                            setAnswer={setAnswer}
                            disabled={!!result}
                          />
                        ) : (
                          <textarea
                            className="w-full min-h-[120px] rounded-md ring-1 ring-border bg-paper p-3 text-copy-14 text-neutral-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            placeholder="在此输入你的答案..."
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            disabled={!!result}
                          />
                        )}
                      </div>
                    )}

                    {/* Result */}
                    {result && (
                      <div
                        className={`rounded-md p-4 ${result.isCorrect ? 'bg-success/5 border border-success/20' : 'bg-error/5 border border-error/20'}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {result.isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          ) : (
                            <span className="text-error font-medium">需要改进</span>
                          )}
                          <span className="font-medium">
                            得分: {result.score}/{exercises[currentExercise]?.maxScore}
                          </span>
                        </div>
                        <p className="text-copy-14 text-neutral-8">{result.aiFeedback}</p>
                        {result.correctAnswer && !result.isCorrect && (
                          <p className="text-copy-14 text-neutral-7 mt-2">
                            参考答案: {result.correctAnswer}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      {!result ? (
                        <Button onClick={handleSubmit} disabled={!answer.trim() || isSubmitting}>
                          {isSubmitting ? '提交中...' : '提交答案'}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleNext}
                          disabled={currentExercise >= exercises.length - 1}
                        >
                          下一题
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}

function ChoiceExercise({
  exercise,
  answer,
  setAnswer,
  disabled,
}: {
  exercise: MicroExercise;
  answer: string;
  setAnswer: (v: string) => void;
  disabled: boolean;
}) {
  const content = exercise.content;
  const options = content.options ?? [];

  return (
    <div className="space-y-2">
      {content.question && (
        <p className="text-copy-14 font-medium text-neutral-10 mb-3">{content.question}</p>
      )}
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex items-center gap-3 rounded-md p-3 cursor-pointer transition-all ${
            answer === opt.value
              ? 'ring-2 ring-accent bg-accent/5'
              : 'ring-1 ring-border hover:bg-neutral-2'
          } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
        >
          <input
            type="radio"
            name="choice"
            value={opt.value}
            checked={answer === opt.value}
            onChange={() => setAnswer(opt.value)}
            className="accent-accent"
            disabled={disabled}
          />
          <span className="text-copy-14 text-neutral-10">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
