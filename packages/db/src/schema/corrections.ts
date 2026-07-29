import { relations } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { essays } from './essays.js';

export const corrections = sqliteTable(
  'corrections',
  {
    id: text('id').primaryKey(),
    essayId: text('essay_id')
      .notNull()
      .references(() => essays.id, { onDelete: 'cascade' }),
    topicAdherenceScore: real('topic_adherence_score'),
    contentScore: real('content_score'),
    languageScore: real('language_score'),
    structureScore: real('structure_score'),
    presentationScore: real('presentation_score'),
    totalScore: real('total_score'),
    scoreTier: text('score_tier'),
    errors: text('errors').default('[]'),
    errorStats: text('error_stats').default('{}'),
    highlights: text('highlights').default('[]'),
    sentenceAnalysis: text('sentence_analysis').default('[]'),
    revisedEssay: text('revised_essay'),
    suggestions: text('suggestions').default('[]'),
    aiProvider: text('ai_provider'),
    aiModel: text('ai_model'),
    correctionTimeMs: integer('correction_time_ms'),
    // 学段标识：junior=初中，senior=高中
    stage: text('stage').notNull().default('junior'),
    // 高中题型（仅高中使用）
    seniorEssayType: text('senior_essay_type'),
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    essayIdx: index('corrections_essay_idx').on(t.essayId),
    // Composite indexes for analytics queries
    scoreTierIdx: index('corrections_score_tier_idx').on(t.scoreTier),
    createdAtIdx: index('corrections_created_at_idx').on(t.createdAt),
    stageIdx: index('corrections_stage_idx').on(t.stage),
  }),
);

export const correctionsRelations = relations(corrections, ({ one }) => ({
  essay: one(essays, {
    fields: [corrections.essayId],
    references: [essays.id],
  }),
}));
