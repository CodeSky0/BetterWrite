import type { LearningPathRecommendationTypeValue } from '@betterwrite/shared';
import type { EducationStage } from '../challenge-scorer.js';

/**
 * 学生历史作文摘要
 */
export interface RecentEssaySummary {
  id: string;
  topicType: string | null;
  topicCategory: string | null;
  totalScore: number | null;
  scoreTier: string | null;
  submittedAt: string;
}

/**
 * 错题统计
 */
export interface ErrorTypeStat {
  errorType: string;
  count: number;
  unresolvedCount: number;
}

/**
 * 微技能进度
 */
export interface MicroSkillProgressSummary {
  skillId: string;
  skillCode: string;
  skillName: string;
  category: string;
  currentLevel: number;
  totalScore: number;
  completedExercises: number;
}

/**
 * 可选微技能
 */
export interface AvailableMicroSkill {
  id: string;
  code: string;
  name: string;
  category: string;
  difficulty: number;
}

/**
 * 可选题库题目
 */
export interface AvailableQuestion {
  id: string;
  topicType: string;
  topicCategory: string | null;
  title: string;
  difficulty: string;
}

/**
 * 考试趋势
 */
export interface ExamTrend {
  topicCategory: string;
  frequency: number;
  recentYears: number[];
  trend: 'rising' | 'stable' | 'declining';
}

/**
 * 推荐引擎输入上下文
 */
export interface RecommendationContext {
  studentId: string;
  stage: EducationStage;
  recentEssays: RecentEssaySummary[];
  errorStats: ErrorTypeStat[];
  microSkillProgress: MicroSkillProgressSummary[];
  availableMicroSkills: AvailableMicroSkill[];
  availableQuestions: AvailableQuestion[];
  examTrends: ExamTrend[];
}

/**
 * 单条推荐项
 */
export interface TopicRecommendation {
  type: LearningPathRecommendationTypeValue;
  id: string;
  title: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  action?: 'open' | 'start' | 'review';
  metadata?: Record<string, unknown>;
}

/**
 * 推荐结果
 */
export interface RecommendationResult {
  weakPoints: string[];
  recommendations: TopicRecommendation[];
  aiAdvice: string;
}
