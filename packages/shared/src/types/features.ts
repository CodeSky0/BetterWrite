/**
 * 新功能类型定义 —— 涵盖作文版本管理、微技能闯关、课堂监控、
 * 学习周报、查重检测、协作题库、学习路径推荐、考试预测
 */

import type { EducationStageValue, PracticeDifficultyValue } from '../constants/essay.js';
import type {
  DailyChallengeTypeValue,
  NotificationTypeValue,
  PeerReviewDimensionValue,
  PeerReviewStatusValue,
  WritingMaterialDifficultyValue,
  WritingMaterialTypeValue,
} from '../constants/features.js';
import type { MicroExerciseTypeValue } from '../constants/features.js';

// ========== 功能1: 作文版本管理 ==========

export interface EssayVersion {
  id: string;
  essayId: string;
  studentId: string;
  versionNumber: number;
  content: string;
  wordCount: number;
  score: number | null;
  scoreTier: string | null;
  correctionId: string | null;
  diffSummary: DiffSummary;
  createdAt: string;
}

export interface DiffSummary {
  added: string[];
  removed: string[];
  changedWords: number;
  scoreDelta: number | null;
}

export interface EssayVersionDetail extends EssayVersion {
  // 与上一版本的完整 diff（用于前端渲染）
  diffLines?: DiffLine[];
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber?: number;
}

// ========== 功能2: 微技能闯关 ==========

export interface MicroSkill {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'language' | 'structure' | 'content' | 'presentation';
  difficulty: number;
  icon: string | null;
  currentLevel: number;
  totalExercises: number;
  completedExercises: number;
  isMastered: boolean;
}

export interface MicroExercise {
  id: string;
  skillId: string;
  skillName: string;
  level: number;
  type: MicroExerciseTypeValue;
  title: string;
  instruction: string;
  content: MicroExerciseContent;
  maxScore: number;
}

export interface MicroExerciseContent {
  // choice 类型
  question?: string;
  options?: Array<{ label: string; value: string }>;
  // fill_blank 类型
  sentence?: string;
  blankIndex?: number;
  // rewrite 类型
  originalSentence?: string;
  hint?: string;
  // free_write 类型
  prompt?: string;
  wordLimit?: number;
}

export interface MicroExerciseResult {
  exerciseId: string;
  score: number;
  isCorrect: boolean;
  aiFeedback: string;
  correctAnswer?: string;
  explanation?: string;
}

export interface MicroSkillProgress {
  skillId: string;
  skillName: string;
  category: string;
  currentLevel: number;
  totalScore: number;
  completedExercises: number;
  totalExercises: number;
  masteredAt: string | null;
  isMastered: boolean;
}

// ========== 功能3: 课堂实时监控 ==========

export interface WritingSessionStatusData {
  sessionId: string;
  studentId: string;
  studentName: string;
  taskId: string | null;
  currentWordCount: number;
  elapsedTimeMs: number;
  writingSpeed: number; // 词/分钟
  isStalled: boolean;
  lastActiveAt: string;
  status: 'active' | 'paused' | 'submitted';
}

export interface ClassroomMonitorData {
  classId: string;
  className: string;
  taskId: string | null;
  taskTitle: string | null;
  sessions: WritingSessionStatusData[];
  summary: {
    totalStudents: number;
    activeWriters: number;
    submittedCount: number;
    stalledCount: number;
    averageWordCount: number;
    averageSpeed: number;
  };
}

// ========== 功能4: 学习周报 ==========

export interface WeeklyReport {
  id: string;
  studentId: string;
  weekStart: string;
  weekEnd: string;
  essaysSubmitted: number;
  averageScore: number | null;
  previousAverageScore: number | null;
  errorsResolved: string[];
  newErrors: string[];
  abilityChanges: Record<string, number>;
  aiSuggestion: string | null;
  recommendedExercises: string[];
  status: 'pending' | 'generated' | 'failed';
  createdAt: string;
}

export interface WeeklyReportSummary {
  studentName: string;
  studentId: string;
  weekStart: string;
  weekEnd: string;
  essaysSubmitted: number;
  averageScore: number | null;
  scoreChange: number | null;
  topImprovements: string[];
  topConcerns: string[];
}

// ========== 功能5: 查重检测 ==========

