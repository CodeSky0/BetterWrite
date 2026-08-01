import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { essayTasks, essays } from './essays.js';
import { users } from './users.js';

/**
 * 教师为每个作文任务配置的同伴互评规则。
 */
export const essayPeerReviewConfigs = sqliteTable(
  'essay_peer_review_configs',
  {
    id: text('id').primaryKey(),
    taskId: text('task_id')
      .notNull()
      .references(() => essayTasks.id, { onDelete: 'cascade' }),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // 是否启用互评
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    // 每篇作文需要被评次数（如 2-3 人）
    reviewsPerEssay: integer('reviews_per_essay').notNull().default(2),
    // 每个学生需要完成的互评份数
    reviewsPerStudent: integer('reviews_per_student').notNull().default(2),
    // 是否匿名互评
    anonymous: integer('anonymous', { mode: 'boolean' }).notNull().default(true),
    // 各评分来源权重：{ ai: 0.6, teacher: 0.3, peer: 0.1 }
    weights: text('weights').default('{"ai":0.6,"teacher":0.3,"peer":0.1}'),
    // 互评截止时间
    dueDate: text('due_date'),
    // 引导性问题（JSON 数组）
    guidingQuestions: text('guiding_questions').default('[]'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    taskIdx: index('essay_peer_review_configs_task_idx').on(t.taskId),
    creatorIdx: index('essay_peer_review_configs_creator_idx').on(t.createdBy),
  }),
);

/**
 * 同伴互评记录：同时作为“分配任务”和“互评结果”。
 */
export const peerReviews = sqliteTable(
  'peer_reviews',
  {
    id: text('id').primaryKey(),
    essayId: text('essay_id')
      .notNull()
      .references(() => essays.id, { onDelete: 'cascade' }),
    reviewerId: text('reviewer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // 四个维度的互评得分（0-100）
    contentScore: integer('content_score'),
    languageScore: integer('language_score'),
    structureScore: integer('structure_score'),
    handwritingScore: integer('handwriting_score'),
    // 互评总分（后端自动计算四维度平均）
    totalScore: integer('total_score'),
    // 评语
    comment: text('comment'),
    // 对引导性问题的回答：[{ questionId, answer }]
    answers: text('answers').default('[]'),
    // pending = 待评, completed = 已完成, skipped = 跳过/驳回
    status: text('status').notNull().default('pending'),
    submittedAt: text('submitted_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    essayIdx: index('peer_reviews_essay_idx').on(t.essayId),
    reviewerIdx: index('peer_reviews_reviewer_idx').on(t.reviewerId),
    statusIdx: index('peer_reviews_status_idx').on(t.status),
    uniqueReview: index('peer_reviews_unique_idx').on(t.essayId, t.reviewerId),
  }),
);

export const essayPeerReviewConfigsRelations = relations(essayPeerReviewConfigs, ({ one }) => ({
  task: one(essayTasks, {
    fields: [essayPeerReviewConfigs.taskId],
    references: [essayTasks.id],
  }),
  creator: one(users, {
    fields: [essayPeerReviewConfigs.createdBy],
    references: [users.id],
  }),
}));

export const peerReviewsRelations = relations(peerReviews, ({ one }) => ({
  essay: one(essays, {
    fields: [peerReviews.essayId],
    references: [essays.id],
  }),
  reviewer: one(users, {
    fields: [peerReviews.reviewerId],
    references: [users.id],
  }),
}));
