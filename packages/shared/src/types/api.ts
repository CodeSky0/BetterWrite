import type { Correction, Essay, EssayTask, TeachingResource } from './essay.js';

/**
 * Shared API response types used by both web and mobile fetchers.
 * These types represent the JSON shapes returned by the API server.
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthUserResponse {
  userId: string;
  name: string;
  email: string;
  role: string;
  schoolId: string | null;
}

export interface AiGeneratedTask {
  title: string;
  topicType: string;
  topicCategory: string;
  requirements: string;
  keyPoints: string[];
  referenceEssay: string;
  wordLimitMin?: number;
  wordLimitMax?: number;
}

export interface CorrectionDetail {
  id: string;
  essayId: string;
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
  errorStats: Record<string, number>;
  highlights: Array<{ sentence: string; type: string; comment: string }>;
  sentenceAnalysis: unknown[];
  revisedEssay: string;
  suggestions: Array<{ priority: 'high' | 'medium' | 'low'; category: string; suggestion: string }>;
  aiProvider: string;
  aiModel: string;
  correctionTimeMs: number;
  createdAt: string;
}

export interface StudentListItem {
  id: string;
  name: string;
  email: string;
  studentNo: string | null;
  classId: string;
  className: string;
  grade: string;
  tag: string | null;
  essayCount: number;
  averageScore: number | null;
}

export interface StudentDetail {
  id: string;
  name: string;
  email: string;
  studentNo: string | null;
  classes: Array<{ id: string; name: string | null; grade: string | null }>;
  tag: string | null;
  averageScore: number | null;
  essayCount: number;
  recentEssays: Array<{
    id: string;
    title: string;
    status: string;
    totalScore: number | null;
    wordCount: number;
    submittedAt: string;
    topicType: string | null;
  }>;
}

export interface ImportResult {
  successCount: number;
  totalCount: number;
  results: Array<{
    line: number;
    name: string;
    email: string;
    success: boolean;
    error?: string;
  }>;
}

export interface TeachingResourceWithCreator extends TeachingResource {
  creator?: { id: string; name: string } | null;
}

// Re-export types from essay.ts for backward compatibility
export type { Correction, Essay, EssayTask };
