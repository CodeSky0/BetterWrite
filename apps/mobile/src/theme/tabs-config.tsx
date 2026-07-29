import type { ReactElement } from 'react';
import type { ThemeColors } from './tokens';

export interface TabScreenConfig {
  name: string;
  title: string;
  icon: string;
  href?: string | null;
  headerShown?: boolean;
}

/**
 * Shared tab screen options factory for consistent styling across student/teacher layouts
 */
export function createTabScreenOptions(colors: ThemeColors) {
  return {
    headerShown: true,
    headerStyle: { backgroundColor: colors.bgPrimary },
    headerTintColor: colors.textPrimary,
    headerTitleStyle: { fontWeight: '600' as const },
    tabBarActiveTintColor: colors.accent,
    tabBarInactiveTintColor: colors.textTertiary,
    tabBarStyle: {
      backgroundColor: colors.bgElevated,
      borderTopColor: colors.border,
      borderTopWidth: 1,
    },
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '500' as const,
    },
  };
}

/**
 * Create tab screen options with icon for a specific screen
 */
export function createScreenOptions(
  config: TabScreenConfig,
  _colors: ThemeColors,
):
  | {
      title: string;
      tabBarIcon: (props: { color: string; size: number }) => ReactElement;
    }
  | { href: null; headerShown: false } {
  // Hidden tab (e.g., for sub-screens)
  if (config.href === null) {
    return { href: null, headerShown: false };
  }

  return {
    title: config.title,
    tabBarIcon: ({ color, size }: { color: string; size: number }) =>
      // Using Ionicons component name as string - actual rendering happens in the layout
      ({ type: 'icon', name: config.icon, color, size }) as unknown as ReactElement,
  };
}

/**
 * Predefined tab configurations for student and teacher roles
 */
export const STUDENT_TABS: TabScreenConfig[] = [
  { name: 'index', title: '首页', icon: 'home' },
  { name: 'tasks', title: '任务', icon: 'document-text' },
  { name: 'practice', title: '练习', icon: 'trophy' },
  { name: 'assistant', title: '助手', icon: 'sparkles' },
  { name: 'profile', title: '我的', icon: 'person' },
];

export const TEACHER_TABS: TabScreenConfig[] = [
  { name: 'index', title: '概览', icon: 'home' },
  { name: 'tasks', title: '任务', icon: 'document-text' },
  { name: 'essays', title: '批改', icon: 'clipboard' },
  { name: 'profile', title: '我的', icon: 'person' },
  { name: 'students', title: '学生', icon: 'people', href: null },
];

/**
 * Helper to render tab icon - use in layout files
 */
export function renderTabIcon(
  iconName: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap,
) {
  return ({ color, size }: { color: string; size: number }) => {
    const { Ionicons: IoniconsComponent } = require('@expo/vector-icons');
    return <IoniconsComponent name={iconName} color={color} size={size} />;
  };
}
