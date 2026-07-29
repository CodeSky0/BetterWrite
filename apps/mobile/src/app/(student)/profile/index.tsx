import { ProfilePage } from '../../../components/ProfilePage';
import type { ProfileMenuItem } from '../../../components/ProfilePage';

const menuItems: ProfileMenuItem[] = [
  { icon: 'document-text', label: '我的作文', route: '/(student)/essays' },
  { icon: 'trophy', label: '自主练习', route: '/(student)/practice' },
  { icon: 'warning', label: '错题本', route: '/(student)/errors' },
  { icon: 'podium', label: '写作成长', route: '/(student)/progress' },
  { icon: 'sparkles', label: 'AI 助手', route: '/(student)/assistant' },
];

export default function StudentProfilePage() {
  return <ProfilePage menuItems={menuItems} versionLabel="BetterWrite Student v0.1.0" />;
}
