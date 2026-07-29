import { UserRole } from '@betterwrite/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { fetcher } from '../../lib/api/fetcher';
import { getDashboardPath, useAuth } from '../../lib/auth/store';
import { useTheme } from '../../theme/dark-mode';
import type { ThemeColors } from '../../theme/tokens';
import { authStyles } from './auth-styles';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  role: (typeof UserRole)[keyof typeof UserRole];
  schoolCode: string;
  classCode: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    role: UserRole.STUDENT,
    schoolCode: '',
    classCode: '',
  });

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await fetcher.register(form);
      if (!result.success || !result.data) {
        setError(result.error ?? '注册失败');
        return;
      }

      // Auto-login after successful registration
      const loggedInUser = await login(form.email, form.password);
      router.replace(getDashboardPath(loggedInUser.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = form.name && form.email && form.password.length >= 6;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[authStyles.container, { backgroundColor: colors.bgPrimary }]}
    >
      <ScrollView
        contentContainerStyle={authStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[authStyles.title, { color: colors.textPrimary }]}>创建账号</Text>
        <Text style={[authStyles.subtitle, { color: colors.textSecondary }]}>
          加入 BetterWrite 提升英语写作
        </Text>

        <Card colors={colors} style={authStyles.card}>
          <Input
            label="姓名"
            value={form.name}
            onChangeText={(text) => updateField('name', text)}
            placeholder="真实姓名"
            colors={colors}
          />
          <Input
            label="邮箱"
            value={form.email}
            onChangeText={(text) => updateField('email', text)}
            placeholder="your@school.com"
            autoCapitalize="none"
            keyboardType="email-address"
            colors={colors}
          />
          <Input
            label="密码"
            value={form.password}
            onChangeText={(text) => updateField('password', text)}
            placeholder="至少6位"
            secureTextEntry
            colors={colors}
          />

          <View>
            <Text style={[registerStyles.label, { color: colors.textSecondary }]}>身份</Text>
            <View style={registerStyles.roleRow}>
              <RoleOption
                label="学生"
                selected={form.role === UserRole.STUDENT}
                onPress={() => {
                  setForm((prev) => ({ ...prev, role: UserRole.STUDENT }));
                  setError(null);
                }}
                colors={colors}
              />
              <RoleOption
                label="教师"
                selected={form.role === UserRole.TEACHER}
                onPress={() => {
                  setForm((prev) => ({ ...prev, role: UserRole.TEACHER }));
                  setError(null);
                }}
                colors={colors}
              />
            </View>
          </View>

          <View style={registerStyles.codeRow}>
            <View style={registerStyles.codeInput}>
              <Input
                label="学校代码"
                value={form.schoolCode}
                onChangeText={(text) => updateField('schoolCode', text)}
                placeholder="选填"
                colors={colors}
              />
            </View>
            <View style={registerStyles.codeInput}>
              <Input
                label="班级代码"
                value={form.classCode}
                onChangeText={(text) => updateField('classCode', text)}
                placeholder="选填"
                colors={colors}
              />
            </View>
          </View>

          {error ? (
            <Text style={[authStyles.errorText, { color: colors.error }]}>{error}</Text>
          ) : null}

          <Button
            title={isLoading ? '注册中...' : '注册'}
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading || !canSubmit}
            colors={colors}
          />
        </Card>

        <View style={authStyles.footer}>
          <Text style={[authStyles.footerText, { color: colors.textSecondary }]}>已有账号？</Text>
          <Text
            style={[authStyles.link, { color: colors.accent }]}
            onPress={() => router.push('/(auth)/login')}
          >
            立即登录
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RoleOption({
  label,
  selected,
  onPress,
  colors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ThemeColors;
}) {
  return (
    <Button
      title={label}
      onPress={onPress}
      variant={selected ? 'primary' : 'secondary'}
      colors={colors}
      style={{ flex: 1 }}
    />
  );
}

const registerStyles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  codeInput: {
    flex: 1,
  },
});
