import { z } from 'zod';
import type { AIProviderRouter } from '../router.js';
import {
  generateRuleBasedAdvice,
  generateRuleBasedRecommendations,
  identifyWeakPoints,
} from './rules.js';
import type { RecommendationContext, RecommendationResult, TopicRecommendation } from './types.js';

const recommendationSchema = z.object({
  weakPoints: z.array(z.string()).max(3),
  recommendations: z.array(
    z.object({
      type: z.enum(['micro_skill', 'question_bank', 'error_practice', 'reading']),
      id: z.string(),
      title: z.string(),
      reason: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
    }),
  ),
  aiAdvice: z.string(),
});

export type { RecommendationContext, RecommendationResult, TopicRecommendation };

/**
 * 智能选题推荐引擎。
 *
 * 当 AI provider 可用时，使用结构化 AI 输出生成推荐；
 * 否则回退到规则推荐，保证离线/未配置 AI 时仍可工作。
 */
export async function recommendTopics(
  router: AIProviderRouter,
  context: RecommendationContext,
): Promise<RecommendationResult> {
  if (router.availableNames().length === 0) {
    return generateFallbackRecommendations(context);
  }

  try {
    return await generateAIRecommendations(router, context);
  } catch (_err) {
    // AI 失败时优雅降级到规则推荐
    return generateFallbackRecommendations(context);
  }
}

function generateFallbackRecommendations(context: RecommendationContext): RecommendationResult {
  const weakPoints = identifyWeakPoints(context.errorStats);
  const recommendations = generateRuleBasedRecommendations({
    errorStats: context.errorStats,
    microSkillProgress: context.microSkillProgress,
    availableMicroSkills: context.availableMicroSkills,
    recentEssays: context.recentEssays,
    availableQuestions: context.availableQuestions,
    examTrends: context.examTrends,
  });

  return {
    weakPoints,
    recommendations,
    aiAdvice: generateRuleBasedAdvice(weakPoints),
  };
}

async function generateAIRecommendations(
  router: AIProviderRouter,
  context: RecommendationContext,
): Promise<RecommendationResult> {
  const prompt = buildRecommendationPrompt(context);

  const result = await router.executeWithFallback('content', (provider) =>
    provider.completeStructured(prompt, recommendationSchema, { maxOutputTokens: 1536 }),
  );

  const recommendations = result.recommendations.slice(0, 6).map((r) => ({
    ...r,
    isCompleted: false,
  }));

  return {
    weakPoints: result.weakPoints,
    recommendations,
    aiAdvice: result.aiAdvice,
  };
}

function buildRecommendationPrompt(context: RecommendationContext): string {
  const stageLabel = context.stage === 'senior' ? '高中' : '初中';

  return `你是一位专业的中学英语写作教学专家，正在为一名${stageLabel}学生制定本周个性化学习路径。

请根据以下数据，推荐 3-6 项最适合该学生的练习任务。推荐类型只能是以下四种之一：
- micro_skill：微技能练习（针对具体语言/结构技能）
- question_bank：题库作文练习（针对薄弱话题或考试趋势话题）
- error_practice：错题巩固（针对错题本中高频错误类型）
- reading：范文阅读（针对热门话题积累表达）

【学生学段】
${stageLabel}

【近期作文表现】
${formatRecentEssays(context.recentEssays)}

【错题统计】
${formatErrorStats(context.errorStats)}

【微技能进度】
${formatMicroSkills(context.microSkillProgress)}

【可用微技能】
${formatAvailableMicroSkills(context.availableMicroSkills)}

【可选题库题目】
${formatAvailableQuestions(context.availableQuestions)}

【本地考试趋势（近10年）】
${formatExamTrends(context.examTrends)}

请输出 JSON：
{
  "weakPoints": ["薄弱点1", "薄弱点2"],
  "recommendations": [
    {
      "type": "micro_skill|question_bank|error_practice|reading",
      "id": "使用真实存在的 skillId/questionId/errorType/topicCategory",
      "title": "推荐标题",
      "reason": "为什么推荐这个练习（中文，1-2句）",
      "priority": "high|medium|low"
    }
  ],
  "aiAdvice": "给学生的整体学习建议（中文，2-3句）"
}

注意：
1. id 必须与输入数据中的真实 ID 或分类一致，确保前端可以跳转。
2. 优先推荐错题巩固和薄弱微技能；其次结合考试趋势推荐题目。
3. 若近期表现稳定且错题少，可推荐拓展性练习或范文阅读。
4. weakPoints 最多 3 个。`;
}

function formatRecentEssays(essays: RecommendationContext['recentEssays']): string {
  if (essays.length === 0) return '暂无近期作文数据。';
  return essays
    .map(
      (e) =>
        `- ${e.topicCategory ?? '未知话题'} / ${e.topicType ?? '未知类型'}: ${e.totalScore ?? '未评分'}分 (${e.submittedAt.slice(0, 10)})`,
    )
    .join('\n');
}

function formatErrorStats(stats: RecommendationContext['errorStats']): string {
  if (stats.length === 0) return '暂无错题数据。';
  return stats
    .map((s) => `- ${s.errorType}: 共${s.count}次，未解决${s.unresolvedCount}次`)
    .join('\n');
}

function formatMicroSkills(progress: RecommendationContext['microSkillProgress']): string {
  if (progress.length === 0) return '暂无微技能进度数据。';
  return progress
    .map(
      (p) =>
        `- ${p.skillName}（${p.category}）: 当前等级${p.currentLevel}，累计得分${p.totalScore}`,
    )
    .join('\n');
}

function formatAvailableMicroSkills(skills: RecommendationContext['availableMicroSkills']): string {
  if (skills.length === 0) return '暂无可用微技能。';
  return skills
    .map((s) => `- ${s.name}（${s.category}，难度${s.difficulty}）id=${s.id}`)
    .join('\n');
}

function formatAvailableQuestions(questions: RecommendationContext['availableQuestions']): string {
  if (questions.length === 0) return '暂无可用题库题目。';
  return questions
    .map((q) => `- ${q.title}（${q.topicCategory ?? '未知分类'}，难度${q.difficulty}）id=${q.id}`)
    .join('\n');
}

function formatExamTrends(trends: RecommendationContext['examTrends']): string {
  if (trends.length === 0) return '暂无考试趋势数据。';
  return trends
    .map(
      (t) =>
        `- ${t.topicCategory}: 近10年出现${t.frequency}次，趋势${t.trend}，近年${t.recentYears.join(', ')}`,
    )
    .join('\n');
}
