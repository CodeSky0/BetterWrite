import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * 中考真题历史数据表 —— 存储近10年深圳中考英语作文真题
 * 用于考试预测和备考对标分析
 */
export const examHistory = sqliteTable(
  'exam_history',
  {
    id: text('id').primaryKey(),
    year: integer('year').notNull(), // 2016-2026
    topicType: text('topic_type').notNull(), // letter/speech/argumentation/narration/proposal
    topicCategory: text('topic_category').notNull(), // school_life/social_issues/culture/tech/growth/travel
    title: text('title').notNull(), // 作文题目
    requirements: text('requirements').notNull(), // 题目要求全文
    keyPoints: text('key_points').default('[]'), // JSON: string[] 评分要点
    wordLimitMin: integer('word_limit_min').default(80).notNull(),
    wordLimitMax: integer('word_limit_max').default(125).notNull(),
    // 趋势分析标签
    tags: text('tags').default('[]'), // JSON: string[] 如 ['本土化', '开放性', '真实情境']
    // 范文
    modelEssay: text('model_essay'),
    // 命题趋势分析
    trendNotes: text('trend_notes'),
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    yearIdx: index('exam_history_year_idx').on(t.year),
    topicTypeIdx: index('exam_history_topic_type_idx').on(t.topicType),
    topicCategoryIdx: index('exam_history_topic_category_idx').on(t.topicCategory),
  }),
);
