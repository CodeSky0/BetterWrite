export interface AdminDashboardStats {
  totalSchools: number;
  totalTeachers: number;
  totalStudents: number;
  totalEssays: number;
  todayEssays: number;
  activeRate: number;
  apiCallsToday: number;
  apiCallsTotal: number;
  apiSuccessRate: number;
  apiAvgLatencyMs: number;
}

export interface SchoolWithStats {
  id: string;
  code: string;
  name: string;
  region: string;
  // 学段：junior=初中，senior=高中
  stage: 'junior' | 'senior';
  contactName: string | null;
  contactPhone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalTeachers: number;
  totalStudents: number;
  totalClasses: number;
  totalEssays: number;
  averageScore: number | null;
}

export interface SchoolStats {
  schoolId: string;
  schoolName: string;
  totalTeachers: number;
  totalStudents: number;
  totalClasses: number;
  totalEssays: number;
  averageScore: number | null;
  activeRate: number;
}

export interface ApiConfigItem {
  id: string;
  provider: string;
  apiKeyMasked: string;
  baseUrl: string | null;
  model: string | null;
  isActive: boolean;
  priority: number;
  maxTokens: number | null;
  temperature: number | null;
  rateLimitPerMin: number | null;
  createdAt: string;
  updatedAt: string;
}

// 批改流程环节：与 AI 包中 CorrectionType 一致。每个环节可由超管单独指定使用的 API 配置。
// 说明：AI 写作助手（润色/同义词/语法检查等）复用 language 环节的路由。
export type CorrectionStage = 'content' | 'topicAdherence' | 'language' | 'structure' | 'scorer';

export const CORRECTION_STAGES: ReadonlyArray<{ value: CorrectionStage; label: string }> = [
  { value: 'topicAdherence', label: '题意符合度分析' },
  { value: 'content', label: '内容分析' },
  { value: 'language', label: '语言分析（含 AI 助手）' },
  { value: 'structure', label: '结构分析' },
  { value: 'scorer', label: '综合评分' },
];

// 模型路由配置：为某个批改环节指定首选 API 配置（主模型）；
// 主模型不可用时自动按全局优先级链回退到其余启用的配置。
// apiConfigId 为 null 表示该环节未固定，直接按优先级选择。
// routeStage 为 null 表示该路由适用于所有学段（默认）。
export interface ModelRouteItem {
  routeStage: 'junior' | 'senior' | null;
  seniorEssayType: 'applied_writing' | 'continuation_writing' | null;
  stage: CorrectionStage;
  apiConfigId: string | null;
  provider: string | null;
  model: string | null;
  updatedAt: string | null;
}

export interface ApiCallLogItem {
  id: string;
  provider: string;
  model: string | null;
  endpoint: string | null;
  tokensUsed: number | null;
  latencyMs: number | null;
  cost: number | null;
  status: string | null;
  errorMessage: string | null;
  essayId: string | null;
  createdAt: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  targetRole: string;
  isActive: boolean;
  createdBy: string | null;
  creatorName: string | null;
  createdAt: string;
  updatedAt: string;
}
