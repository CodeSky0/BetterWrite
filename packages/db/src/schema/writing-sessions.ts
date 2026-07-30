import { relations } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { classes } from './classes.js';
import { essayTasks } from './essays.js';
import { users } from './users.js';

/**
 * 写作会话表 —— 记录学生写作过程中的实时数据
 * 用于教师端课堂实时监控
 */
export const writingSessions = sqliteTable(
  'writing_sessions',
  {
    id: text('id').primaryKey(),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    taskId: text('task_id').references(() => essayTasks.id, { onDelete: 'set null' }),
    classId: text('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    currentWordCount: integer('current_word_count').notNull().default(0),
    elapsedTimeMs: integer('elapsed_time_ms').notNull().default(0),
    writingSpeed: real('writing_speed').default(0), // 词/分钟
    isStalled: integer('is_stalled', { mode: 'boolean' }).notNull().default(false),
    lastActiveAt: text('last_active_at').notNull(),
    status: text('status').notNull().default('active'), // 'active' | 'paused' | 'submitted'
    startedAt: text('started_at').notNull(),
    submittedAt: text('submitted_at'),
  },
  (t) => ({
    studentIdx: index('writing_sessions_student_idx').on(t.studentId),
    classIdx: index('writing_sessions_class_idx').on(t.classId),
    taskIdx: index('writing_sessions_task_idx').on(t.taskId),
    classStatusIdx: index('writing_sessions_class_status_idx').on(t.classId, t.status),
  }),
);

export const writingSessionsRelations = relations(writingSessions, ({ one }) => ({
  student: one(users, {
    fields: [writingSessions.studentId],
    references: [users.id],
  }),
  task: one(essayTasks, {
    fields: [writingSessions.taskId],
    references: [essayTasks.id],
  }),
  class: one(classes, {
    fields: [writingSessions.classId],
    references: [classes.id],
  }),
}));
