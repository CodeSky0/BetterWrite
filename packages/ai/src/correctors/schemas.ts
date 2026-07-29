import { z } from 'zod';

export const errorPositionSchema = z.object({
  start: z.number().int().min(0),
  end: z.number().int().min(0),
});

export const errorSchema = z.object({
  type: z.string(),
  original: z.string(),
  corrected: z.string(),
  explanation: z.string(),
  position: errorPositionSchema,
});

export const vocabularySuggestionSchema = z.object({
  original: z.string(),
  suggestion: z.string(),
  context: z.string(),
});

export const highlightSchema = z.object({
  sentence: z.string(),
  type: z.string(),
  comment: z.string(),
});

export const contentPointSchema = z.object({
  point: z.string(),
  status: z.enum(['fully', 'partially', 'missing']),
  evidence: z.string(),
});

export const contentAnalysisSchema = z.object({
  pointCoverage: z.array(contentPointSchema).optional().default([]),
  // Bug #18: 子维度分数区间曾设为 0-4.5，但 contentScore 整体 max=5.0
  // 两者相加极易超过 5.0；改为 0-2.5 + 0-2.5 = 0-5.0 与 contentScore 上限一致。
  // 高中（25分制）内容维度占比 0-10.0，子维度各 0-5.0
  expansionScore: z.number().min(0).max(5),
  relevanceScore: z.number().min(0).max(5),
  contentScore: z.number().min(0).max(10),
  // 读后续写专用子维度（可选）
  plotLogic: z.object({ score: z.number().min(0).max(5), comment: z.string() }).optional(),
  originalFusion: z.object({ score: z.number().min(0).max(5), comment: z.string() }).optional(),
  paragraphConnection: z
    .object({ score: z.number().min(0).max(5), comment: z.string() })
    .optional(),
  creativity: z.object({ score: z.number().min(0).max(5), comment: z.string() }).optional(),
  comment: z.string(),
});

export const taskUnderstandingSchema = z.object({
  genreCorrect: z.boolean(),
  personTenseAppropriate: z.boolean(),
  formatAppropriate: z.boolean(),
  comment: z.string(),
});

export const requiredElementSchema = z.object({
  element: z.string(),
  required: z.boolean(),
  present: z.boolean(),
  evidence: z.string(),
});

export const topicIssueSchema = z.object({
  severity: z.enum(['high', 'medium', 'low']),
  category: z.string(),
  description: z.string(),
  evidence: z.string(),
});

export const languageAnalysisSchema = z.object({
  errors: z.array(errorSchema),
  errorStats: z.record(z.string(), z.number().int().min(0)),
  vocabularyLevel: z.enum(['basic', 'intermediate', 'advanced']),
  vocabularySuggestions: z.array(vocabularySuggestionSchema),
  sentenceStats: z.object({
    simpleCount: z.number().int().min(0),
    compoundCount: z.number().int().min(0),
    complexCount: z.number().int().min(0),
  }),
  highlights: z.array(highlightSchema),
  revisedEssay: z.string(),
  // 初中满分4.0，高中满分10.0
  languageScore: z.number().min(0).max(10),
  // 读后续写专用：与原文风格匹配度（可选）
  styleMatchScore: z.number().min(0).max(2.5).optional(),
  comment: z.string(),
});

// 初中标准三段式 + 高中读后续写双段结构共用（passthrough 允许额外字段）
export const paragraphStructureSchema = z
  .object({
    hasOpening: z.boolean().optional(),
    hasBody: z.boolean().optional(),
    hasClosing: z.boolean().optional(),
    openingQuality: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
    bodyParagraphs: z.number().int().min(0).optional(),
    closingQuality: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
    // 读后续写专用字段
    paragraphCount: z.number().int().min(0).optional(),
    paragraph1Quality: z.string().optional(),
    paragraph2Quality: z.string().optional(),
    hasRisingAction: z.boolean().optional(),
    hasClimax: z.boolean().optional(),
    hasResolution: z.boolean().optional(),
  })
  .passthrough();

export const connectiveUsageSchema = z.object({
  usedConnectives: z.array(z.string()),
  missingTypes: z.array(z.string()),
  // 初中满分2.5，高中满分5.0
  score: z.number().min(0).max(5),
});

export const formatCheckSchema = z.object({
  type: z.string(),
  hasGreeting: z.boolean(),
  hasClosing: z.boolean(),
  hasSignature: z.boolean(),
  isCorrect: z.boolean(),
  // 读后续写专用字段（可选）
  followsParagraphStarts: z.boolean().optional(),
  twoParagraphs: z.boolean().optional(),
});

export const structureAnalysisSchema = z
  .object({
    paragraphStructure: paragraphStructureSchema,
    connectiveUsage: connectiveUsageSchema,
    formatCheck: formatCheckSchema,
    wordCount: z.number().int().min(0),
    // 初中满分2.5，高中满分5.0
    wordCountScore: z.number().min(0).max(5),
    structureScore: z.number().min(0).max(5),
    comment: z.string(),
  })
  .passthrough();

export const suggestionSchema = z.object({
  priority: z.enum(['high', 'medium', 'low']),
  category: z.string(),
  suggestion: z.string(),
});

export const topicAdherenceAnalysisSchema = z
  .object({
    taskUnderstanding: taskUnderstandingSchema,
    keyPointCoverage: z.array(contentPointSchema).optional().default([]),
    requiredElements: z.array(requiredElementSchema).optional().default([]),
    topicRelevance: z.object({
      // Bug #18: topicRelevance.score 曾设为 0-5，但 topicAdherence 整体 max=2.0
      // 4.5 > 2.0 的样例值会让 LLM 误以为整体维度可打到 4.5 分；改为 0-2 对齐。
      // 高中满分3.0
      score: z.number().min(0).max(3),
      comment: z.string(),
    }),
    // 初中满分2.0，高中满分3.0
    topicAdherenceScore: z.number().min(0).max(3),
    issues: z.array(topicIssueSchema),
    suggestions: z.array(suggestionSchema),
    comment: z.string(),
  })
  .passthrough();

export const dimensionScoresSchema = z.object({
  // 初中满分: 2/5/4/2.5/1.5=15; 高中满分: 3/10/10/5/1.5=29.5 (允许维度分之和>25, scorer 会裁剪)
  topicAdherence: z.number().min(0).max(3),
  content: z.number().min(0).max(10),
  language: z.number().min(0).max(10),
  structure: z.number().min(0).max(5),
  presentation: z.number().min(0).max(1.5),
});

export const scorerSchema = z.object({
  // 初中满分15，高中满分25
  totalScore: z.number().min(0).max(25),
  scoreTier: z.string(),
  tierLabel: z.string(),
  dimensionScores: dimensionScoresSchema,
  suggestions: z.array(suggestionSchema),
  comment: z.string(),
});

export type ContentAnalysis = z.infer<typeof contentAnalysisSchema>;
export type TopicAdherenceAnalysis = z.infer<typeof topicAdherenceAnalysisSchema>;
export type LanguageAnalysis = z.infer<typeof languageAnalysisSchema>;
export type StructureAnalysis = z.infer<typeof structureAnalysisSchema>;
export type ScorerResult = z.infer<typeof scorerSchema>;
