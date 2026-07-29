import { ProfilePage } from '../../../components/ProfilePage';
import type { ProfileMenuItem } from '../../../components/ProfilePage';

const menuItems: ProfileMenuItem[] = [
  { icon: 'document-text', label: '作文任务', route: '/(teacher)/tasks' },
  { icon: 'clipboard', label: '批改中心', route: '/(teacher)/essays' },
  { icon: 'people', label: '学生管理', route: '/(teacher)/students' },
];

export default function TeacherProfilePage() {
  return <ProfilePage menuItems={menuItems} versionLabel="BetterWrite Teacher v0.1.0" />;
}
