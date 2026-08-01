import { relations } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users.js';

/**
 * 每日写作挑战题目表
 */
export const dailyChallenges = sqliteTable(
  'daily_challenges',
  {
    id: text('id').primaryKey(),
    // 挑战日期，格式 YYYY-MM-DD，每天每学段唯一
    challengeDate: text('challenge_date').notNull(),
    // 学段：junior=初中，senior=高中
    stage: text('stage').notNull().default('junior'),
    // 挑战类型：sentence_rewrite / dialogue / continuation / translation / free_write
    type: text('type').notNull(),
    title: text('title').notNull(),
    instruction: text('instruction').notNull(),
    // 题目内容/提示词
    content: text('content').notNull(),
    // 参考答案或范文
    referenceAnswer: text('reference_answer'),
    // 建议字数
    suggestedWords: integer('suggested_words').default(50),
    // 难度 1-5
    difficulty: integer('difficulty').notNull().default(1),
    // 话题类型
    topicType: text('topic_type'),
    topicCategory: text('topic_category'),
    // 是否启用
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    dateIdx: index('daily_challenges_date_idx').on(t.challengeDate),
    stageIdx: index('daily_challenges_stage_idx').on(t.stage),
    dateStageIdx: index('daily_challenges_date_stage_idx').on(t.challengeDate, t.stage),
  }),
);

/**
 * 每日挑战提交记录表
 */
export const challengeSubmissions = sqliteTable(
  'challenge_submissions',
  {
    id: text('id').primaryKey(),
    challengeId: text('challenge_id')
      .notNull()
      .references(() => dailyChallenges.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    wordCount: integer('word_count').notNull(),
    // AI 快速评分 0-100
    score: real('score'),
    // 评分等级
    scoreTier: text('score_tier'),
    // AI 反馈 JSON
    aiFeedback: text('ai_feedback').default('{}'),
    // 完成耗时 ms
    durationMs: integer('duration_ms'),
    // 连续打卡天数（提交时根据历史计算）
    streakDays: integer('streak_days').notNull().default(1),
    submittedAt: text('submitted_at').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    challengeIdx: index('challenge_submissions_challenge_idx').on(t.challengeId),
    studentIdx: index('challenge_submissions_student_idx').on(t.studentId),
    studentDateIdx: index('challenge_submissions_student_date_idx').on(t.studentId, t.submittedAt),
  }),
);

export const dailyChallengesRelations = relations(dailyChallenges, ({ many }) => ({
  submissions: many(challengeSubmissions),
}));

export const challengeSubmissionsRelations = relations(challengeSubmissions, ({ one }) => ({
  challenge: one(dailyChallenges, {
    fields: [challengeSubmissions.challengeId],
    references: [dailyChallenges.id],
  }),
  student: one(users, {
    fields: [challengeSubmissions.studentId],
    references: [users.id],
  }),
}));
