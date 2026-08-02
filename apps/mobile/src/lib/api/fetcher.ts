import type {
  Achievement,
  AiAssistantResult,
  AiConversation,
  AuthUserResponse,
  ChallengeStreak,
  ChallengeSubmission,
  ClassAnalytics,
  Correction,
  CorrectionDetail,
  DailyChallenge,
  DailyQuote,
  ErrorBookGroup,
  ErrorBookItem,
  Essay,
  EssayDraft,
  EssayTask,
  ImportResult,
  PeerReview,
  PeerReviewSummary,
  PeerReviewWithEssay,
  PracticeExercise,
  QuestionBankItem,
  StudentAnalytics,
  StudentDetail,
  StudentListItem,
  StudentProgress,
  TeachingResourceWithCreator,
  WritingMaterial,
} from '@betterwrite/shared';
import type { ApiResponse } from './client';
import { request } from './client';

// ========== Mobile-specific types ==========

export interface OcrResult {
  content: string;
  confidence: number;
}

export interface ApiTokenItem {
  id: string;
  platform: string;
  deviceName: string | null;
  expiresAt: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface TokenLoginResult {
  token: string;
  user: AuthUserResponse;
}

// Re-export shared types for backward compatibility
export type {
  ApiResponse,
  AuthUserResponse,
  Correction,
  CorrectionDetail,
  Essay,
  EssayTask,
  ImportResult,
  StudentDetail,
  StudentListItem,
  TeachingResourceWithCreator,
};

// ========== Fetcher ==========

export const fetcher = {
  // ----- Auth (mobile-specific) -----
  loginWithToken: (body: {
    email: string;
    password: string;
    platform: string;
    deviceName: string;
  }) =>
    request<ApiResponse<TokenLoginResult>>('/api/auth/token', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  listTokens: () => request<ApiResponse<ApiTokenItem[]>>('/api/auth/tokens'),

  // Bug #UX-4.2: 登出时撤销服务端 token，防止 token 泄露后仍有效 90 天。
  revokeToken: (tokenId: string) =>
    request<ApiResponse<null>>(`/api/auth/tokens/${tokenId}`, { method: 'DELETE' }),

  registerDeviceToken: (body: { token: string; platform: string }) =>
    request<ApiResponse<{ userId: string; token: string }>>('/api/auth/device-token', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // ----- Auth (shared) -----
  register: (body: {
    email: string;
    password: string;
    name: string;
    role: string;
    schoolCode?: string;
    classCode?: string;
  }) =>
    request<ApiResponse<AuthUserResponse>>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  logout: () => request<ApiResponse<null>>('/api/auth/logout', { method: 'POST' }),

  me: () =>
    request<
      ApiResponse<{
        id: string;
        name: string;
        email: string;
        role: string;
        schoolId: string | null;
      }>
    >('/api/auth/me'),

  // ----- Notifications (mobile-specific) -----
  sendTestNotification: () =>
    request<ApiResponse<{ sent: number }>>('/api/notifications/test', { method: 'POST' }),

  // ----- OCR (mobile-specific) -----
  submitOcr: (body: { imageBase64: string; taskId?: string }) =>
    request<ApiResponse<OcrResult>>('/api/essays/ocr', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // ----- Essays -----
  submitEssay: (body: { content: string; taskId?: string; title?: string }) =>
    request<ApiResponse<Essay>>('/api/essays', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listMyEssays: () => request<ApiResponse<Essay[]>>('/api/essays/my'),
  getEssay: (id: string) => request<ApiResponse<Essay>>(`/api/essays/${id}`),
  getCorrection: (id: string) =>
    request<ApiResponse<CorrectionDetail>>(`/api/essays/${id}/correction`),

  // ----- Tasks -----
  listTasks: () => request<ApiResponse<EssayTask[]>>('/api/tasks'),
  getTask: (id: string) => request<ApiResponse<EssayTask>>(`/api/tasks/${id}`),
  createTask: (body: {
    title: string;
    topicType: string;
    requirements: string;
    keyPoints: string[];
    classId: string;
    wordLimitMin: number;
    wordLimitMax: number;
    dueDate?: string;
  }) =>
    request<ApiResponse<EssayTask>>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // ----- Teacher dashboard -----
  getTeacherDashboard: () =>
    request<
      ApiResponse<{
        stats: {
          totalClasses: number;
          totalStudents: number;
          pendingEssays: number;
          averageScore: number | null;
        };
        classes: Array<{ id: string; name: string; grade: string; studentCount: number }>;
        recentTasks: EssayTask[];
        recentEssays: Essay[];
      }>
    >('/api/teacher/dashboard'),

  listTeacherClasses: () =>
    request<ApiResponse<Array<{ id: string; name: string; grade: string; studentCount: number }>>>(
      '/api/teacher/classes',
    ),

  listTeacherEssays: () => request<ApiResponse<Essay[]>>('/api/essays'),

  // ----- Analytics -----
  getClassAnalytics: (classId: string) =>
    request<ApiResponse<ClassAnalytics>>(`/api/teacher/analytics/class/${classId}`),

  getStudentAnalytics: (studentId: string) =>
    request<ApiResponse<StudentAnalytics>>(`/api/teacher/analytics/student/${studentId}`),

  // ----- Students -----
  listStudents: (params?: { classId?: string; keyword?: string }) => {
    const query = new URLSearchParams();
    if (params?.classId) query.set('classId', params.classId);
    if (params?.keyword) query.set('keyword', params.keyword);
    const qs = query.toString();
    return request<ApiResponse<StudentListItem[]>>(`/api/teacher/students${qs ? `?${qs}` : ''}`);
  },

  getStudentDetail: (id: string) =>
    request<ApiResponse<StudentDetail>>(`/api/teacher/students/${id}`),

  importStudents: (body: { classId: string; csv: string }) =>
    request<ApiResponse<ImportResult>>('/api/teacher/students/import', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateStudentTag: (id: string, tag: string) =>
    request<ApiResponse<{ studentId: string; tag: string }>>(`/api/teacher/students/${id}/tags`, {
      method: 'PATCH',
      body: JSON.stringify({ tag }),
    }),

  // ----- Teaching Resources -----
  listResources: (params?: {
    type?: string;
    topicType?: string;
    difficulty?: string;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.topicType) query.set('topicType', params.topicType);
    if (params?.difficulty) query.set('difficulty', params.difficulty);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return request<ApiResponse<TeachingResourceWithCreator[]>>(
      `/api/teacher/resources${qs ? `?${qs}` : ''}`,
    );
  },

  getResource: (id: string) =>
    request<ApiResponse<TeachingResourceWithCreator>>(`/api/teacher/resources/${id}`),

  createResource: (body: {
    type: string;
    title: string;
    topicType?: string;
    difficulty: string;
    content: string;
    highlights?: string;
    tags?: string[];
  }) =>
    request<ApiResponse<TeachingResourceWithCreator>>('/api/teacher/resources', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateResource: (
    id: string,
    body: {
      title?: string;
      topicType?: string;
      difficulty?: string;
      content?: string;
      highlights?: string;
      tags?: string[];
    },
  ) =>
    request<ApiResponse<TeachingResourceWithCreator>>(`/api/teacher/resources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  deleteResource: (id: string) =>
    request<ApiResponse<null>>(`/api/teacher/resources/${id}`, { method: 'DELETE' }),

  // ----- Error book -----
  getErrorBookGroups: () => request<ApiResponse<ErrorBookGroup[]>>('/api/student/errors'),
  syncErrorBook: () =>
    request<ApiResponse<{ synced: number }>>('/api/student/errors/sync', { method: 'POST' }),
  generateErrorPractice: (errorType: string) =>
    request<ApiResponse<{ exercises: string[] }>>('/api/student/errors/practice', {
      method: 'POST',
      body: JSON.stringify({ errorType }),
    }),
  getErrorBookByType: (type: string, params?: { offset?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.offset !== undefined) query.set('offset', String(params.offset));
    if (params?.limit !== undefined) query.set('limit', String(params.limit));
    const qs = query.toString();
    return request<ApiResponse<ErrorBookItem[]>>(
      `/api/student/errors/${type}${qs ? `?${qs}` : ''}`,
    );
  },
  masterError: (id: string) =>
    request<ApiResponse<{ studentId: string; id: string; status: string }>>(
      `/api/student/errors/${id}/master`,
      { method: 'POST' },
    ),

  // ----- Student progress & achievements -----
  getStudentProgress: () => request<ApiResponse<StudentProgress>>('/api/student/progress'),
  getAchievements: () => request<ApiResponse<Achievement[]>>('/api/student/achievements'),

  // ----- AI assistant -----
  aiPolish: (text: string) =>
    request<ApiResponse<AiAssistantResult>>('/api/student/ai/polish', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  aiUpgrade: (text: string) =>
    request<ApiResponse<AiAssistantResult>>('/api/student/ai/upgrade', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  aiSynonym: (word: string, context: string) =>
    request<ApiResponse<AiAssistantResult>>('/api/student/ai/synonym', {
      method: 'POST',
      body: JSON.stringify({ word, context }),
    }),
  aiGrammar: (text: string) =>
    request<ApiResponse<AiAssistantResult>>('/api/student/ai/grammar', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  getAiHistory: (params?: { offset?: number; limit?: number; mode?: string }) => {
    const query = new URLSearchParams();
    if (params?.offset !== undefined) query.set('offset', String(params.offset));
    if (params?.limit !== undefined) query.set('limit', String(params.limit));
    if (params?.mode) query.set('mode', params.mode);
    const qs = query.toString();
    return request<ApiResponse<AiConversation[]>>(`/api/student/ai/history${qs ? `?${qs}` : ''}`);
  },

  // ----- Question bank & practice -----
  getQuestions: (params?: {
    topicType?: string;
    difficulty?: string;
    offset?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.topicType) query.set('topicType', params.topicType);
    if (params?.difficulty) query.set('difficulty', params.difficulty);
    if (params?.offset !== undefined) query.set('offset', String(params.offset));
    if (params?.limit !== undefined) query.set('limit', String(params.limit));
    const qs = query.toString();
    return request<ApiResponse<QuestionBankItem[]>>(
      `/api/student/question-bank${qs ? `?${qs}` : ''}`,
    );
  },
  getQuestion: (id: string) =>
    request<ApiResponse<QuestionBankItem>>(`/api/student/question-bank/${id}`),
  submitPractice: (body: {
    questionId?: string;
    content: string;
    durationMs?: number;
    exerciseType: string;
  }) =>
    request<
      ApiResponse<{
        exercise: PracticeExercise;
        feedback: {
          errors: Array<{
            original: string;
            corrected: string;
            type: string;
            explanation: string;
          }>;
        };
      }>
    >('/api/student/practice', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  submitPracticeDeep: (body: {
    questionId?: string;
    content: string;
    durationMs?: number;
    exerciseType: string;
  }) =>
    request<ApiResponse<{ essayId: string }>>('/api/student/practice/deep', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getPracticeHistory: (params?: { offset?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.offset !== undefined) query.set('offset', String(params.offset));
    if (params?.limit !== undefined) query.set('limit', String(params.limit));
    const qs = query.toString();
    return request<ApiResponse<PracticeExercise[]>>(
      `/api/student/practice/history${qs ? `?${qs}` : ''}`,
    );
  },

  // ----- Student dashboard -----
  getStudentDashboard: () =>
    request<
      ApiResponse<{
        pendingTasks: number;
        correctedEssays: number;
        averageScore: number | null;
        quote: DailyQuote | null;
      }>
    >('/api/student/dashboard'),

  // ----- Drafts (cloud sync) -----
  getDraft: (taskId: string) =>
    request<ApiResponse<EssayDraft | null>>(`/api/student/drafts/${taskId}`),
  saveDraft: (taskId: string, body: { content: string; wordCount: number; durationMs: number }) =>
    request<ApiResponse<EssayDraft>>(`/api/student/drafts/${taskId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteDraft: (taskId: string) =>
    request<ApiResponse<null>>(`/api/student/drafts/${taskId}`, { method: 'DELETE' }),

  // ========== Feature 10: Daily Writing Challenge ==========
  getDailyChallengeToday: () =>
    request<
      ApiResponse<{
        challenge: DailyChallenge;
        submission: ChallengeSubmission | null;
        streak: number;
      }>
    >('/api/daily-challenges/today'),
  submitDailyChallenge: (challengeId: string, data: { content: string; durationMs?: number }) =>
    request<
      ApiResponse<{
        submissionId: string;
        score: number;
        scoreTier: string;
        feedback: string;
        streakDays: number;
      }>
    >(`/api/daily-challenges/${challengeId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getDailyChallengeStreak: () =>
    request<ApiResponse<ChallengeStreak & { totalSubmissions: number }>>(
      '/api/daily-challenges/streak',
    ),

  // ========== Feature 11: Writing Material Library ==========
  getWritingMaterials: (params?: {
    type?: string;
    topicType?: string;
    stage?: string;
    difficulty?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) =>
    request<
      ApiResponse<{
        list: WritingMaterial[];
        total: number;
        page: number;
        pageSize: number;
      }>
    >(
      `/api/writing-materials?${new URLSearchParams({
        ...(params?.type ? { type: params.type } : {}),
        ...(params?.topicType ? { topicType: params.topicType } : {}),
        ...(params?.stage ? { stage: params.stage } : {}),
        ...(params?.difficulty ? { difficulty: params.difficulty } : {}),
        ...(params?.keyword ? { keyword: params.keyword } : {}),
        page: String(params?.page ?? 1),
        pageSize: String(params?.pageSize ?? 20),
      }).toString()}`,
    ),

  getWritingMaterial: (id: string) =>
    request<ApiResponse<WritingMaterial>>(`/api/writing-materials/${id}`),

  createWritingMaterial: (data: {
    type: string;
    title: string;
    content: string;
    topicType?: string;
    stage?: string;
    difficulty: string;
    tags?: string[];
    source?: string;
    isPublic?: boolean;
  }) =>
    request<ApiResponse<WritingMaterial>>('/api/writing-materials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateWritingMaterial: (
    id: string,
    data: Partial<{
      type: string;
      title: string;
      content: string;
      topicType?: string;
      stage?: string;
      difficulty: string;
      tags?: string[];
      source?: string;
      isPublic?: boolean;
    }>,
  ) =>
    request<ApiResponse<WritingMaterial>>(`/api/writing-materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteWritingMaterial: (id: string) =>
    request<ApiResponse<null>>(`/api/writing-materials/${id}`, { method: 'DELETE' }),

  favoriteWritingMaterial: (id: string) =>
    request<ApiResponse<{ isFavorited: boolean }>>(`/api/writing-materials/${id}/favorite`, {
      method: 'POST',
    }),

  unfavoriteWritingMaterial: (id: string) =>
    request<ApiResponse<{ isFavorited: boolean }>>(`/api/writing-materials/${id}/favorite`, {
      method: 'DELETE',
    }),

  // ========== Feature 12: Peer Review ==========
  getPendingPeerReviews: () =>
    request<ApiResponse<PeerReviewWithEssay[]>>('/api/peer-reviews/pending'),

  getMyEssayPeerReviews: (essayId: string) =>
    request<ApiResponse<{ reviews: PeerReview[]; summary: PeerReviewSummary }>>(
      `/api/peer-reviews/my-essay/${essayId}`,
    ),

  submitPeerReview: (
    id: string,
    data: {
      contentScore: number;
      languageScore: number;
      structureScore: number;
      handwritingScore: number;
      comment?: string;
      answers?: Array<{ questionId: string; answer: string }>;
    },
  ) =>
    request<ApiResponse<PeerReview>>(`/api/peer-reviews/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
