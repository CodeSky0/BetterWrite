/**
 * 新功能相关常量定义
 */

// 微技能分类
export const MicroSkillCategory = {
  LANGUAGE: 'language',
  STRUCTURE: 'structure',
  CONTENT: 'content',
  PRESENTATION: 'presentation',
} as const;

export type MicroSkillCategoryValue = (typeof MicroSkillCategory)[keyof typeof MicroSkillCategory];

export const MicroSkillCategoryLabels: Record<MicroSkillCategoryValue, string> = {
  [MicroSkillCategory.LANGUAGE]: '语言表达',
  [MicroSkillCategory.STRUCTURE]: '篇章结构',
  [MicroSkillCategory.CONTENT]: '内容组织',
  [MicroSkillCategory.PRESENTATION]: '卷面呈现',
};

// 微技能练习类型
export const MicroExerciseType = {
  CHOICE: 'choice',
  FILL_BLANK: 'fill_blank',
  REWRITE: 'rewrite',
  FREE_WRITE: 'free_write',
} as const;

export type MicroExerciseTypeValue = (typeof MicroExerciseType)[keyof typeof MicroExerciseType];

export const MicroExerciseTypeLabels: Record<MicroExerciseTypeValue, string> = {
  [MicroExerciseType.CHOICE]: '选择题',
  [MicroExerciseType.FILL_BLANK]: '填空题',
  [MicroExerciseType.REWRITE]: '改写题',
  [MicroExerciseType.FREE_WRITE]: '自由写作',
};

// 查重风险等级
export const SimilarityRiskLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type SimilarityRiskLevelValue =
  (typeof SimilarityRiskLevel)[keyof typeof SimilarityRiskLevel];

export const SimilarityRiskLevelLabels: Record<SimilarityRiskLevelValue, string> = {
  [SimilarityRiskLevel.LOW]: '低风险',
  [SimilarityRiskLevel.MEDIUM]: '中风险',
  [SimilarityRiskLevel.HIGH]: '高风险',
};

// 写作会话状态
export const WritingSessionStatus = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  SUBMITTED: 'submitted',
} as const;

export type WritingSessionStatusValue =
  (typeof WritingSessionStatus)[keyof typeof WritingSessionStatus];

// 资源可见性
export const ResourceVisibility = {
  PRIVATE: 'private',
  SCHOOL: 'school',
  PUBLIC: 'public',
} as const;

export type ResourceVisibilityValue = (typeof ResourceVisibility)[keyof typeof ResourceVisibility];

export const ResourceVisibilityLabels: Record<ResourceVisibilityValue, string> = {
  [ResourceVisibility.PRIVATE]: '仅自己',
  [ResourceVisibility.SCHOOL]: '校内共享',
  [ResourceVisibility.PUBLIC]: '公开',
};

// 学习路径推荐类型
export const LearningPathRecommendationType = {
  MICRO_SKILL: 'micro_skill',
  QUESTION_BANK: 'question_bank',
  ERROR_PRACTICE: 'error_practice',
  READING: 'reading',
} as const;

export type LearningPathRecommendationTypeValue =
  (typeof LearningPathRecommendationType)[keyof typeof LearningPathRecommendationType];

export const LearningPathRecommendationTypeLabels: Record<
  LearningPathRecommendationTypeValue,
  string
> = {
  [LearningPathRecommendationType.MICRO_SKILL]: '微技能练习',
  [LearningPathRecommendationType.QUESTION_BANK]: '题库练习',
  [LearningPathRecommendationType.ERROR_PRACTICE]: '错题巩固',
  [LearningPathRecommendationType.READING]: '范文阅读',
};

// 话题趋势方向
export const TopicTrendDirection = {
  RISING: 'rising',
  STABLE: 'stable',
  DECLINING: 'declining',
} as const;

export type TopicTrendDirectionValue =
  (typeof TopicTrendDirection)[keyof typeof TopicTrendDirection];

export const TopicTrendDirectionLabels: Record<TopicTrendDirectionValue, string> = {
  [TopicTrendDirection.RISING]: '上升趋势',
  [TopicTrendDirection.STABLE]: '保持稳定',
  [TopicTrendDirection.DECLINING]: '下降趋势',
};

// 每日挑战类型
export const DailyChallengeType = {
  SENTENCE_REWRITE: 'sentence_rewrite',
  DIALOGUE: 'dialogue',
  CONTINUATION: 'continuation',
  TRANSLATION: 'translation',
  FREE_WRITE: 'free_write',
} as const;

export type DailyChallengeTypeValue = (typeof DailyChallengeType)[keyof typeof DailyChallengeType];

