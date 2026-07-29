import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTheme } from '../../theme/dark-mode';
import { createTabScreenOptions } from '../../theme/tabs-config';

export default function TeacherLayout() {
  const { colors } = useTheme();
  const tabOptions = createTabScreenOptions(colors);

  return (
    <Tabs screenOptions={tabOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: '概览',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: '任务',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="essays"
        options={{
          title: '批改',
          tabBarIcon: ({ color, size }) => <Ionicons name="clipboard" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="students" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
