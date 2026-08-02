import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { schools } from './schools.js';
import { users } from './users.js';

export const writingMaterials = sqliteTable(
  'writing_materials',
  {
    id: text('id').primaryKey(),
    type: text('type').notNull(), // phrase, sentence_pattern, connector, template, argument, idiom
    title: text('title').notNull(),
    content: text('content').notNull(),
    topicType: text('topic_type'),
    stage: text('stage').notNull().default('junior'), // junior, senior
    difficulty: text('difficulty').notNull().default('medium'), // easy, medium, hard
    tags: text('tags').default('[]'),
    source: text('source'),
    usageCount: integer('usage_count').notNull().default(0),
    isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(true),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    schoolId: text('school_id').references(() => schools.id, { onDelete: 'cascade' }),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => ({
    typeIdx: index('writing_materials_type_idx').on(t.type),
    stageIdx: index('writing_materials_stage_idx').on(t.stage),
    topicIdx: index('writing_materials_topic_idx').on(t.topicType),
    publicIdx: index('writing_materials_public_idx').on(t.isPublic),
    creatorIdx: index('writing_materials_creator_idx').on(t.createdBy),
    schoolIdx: index('writing_materials_school_idx').on(t.schoolId),
  }),
);

export const writingMaterialsRelations = relations(writingMaterials, ({ one, many }) => ({
  creator: one(users, {
    fields: [writingMaterials.createdBy],
    references: [users.id],
  }),
  school: one(schools, {
    fields: [writingMaterials.schoolId],
    references: [schools.id],
  }),
  favorites: many(studentMaterialFavorites),
}));

export const studentMaterialFavorites = sqliteTable(
  'student_material_favorites',
  {
    id: text('id').primaryKey(),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    materialId: text('material_id')
      .notNull()
      .references(() => writingMaterials.id, { onDelete: 'cascade' }),
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    studentIdx: index('student_material_favorites_student_idx').on(t.studentId),
    materialIdx: index('student_material_favorites_material_idx').on(t.materialId),
    uniqueFavorite: index('student_material_favorites_unique_idx').on(t.studentId, t.materialId),
  }),
);

export const studentMaterialFavoritesRelations = relations(studentMaterialFavorites, ({ one }) => ({
  student: one(users, {
    fields: [studentMaterialFavorites.studentId],
    references: [users.id],
  }),
  material: one(writingMaterials, {
    fields: [studentMaterialFavorites.materialId],
    references: [writingMaterials.id],
  }),
}));
