import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users.js';

/**
 * 微技能定义表 —— 写作能力拆解为细粒度技能点
 * 如：主题句写作、连接词运用、时态一致性等
 */
export const microSkills = sqliteTable(
  'micro_skills',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull().unique(), // e.g. 'topic_sentence', 'transitions'
    name: text('name').notNull(), // 显示名称
    description: text('description').notNull(),
    category: text('category').notNull(), // 'language' | 'structure' | 'content' | 'presentation'
    difficulty: integer('difficulty').notNull().default(1), // 1-5
    sortOrder: integer('sort_order').notNull().default(0),
    icon: text('icon'), // lucide icon name
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    categoryIdx: index('micro_skills_category_idx').on(t.category),
    difficultyIdx: index('micro_skills_difficulty_idx').on(t.difficulty),
  }),
);

/**
 * 微技能练习题表 —— 每个微技能包含多个渐进式练习
 */
export const microExercises = sqliteTable(
  'micro_exercises',
  {
    id: text('id').primaryKey(),
    skillId: text('skill_id')
      .notNull()
      .references(() => microSkills.id, { onDelete: 'cascade' }),
    level: integer('level').notNull(), // 1-5, 渐进难度
    type: text('type').notNull(), // 'choice' | 'fill_blank' | 'rewrite' | 'free_write'
    title: text('title').notNull(),
    instruction: text('instruction').notNull(), // 题目说明
    content: text('content').notNull(), // 题目内容（JSON for choice questions）
    answerKey: text('answer_key'), // 参考答案（JSON）
    aiPromptTemplate: text('ai_prompt_template'), // AI 评分用的 prompt 模板
    maxScore: integer('max_score').notNull().default(10),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    skillIdx: index('micro_exercises_skill_idx').on(t.skillId),
    skillLevelIdx: index('micro_exercises_skill_level_idx').on(t.skillId, t.level),
  }),
);

/**
 * 学生微技能进度表 —— 追踪每个学生在各微技能的完成情况
 */
export const microSkillProgress = sqliteTable(
  'micro_skill_progress',
  {
    id: text('id').primaryKey(),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    skillId: text('skill_id')
      .notNull()
      .references(() => microSkills.id, { onDelete: 'cascade' }),
    currentLevel: integer('current_level').notNull().default(0), // 当前解锁等级
    totalScore: integer('total_score').notNull().default(0),
    completedExercises: integer('completed_exercises').notNull().default(0),
    masteredAt: text('mastered_at'), // 完全掌握的时间
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    studentSkillIdx: index('micro_progress_student_skill_idx').on(t.studentId, t.skillId),
    studentIdx: index('micro_progress_student_idx').on(t.studentId),
  }),
);

/**
 * 微技能练习提交记录
 */
export const microExerciseAttempts = sqliteTable(
  'micro_exercise_attempts',
  {
    id: text('id').primaryKey(),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => microExercises.id, { onDelete: 'cascade' }),
    skillId: text('skill_id')
      .notNull()
      .references(() => microSkills.id, { onDelete: 'cascade' }),
    answer: text('answer').notNull(), // 学生提交的答案
    score: integer('score'), // 得分
    isCorrect: integer('is_correct', { mode: 'boolean' }),
    aiFeedback: text('ai_feedback'), // AI 反馈
    attemptNumber: integer('attempt_number').notNull().default(1),
    durationMs: integer('duration_ms'),
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    studentIdx: index('micro_attempts_student_idx').on(t.studentId),
    exerciseIdx: index('micro_attempts_exercise_idx').on(t.exerciseId),
    studentSkillIdx: index('micro_attempts_student_skill_idx').on(t.studentId, t.skillId),
  }),
);

export const microSkillsRelations = relations(microSkills, ({ many }) => ({
  exercises: many(microExercises),
}));

export const microExercisesRelations = relations(microExercises, ({ one, many }) => ({
  skill: one(microSkills, {
    fields: [microExercises.skillId],
    references: [microSkills.id],
  }),
  attempts: many(microExerciseAttempts),
}));

export const microSkillProgressRelations = relations(microSkillProgress, ({ one }) => ({
  student: one(users, {
    fields: [microSkillProgress.studentId],
    references: [users.id],
  }),
  skill: one(microSkills, {
    fields: [microSkillProgress.skillId],
    references: [microSkills.id],
  }),
}));

export const microExerciseAttemptsRelations = relations(microExerciseAttempts, ({ one }) => ({
  student: one(users, {
    fields: [microExerciseAttempts.studentId],
    references: [users.id],
  }),
  exercise: one(microExercises, {
    fields: [microExerciseAttempts.exerciseId],
    references: [microExercises.id],
  }),
  skill: one(microSkills, {
    fields: [microExerciseAttempts.skillId],
    references: [microSkills.id],
  }),
}));
