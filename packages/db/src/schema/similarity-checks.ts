import { relations } from 'drizzle-orm';
import { index, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { essays } from './essays.js';
import { users } from './users.js';

/**
 * 查重检测结果表 —— 作文相似度与 AI 代写检测
 */
export const similarityChecks = sqliteTable(
  'similarity_checks',
  {
    id: text('id').primaryKey(),
    essayId: text('essay_id')
      .notNull()
      .references(() => essays.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // 相似度检测结果
    overallSimilarity: real('overall_similarity'), // 0-1, 最高相似度
    matchedEssayIds: text('matched_essay_ids').default('[]'), // JSON: string[]
    matchedDetails: text('matched_details').default('[]'), // JSON: { essayId, studentName, similarity, matchedParagraphs }
    // AI 代写检测
    aiGeneratedScore: real('ai_generated_score'), // 0-1, AI 生成可能性
    aiDetectionDetails: text('ai_detection_details').default('[]'), // JSON: { paragraph, score, indicators }
    // 综合判定
    riskLevel: text('risk_level'), // 'low' | 'medium' | 'high'
    teacherNote: text('teacher_note'),
    status: text('status').notNull().default('pending'), // 'pending' | 'completed' | 'failed'
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    essayIdx: index('similarity_checks_essay_idx').on(t.essayId),
    studentIdx: index('similarity_checks_student_idx').on(t.studentId),
    riskIdx: index('similarity_checks_risk_idx').on(t.riskLevel),
  }),
);

export const similarityChecksRelations = relations(similarityChecks, ({ one }) => ({
  essay: one(essays, {
    fields: [similarityChecks.essayId],
    references: [essays.id],
  }),
  student: one(users, {
    fields: [similarityChecks.studentId],
    references: [users.id],
  }),
}));
