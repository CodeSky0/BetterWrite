import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users.js';

/**
 * 学习路径推荐表 —— AI 生成的个性化每周学习计划
 */
export const learningPaths = sqliteTable(
  'learning_paths',
  {
    id: text('id').primaryKey(),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    weekStart: text('week_start').notNull(), // ISO date
    weekEnd: text('week_end').notNull(),
    // 基于分析的学生薄弱点
    weakPoints: text('weak_points').default('[]'), // JSON: string[]
    // 推荐练习列表 JSON: Array<{ type, id, title, reason, priority }>
    recommendations: text('recommendations').default('[]'),
    // AI 生成的个性化建议文案
    aiAdvice: text('ai_advice'),
    // 完成情况
    completedCount: integer('completed_count').notNull().default(0),
    totalRecommendations: integer('total_recommendations').notNull().default(0),
    status: text('status').notNull().default('active'), // 'active' | 'completed' | 'expired'
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    studentIdx: index('learning_paths_student_idx').on(t.studentId),
    weekIdx: index('learning_paths_week_idx').on(t.weekStart),
    studentWeekIdx: index('learning_paths_student_week_idx').on(t.studentId, t.weekStart),
  }),
);

export const learningPathsRelations = relations(learningPaths, ({ one }) => ({
  student: one(users, {
    fields: [learningPaths.studentId],
    references: [users.id],
  }),
}));
