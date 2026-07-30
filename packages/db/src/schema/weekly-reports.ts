import { relations } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users.js';

/**
 * 学习周报表 —— 每周自动生成的学生个性化学习报告
 */
export const weeklyReports = sqliteTable(
  'weekly_reports',
  {
    id: text('id').primaryKey(),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    weekStart: text('week_start').notNull(), // ISO date: '2026-07-27'
    weekEnd: text('week_end').notNull(),
    // 本周统计
    essaysSubmitted: integer('essays_submitted').notNull().default(0),
    averageScore: real('average_score'),
    previousAverageScore: real('previous_average_score'),
    // 错题变化
    errorsResolved: text('errors_resolved').default('[]'), // JSON: string[]
    newErrors: text('new_errors').default('[]'), // JSON: string[]
    // 能力维度变化
    abilityChanges: text('ability_changes').default('{}'), // JSON: { content: +0.5, language: -0.3, ... }
    // AI 生成的个性化建议
    aiSuggestion: text('ai_suggestion'),
    // 推荐练习
    recommendedExercises: text('recommended_exercises').default('[]'), // JSON: string[]
    // 生成状态
    status: text('status').notNull().default('pending'), // 'pending' | 'generated' | 'failed'
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    studentIdx: index('weekly_reports_student_idx').on(t.studentId),
    weekIdx: index('weekly_reports_week_idx').on(t.weekStart),
    studentWeekIdx: index('weekly_reports_student_week_idx').on(t.studentId, t.weekStart),
  }),
);

export const weeklyReportsRelations = relations(weeklyReports, ({ one }) => ({
  student: one(users, {
    fields: [weeklyReports.studentId],
    references: [users.id],
  }),
}));
