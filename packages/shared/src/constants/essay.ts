export const TopicType = {
  LETTER: 'letter',
  SPEECH: 'speech',
  ARGUMENTATION: 'argumentation',
  NARRATION: 'narration',
  PROPOSAL: 'proposal',
} as const;

export type TopicTypeValue = (typeof TopicType)[keyof typeof TopicType];

// 学段枚举：初中 / 高中
export const EducationStage = {
  JUNIOR: 'junior', // 初中
  SENIOR: 'senior', // 高中
} as const;

export type EducationStageValue = (typeof EducationStage)[keyof typeof EducationStage];

export const EducationStageLabels: Record<EducationStageValue, string> = {
  [EducationStage.JUNIOR]: '初中',
  [EducationStage.SENIOR]: '高中',
};

// 高中作文题型：应用文写作（25分）/ 读后续写（25分）
export const SeniorEssayType = {
  APPLIED_WRITING: 'applied_writing', // 应用文写作（25分）
  CONTINUATION_WRITING: 'continuation_writing', // 读后续写（25分）
} as const;

export type SeniorEssayTypeValue = (typeof SeniorEssayType)[keyof typeof SeniorEssayType];

export const SeniorEssayTypeLabels: Record<SeniorEssayTypeValue, string> = {
  [SeniorEssayType.APPLIED_WRITING]: '应用文写作',
  [SeniorEssayType.CONTINUATION_WRITING]: '读后续写',
};

export const TopicCategory = {
  SCHOOL_LIFE: 'school_life',
  SOCIAL_ISSUES: 'social_issues',
  CULTURE: 'culture',
  TECH: 'tech',
  GROWTH: 'growth',
  TRAVEL: 'travel',
} as const;

export type TopicCategoryValue = (typeof TopicCategory)[keyof typeof TopicCategory];

export const ErrorType = {
  TENSE: 'tense',
  SUBJECT_VERB: 'subject_verb',
  SPELLING: 'spelling',
  PLURAL: 'plural',
  ARTICLE: 'article',
  PREPOSITION: 'preposition',
  WORD_FORM: 'word_form',
  PRONOUN: 'pronoun',
  CHINGLISH: 'chinglish',
  SENTENCE_STRUCTURE: 'sentence_structure',
  COLLOCATION: 'collocation',
} as const;

export type ErrorTypeValue = (typeof ErrorType)[keyof typeof ErrorType];

export const TeachingResourceType = {
  SAMPLE: 'sample',
  SENTENCE: 'sentence',
  CONNECTOR: 'connector',
  ERROR_CASE: 'errorcase',
} as const;

export type TeachingResourceTypeValue =
  (typeof TeachingResourceType)[keyof typeof TeachingResourceType];

export const TeachingResourceDifficulty = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

export type TeachingResourceDifficultyValue =
  (typeof TeachingResourceDifficulty)[keyof typeof TeachingResourceDifficulty];

export const StudentTag = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  IMPROVING: 'improving',
  ATTENTION: 'attention',
} as const;

export type StudentTagValue = (typeof StudentTag)[keyof typeof StudentTag];

export const PracticeDifficulty = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

export type PracticeDifficultyValue = (typeof PracticeDifficulty)[keyof typeof PracticeDifficulty];

export const ExerciseType = {
  QUESTION_BANK: 'question_bank',
  TIMED_MOCK: 'timed_mock',
} as const;

export type ExerciseTypeValue = (typeof ExerciseType)[keyof typeof ExerciseType];

export const AchievementTier = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
} as const;

export type AchievementTierValue = (typeof AchievementTier)[keyof typeof AchievementTier];

export const AiAssistantMode = {
  POLISH: 'polish',
  UPGRADE: 'upgrade',
  SYNONYM: 'synonym',
  GRAMMAR: 'grammar',
} as const;

export type AiAssistantModeValue = (typeof AiAssistantMode)[keyof typeof AiAssistantMode];

export const ErrorBookStatus = {
  UNRESOLVED: 'unresolved',
  MASTERED: 'mastered',
} as const;

export type ErrorBookStatusValue = (typeof ErrorBookStatus)[keyof typeof ErrorBookStatus];

