import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users.js';

export const teachingResources = sqliteTable(
  'teaching_resources',
  {
    id: text('id').primaryKey(),
    type: text('type').notNull(),
    title: text('title').notNull(),
    topicType: text('topic_type'),
    difficulty: text('difficulty').notNull().default('medium'),
    content: text('content').notNull(),
    highlights: text('highlights').default(''),
    tags: text('tags').default('[]'),
    // AI 结构化解析结果（段落功能、衔接词、亮点句等）
    analysis: text('analysis').default('{}'),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // 学段：junior=初中（默认），senior=高中
    stage: text('stage').notNull().default('junior'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    creatorIdx: index('teaching_resources_creator_idx').on(t.createdBy),
    typeIdx: index('teaching_resources_type_idx').on(t.type),
    stageIdx: index('teaching_resources_stage_idx').on(t.stage),
  }),
);

export const teachingResourcesRelations = relations(teachingResources, ({ one, many }) => ({
  creator: one(users, {
    fields: [teachingResources.createdBy],
    references: [users.id],
  }),
  imitations: many(modelEssayImitations),
}));

// 范文精读后的仿写作文及 AI 批改结果
export const modelEssayImitations = sqliteTable(
  'model_essay_imitations',
  {
    id: text('id').primaryKey(),
    resourceId: text('resource_id')
      .notNull()
      .references(() => teachingResources.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title'),
    content: text('content').notNull(),
    wordCount: integer('word_count').notNull(),
    // 仿写批改状态：pending / correcting / completed / failed
    status: text('status').notNull().default('pending'),
    // AI 批改总评与得分（0-100）
    score: integer('score'),
    // AI 结构化批改结果
    feedback: text('feedback').default('{}'),
    // 教师可选点评
    teacherComment: text('teacher_comment'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    resourceIdx: index('model_essay_imitations_resource_idx').on(t.resourceId),
    studentIdx: index('model_essay_imitations_student_idx').on(t.studentId),
  }),
);

export const modelEssayImitationsRelations = relations(modelEssayImitations, ({ one }) => ({
  resource: one(teachingResources, {
    fields: [modelEssayImitations.resourceId],
    references: [teachingResources.id],
  }),
  student: one(users, {
    fields: [modelEssayImitations.studentId],
    references: [users.id],
  }),
}));
