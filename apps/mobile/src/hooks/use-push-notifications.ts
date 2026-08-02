import { getLastNotificationResponseAsync } from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../lib/auth/store';
import {
  clearNotificationListeners,
  registerForPushNotifications,
  setupNotificationListeners,
} from '../lib/notifications/push';

interface NotificationData {
  type?: string;
  referenceId?: string;
}

/**
 * 移动端推送通知 hook。
 * - 用户登录后自动注册 Expo push token 到后端
 * - 监听前台收到的通知
 * - 处理点击通知后的跳转（冷启动/热启动）
 */
export function usePushNotifications(): void {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      clearNotificationListeners();
      return;
    }

    const handleOpen = (data: NotificationData): void => {
      const { type, referenceId } = data;
      const ref = referenceId && referenceId.length > 0 ? referenceId : undefined;
      switch (type) {
        case 'task_due':
        case 'task_overdue':
          router.push(user.role === 'teacher' ? '/(teacher)/tasks' : '/(student)/tasks');
          break;
        case 'correction_ready':
          if (ref) {
            router.push(`/(student)/essays/${ref}`);
          }
          break;
        case 'teacher_pending':
          router.push('/(teacher)/essays');
          break;
        case 'error_review':
          router.push('/(student)/errors');
          break;
        case 'daily_challenge':
          router.push('/(student)/daily-challenge');
          break;
        default:
          break;
      }
    };

    // 处理冷启动时点击通知打开应用的情况
    void getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = (response.notification.request.content.data ?? {}) as NotificationData;
        handleOpen(data);
      }
    });

    // 用户登录后注册推送 token
    void registerForPushNotifications();

    // 设置通知监听器
    setupNotificationListeners(
      (notification) => {
        console.log('[Push] received in foreground:', notification.request.identifier);
      },
      (response) => {
        const data = (response.notification.request.content.data ?? {}) as NotificationData;
        handleOpen(data);
      },
    );

    return () => {
      clearNotificationListeners();
    };
  }, [user, router]);
}