export const EssayStatus = {
  PENDING: 'pending',
  CORRECTING: 'correcting',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type EssayStatusValue = (typeof EssayStatus)[keyof typeof EssayStatus];

export const ModelEssayImitationStatus = {
  PENDING: 'pending',
  CORRECTING: 'correcting',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type ModelEssayImitationStatusValue =
  (typeof ModelEssayImitationStatus)[keyof typeof ModelEssayImitationStatus];

export const TopicTypeLabels: Record<TopicTypeValue, string> = {
  [TopicType.LETTER]: '书信',
  [TopicType.SPEECH]: '演讲稿',
  [TopicType.ARGUMENTATION]: '议论文',
  [TopicType.NARRATION]: '记叙文',
  [TopicType.PROPOSAL]: '建议书',
};

export const TopicCategoryLabels: Record<TopicCategoryValue, string> = {
  [TopicCategory.SCHOOL_LIFE]: '校园生活',
  [TopicCategory.SOCIAL_ISSUES]: '社会热点',
  [TopicCategory.CULTURE]: '文化习俗',
  [TopicCategory.TECH]: '科技发展',
  [TopicCategory.GROWTH]: '成长励志',
  [TopicCategory.TRAVEL]: '旅行见闻',
};

export const ErrorTypeLabels: Record<ErrorTypeValue, string> = {
  [ErrorType.TENSE]: '时态',
  [ErrorType.SUBJECT_VERB]: '主谓一致',
  [ErrorType.SPELLING]: '拼写',
  [ErrorType.PLURAL]: '复数',
  [ErrorType.ARTICLE]: '冠词',
  [ErrorType.PREPOSITION]: '介词',
  [ErrorType.WORD_FORM]: '词形',
  [ErrorType.PRONOUN]: '代词',
  [ErrorType.CHINGLISH]: '中式英语',
  [ErrorType.SENTENCE_STRUCTURE]: '句式结构',
  [ErrorType.COLLOCATION]: '搭配',
};

export const TeachingResourceTypeLabels: Record<TeachingResourceTypeValue, string> = {
  [TeachingResourceType.SAMPLE]: '范文',
  [TeachingResourceType.SENTENCE]: '句型',
  [TeachingResourceType.CONNECTOR]: '连接词',
  [TeachingResourceType.ERROR_CASE]: '错误案例',
};

export const TeachingResourceDifficultyLabels: Record<TeachingResourceDifficultyValue, string> = {
  [TeachingResourceDifficulty.EASY]: '简单',
  [TeachingResourceDifficulty.MEDIUM]: '中等',
  [TeachingResourceDifficulty.HARD]: '困难',
};

export const StudentTagLabels: Record<StudentTagValue, string> = {
  [StudentTag.EXCELLENT]: '优秀',
  [StudentTag.GOOD]: '良好',
  [StudentTag.IMPROVING]: '进步中',
  [StudentTag.ATTENTION]: '需关注',
};

export const PracticeDifficultyLabels: Record<PracticeDifficultyValue, string> = {
  [PracticeDifficulty.EASY]: '简单',
  [PracticeDifficulty.MEDIUM]: '中等',
  [PracticeDifficulty.HARD]: '困难',
};

export const ExerciseTypeLabels: Record<ExerciseTypeValue, string> = {
  [ExerciseType.QUESTION_BANK]: '题库练习',
  [ExerciseType.TIMED_MOCK]: '限时模拟',
};

export const AchievementTierLabels: Record<AchievementTierValue, string> = {
  [AchievementTier.BRONZE]: '青铜',
  [AchievementTier.SILVER]: '白银',
  [AchievementTier.GOLD]: '黄金',
  [AchievementTier.PLATINUM]: '铂金',
};

export const AiAssistantModeLabels: Record<AiAssistantModeValue, string> = {
  [AiAssistantMode.POLISH]: '润色',
  [AiAssistantMode.UPGRADE]: '升级',
  [AiAssistantMode.SYNONYM]: '同义词',
  [AiAssistantMode.GRAMMAR]: '语法',
};

export const ErrorBookStatusLabels: Record<ErrorBookStatusValue, string> = {
  [ErrorBookStatus.UNRESOLVED]: '未解决',
  [ErrorBookStatus.MASTERED]: '已掌握',
};

export const EssayStatusLabels: Record<EssayStatusValue, string> = {
  [EssayStatus.PENDING]: '等待批改',
  [EssayStatus.CORRECTING]: '批改中',
  [EssayStatus.COMPLETED]: '已完成',
  [EssayStatus.FAILED]: '批改失败',
};

export const ModelEssayImitationStatusLabels: Record<ModelEssayImitationStatusValue, string> = {
  [ModelEssayImitationStatus.PENDING]: '等待批改',
  [ModelEssayImitationStatus.CORRECTING]: '批改中',
  [ModelEssayImitationStatus.COMPLETED]: '已完成',
  [ModelEssayImitationStatus.FAILED]: '批改失败',
};

export function getTopicTypeLabel(topicType: string): string {
  return TopicTypeLabels[topicType as TopicTypeValue] ?? topicType;
}

export function getTopicCategoryLabel(category: string): string {
  return TopicCategoryLabels[category as TopicCategoryValue] ?? category;
}

export function getErrorTypeLabel(errorType: string): string {
  return ErrorTypeLabels[errorType as ErrorTypeValue] ?? errorType;
}

export function getTeachingResourceTypeLabel(type: string): string {
  return TeachingResourceTypeLabels[type as TeachingResourceTypeValue] ?? type;
}

export function getTeachingResourceDifficultyLabel(difficulty: string): string {
  return (
    TeachingResourceDifficultyLabels[difficulty as TeachingResourceDifficultyValue] ?? difficulty
  );
}

export function getStudentTagLabel(tag: string): string {
  return StudentTagLabels[tag as StudentTagValue] ?? tag;
}

export function getPracticeDifficultyLabel(difficulty: string): string {
  return PracticeDifficultyLabels[difficulty as PracticeDifficultyValue] ?? difficulty;
}

export function getExerciseTypeLabel(type: string): string {
  return ExerciseTypeLabels[type as ExerciseTypeValue] ?? type;
}

export function getAchievementTierLabel(tier: string): string {
  return AchievementTierLabels[tier as AchievementTierValue] ?? tier;
}

export function getAiAssistantModeLabel(mode: string): string {
  return AiAssistantModeLabels[mode as AiAssistantModeValue] ?? mode;
}

export function getErrorBookStatusLabel(status: string): string {
  return ErrorBookStatusLabels[status as ErrorBookStatusValue] ?? status;
}

export function getEssayStatusLabel(status: string): string {
  return EssayStatusLabels[status as EssayStatusValue] ?? status;
}

export function getModelEssayImitationStatusLabel(status: string): string {
  return ModelEssayImitationStatusLabels[status as ModelEssayImitationStatusValue] ?? status;
}

export function getEducationStageLabel(stage: string): string {
  return EducationStageLabels[stage as EducationStageValue] ?? stage;
}

export function getSeniorEssayTypeLabel(essayType: string): string {
  return SeniorEssayTypeLabels[essayType as SeniorEssayTypeValue] ?? essayType;
}