export interface SimilarityCheckResult {
  id: string;
  essayId: string;
  studentId: string;
  overallSimilarity: number | null;
  matchedDetails: MatchedDetail[];
  aiGeneratedScore: number | null;
  aiDetectionDetails: AiDetectionDetail[];
  riskLevel: 'low' | 'medium' | 'high' | null;
  teacherNote: string | null;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface MatchedDetail {
  essayId: string;
  studentName: string;
  similarity: number;
  matchedParagraphs: string[];
}

export interface AiDetectionDetail {
  paragraphIndex: number;
  score: number;
  indicators: string[];
}

// ========== 功能6: 协作题库 ==========

export interface ResourceRating {
  id: string;
  resourceId: string;
  resourceType: 'question' | 'resource';
  raterId: string;
  raterName?: string;
  score: number;
  comment: string | null;
  createdAt: string;
}

export interface ResourceComment {
  id: string;
  resourceId: string;
  resourceType: 'question' | 'resource';
  authorId: string;
  authorName?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicQuestionWithStats {
  id: string;
  topicType: string;
  topicCategory: string | null;
  title: string;
  requirements: string;
  keyPoints: string[];
  wordLimitMin: number;
  wordLimitMax: number;
  difficulty: PracticeDifficultyValue;
  stage: EducationStageValue;
  creatorName: string;
  avgRating: number | null;
  ratingCount: number;
  commentCount: number;
  useCount: number;
  createdAt: string;
}

// ========== 功能7: 学习路径推荐 ==========

export interface LearningPath {
  id: string;
  studentId: string;
  weekStart: string;
  weekEnd: string;
  weakPoints: string[];
  recommendations: LearningPathRecommendation[];
  aiAdvice: string | null;
  completedCount: number;
  totalRecommendations: number;
  status: 'active' | 'completed' | 'expired';
  createdAt: string;
}

export interface LearningPathRecommendation {
  type: 'micro_skill' | 'question_bank' | 'error_practice' | 'reading';
  id: string;
  title: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  isCompleted: boolean;
}

// ========== 功能8: 考试预测 ==========

export interface ExamHistoryItem {
  id: string;
  year: number;
  topicType: string;
  topicCategory: string;
  title: string;
  requirements: string;
  keyPoints: string[];
  wordLimitMin: number;
  wordLimitMax: number;
  tags: string[];
  modelEssay: string | null;
  trendNotes: string | null;
}

export interface ExamForecast {
  generatedAt: string;
  // 趋势分析
  topicTrends: TopicTrend[];
  // 预测话题
  predictedTopics: PredictedTopic[];
  // 备考建议
  preparationAdvice: string;
  // 班级对标
  classBenchmark?: ClassBenchmark;
}

export interface TopicTrend {
  category: string;
  frequency: number; // 近10年出现次数
  recentYears: number[]; // 出现的年份
  trend: 'rising' | 'stable' | 'declining';
}

export interface PredictedTopic {
  category: string;
  confidence: number; // 0-1
  reasoning: string;
  suggestedTitles: string[];
}

export interface ClassBenchmark {
  classId: string;
  className: string;
  currentLevel: number; // 当前班级平均得分
  targetLevel: number; // 中考目标得分
  gap: number;
  weakDimensions: Array<{ dimension: string; score: number; target: number }>;
  focusStudents: Array<{ studentId: string; name: string; currentScore: number; risk: string }>;
}

// ========== 功能9: 智能推送提醒 ==========

export interface NotificationLog {
  id: string;
  userId: string;
  type: NotificationTypeValue;
  title: string;
  body: string;
  referenceId: string | null;
  channel: 'push' | 'in_app' | 'sms';
  isRead: boolean;
  status: 'pending' | 'sent' | 'failed';
  sentAt: string | null;
  createdAt: string;
}

export interface NotificationSummary {
  total: number;
  unread: number;
}

// ========== 功能10: 每日写作挑战 ==========

export interface DailyChallenge {
  id: string;
  challengeDate: string;
  stage: EducationStageValue;
  type: DailyChallengeTypeValue;
  title: string;
  instruction: string;
  content: string;
  referenceAnswer: string | null;
  suggestedWords: number;
  difficulty: number;
  topicType: string | null;
  topicCategory: string | null;
  isActive: boolean;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  studentId: string;
  content: string;
  wordCount: number;
  score: number | null;
  scoreTier: string | null;
  aiFeedback: Record<string, unknown>;
  durationMs: number | null;
  streakDays: number;
  submittedAt: string;
}

export interface DailyChallengeWithSubmission extends DailyChallenge {
  isSubmitted: boolean;
  submission: ChallengeSubmission | null;
}

export interface ChallengeStreak {
  currentStreak: number;
  longestStreak: number;
  lastSubmittedDate: string | null;
}

// ========== 功能11: 写作素材库 ==========

export interface WritingMaterial {
  id: string;
  type: WritingMaterialTypeValue;
  title: string;
  content: string;
  topicType: string | null;
  stage: EducationStageValue;
  difficulty: WritingMaterialDifficultyValue;
  tags: string[];
  source: string | null;
  usageCount: number;
  isPublic: boolean;
  createdBy: string;
  schoolId: string | null;
  createdAt: string;
  updatedAt: string;
  isFavorited?: boolean;
}

export interface StudentMaterialFavorite {
  id: string;
  studentId: string;
  materialId: string;
  createdAt: string;
}

// ========== 功能12: 同伴互评 ==========

export interface PeerReviewWeights {
  ai: number;
  teacher: number;
  peer: number;
}

export interface PeerReviewAnswer {
  questionId: string;
  answer: string;
}

export interface PeerReview {
  id: string;
  essayId: string;
  reviewerId: string;
  reviewerName: string | null;
  anonymous: boolean;
  contentScore: number | null;
  languageScore: number | null;
  structureScore: number | null;
  handwritingScore: number | null;
  totalScore: number | null;
  comment: string | null;
  answers: PeerReviewAnswer[];
  status: PeerReviewStatusValue;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PeerReviewWithEssay extends PeerReview {
  essay: {
    id: string;
    title: string | null;
    content: string;
    wordCount: number;
    studentId: string;
    studentName: string | null;
    taskId: string | null;
    taskTitle: string | null;
  };
}

export interface EssayPeerReviewConfig {
  id: string;
  taskId: string;
  createdBy: string;
  enabled: boolean;
  reviewsPerEssay: number;
  reviewsPerStudent: number;
  anonymous: boolean;
  weights: PeerReviewWeights;
  dueDate: string | null;
  guidingQuestions: Array<{ id: string; text: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface PeerReviewSummary {
  essayId: string;
  reviewCount: number;
  averageScore: number | null;
  dimensionAverages: Record<PeerReviewDimensionValue, number | null>;
}
