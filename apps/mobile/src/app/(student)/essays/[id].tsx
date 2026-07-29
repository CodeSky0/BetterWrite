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

export default function EssayDetailPage() {
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
        }
        if (correctionRes.success && correctionRes.data) {
          setCorrection(correctionRes.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setIsLoading(false);
      }
    };
    void loadData();
  }, [id, refreshKey]);

  if (isLoading) return <Loading fullScreen colors={colors} />;
  if (error || !essay) return <Loading fullScreen colors={colors} />;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={styles.header}>
        <Badge colors={colors}>{getEssayStatusLabel(essay.status)}</Badge>
        <Text style={[styles.submittedAt, { color: colors.textTertiary }]}>
          提交于 {new Date(essay.submittedAt).toLocaleString()}
        </Text>
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {essay.title ?? essay.task?.title ?? '作文详情'}
      </Text>

      {(essay.status === 'pending' || essay.status === 'correcting') && (
        <Button
          title="刷新状态"
          variant="secondary"
          size="sm"
          onPress={() => setRefreshKey((k) => k + 1)}
          colors={colors}
        />
      )}

      <Card colors={colors} style={essayStyles.sectionCard}>
        <Text style={[essayStyles.sectionTitle, { color: colors.textPrimary }]}>原文</Text>
        <Text style={[essayStyles.contentText, { color: colors.textPrimary }]}>
          {essay.content}
        </Text>
        <Text style={[styles.wordCount, { color: colors.textTertiary }]}>
          词数：{essay.wordCount}
        </Text>
      </Card>

      {essay.status === 'pending' && (
        <Card colors={colors} style={essayStyles.statusCard}>
          <Text style={[essayStyles.statusTitle, { color: colors.accent }]}>
            作文正在排队等待批改
          </Text>
          <Text style={[essayStyles.statusDesc, { color: colors.textSecondary }]}>
            请稍候刷新查看结果
          </Text>
        </Card>
      )}

      {essay.status === 'correcting' && (
        <Card colors={colors} style={essayStyles.statusCard}>
          <Text style={[essayStyles.statusTitle, { color: colors.accent }]}>AI 正在批改中</Text>
          <Text style={[essayStyles.statusDesc, { color: colors.textSecondary }]}>
            通常需要几秒到几十秒
          </Text>
        </Card>
      )}

      {essay.status === 'failed' && (
        <Card colors={colors} style={essayStyles.statusCard}>
          <Text style={[essayStyles.statusTitle, { color: colors.error }]}>批改失败</Text>
          <Text style={[essayStyles.statusDesc, { color: colors.textSecondary }]}>
            请尝试刷新或联系老师
          </Text>
        </Card>
      )}

      {correction && <EssayCorrectionView correction={correction} colors={colors} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  submittedAt: {
    fontSize: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  wordCount: {
    fontSize: 12,
    marginTop: 12,
  },
});
