import type { ChallengeSubmission, DailyChallenge } from '@betterwrite/shared';
import { DailyChallengeTypeLabels } from '@betterwrite/shared';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Loading } from '../../../components/ui/Loading';
import { fetcher } from '../../../lib/api/fetcher';
import { useTheme } from '../../../theme/dark-mode';

const challengeTierLabels: Record<string, string> = {
  first: '优秀',
  second: '良好',
  third: '中等',
  fourth: '及格',
  fifth: '待提升',
};

export default function DailyChallengePage() {
  const router = useRouter();
  const { colors } = useTheme();

  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [submission, setSubmission] = useState<ChallengeSubmission | null>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    score: number;
    scoreTier: string;
    feedback: string;
    streakDays: number;
  } | null>(null);

  const startTimeRef = useRef<number>(Date.now());

  const loadToday = useCallback(async () => {
    try {
      const res = await fetcher.getDailyChallengeToday();
      if (res.success && res.data) {
        setChallenge(res.data.challenge);
        setSubmission(res.data.submission);
        setStreak(res.data.streak);
        if (res.data.submission) {
          setContent(res.data.submission.content);
        }
      } else {
        setError(res.error ?? '获取今日挑战失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取今日挑战失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const isSubmitted = Boolean(submission || submitResult);

  const handleSubmit = async () => {
    if (!challenge || content.trim().length === 0) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const durationMs = Date.now() - startTimeRef.current;
      const res = await fetcher.submitDailyChallenge(challenge.id, {
        content: content.trim(),
        durationMs,
      });
      if (res.success && res.data) {
        setSubmitResult(res.data);
        setStreak(res.data.streakDays);
      } else {
        setError(res.error ?? '提交失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resultScore = submitResult?.score ?? submission?.score ?? null;
  const resultTier = submitResult?.scoreTier ?? submission?.scoreTier ?? null;
  const resultFeedback =
    submitResult?.feedback ??
    (typeof submission?.aiFeedback?.feedback === 'string' ? submission.aiFeedback.feedback : null);
  const resultStreakDays = submitResult?.streakDays ?? submission?.streakDays ?? streak;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {challenge?.title ?? '每日写作挑战'}
          </Text>
          {challenge && (
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {DailyChallengeTypeLabels[challenge.type] ?? challenge.type}
              {' · '}
              建议 {challenge.suggestedWords ?? 50} 词
            </Text>
          )}
        </View>
        <View style={styles.streakBox}>
          <Text style={[styles.streakCount, { color: colors.warning }]}>{streak}</Text>
          <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>连击天</Text>
        </View>
      </View>

      {challenge?.instruction ? (
        <Text style={[styles.instruction, { color: colors.textSecondary }]}>
          {challenge.instruction}
        </Text>
      ) : null}

      {challenge?.content ? (
        <Card colors={colors} style={styles.promptCard}>
          <Text style={[styles.promptTitle, { color: colors.textPrimary }]}>题目</Text>
          <Text style={[styles.promptText, { color: colors.textSecondary }]}>
            {challenge.content}
          </Text>
        </Card>
      ) : null}

      {loading ? (
        <Loading colors={colors} />
      ) : error && !challenge ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      ) : (
        <>
          <Card colors={colors} style={styles.inputCard}>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.bgSecondary,
                  borderColor: colors.border,
                },
              ]}
              multiline
              textAlignVertical="top"
              value={content}
              onChangeText={setContent}
              placeholder="在此输入你的英语作答..."
              placeholderTextColor={colors.textTertiary}
              editable={!isSubmitted}
              spellCheck={false}
              autoCorrect={false}
            />
            <Text style={[styles.wordCount, { color: colors.textTertiary }]}>{wordCount} 词</Text>
          </Card>

          {resultScore !== null && (
            <Card colors={colors} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={[styles.resultScore, { color: colors.textPrimary }]}>
                  {Math.round(resultScore)} 分
                </Text>
                {resultTier ? (
                  <Text style={[styles.resultTier, { color: colors.textSecondary }]}>
                    {challengeTierLabels[resultTier] ?? resultTier}
                  </Text>
                ) : null}
              </View>
              <Text style={[styles.resultStreak, { color: colors.warning }]}>
                连击 {resultStreakDays} 天
              </Text>
              {resultFeedback ? (
                <View style={styles.feedbackBox}>
                  <Text style={[styles.feedbackTitle, { color: colors.textPrimary }]}>AI 点评</Text>
                  <Text style={[styles.feedbackText, { color: colors.textSecondary }]}>
                    {resultFeedback}
                  </Text>
                </View>
              ) : null}
            </Card>
          )}

          {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button
              title="返回练习"
              variant="secondary"
              onPress={() => router.replace('/(student)/practice')}
              colors={colors}
            />
            {isSubmitted ? (
              <Button title="今日已完成" disabled colors={colors} />
            ) : (
              <Button
                title={isSubmitting ? '提交中...' : '提交挑战'}
                onPress={handleSubmit}
                disabled={isSubmitting || content.trim().length === 0}
                colors={colors}
              />
            )}
          </View>
        </>
      )}
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  meta: {
    fontSize: 13,
    marginTop: 4,
  },
  streakBox: {
    alignItems: 'center',
  },
  streakCount: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
  },
  streakLabel: {
    fontSize: 12,
  },
  instruction: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  promptCard: {
    marginBottom: 16,
    gap: 8,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  promptText: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputCard: {
    marginBottom: 16,
  },
  textInput: {
    minHeight: 200,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
  },
  wordCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
  resultCard: {
    marginBottom: 16,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  resultScore: {
    fontSize: 24,
    fontWeight: '700',
  },
  resultTier: {
    fontSize: 14,
  },
  resultStreak: {
    fontSize: 14,
    fontWeight: '600',
  },
  feedbackBox: {
    gap: 4,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 32,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
  },
});
