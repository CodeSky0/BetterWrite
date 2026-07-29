import { getEssayStatusLabel } from '@betterwrite/shared';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { EssayCorrectionView, essayStyles } from '../../../components/EssayCorrectionView';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Loading } from '../../../components/ui/Loading';
import { type CorrectionDetail, type Essay, fetcher } from '../../../lib/api/fetcher';
import { useTheme } from '../../../theme/dark-mode';

export default function TeacherEssayDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [essay, setEssay] = useState<Essay | null>(null);
  const [correction, setCorrection] = useState<CorrectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey intentionally triggers reload
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [essayRes, correctionRes] = await Promise.all([
          fetcher.getEssay(id),
          fetcher.getCorrection(id),
        ]);
        if (essayRes.success && essayRes.data) {
          setEssay(essayRes.data);
        } else {
          setError(essayRes.error ?? '获取作文失败');
          console.warn('[TeacherEssayDetail] getEssay failed:', essayRes.error);
        }
        if (correctionRes.success && correctionRes.data) {
          setCorrection(correctionRes.data);
        } else {
          setCorrection(null);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '加载失败';
        setError(message);
        console.error('[TeacherEssayDetail] error:', message);
      } finally {
        setIsLoading(false);
      }
    };
    void loadData();
  }, [id, refreshKey]);

  if (isLoading) return <Loading fullScreen colors={colors} />;
  if (error || !essay) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.bgPrimary }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error ?? '作文不存在'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={styles.header}>
        <Badge
          variant={
            essay.status === 'completed'
              ? 'success'
              : essay.status === 'pending'
                ? 'warning'
                : essay.status === 'failed'
                  ? 'error'
                  : 'info'
          }
          colors={colors}
        >
          {getEssayStatusLabel(essay.status)}
        </Badge>
        {essay.status === 'pending' || essay.status === 'correcting' ? (
          <Button
            title="刷新"
            variant="ghost"
            size="sm"
            onPress={() => setRefreshKey((k) => k + 1)}
            colors={colors}
          />
        ) : null}
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {essay.title ?? essay.task?.title ?? '作文详情'}
      </Text>
      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        学生：{essay.student?.name ?? '未知学生'}
        {essay.student?.studentNo ? ` · ${essay.student.studentNo}` : ''} · {essay.wordCount} 词
      </Text>
      <Text style={[styles.meta, { color: colors.textTertiary }]}>
        提交于 {new Date(essay.submittedAt).toLocaleString()}
      </Text>

      <Card colors={colors} style={essayStyles.sectionCard}>
        <Text style={[essayStyles.sectionTitle, { color: colors.textPrimary }]}>原文</Text>
        <Text style={[essayStyles.contentText, { color: colors.textPrimary }]}>
          {essay.content}
        </Text>
      </Card>

      {essay.status === 'pending' ? (
        <Card colors={colors} style={essayStyles.statusCard}>
          <Text style={[essayStyles.statusTitle, { color: colors.accent }]}>
            作文正在排队等待批改
          </Text>
          <Text style={[essayStyles.statusDesc, { color: colors.textSecondary }]}>
            请稍候刷新查看结果
          </Text>
        </Card>
      ) : null}

      {essay.status === 'correcting' ? (
        <Card colors={colors} style={essayStyles.statusCard}>
          <Text style={[essayStyles.statusTitle, { color: colors.accent }]}>AI 正在批改中</Text>
          <Text style={[essayStyles.statusDesc, { color: colors.textSecondary }]}>
            通常需要几秒到几十秒
          </Text>
        </Card>
      ) : null}

      {essay.status === 'failed' ? (
        <Card colors={colors} style={essayStyles.statusCard}>
          <Text style={[essayStyles.statusTitle, { color: colors.error }]}>批改失败</Text>
          <Text style={[essayStyles.statusDesc, { color: colors.textSecondary }]}>
            可尝试刷新或检查 worker 日志
          </Text>
        </Card>
      ) : null}

      {correction && <EssayCorrectionView correction={correction} colors={colors} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    marginBottom: 2,
  },
});
