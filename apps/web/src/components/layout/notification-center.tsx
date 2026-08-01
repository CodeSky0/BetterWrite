'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { fetcher } from '@/lib/api/fetcher';
import { useAuth } from '@/lib/auth-store';
import {
  type NotificationLog,
  NotificationType,
  NotificationTypeLabels,
} from '@betterwrite/shared';
import { UserRole, type UserRoleType } from '@betterwrite/shared';
import {
  AlertCircle,
  Bell,
  CalendarClock,
  CheckCheck,
  FileCheck,
  Flame,
  type LucideIcon,
  PenLine,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const typeIconMap: Record<string, LucideIcon> = {
  [NotificationType.TASK_DUE]: CalendarClock,
  [NotificationType.TASK_OVERDUE]: AlertCircle,
  [NotificationType.CORRECTION_READY]: FileCheck,
  [NotificationType.ERROR_REVIEW]: Sparkles,
  [NotificationType.DAILY_CHALLENGE]: Flame,
  [NotificationType.TEACHER_PENDING]: PenLine,
};

const typeRouteMap: Record<
  string,
  (referenceId: string | null, role: UserRoleType | undefined) => string | null
> = {
  [NotificationType.TASK_DUE]: (referenceId, role) =>
    role === UserRole.STUDENT ? `/student/tasks/${referenceId}/write` : '/teacher/tasks',
  [NotificationType.TASK_OVERDUE]: (referenceId, role) =>
    role === UserRole.STUDENT ? `/student/tasks/${referenceId}/write` : '/teacher/tasks',
  [NotificationType.CORRECTION_READY]: (referenceId) =>
    referenceId ? `/student/essays/${referenceId}` : null,
  [NotificationType.TEACHER_PENDING]: () => '/teacher/essays',
  [NotificationType.ERROR_REVIEW]: () => '/student/errors',
  [NotificationType.DAILY_CHALLENGE]: () => '/student/practice',
};

const PAGE_SIZE = 20;

function cn(...inputs: (string | false | null | undefined)[]) {
  return inputs.filter(Boolean).join(' ');
}

export function NotificationCenter() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [summary, setSummary] = useState<{ total: number; unread: number }>({
    total: 0,
    unread: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher.getNotifications({ limit: PAGE_SIZE, offset: 0 });
      if (result.success && result.data) {
        setNotifications(result.data.items);
        setSummary({ total: result.data.total, unread: result.data.unread });
      } else {
        setError(result.error ?? '加载通知失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载通知失败');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (open) {
      void loadNotifications();
    }
  }, [open, loadNotifications]);

  const handleMarkRead = async (id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    try {
      const result = await fetcher.markNotificationRead(id);
      if (result.success) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
        setSummary((prev) => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1),
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '标记已读失败');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const result = await fetcher.markAllNotificationsRead();
      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setSummary((prev) => ({ ...prev, unread: 0 }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '全部已读失败');
    }
  };

  const handleNotificationClick = (notification: NotificationLog) => {
    const routeFn = typeRouteMap[notification.type];
    const route = routeFn ? routeFn(notification.referenceId, user?.role) : null;

    if (!notification.isRead) {
      void handleMarkRead(notification.id);
    }

    if (route) {
      setOpen(false);
      router.push(route);
    }
  };

  const formatTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const unreadCount = summary.unread;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="消息中心"
          type="button"
        >
          <Bell className="w-5 h-5 text-neutral-8" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-label-10 font-medium text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-copy-16 font-medium text-neutral-10">消息中心</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-label-12"
              onClick={handleMarkAllRead}
              type="button"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              全部已读
            </Button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading && notifications.length === 0 && (
            <div className="py-8 text-center text-neutral-7 text-copy-14">加载中...</div>
          )}

          {error && (
            <div className="mx-4 my-3 rounded-md bg-error/10 p-2 text-copy-13 text-error">
              {error}
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="py-10 flex flex-col items-center text-neutral-7">
              <Bell className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-copy-14">暂无消息</p>
            </div>
          )}

          {notifications.length > 0 && (
            <ul className="divide-y divide-border">
              {notifications.map((notification) => {
                const Icon = typeIconMap[notification.type] ?? Bell;
                const label = NotificationTypeLabels[notification.type] ?? '系统消息';
                const routeFn = typeRouteMap[notification.type];
                const hasRoute = !!routeFn?.(notification.referenceId, user?.role);

                return (
                  <li
                    key={notification.id}
                    className={cn(
                      'flex gap-3 px-4 py-3 transition-colors',
                      notification.isRead ? 'bg-neutral-1' : 'bg-accent/5',
                      hasRoute && 'cursor-pointer hover:bg-neutral-2',
                    )}
                  >
                    {hasRoute ? (
                      <button
                        type="button"
                        className="flex gap-3 w-full text-left"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <NotificationContent
                          notification={notification}
                          icon={Icon}
                          label={label}
                          formatTime={formatTime}
                        />
                      </button>
                    ) : (
                      <div className="flex gap-3 w-full">
                        <NotificationContent
                          notification={notification}
                          icon={Icon}
                          label={label}
                          formatTime={formatTime}
                        />
                      </div>
                    )}
                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkRead(notification.id, e)}
                        className="mt-0.5 shrink-0 text-label-11 text-accent hover:underline self-start"
                      >
                        标记已读
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t border-border bg-neutral-2">
            <p className="text-center text-label-11 text-neutral-6">
              共 {summary.total} 条消息，{summary.unread} 条未读
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface NotificationContentProps {
  notification: NotificationLog;
  icon: LucideIcon;
  label: string;
  formatTime: (createdAt: string) => string;
}

function NotificationContent({
  notification,
  icon: Icon,
  label,
  formatTime,
}: NotificationContentProps) {
  return (
    <>
      <div className="mt-0.5 shrink-0">
        <Icon className={cn('w-4 h-4', notification.isRead ? 'text-neutral-6' : 'text-accent')} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-label-12 text-neutral-7 shrink-0">{label}</span>
          <span className="text-label-11 text-neutral-6 shrink-0">
            {formatTime(notification.createdAt)}
          </span>
        </div>
        <p
          className={cn(
            'text-copy-14 text-neutral-10 mt-0.5 line-clamp-2',
            !notification.isRead && 'font-medium',
          )}
        >
          {notification.title}
        </p>
        <p className="text-copy-13 text-neutral-8 mt-0.5 line-clamp-2">{notification.body}</p>
      </div>
    </>
  );
}
