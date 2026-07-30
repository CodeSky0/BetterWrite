import { relations } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { essays } from './essays.js';
import { users } from './users.js';

/**
 * 作文版本表 —— 支持作文升格训练（V1 -> V2 -> V3）
 * 每次学生根据批改反馈修改后提交新版本，系统追踪分数变化轨迹。
 */
export const essayVersions = sqliteTable(
  'essay_versions',
  {
    id: text('id').primaryKey(),
    essayId: text('essay_id')
      .notNull()
      .references(() => essays.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull(), // 1, 2, 3...
    content: text('content').notNull(),
    wordCount: integer('word_count').notNull(),
    score: real('score'),
    scoreTier: text('score_tier'),
    correctionId: text('correction_id'),
    // 与上一版本的差异摘要（JSON: { added: string[], removed: string[], changed: number }）
    diffSummary: text('diff_summary').default('{}'),
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    essayIdx: index('essay_versions_essay_idx').on(t.essayId),
    studentIdx: index('essay_versions_student_idx').on(t.studentId),
    essayVersionIdx: index('essay_versions_essay_version_idx').on(t.essayId, t.versionNumber),
  }),
);

export const essayVersionsRelations = relations(essayVersions, ({ one }) => ({
  essay: one(essays, {
    fields: [essayVersions.essayId],
    references: [essays.id],
  }),
  student: one(users, {
    fields: [essayVersions.studentId],
    references: [users.id],
  }),
}));
