import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { classes } from './classes.js';
import { users } from './users.js';

export const schools = sqliteTable('schools', {
  id: text('id').primaryKey(),
  code: text('code').notNull().default('').unique(),
  name: text('name').notNull(),
  region: text('region').notNull(),
  // 学段：junior=初中，senior=高中
  stage: text('stage').notNull().default('junior'),
  contactName: text('contact_name'),
  contactPhone: text('contact_phone'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const schoolsRelations = relations(schools, ({ many }) => ({
  users: many(users),
  classes: many(classes),
}));
