import {
  PeerReviewDimension,
  PeerReviewDimensionLabels,
  PeerReviewStatusLabels,
  type PeerReviewWithEssay,
} from '@betterwrite/shared';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, ToastAndroid, View } from 'react-native';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Empty } from '../../../components/ui/Empty';
import { Loading } from '../../../components/ui/Loading';
import { fetcher } from '../../../lib/api/fetcher';
import { useTheme } from '../../../theme/dark-mode';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '../../../theme/tokens';

const DIMENSIONS = [
  PeerReviewDimension.CONTENT,
  PeerReviewDimension.LANGUAGE,
  PeerReviewDimension.STRUCTURE,
  PeerReviewDimension.HANDWRITING,
] as const;

const GUIDING_QUESTIONS = [
  { id: 'main_idea', text: '文章主旨是否明确？' },
  { id: 'examples', text: '论据/例子是否充分支持观点？' },
  { id: 'logic', text: '段落之间衔接是否自然？' },
  { id: 'vocabulary', text: '有哪些值得学习的表达？' },
  { id: 'suggestion', text: '给作者一个具体的改进建议。' },
];

export default function StudentPeerReviewPage() {
  const { colors } = useTheme();

  const [reviews, setReviews] = useState<PeerReviewWithEssay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<PeerReviewWithEssay | null>(null);

  const [scores, setScores] = useState<Record<(typeof DIMENSIONS)[number], number>>({
    [PeerReviewDimension.CONTENT]: 80,
    [PeerReviewDimension.LANGUAGE]: 80,
    [PeerReviewDimension.STRUCTURE]: 80,
    [PeerReviewDimension.HANDWRITING]: 80,
  });
  const [comment, setComment] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher.getPendingPeerReviews();
      if (res.success && res.data) {
        setReviews(res.data);
      } else {
        setError(res.error ?? '获取互评任务失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSelect = (review: PeerReviewWithEssay) => {
    setSelectedReview(review);
    setScores({
      [PeerReviewDimension.CONTENT]: 80,
      [PeerReviewDimension.LANGUAGE]: 80,
      [PeerReviewDimension.STRUCTURE]: 80,
      [PeerReviewDimension.HANDWRITING]: 80,
    });
    setComment('');
    setAnswers({});
  };

  const handleBack = () => {
    setSelectedReview(null);
  };

  const adjustScore = (key: (typeof DIMENSIONS)[number], delta: number) => {
    setScores((prev) => ({
      ...prev,
      [key]: Math.min(100, Math.max(0, prev[key] + delta)),
    }));
  };

  const handleSubmit = async () => {
    if (!selectedReview) return;
    setSubmitting(true);
    try {
      const answerList = Object.entries(answers)
        .filter(([, v]) => v.trim())
        .map(([questionId, answer]) => ({ questionId, answer }));
      const res = await fetcher.submitPeerReview(selectedReview.id, {
        contentScore: scores[PeerReviewDimension.CONTENT],
        languageScore: scores[PeerReviewDimension.LANGUAGE],
        structureScore: scores[PeerReviewDimension.STRUCTURE],
        handwritingScore: scores[PeerReviewDimension.HANDWRITING],
        comment,
        answers: answerList,
      });
      if (res.success) {
        if (ToastAndroid) {
          ToastAndroid.show('互评提交成功', ToastAndroid.SHORT);
        }
        setSelectedReview(null);
        await loadReviews();
      } else {
        Alert.alert('提交失败', res.error ?? '请稍后重试');
      }
    } catch (err) {
      Alert.alert('提交失败', err instanceof Error ? err.message : '未知错误');
    } finally {
      setSubmitting(false);
    }
  };

  if (selectedReview) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bgPrimary }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Button title="返回列表" variant="ghost" size="sm" colors={colors} onPress={handleBack} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>互评打分</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Card colors={colors} style={styles.card}>
          <View style={styles.rowBetween}>
            <Badge variant="outline" colors={colors}>
              {selectedReview.essay.taskTitle ?? '自主练习'}
            </Badge>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {selectedReview.essay.wordCount} 词
            </Text>
          </View>
          <Text style={[styles.essayTitle, { color: colors.textPrimary }]}>
            {selectedReview.essay.title ?? '未命名作文'}
          </Text>
          <Text style={[styles.essayContent, { color: colors.textSecondary }]}>
            {selectedReview.essay.content}
          </Text>
        </Card>

        <Card colors={colors} style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>互评打分</Text>
          {DIMENSIONS.map((key) => (
            <View key={key} style={styles.dimensionRow}>
              <View style={styles.dimensionHeader}>
                <Text style={[styles.dimensionLabel, { color: colors.textSecondary }]}>
                  {PeerReviewDimensionLabels[key]}（0-100）
                </Text>
                <Text style={[styles.dimensionValue, { color: colors.accent }]}>{scores[key]}</Text>
              </View>
              <View style={styles.stepper}>
                <Button
                  title="-"
                  variant="outline"
                  size="sm"
                  colors={colors}
                  onPress={() => adjustScore(key, -5)}
                />
                <View style={[styles.scoreBar, { backgroundColor: colors.bgTertiary }]}>
                  <View
                    style={[
                      styles.scoreBarFill,
                      {
                        backgroundColor: colors.accent,
                        width: `${scores[key]}%`,
                      },
                    ]}
                  />
                </View>
                <Button
                  title="+"
                  variant="outline"
                  size="sm"
                  colors={colors}
                  onPress={() => adjustScore(key, 5)}
                />
              </View>
            </View>
          ))}

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>评语</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.bgSecondary,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              value={comment}
              onChangeText={setComment}
              placeholder="写下你对这篇作文的具体评价..."
              placeholderTextColor={colors.textDisabled}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {selectedReview.essay.taskId ? (
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>引导性问题</Text>
              {GUIDING_QUESTIONS.map((q) => (
                <View key={q.id} style={styles.question}>
                  <Text style={[styles.questionText, { color: colors.textSecondary }]}>
                    {q.text}
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.bgSecondary,
                        color: colors.textPrimary,
                        borderColor: colors.border,
                      },
                    ]}
                    value={answers[q.id] ?? ''}
                    onChangeText={(text) => setAnswers((prev) => ({ ...prev, [q.id]: text }))}
                    placeholder="简要回答..."
                    placeholderTextColor={colors.textDisabled}
                  />
                </View>
              ))}
            </View>
          ) : null}

          <Button
            title={submitting ? '提交中...' : '提交互评'}
            variant="primary"
            size="lg"
            colors={colors}
            loading={submitting}
            disabled={submitting}
            onPress={handleSubmit}
          />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>同伴互评</Text>
      </View>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        完成互评任务后方可查看他人对自己作文的评价
      </Text>

      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

      {loading ? (
        <Loading fullScreen colors={colors} />
      ) : reviews.length === 0 ? (
        <Empty
          title="暂无待评任务"
          description="教师分配互评任务后将在此处显示"
          icon={<Ionicons name="people-outline" size={48} color={colors.textDisabled} />}
          colors={colors}
        />
      ) : (
        <View style={styles.list}>
          {reviews.map((review) => (
            <Card key={review.id} colors={colors} onPress={() => handleSelect(review)}>
              <View style={styles.cardHeader}>
                <Badge variant="secondary" colors={colors}>
                  {PeerReviewStatusLabels[review.status]}
                </Badge>
                {review.essay.taskTitle ? (
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>
                    {review.essay.taskTitle}
                  </Text>
                ) : null}
              </View>
              <Text style={[styles.essayTitle, { color: colors.textPrimary }]}>
                {review.essay.title ?? '未命名作文'}
              </Text>
              <Text
                style={[styles.essayContent, { color: colors.textSecondary }]}
                numberOfLines={3}
              >
                {review.essay.content}
              </Text>
              <View style={styles.cardFooter}>
                <Ionicons name="document-text-outline" size={16} color={colors.textDisabled} />
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  {review.essay.wordCount} 词
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  headerSpacer: {
    width: 72,
  },
  title: {
    fontSize: fontSizes.title24,
    fontWeight: fontWeights.medium as '500',
    lineHeight: lineHeights.title24,
  },
  subtitle: {
    fontSize: fontSizes.copy14,
    lineHeight: lineHeights.copy14,
    marginBottom: spacing[4],
  },
  error: {
    fontSize: fontSizes.copy14,
    marginBottom: spacing[4],
  },
  list: {
    gap: spacing[3],
    paddingBottom: spacing[8],
  },
  card: {
    marginBottom: spacing[3],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[3],
  },
  essayTitle: {
    fontSize: fontSizes.copy16,
    fontWeight: fontWeights.medium as '500',
    lineHeight: lineHeights.copy16,
    marginBottom: spacing[1],
  },
  essayContent: {
    fontSize: fontSizes.copy14,
    lineHeight: lineHeights.copy14,
  },
  meta: {
    fontSize: fontSizes.label12,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: fontSizes.title20,
    fontWeight: fontWeights.medium as '500',
    lineHeight: lineHeights.title20,
    marginBottom: spacing[4],
  },
  dimensionRow: {
    marginBottom: spacing[4],
  },
  dimensionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  dimensionLabel: {
    fontSize: fontSizes.copy14,
  },
  dimensionValue: {
    fontSize: fontSizes.title20,
    fontWeight: fontWeights.medium as '500',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  scoreBar: {
    flex: 1,
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
  },
  field: {
    marginTop: spacing[4],
  },
  fieldLabel: {
    fontSize: fontSizes.copy14,
    marginBottom: spacing[2],
  },
  textArea: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing[3],
    fontSize: fontSizes.copy14,
    lineHeight: lineHeights.copy14,
    minHeight: 96,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing[3],
    fontSize: fontSizes.copy14,
    lineHeight: lineHeights.copy14,
  },
  question: {
    marginBottom: spacing[3],
  },
  questionText: {
    fontSize: fontSizes.copy14,
    marginBottom: spacing[1],
  },
});
