import type { EducationStageValue, SeniorEssayTypeValue } from './essay.js';
import { SeniorEssayType } from './essay.js';

// ──────────────────────────────────────────────────────────────────────────────
// 初中（中考）评分配置 — 深圳中考 15 分制
// ──────────────────────────────────────────────────────────────────────────────

export const SCORING_WEIGHTS = {
  topicAdherence: 0.133, // 审题扣题 2.0 / 15
  content: 0.333, // 内容要点 5.0 / 15
  language: 0.267, // 语言运用 4.0 / 15
  structure: 0.167, // 结构连贯 2.5 / 15
  presentation: 0.1, // 卷面规范 1.5 / 15
} as const;

export const SCORE_TIERS = [
  { tier: '1st', label: '第一档（优）', min: 13, max: 15 },
  { tier: '2nd', label: '第二档（良）', min: 10, max: 12.5 },
  { tier: '3rd', label: '第三档（中）', min: 7, max: 9.5 },
  { tier: '4th', label: '第四档（及格）', min: 4, max: 6.5 },
  { tier: '5th', label: '第五档（差）', min: 0, max: 3.5 },
] as const;

export const DEDUCTION_RULES = {
  grammarError: 0.5,
  missingKeyPoint: 1.0,
  formatError: 1.0,
  wordCountBelow: { threshold: 80, action: 'downgrade_tier' as const },
  wordCountIdeal: { min: 100, max: 125, bonus: 0.5 },
} as const;

// ──────────────────────────────────────────────────────────────────────────────
// 高中（高考）评分配置 — 全国卷 25 分制
// ──────────────────────────────────────────────────────────────────────────────

export const SENIOR_SCORE_TIERS = [
  { tier: '5th', label: '第五档（很好）', min: 21, max: 25 },
  { tier: '4th', label: '第四档（好）', min: 16, max: 20 },
  { tier: '3rd', label: '第三档（适当）', min: 11, max: 15 },
  { tier: '2nd', label: '第二档（较差）', min: 6, max: 10 },
  { tier: '1st', label: '第一档（差）', min: 1, max: 5 },
] as const;

// 高考应用文写作评分配置（25分制）
export const SENIOR_APPLIED_SCORING = {
  totalScore: 25,
  tiers: SENIOR_SCORE_TIERS,
  wordLimit: { min: 80, ideal: 100, max: 120 },
  // 高考应用文评分维度（综合档次评定，无细分维度满分）
  dimensions: {
    contentPoints: '内容要点覆盖完整性',
    vocabGrammar: '词汇与语法准确性',
    coherence: '上下文连贯性与逻辑性',
  },
} as const;

// 高考读后续写评分配置（25分制）
export const SENIOR_CONTINUATION_SCORING = {
  totalScore: 25,
  tiers: SENIOR_SCORE_TIERS,
  wordLimit: { min: 120, ideal: 150, max: 180 },
  // 读后续写评分维度
  dimensions: {
    plotLogic: '情节逻辑与合理性',
    languageFusion: '与原文语言风格融合度',
    creativity: '创造性语言运用',
    coherence: '上下文连贯性',
  },
} as const;

// ──────────────────────────────────────────────────────────────────────────────
// 档次判定函数
// ──────────────────────────────────────────────────────────────────────────────

/**
 * 获取初中（中考）档次
 */
export function getScoreTier(totalScore: number): (typeof SCORE_TIERS)[number] {
  // 按档次降序匹配，命中第一个 min 即归属该档；避免档位边界之间的浮点空隙
  // （如 12.7、9.7）落入第五档的归档错误。
  return SCORE_TIERS.find((t) => totalScore >= t.min) ?? SCORE_TIERS[4];
}

/**
 * 获取高中（高考）档次
 */
export function getSeniorScoreTier(totalScore: number): (typeof SENIOR_SCORE_TIERS)[number] {
  return SENIOR_SCORE_TIERS.find((t) => totalScore >= t.min) ?? SENIOR_SCORE_TIERS[4];
}

/**
 * 按学段获取档次（统一入口）
 * @param totalScore 总分
 * @param stage 学段：junior=初中，senior=高中
 */
export function getScoreTierByStage(
  totalScore: number,
  stage: EducationStageValue,
): { tier: string; label: string } {
  if (stage === 'senior') {
    const t = getSeniorScoreTier(totalScore);
    return { tier: t.tier, label: t.label };
  }
  const t = getScoreTier(totalScore);
  return { tier: t.tier, label: t.label };
}

/**
 * 根据学段获取满分值
 */
export function getMaxScoreByStage(
  stage: EducationStageValue,
  seniorEssayType?: SeniorEssayTypeValue,
): number {
  if (stage === 'senior') {
    // 高中应用文和读后续写均为25分
    return seniorEssayType === SeniorEssayType.CONTINUATION_WRITING
      ? SENIOR_CONTINUATION_SCORING.totalScore
      : SENIOR_APPLIED_SCORING.totalScore;
  }
  return 15; // 初中15分制
}

/**
 * 根据学段获取字数要求
 */
export function getWordLimitByStage(
  stage: EducationStageValue,
  seniorEssayType?: SeniorEssayTypeValue,
): { min: number; ideal: number; max: number } {
  if (stage === 'senior') {
    return seniorEssayType === SeniorEssayType.CONTINUATION_WRITING
      ? SENIOR_CONTINUATION_SCORING.wordLimit
      : SENIOR_APPLIED_SCORING.wordLimit;
  }
  return { min: 80, ideal: 110, max: 125 };
}