export const DailyChallengeTypeLabels: Record<DailyChallengeTypeValue, string> = {
  [DailyChallengeType.SENTENCE_REWRITE]: '句子改写',
  [DailyChallengeType.DIALOGUE]: '情景对话',
  [DailyChallengeType.CONTINUATION]: '故事续写',
  [DailyChallengeType.TRANSLATION]: '翻译练习',
  [DailyChallengeType.FREE_WRITE]: '自由写作',
};

// 通知类型
export const NotificationType = {
  TASK_DUE: 'task_due',
  TASK_OVERDUE: 'task_overdue',
  CORRECTION_READY: 'correction_ready',
  ERROR_REVIEW: 'error_review',
  DAILY_CHALLENGE: 'daily_challenge',
  TEACHER_PENDING: 'teacher_pending',
} as const;

export type NotificationTypeValue = (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationTypeLabels: Record<NotificationTypeValue, string> = {
  [NotificationType.TASK_DUE]: '任务即将截止',
  [NotificationType.TASK_OVERDUE]: '任务已逾期',
  [NotificationType.CORRECTION_READY]: '批改完成',
  [NotificationType.ERROR_REVIEW]: '错题复习',
  [NotificationType.DAILY_CHALLENGE]: '每日挑战',
  [NotificationType.TEACHER_PENDING]: '待批改提醒',
};

// 通知渠道
export const NotificationChannel = {
  PUSH: 'push',
  IN_APP: 'in_app',
  SMS: 'sms',
} as const;

export type NotificationChannelValue =
  (typeof NotificationChannel)[keyof typeof NotificationChannel];

// 写作素材类型
export const WritingMaterialType = {
  PHRASE: 'phrase',
  SENTENCE_PATTERN: 'sentence_pattern',
  CONNECTOR: 'connector',
  TEMPLATE: 'template',
  ARGUMENT: 'argument',
  IDIOM: 'idiom',
} as const;

export type WritingMaterialTypeValue =
  (typeof WritingMaterialType)[keyof typeof WritingMaterialType];

export const WritingMaterialTypeLabels: Record<WritingMaterialTypeValue, string> = {
  [WritingMaterialType.PHRASE]: '地道表达',
  [WritingMaterialType.SENTENCE_PATTERN]: '高分句型',
  [WritingMaterialType.CONNECTOR]: '衔接词',
  [WritingMaterialType.TEMPLATE]: '开头结尾模板',
  [WritingMaterialType.ARGUMENT]: '论证素材',
  [WritingMaterialType.IDIOM]: '习语谚语',
};

// 素材难度
export const WritingMaterialDifficulty = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

export type WritingMaterialDifficultyValue =
  (typeof WritingMaterialDifficulty)[keyof typeof WritingMaterialDifficulty];

export const WritingMaterialDifficultyLabels: Record<WritingMaterialDifficultyValue, string> = {
  [WritingMaterialDifficulty.EASY]: '简单',
  [WritingMaterialDifficulty.MEDIUM]: '中等',
  [WritingMaterialDifficulty.HARD]: '困难',
};

// 同伴互评状态
export const PeerReviewStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
} as const;

export type PeerReviewStatusValue = (typeof PeerReviewStatus)[keyof typeof PeerReviewStatus];

export const PeerReviewStatusLabels: Record<PeerReviewStatusValue, string> = {
  [PeerReviewStatus.PENDING]: '待评',
  [PeerReviewStatus.COMPLETED]: '已完成',
  [PeerReviewStatus.SKIPPED]: '已跳过',
};

// 互评得分维度
export const PeerReviewDimension = {
  CONTENT: 'content',
  LANGUAGE: 'language',
  STRUCTURE: 'structure',
  HANDWRITING: 'handwriting',
} as const;

export type PeerReviewDimensionValue =
  (typeof PeerReviewDimension)[keyof typeof PeerReviewDimension];

export const PeerReviewDimensionLabels: Record<PeerReviewDimensionValue, string> = {
  [PeerReviewDimension.CONTENT]: '内容',
  [PeerReviewDimension.LANGUAGE]: '语言',
  [PeerReviewDimension.STRUCTURE]: '结构',
  [PeerReviewDimension.HANDWRITING]: '卷面',
};

// 默认互评引导性问题
export const DefaultPeerReviewQuestions: Array<{ id: string; text: string }> = [
  { id: 'main_idea', text: '文章主旨是否明确？' },
  { id: 'examples', text: '论据/例子是否充分支持观点？' },
  { id: 'logic', text: '段落之间衔接是否自然？' },
  { id: 'vocabulary', text: '有哪些值得学习的表达？' },
  { id: 'suggestion', text: '给作者一个具体的改进建议。' },
];
