import { clientLogger } from '@/lib/client-logger';
import type { ClassAnalytics, StudentAnalytics } from '@betterwrite/shared';
import type {
  Achievement,
  AdminDashboardStats,
  AiAssistantResult,
  AiConversation,
  AnnouncementItem,
  ApiCallLogItem,
  ApiConfigItem,
  ChallengeStreak,
  ChallengeSubmission,
  ClassroomMonitorData,
  CorrectionStage,
  DailyChallenge,
  DailyQuote,
  ErrorBookGroup,
  ErrorBookItem,
  EssayDraft,
  EssayVersion,
  ExamForecast,
  ExamHistoryItem,
  LearningPath,
  MicroExercise,
  MicroExerciseResult,
  MicroSkill,
  ModelRouteItem,
  NotificationLog,
  PracticeExercise,
  PublicQuestionWithStats,
  QuestionBankItem,
  SchoolStats,
  SchoolWithStats,
  SimilarityCheckResult,
  StudentProgress,
  WeeklyReport,
  WritingMaterial,
} from '@betterwrite/shared';
import type {
  AiGeneratedTask,
  ApiResponse,
  AuthUserResponse,
  CorrectionDetail,
  Essay,
  EssayTask,
  ImportResult,
  StudentDetail,
  StudentListItem,
  TeachingResourceWithCreator,
} from './fetcher-types';

export type {
  AiGeneratedTask,
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
} from './fetcher-types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

