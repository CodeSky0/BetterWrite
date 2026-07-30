import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { practiceExercises } from './practice-exercises.js';

export const questionBank = sqliteTable(
  'question_bank',
  {
    id: text('id').primaryKey(),
    topicType: text('topic_type').notNull(),
    topicCategory: text('topic_category'),
    title: text('title').notNull(),
    requirements: text('requirements').notNull(),
    keyPoints: text('key_points').default('[]'),
    referenceEssay: text('reference_essay'),
    wordLimitMin: integer('word_limit_min').default(80).notNull(),
    wordLimitMax: integer('word_limit_max').default(125).notNull(),
    timeLimitMinutes: integer('time_limit_minutes').default(15),
    difficulty: text('difficulty').default('medium'),
    source: text('source'),
    isPublic: integer('is_public').default(1),
    // 学段：junior=初中（默认），senior=高中
    stage: text('stage').notNull().default('junior'),
    // 高中题型（仅高中使用）
    seniorEssayType: text('senior_essay_type'),
    // 出题人（用于公共题库展示）
    createdBy: text('created_by'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    topicTypeIdx: index('question_bank_topic_type_idx').on(t.topicType),
    difficultyIdx: index('question_bank_difficulty_idx').on(t.difficulty),
    stageIdx: index('question_bank_stage_idx').on(t.stage),
  }),
);

export const questionBankRelations = relations(questionBank, ({ many }) => ({
  practiceExercises: many(practiceExercises),
}));
