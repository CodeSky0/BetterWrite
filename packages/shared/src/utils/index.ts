import type { EducationStageValue } from '../constants/essay.js';
import { getScoreTierByStage } from '../constants/scoring.js';
import type { ScoreDistribution } from '../types/essay.js';
import type { PeerReviewWeights } from '../types/features.js';

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

export function formatScore(score: number | null): string {
  if (score === null) return '-';
  return score.toFixed(1);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function calculateScoreDistribution(scores: number[]): ScoreDistribution[] {
  if (scores.length === 0) return [];
  const ranges = [
    { range: '0-9', min: 0, max: 9.99 },
    { range: '10-11', min: 10, max: 11.99 },
    { range: '12-13', min: 12, max: 13.99 },
    { range: '14-15', min: 14, max: 15 },
  ];
  return ranges.map((r) => ({
    range: r.range,
    count: scores.filter((s) => s >= r.min && s <= r.max).length,
  }));
}

export function calculateErrorStats(
  errors: Array<{ type: string }>,
): Array<{ type: string; count: number; percentage: number }> {
  if (errors.length === 0) return [];
  const counts = new Map<string, number>();
  for (const e of errors) {
    counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
  }
  const total = errors.length;
  return Array.from(counts.entries())
    .map(([type, count]) => ({ type, count, percentage: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
}

export function calculateAbilityRadar(
  essays: Array<{
    topicAdherenceScore: number | null;
    contentScore: number | null;
    languageScore: number | null;
    structureScore: number | null;
    presentationScore: number | null;
  }>,
): Array<{ label: string; value: number; max: number }> {
  const dims = [
    { label: 'TopicAdherence', key: 'topicAdherenceScore' as const, max: 2 },
    { label: 'Content', key: 'contentScore' as const, max: 5 },
    { label: 'Language', key: 'languageScore' as const, max: 4 },
    { label: 'Structure', key: 'structureScore' as const, max: 2.5 },
    { label: 'Presentation', key: 'presentationScore' as const, max: 1.5 },
  ];
  if (essays.length === 0) {
    return dims.map((d) => ({ label: d.label, value: 0, max: d.max }));
  }
  return dims.map((d) => {
    const scores = essays.map((e) => e[d.key]).filter((s): s is number => s !== null);
    if (scores.length === 0) return { label: d.label, value: 0, max: d.max };
    const sum = scores.reduce((acc, s) => acc + s, 0);
    return { label: d.label, value: sum / scores.length, max: d.max };
  });
}

export function calculateProgressCurve(
  essays: Array<{ totalScore: number | null; submittedAt: string }>,
): Array<{ label: string; value: number }> {
  const valid = essays
    .filter((e): e is { totalScore: number; submittedAt: string } => e.totalScore !== null)
    .slice()
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  const recent = valid.slice(-20);
  return recent.map((e) => {
    const d = new Date(e.submittedAt);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return { label: `${month}-${day}`, value: e.totalScore };
  });
}

export function calculateClassRank(
  myAverage: number,
  peerScores: number[],
): { classRank: number; total: number; percentile: number } {
  const total = peerScores.length;
  if (total === 0) {
    return { classRank: 0, total: 0, percentile: 0 };
  }
  const higherCount = peerScores.filter((s) => s > myAverage).length;
  const classRank = higherCount + 1;
  const percentile = ((total - classRank + 1) / total) * 100;
  return { classRank, total, percentile };
}

export function checkAchievements(stats: {
  totalEssays: number;
  averageScore: number | null;
  perfectScores: number;
  consecutiveProgress: number;
  errorFreeEssays: number;
  challengeStreak?: number;
  totalChallenges?: number;
}): string[] {
  const codes: string[] = [];
  if (stats.totalEssays >= 10) codes.push('essay_10');
  if (stats.totalEssays >= 50) codes.push('essay_50');
  if (stats.totalEssays >= 100) codes.push('essay_100');
  if (stats.perfectScores >= 1) codes.push('perfect_score');
  if (stats.consecutiveProgress >= 3) codes.push('progress_streak');
  if (stats.averageScore !== null && stats.averageScore >= 13) {
    codes.push('first_tier_regular');
  }
  if (stats.errorFreeEssays >= 5) codes.push('grammar_master');
  if ((stats.challengeStreak ?? 0) >= 7) codes.push('challenge_streak_7');
  if ((stats.challengeStreak ?? 0) >= 30) codes.push('challenge_streak_30');
  if ((stats.totalChallenges ?? 0) >= 50) codes.push('challenge_master');
  return codes;
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/**
 * 将百分制分数归一化到当前学段满分制。
 * 教师评分与同伴互评均使用 0-100 分输入，最终需与 AI 批改同量纲后加权。
 */
export function normalizeToMaxScore(score: number, maxScore: number): number {
  return (score / 100) * maxScore;
}

export interface WeightedScoreInput {
  aiScore?: number | null;
  teacherScore?: number | null;
  peerAverage?: number | null;
  weights: PeerReviewWeights;
  maxScore: number;
  stage: EducationStageValue;
}

/**
 * 根据 AI、教师、同伴评分权重计算最终总分与档次。
 * 教师/同伴评分按百分制归一化；缺失的评分来源会自动剔除并重新归一化权重。
 */
export function calculateWeightedScore(
  input: WeightedScoreInput,
): { totalScore: number; scoreTier: string; label: string } | null {
  const entries: { score: number; weight: number }[] = [];
  if (input.aiScore !== null && input.aiScore !== undefined) {
    entries.push({ score: input.aiScore, weight: input.weights.ai });
  }
  if (input.teacherScore !== null && input.teacherScore !== undefined) {
    entries.push({
      score: normalizeToMaxScore(input.teacherScore, input.maxScore),
      weight: input.weights.teacher,
    });
  }
  if (input.peerAverage !== null && input.peerAverage !== undefined) {
    entries.push({
      score: normalizeToMaxScore(input.peerAverage, input.maxScore),
      weight: input.weights.peer,
    });
  }

  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
  if (entries.length === 0 || totalWeight <= 0) {
    return null;
  }

  const weightedSum = entries.reduce((sum, e) => sum + e.score * e.weight, 0);
  const totalScore = Math.round((weightedSum / totalWeight) * 10) / 10;
  const tier = getScoreTierByStage(totalScore, input.stage);
  return { totalScore, scoreTier: tier.tier, label: tier.label };
}

const DEFAULT_PEER_REVIEW_WEIGHTS: PeerReviewWeights = { ai: 0.6, teacher: 0.3, peer: 0.1 };

/**
 * 安全解析同伴互评权重 JSON，字段缺失或非法时使用默认值。
 */
export function parsePeerReviewWeights(weights: string | null | undefined): PeerReviewWeights {
  if (!weights) return DEFAULT_PEER_REVIEW_WEIGHTS;
  try {
    const parsed = JSON.parse(weights) as Partial<PeerReviewWeights>;
    return {
      ai: typeof parsed.ai === 'number' ? parsed.ai : DEFAULT_PEER_REVIEW_WEIGHTS.ai,
      teacher:
        typeof parsed.teacher === 'number' ? parsed.teacher : DEFAULT_PEER_REVIEW_WEIGHTS.teacher,
      peer: typeof parsed.peer === 'number' ? parsed.peer : DEFAULT_PEER_REVIEW_WEIGHTS.peer,
    };
  } catch {
    return DEFAULT_PEER_REVIEW_WEIGHTS;
  }
}

export * from './hash.js';