// Bug #UX-4.1: 请求超时（30s），避免慢网络用户无限等待。
const REQUEST_TIMEOUT_MS = 30_000;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { headers: callerHeaders, signal: callerSignal, ...restOptions } = options ?? {};
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // 如果调用方也传了 signal，联动取消
  if (callerSignal) {
    callerSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...restOptions,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...((callerHeaders as Record<string, string>) ?? {}),
      },
    });

    if (!res.ok) {
      let errorMessage = `请求失败 (${res.status})`;
      try {
        const body = (await res.json()) as { error?: string };
        if (body?.error) errorMessage = body.error;
      } catch {
        // 响应体不是 JSON（如网关返回的 HTML 错误页）
      }
      throw new Error(errorMessage);
    }

    const data = (await res.json()) as T;
    return data;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('请求超时，请检查网络后重试');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export const fetcher = {
  login: (email: string, password: string) =>
    request<ApiResponse<AuthUserResponse>>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: {
    email: string;
    password: string;
    name: string;
    role: string;
    schoolCode?: string;
    classCode?: string;
  }) =>
    request<ApiResponse<AuthUserResponse>>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
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
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<ApiResponse<null>>('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Essays
  submitEssay: (data: { content: string; taskId?: string; title?: string }) =>
    request<ApiResponse<Essay>>('/api/essays', { method: 'POST', body: JSON.stringify(data) }),
  listMyEssays: () => request<ApiResponse<Essay[]>>('/api/essays/my'),
  getEssay: (id: string) => request<ApiResponse<Essay>>(`/api/essays/${id}`),
  getCorrection: (id: string) =>
    request<ApiResponse<CorrectionDetail>>(`/api/essays/${id}/correction`),
  reviewEssay: (id: string, data: { teacherReview?: string; teacherScore?: number }) =>
    request<ApiResponse<Essay>>(`/api/essays/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Tasks
  listTasks: () => request<ApiResponse<EssayTask[]>>('/api/tasks'),
  getTask: (id: string) => request<ApiResponse<EssayTask>>(`/api/tasks/${id}`),

  // Teacher dashboard
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

  createTask: (data: {
    title: string;
    topicType: string;
    requirements: string;
    keyPoints: string[];
    classId: string;
    wordLimitMin: number;
    wordLimitMax: number;
    dueDate?: string;
  }) =>
    request<ApiResponse<EssayTask>>('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
  aiGenerateTask: (data: {
    topic: string;
    topicType?: string;
    gradeLevel?: string;
    wordLimitMin?: number;
    wordLimitMax?: number;
  }) =>
    request<ApiResponse<AiGeneratedTask>>('/api/tasks/ai-generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  publishTask: (id: string) =>
    request<ApiResponse<EssayTask>>(`/api/tasks/${id}/publish`, { method: 'PUT' }),
  closeTask: (id: string) =>
    request<ApiResponse<EssayTask>>(`/api/tasks/${id}/close`, { method: 'PUT' }),

  // Analytics
  getClassAnalytics: (classId: string) =>
    request<ApiResponse<ClassAnalytics>>(`/api/teacher/analytics/class/${classId}`),

  getStudentAnalytics: (studentId: string) =>
    request<ApiResponse<StudentAnalytics>>(`/api/teacher/analytics/student/${studentId}`),

  exportClassAnalytics: async (classId: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/api/teacher/analytics/class/${classId}/export`, {
      credentials: 'include',
    });
    if (!res.ok) {
      clientLogger.warn(`[Fetcher] exportClassAnalytics failed status=${res.status}`);
      throw new Error('导出失败');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class-${classId}-essays.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  },

  // Students
  listStudents: (params?: { classId?: string; keyword?: string }) => {
    const query = new URLSearchParams();
    if (params?.classId) query.set('classId', params.classId);
    if (params?.keyword) query.set('keyword', params.keyword);
    const qs = query.toString();
    return request<ApiResponse<StudentListItem[]>>(`/api/teacher/students${qs ? `?${qs}` : ''}`);
  },

  getStudentDetail: (id: string) =>
    request<ApiResponse<StudentDetail>>(`/api/teacher/students/${id}`),

  importStudents: (data: { classId: string; csv: string }) =>
    request<ApiResponse<ImportResult>>('/api/teacher/students/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStudentTag: (id: string, tag: string) =>
    request<ApiResponse<{ studentId: string; tag: string }>>(`/api/teacher/students/${id}/tags`, {
      method: 'PATCH',
      body: JSON.stringify({ tag }),
    }),

  // Teaching Resources
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

  createResource: (data: {
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
      body: JSON.stringify(data),
    }),

  updateResource: (
    id: string,
    data: {
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
      body: JSON.stringify(data),
    }),

  deleteResource: (id: string) =>
    request<ApiResponse<null>>(`/api/teacher/resources/${id}`, { method: 'DELETE' }),

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

  getStudentProgress: () => request<ApiResponse<StudentProgress>>('/api/student/progress'),
  getAchievements: () => request<ApiResponse<Achievement[]>>('/api/student/achievements'),

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
  submitPractice: (data: {
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
      body: JSON.stringify(data),
    }),
  submitPracticeDeep: (data: {
    questionId?: string;
    content: string;
    durationMs?: number;
    exerciseType: string;
  }) =>
    request<ApiResponse<{ essayId: string }>>('/api/student/practice/deep', {
      method: 'POST',
      body: JSON.stringify(data),
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

  getStudentDashboard: () =>
    request<
      ApiResponse<{
        pendingTasks: number;
        correctedEssays: number;
        averageScore: number | null;
        quote: DailyQuote | null;
      }>
    >('/api/student/dashboard'),
  getDraft: (taskId: string) =>
    request<ApiResponse<EssayDraft | null>>(`/api/student/drafts/${taskId}`),
  saveDraft: (taskId: string, data: { content: string; wordCount: number; durationMs: number }) =>
    request<ApiResponse<EssayDraft>>(`/api/student/drafts/${taskId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteDraft: (taskId: string) =>
    request<ApiResponse<null>>(`/api/student/drafts/${taskId}`, { method: 'DELETE' }),

  // Admin: Dashboard
  getAdminDashboardStats: () =>
    request<ApiResponse<AdminDashboardStats>>('/api/admin/dashboard/stats'),

  // Admin: Schools
  listAdminSchools: (params?: { region?: string; offset?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.region) query.set('region', params.region);
    if (params?.offset !== undefined) query.set('offset', String(params.offset));
    if (params?.limit !== undefined) query.set('limit', String(params.limit));
    const qs = query.toString();
    return request<ApiResponse<SchoolWithStats[]>>(`/api/admin/schools${qs ? `?${qs}` : ''}`);
  },
  createAdminSchool: (data: {
    code: string;
    name: string;
    region: string;
    contactName?: string;
    contactPhone?: string;
  }) =>
    request<ApiResponse<{ id: string }>>('/api/admin/schools', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAdminSchool: (
    id: string,
    data: {
      code?: string;
      name?: string;
      region?: string;
      contactName?: string;
      contactPhone?: string;
      isActive?: boolean;
    },
  ) =>
    request<ApiResponse<null>>(`/api/admin/schools/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteAdminSchool: (id: string) =>
    request<ApiResponse<null>>(`/api/admin/schools/${id}`, { method: 'DELETE' }),
  getAdminSchoolStats: (id: string) =>
    request<ApiResponse<SchoolStats>>(`/api/admin/schools/${id}/stats`),

  // Admin: API Configs
  listAdminApiConfigs: () => request<ApiResponse<ApiConfigItem[]>>('/api/admin/api-configs'),
  createAdminApiConfig: (data: {
    provider: string;
    apiKey: string;
    baseUrl?: string;
    model?: string;
    isActive?: boolean;
    priority?: number;
    maxTokens?: number;
    temperature?: number;
    rateLimitPerMin?: number;
  }) =>
    request<ApiResponse<{ id: string }>>('/api/admin/api-configs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAdminApiConfig: (
    id: string,
    data: {
      provider?: string;
      apiKey?: string;
      baseUrl?: string;
      model?: string;
      isActive?: boolean;
      priority?: number;
      maxTokens?: number;
      temperature?: number;
      rateLimitPerMin?: number;
    },
  ) =>
    request<ApiResponse<null>>(`/api/admin/api-configs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteAdminApiConfig: (id: string) =>
    request<ApiResponse<null>>(`/api/admin/api-configs/${id}`, { method: 'DELETE' }),

  // Admin: Model Routes（各批改环节的首选模型配置）
  listAdminModelRoutes: () => request<ApiResponse<ModelRouteItem[]>>('/api/admin/model-routes'),
  saveAdminModelRoutes: (routes: { stage: CorrectionStage; apiConfigId: string | null }[]) =>
    request<ApiResponse<null>>('/api/admin/model-routes', {
      method: 'PUT',
      body: JSON.stringify({ routes }),
    }),

  // Admin: API Logs
  listAdminApiLogs: (params?: {
    provider?: string;
    dateFrom?: string;
    dateTo?: string;
    offset?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.provider) query.set('provider', params.provider);
    if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
    if (params?.dateTo) query.set('dateTo', params.dateTo);
    if (params?.offset !== undefined) query.set('offset', String(params.offset));
    if (params?.limit !== undefined) query.set('limit', String(params.limit));
    const qs = query.toString();
    return request<ApiResponse<ApiCallLogItem[]>>(`/api/admin/api-logs${qs ? `?${qs}` : ''}`);
  },

  // Admin: Announcements
  listAdminAnnouncements: () =>
    request<ApiResponse<AnnouncementItem[]>>('/api/admin/announcements'),
  createAdminAnnouncement: (data: {
    title: string;
    content: string;
    targetRole?: string;
    isActive?: boolean;
  }) =>
    request<ApiResponse<{ id: string }>>('/api/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAdminAnnouncement: (
    id: string,
    data: {
      title?: string;
      content?: string;
      targetRole?: string;
      isActive?: boolean;
    },
  ) =>
    request<ApiResponse<null>>(`/api/admin/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteAdminAnnouncement: (id: string) =>
    request<ApiResponse<null>>(`/api/admin/announcements/${id}`, { method: 'DELETE' }),

  // Admin: Question Bank
  listAdminQuestions: (params?: {
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
      `/api/admin/question-bank${qs ? `?${qs}` : ''}`,
    );
  },
  createAdminQuestion: (data: {
    topicType: string;
    title: string;
    requirements: string;
    topicCategory?: string;
    keyPoints?: string[];
    modelEssay?: string;
    wordLimitMin?: number;
    wordLimitMax?: number;
    timeLimitMinutes?: number;
    difficulty?: string;
    source?: string;
  }) =>
    request<ApiResponse<{ id: string }>>('/api/admin/question-bank', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAdminQuestion: (
    id: string,
    data: {
      topicType?: string;
      title?: string;
      requirements?: string;
      topicCategory?: string;
      keyPoints?: string[];
      modelEssay?: string;
      wordLimitMin?: number;
      wordLimitMax?: number;
      timeLimitMinutes?: number;
      difficulty?: string;
      source?: string;
    },
  ) =>
    request<ApiResponse<null>>(`/api/admin/question-bank/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteAdminQuestion: (id: string) =>
    request<ApiResponse<null>>(`/api/admin/question-bank/${id}`, { method: 'DELETE' }),

  // Admin: Scoring Config (read-only)
  getAdminScoringConfig: () =>
    request<
      ApiResponse<{
        scoringWeights: {
          content: number;
          language: number;
          structure: number;
          presentation: number;
        };
        scoreTiers: Array<{ tier: string; label: string; min: number; max: number }>;
        deductionRules: Record<string, unknown>;
      }>
    >('/api/admin/scoring-config'),

  // ========== Feature 1: Essay Versions ==========
  submitEssayVersion: (essayId: string, data: { content: string; title?: string }) =>
    request<ApiResponse<EssayVersion>>(`/api/essays/${essayId}/versions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getEssayVersions: (essayId: string) =>
    request<ApiResponse<EssayVersion[]>>(`/api/essays/${essayId}/versions`),

  // ========== Feature 2: Micro Skills ==========
  getMicroSkills: () =>
    request<ApiResponse<Array<MicroSkill & { totalExercises: number }>>>(
      '/api/student/micro-skills',
    ),
  getMicroSkillExercises: (skillId: string) =>
    request<ApiResponse<Array<MicroExercise & { isCompleted: boolean }>>>(
      `/api/student/micro-skills/${skillId}/exercises`,
    ),
  submitMicroExercise: (
    skillId: string,
    exerciseId: string,
    data: { answer: string; durationMs?: number },
  ) =>
    request<ApiResponse<MicroExerciseResult>>(
      `/api/student/micro-skills/${skillId}/exercises/${exerciseId}/submit`,
      { method: 'POST', body: JSON.stringify(data) },
    ),

  // ========== Feature 3: Classroom Monitor ==========
  updateWritingSession: (data: {
    taskId?: string;
    classId: string;
    currentWordCount: number;
    elapsedTimeMs: number;
    writingSpeed: number;
    isStalled?: boolean;
    status?: 'active' | 'paused' | 'submitted';
  }) =>
    request<ApiResponse<{ id: string }>>('/api/writing/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getClassroomMonitor: (classId: string) =>
    request<ApiResponse<ClassroomMonitorData>>(`/api/teacher/writing-monitor/${classId}`),

  // ========== Feature 4: Weekly Reports ==========
  getWeeklyReports: () => request<ApiResponse<WeeklyReport[]>>('/api/student/weekly-report'),
  generateWeeklyReports: (classId: string) =>
    request<
      ApiResponse<{ generated: number; classId: string; weekStart: string; weekEnd: string }>
    >('/api/teacher/weekly-reports/generate', {
      method: 'POST',
      body: JSON.stringify({ classId }),
    }),

  // ========== Feature 5: Similarity Check ==========
  triggerSimilarityCheck: (essayId: string) =>
    request<ApiResponse<SimilarityCheckResult>>(`/api/essays/${essayId}/similarity-check`, {
      method: 'POST',
    }),
  getSimilarityCheck: (essayId: string) =>
    request<ApiResponse<SimilarityCheckResult | null>>(`/api/essays/${essayId}/similarity-check`),

  // ========== Feature 6: Collaborative Question Bank ==========
  getPublicQuestions: (params?: {
    topicType?: string;
    difficulty?: string;
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.topicType) query.set('topicType', params.topicType);
    if (params?.difficulty) query.set('difficulty', params.difficulty);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const qs = query.toString();
    return request<ApiResponse<PublicQuestionWithStats[]>>(
      `/api/teacher/public-questions${qs ? `?${qs}` : ''}`,
    );
  },
  rateResource: (
    resourceId: string,
    data: { resourceType: 'question' | 'resource'; score: number; comment?: string },
  ) =>
    request<ApiResponse<{ id: string }>>(`/api/teacher/resources/${resourceId}/rate`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  commentResource: (
    resourceId: string,
    data: { resourceType: 'question' | 'resource'; content: string },
  ) =>
    request<ApiResponse<{ id: string }>>(`/api/teacher/resources/${resourceId}/comment`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ========== Feature 7: Learning Path ==========
  getLearningPath: () => request<ApiResponse<LearningPath>>('/api/student/learning-path'),

  // ========== Feature 8: Exam Forecast ==========
  getExamForecast: (classId: string) =>
    request<ApiResponse<ExamForecast>>(`/api/teacher/exam-forecast/${classId}`),
  getAdminExamHistory: () => request<ApiResponse<ExamHistoryItem[]>>('/api/admin/exam-history'),
  createAdminExamHistory: (data: {
    year: number;
    topicType: string;
    topicCategory: string;
    title: string;
    requirements: string;
    keyPoints?: string[];
    wordLimitMin?: number;
    wordLimitMax?: number;
    tags?: string[];
    modelEssay?: string;
    trendNotes?: string;
  }) =>
    request<ApiResponse<{ id: string }>>('/api/admin/exam-history', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ========== Feature 9: Smart Push Notifications ==========
  getNotifications: (params?: { offset?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.offset !== undefined) query.set('offset', String(params.offset));
    if (params?.limit !== undefined) query.set('limit', String(params.limit));
    const qs = query.toString();
    return request<
      ApiResponse<{
        items: NotificationLog[];
        total: number;
        unread: number;
      }>
    >(`/api/notifications${qs ? `?${qs}` : ''}`);
  },
  markNotificationRead: (id: string) =>
    request<ApiResponse<null>>(`/api/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () =>
    request<ApiResponse<null>>('/api/notifications/read-all', { method: 'POST' }),

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
};
