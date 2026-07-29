import {
  countWords,
  generateContentHash,
  getScoreTier,
  getSeniorScoreTier,
} from '@betterwrite/shared';
// cache 依赖 ioredis（Node-only），须从子路径导入，避免污染主入口的客户端可用性
import { getCacheManager } from '@betterwrite/shared/cache';
import type { BaseAIProvider } from '../providers/base.js';
import type { AIProviderRouter } from '../router.js';
import { compressPrompt } from '../utils/prompt-compression.js';
import { contentPrompt } from './content.js';
import { languagePrompt } from './language.js';
import {
  type ContentAnalysis,
  type LanguageAnalysis,
  type ScorerResult,
  type StructureAnalysis,
  type TopicAdherenceAnalysis,
  contentAnalysisSchema,
  languageAnalysisSchema,
  scorerSchema,
  structureAnalysisSchema,
  topicAdherenceAnalysisSchema,
} from './schemas.js';
import { scorerPrompt } from './scorer.js';
import { structurePrompt } from './structure.js';
import { topicAdherencePrompt } from './topic-adherence.js';

export type EducationStage = 'junior' | 'senior';
export type SeniorEssayType = 'applied_writing' | 'continuation_writing';

export interface EssayTaskInput {
  title: string;
  requirements: string;
  keyPoints: string[];
  topicType: string;
  wordLimitMin: number;
  wordLimitMax: number;
  // 学段：junior=初中（默认），senior=高中
  stage: EducationStage;
  // 高中题型：applied_writing=应用文写作，continuation_writing=读后续写（仅高中使用）
  seniorEssayType?: SeniorEssayType;
  // 读后续写专用：阅读原文
  readingPassage?: string;
  // 读后续写专用：段首句
  continuationParagraphStarts?: string[];
}

export interface CorrectionResult {
  topicAdherenceScore: number;
  contentScore: number;
  languageScore: number;
  structureScore: number;
  presentationScore: number;
  totalScore: number;
  scoreTier: string;
  errors: Array<{
    type: string;
    original: string;
    corrected: string;
    explanation: string;
    position: { start: number; end: number };
  }>;
  highlights: Array<{
    sentence: string;
    type: string;
    comment: string;
  }>;
  revisedEssay: string;
  suggestions: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    suggestion: string;
  }>;
  aiProvider: string;
  aiModel: string;
}

export async function correctEssay(
  essay: string,
  task: EssayTaskInput,
  router: AIProviderRouter,
): Promise<CorrectionResult> {
  const wordCount = countWords(essay);

  // Generate content hash for caching
  const contentHash = generateContentHash(essay, task);
  const cache = getCacheManager();

  // Try to get cached result
  const cacheKey = `correction:${contentHash}`;
  const cached = await cache.get<CorrectionResult>(cacheKey);
  if (cached) {
    return cached;
  }

  // Apply prompt compression
  const { compressedEssay, compressedTask } = compressPrompt(essay, task);
  const shouldUseCompressed = essay.length > 1000; // Only compress for longer essays

  const essayToUse = shouldUseCompressed ? compressedEssay : essay;
  const taskToUse = shouldUseCompressed ? JSON.parse(compressedTask) : task;

  const [topicAdherenceResult, contentResult, languageResult, structureResult] = await Promise.all([
    router.executeWithFallback('topicAdherence', (provider) =>
      analyzeTopicAdherence(provider, essayToUse, taskToUse),
    ),
    router.executeWithFallback('content', (provider) =>
      analyzeContent(provider, essayToUse, taskToUse),
    ),
    router.executeWithFallback('language', (provider) =>
      analyzeLanguage(provider, essayToUse, taskToUse),
    ),
    router.executeWithFallback('structure', (provider) =>
      analyzeStructure(provider, essayToUse, taskToUse),
    ),
  ]);

  const scoreResult = await router.executeWithFallback('scorer', (provider) =>
    calculateScore(provider, {
      topicAdherenceResult,
      contentResult,
      languageResult,
      structureResult,
      wordCount,
      task,
    }),
  );

  const result: CorrectionResult = {
    topicAdherenceScore: scoreResult.dimensionScores.topicAdherence,
    contentScore: scoreResult.dimensionScores.content,
    languageScore: scoreResult.dimensionScores.language,
    structureScore: scoreResult.dimensionScores.structure,
    presentationScore: scoreResult.dimensionScores.presentation,
    totalScore: scoreResult.totalScore,
    scoreTier: scoreResult.scoreTier,
    errors: languageResult.errors,
    highlights: languageResult.highlights,
    revisedEssay: languageResult.revisedEssay,
    suggestions: mergeSuggestions(topicAdherenceResult.suggestions, scoreResult.suggestions),
    aiProvider: scoreResult.aiProvider,
    aiModel: scoreResult.aiModel,
  };

  // Cache the result for 24 hours
  await cache.set(cacheKey, result, { ttl: 86400 });

  return result;
}

async function analyzeContent(
  provider: BaseAIProvider,
  essay: string,
  task: EssayTaskInput,
): Promise<ContentAnalysis> {
  const prompt = contentPrompt(essay, task);
  return provider.completeStructured(prompt, contentAnalysisSchema, { maxOutputTokens: 2048 });
}

async function analyzeTopicAdherence(
  provider: BaseAIProvider,
  essay: string,
  task: EssayTaskInput,
): Promise<TopicAdherenceAnalysis> {
  const prompt = topicAdherencePrompt(essay, task);
  return provider.completeStructured(prompt, topicAdherenceAnalysisSchema, {
    maxOutputTokens: 2048,
  });
}

async function analyzeLanguage(
  provider: BaseAIProvider,
  essay: string,
  task: EssayTaskInput,
): Promise<LanguageAnalysis> {
  const prompt = languagePrompt(essay, task);
  return provider.completeStructured(prompt, languageAnalysisSchema, { maxOutputTokens: 4096 });
}

async function analyzeStructure(
  provider: BaseAIProvider,
  essay: string,
  task: EssayTaskInput,
): Promise<StructureAnalysis> {
  const prompt = structurePrompt(essay, task);
  return provider.completeStructured(prompt, structureAnalysisSchema, { maxOutputTokens: 2048 });
}

async function calculateScore(
  provider: BaseAIProvider,
  input: {
    topicAdherenceResult: TopicAdherenceAnalysis;
    contentResult: ContentAnalysis;
    languageResult: LanguageAnalysis;
    structureResult: StructureAnalysis;
    wordCount: number;
    task: EssayTaskInput;
  },
): Promise<ScorerResult & { aiProvider: string; aiModel: string }> {
  const prompt = scorerPrompt(input);
  const result = await provider.completeStructured(prompt, scorerSchema, { maxOutputTokens: 2048 });
  // 按学段选择档次判定函数
  const tier =
    input.task.stage === 'senior'
      ? getSeniorScoreTier(result.totalScore)
      : getScoreTier(result.totalScore);
  return {
    ...result,
    scoreTier: tier.tier,
    tierLabel: tier.label,
    aiProvider: provider.name,
    aiModel: provider.defaultModel,
  };
}

function mergeSuggestions(
  topicSuggestions: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    suggestion: string;
  }>,
  scorerSuggestions: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    suggestion: string;
  }>,
): Array<{ priority: 'high' | 'medium' | 'low'; category: string; suggestion: string }> {
  const seen = new Set<string>();
  const merged: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    suggestion: string;
  }> = [];
  for (const s of [...topicSuggestions, ...scorerSuggestions]) {
    const key = `${s.category}::${s.suggestion}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(s);
  }
  return merged;
}
