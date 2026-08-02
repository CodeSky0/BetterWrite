import { LearningPathRecommendationType } from '@betterwrite/shared';
import type {
  AvailableMicroSkill,
  AvailableQuestion,
  ErrorTypeStat,
  ExamTrend,
  MicroSkillProgressSummary,
  RecentEssaySummary,
  TopicRecommendation,
} from './types.js';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

/**
 * 根据错题统计识别薄弱点
 */
export function identifyWeakPoints(errorStats: ErrorTypeStat[]): string[] {
  return errorStats
    .filter((e) => e.unresolvedCount > 0)
    .sort((a, b) => b.unresolvedCount - a.unresolvedCount)
    .slice(0, 3)
    .map((e) => e.errorType);
}

/**
 * 基于错题生成错题巩固推荐
 */
export function generateErrorPracticeRecommendations(
  errorStats: ErrorTypeStat[],
): TopicRecommendation[] {
  const unresolved = errorStats
    .filter((e) => e.unresolvedCount > 0)
    .sort((a, b) => b.unresolvedCount - a.unresolvedCount)
    .slice(0, 2);

  return unresolved.map((e) => ({
    type: LearningPathRecommendationType.ERROR_PRACTICE,
    id: e.errorType,
    title: `${e.errorType} 错题巩固`,
    reason: `你在 ${e.errorType} 类型中有 ${e.unresolvedCount} 道未解决错题，建议优先复习。`,
    priority: e.unresolvedCount >= 3 ? 'high' : 'medium',
    action: 'review',
  }));
}

/**
 * 基于微技能进度生成微技能练习推荐
 */
export function generateMicroSkillRecommendations(
  progressList: MicroSkillProgressSummary[],
  availableSkills: AvailableMicroSkill[],
): TopicRecommendation[] {
  // 找到尚未掌握的微技能（进度较低）
  const weakSkills = progressList
    .filter((p) => p.currentLevel < 2)
    .sort((a, b) => a.totalScore - b.totalScore)
    .slice(0, 2);

  const recommendations: TopicRecommendation[] = weakSkills.map((p) => ({
    type: LearningPathRecommendationType.MICRO_SKILL,
    id: p.skillId,
    title: p.skillName,
    reason: `你在「${p.skillName}」微技能上练习较少，建议进行针对性训练。`,
    priority: p.currentLevel === 0 ? 'high' : 'medium',
    action: 'start',
    metadata: { skillCode: p.skillCode, category: p.category },
  }));

  // 如果没有薄弱技能，推荐一个随机的可用技能作为拓展
  if (recommendations.length === 0 && availableSkills.length > 0) {
    const skill = availableSkills[0];
    recommendations.push({
      type: LearningPathRecommendationType.MICRO_SKILL,
      id: skill.id,
      title: skill.name,
      reason: '当前微技能掌握较好，可挑战新的微技能练习。',
      priority: 'low',
      action: 'start',
      metadata: { skillCode: skill.code, category: skill.category },
    });
  }

  return recommendations;
}

/**
 * 基于近期作文和考试趋势生成题库/范文推荐
 */
export function generateQuestionAndReadingRecommendations(
  recentEssays: RecentEssaySummary[],
  availableQuestions: AvailableQuestion[],
  examTrends: ExamTrend[],
): TopicRecommendation[] {
  const recommendations: TopicRecommendation[] = [];

  // 找出近期得分较低的话题类型
  const lowScoreTopics = new Set<string>();
  const topicScores: Record<string, number[]> = {};
  for (const essay of recentEssays) {
    if (!essay.topicCategory || essay.totalScore == null) continue;
    topicScores[essay.topicCategory] = topicScores[essay.topicCategory] ?? [];
    topicScores[essay.topicCategory].push(essay.totalScore);
  }
  for (const [category, scores] of Object.entries(topicScores)) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg < 75) lowScoreTopics.add(category);
  }

  // 推荐考试趋势中上升且与薄弱话题相关的题目
  const risingCategories = examTrends
    .filter((t) => t.trend === 'rising' || t.frequency >= 3)
    .map((t) => t.topicCategory)
    .slice(0, 2);

  const targetCategories = new Set([...lowScoreTopics, ...risingCategories]);

  const matchedQuestions = availableQuestions
    .filter((q) => q.topicCategory && targetCategories.has(q.topicCategory))
    .slice(0, 2);

  for (const question of matchedQuestions) {
    const isWeak = question.topicCategory && lowScoreTopics.has(question.topicCategory);
    recommendations.push({
      type: LearningPathRecommendationType.QUESTION_BANK,
      id: question.id,
      title: question.title,
      reason: isWeak
        ? `你在「${question.topicCategory}」话题得分偏低，建议针对性练习。`
        : `「${question.topicCategory}」是近期考试热门话题，建议提前准备。`,
      priority: isWeak ? 'high' : 'medium',
      action: 'start',
      metadata: { topicCategory: question.topicCategory, difficulty: question.difficulty },
    });
  }

  // 如果没有匹配题目，推荐一个范文阅读
  if (recommendations.length === 0 && risingCategories.length > 0) {
    recommendations.push({
      type: LearningPathRecommendationType.READING,
      id: risingCategories[0],
      title: `${risingCategories[0]} 范文精读`,
      reason: `「${risingCategories[0]}」是近年考试上升趋势话题，阅读范文可积累表达。`,
      priority: 'medium',
      action: 'open',
      metadata: { topicCategory: risingCategories[0] },
    });
  }

  return recommendations;
}

/**
 * 规则推荐：综合错题、微技能、考试趋势生成推荐
 */
export function generateRuleBasedRecommendations(context: {
  errorStats: ErrorTypeStat[];
  microSkillProgress: MicroSkillProgressSummary[];
  availableMicroSkills: AvailableMicroSkill[];
  recentEssays: RecentEssaySummary[];
  availableQuestions: AvailableQuestion[];
  examTrends: ExamTrend[];
}): TopicRecommendation[] {
  const recs: TopicRecommendation[] = [
    ...generateErrorPracticeRecommendations(context.errorStats),
    ...generateMicroSkillRecommendations(context.microSkillProgress, context.availableMicroSkills),
    ...generateQuestionAndReadingRecommendations(
      context.recentEssays,
      context.availableQuestions,
      context.examTrends,
    ),
  ];

  // 去重并按优先级排序
  const seen = new Set<string>();
  return recs
    .filter((r) => {
      const key = `${r.type}:${r.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    .slice(0, 6);
}

/**
 * 生成规则版学习建议
 */
export function generateRuleBasedAdvice(weakPoints: string[]): string {
  if (weakPoints.length === 0) {
    return '近期表现稳定，建议保持练习节奏，适当挑战新话题和更高难度的题目。';
  }
  return `本周重点攻克：${weakPoints.join('、')}。建议结合错题巩固和微技能练习，每天安排 15-20 分钟针对性训练。`;
}
