import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users.js';

/**
 * 通知记录表 —— 存储已发送的推送/站内消息历史
 */
export const notificationLogs = sqliteTable(
  'notification_logs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // 通知类型：task_due / task_overdue / correction_ready / error_review / daily_challenge / teacher_pending
    type: text('type').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    // 关联业务 ID（如 task_id / essay_id）
    referenceId: text('reference_id'),
    // 推送渠道：push / in_app / sms（预留）
    channel: text('channel').notNull().default('in_app'),
    // 是否已读（仅 in_app 有效）
    isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
    // 发送状态：pending / sent / failed
    status: text('status').notNull().default('pending'),
    errorMessage: text('error_message'),
    sentAt: text('sent_at'),
    createdAt: text('created_at').notNull(),
  },
  (t) => ({
    userIdx: index('notification_logs_user_idx').on(t.userId),
    typeIdx: index('notification_logs_type_idx').on(t.type),
    userReadIdx: index('notification_logs_user_read_idx').on(t.userId, t.isRead),
    createdAtIdx: index('notification_logs_created_at_idx').on(t.createdAt),
  }),
);

export const notificationLogsRelations = relations(notificationLogs, ({ one }) => ({
  user: one(users, {
    fields: [notificationLogs.userId],
    references: [users.id],
  }),
}));
