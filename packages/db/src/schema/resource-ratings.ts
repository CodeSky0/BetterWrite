import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { users } from './users.js';

/**
 * 资源评分表 —— 教师对公共题库/资源的评分
 */
export const resourceRatings = sqliteTable(
  'resource_ratings',
  {
    id: text('id').primaryKey(),
    resourceId: text('resource_id').notNull(), // 关联 question_bank 或 teaching_resources
    resourceType: text('resource_type').notNull(), // 'question' | 'resource'
    raterId: text('rater_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    score: integer('score').notNull(), // 1-5
    comment: text('comment'),
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    resourceIdx: index('resource_ratings_resource_idx').on(t.resourceId, t.resourceType),
    raterIdx: index('resource_ratings_rater_idx').on(t.raterId),
    uniqueRating: uniqueIndex('resource_ratings_unique_idx').on(
      t.resourceId,
      t.resourceType,
      t.raterId,
    ),
  }),
);

/**
 * 资源评论表 —— 教师对公共题库/资源的评论
 */
export const resourceComments = sqliteTable(
  'resource_comments',
  {
    id: text('id').primaryKey(),
    resourceId: text('resource_id').notNull(),
    resourceType: text('resource_type').notNull(),
    authorId: text('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    resourceIdx: index('resource_comments_resource_idx').on(t.resourceId, t.resourceType),
    authorIdx: index('resource_comments_author_idx').on(t.authorId),
  }),
);

export const resourceRatingsRelations = relations(resourceRatings, ({ one }) => ({
  rater: one(users, {
    fields: [resourceRatings.raterId],
    references: [users.id],
  }),
}));

export const resourceCommentsRelations = relations(resourceComments, ({ one }) => ({
  author: one(users, {
    fields: [resourceComments.authorId],
    references: [users.id],
  }),
}));
