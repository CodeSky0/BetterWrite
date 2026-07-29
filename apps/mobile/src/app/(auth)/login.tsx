import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { getDashboardPath, useAuth } from '../../lib/auth/store';
import { useTheme } from '../../theme/dark-mode';
import { authStyles } from './auth-styles';

export default function LoginPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const { login, isLoading, error, clearError, user, isHydrated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isHydrated && user) {
      router.replace(getDashboardPath(user.role));
    }
  }, [isHydrated, user, router]);

  const handleSubmit = async () => {
    clearError();
    try {
      const loggedInUser = await login(email, password);
      router.replace(getDashboardPath(loggedInUser.role));
    } catch {
      // error is already set in store
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[authStyles.container, { backgroundColor: colors.bgPrimary }]}
    >
      <ScrollView
        contentContainerStyle={authStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[authStyles.title, { color: colors.textPrimary }]}>欢迎回来</Text>
        <Text style={[authStyles.subtitle, { color: colors.textSecondary }]}>
          登录 BetterWrite 继续学习
        </Text>

        <Card colors={colors} style={authStyles.card}>
          <Input
            label="邮箱"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              clearError();
            }}
            placeholder="your@school.com"
            autoCapitalize="none"
            keyboardType="email-address"
            colors={colors}
          />
          <Input
            label="密码"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearError();
            }}
            placeholder="••••••••"
            secureTextEntry
            colors={colors}
          />

          {error ? (
            <Text style={[authStyles.errorText, { color: colors.error }]}>{error}</Text>
          ) : null}

          <Button
            title={isLoading ? '登录中...' : '登录'}
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading || !email || !password}
            colors={colors}
          />
        </Card>

        <View style={authStyles.footer}>
          <Text style={[authStyles.footerText, { color: colors.textSecondary }]}>还没有账号？</Text>
          <Text
            style={[authStyles.link, { color: colors.accent }]}
            onPress={() => router.push('/(auth)/register')}
          >
            立即注册
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
