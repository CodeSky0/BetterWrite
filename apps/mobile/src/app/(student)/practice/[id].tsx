import { type QuestionBankItem, countWords, getTopicTypeLabel } from '@betterwrite/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FeedbackCard } from '../../../components/FeedbackCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Loading } from '../../../components/ui/Loading';
import { fetcher } from '../../../lib/api/fetcher';
import { useTheme } from '../../../theme/dark-mode';
import { practiceStyles as ps } from '../../../theme/practice-styles';

interface FeedbackError {
  original: string;
  corrected: string;
  type: string;
  explanation: string;
}

export default function StudentPracticeItemPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const [question, setQuestion] = useState<QuestionBankItem | null>(null);
  const [content, setContent] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeepSubmitting, setIsDeepSubmitting] = useState(false);
  const [feedbackErrors, setFeedbackErrors] = useState<FeedbackError[] | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    fetcher
      .getQuestion(id)
      .then((res) => {
        if (res.success && res.data) {
          setQuestion(res.data);
        } else {
          setLoadError(res.error ?? '获取题目失败');
        }
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : '获取题目失败'))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const wordCount = countWords(content);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  const handleSubmit = async () => {
    if (!question) return;
    const minWords = question.wordLimitMin;
    if (wordCount < minWords) {
      setLoadError(`字数不足，建议至少 ${minWords} 词`);
      return;
    }
    setIsSubmitting(true);
    setLoadError(null);
    try {
      const res = await fetcher.submitPractice({
        questionId: id,
        content,
        durationMs: elapsed * 1000,
        exerciseType: 'question_bank',
      });
      if (res.success && res.data) {
        setFeedbackErrors(res.data.feedback.errors);
      } else {
        setLoadError(res.error ?? '提交失败');
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeepSubmit = async () => {
    if (!question) return;
    setIsDeepSubmitting(true);
    setLoadError(null);
    try {
      const res = await fetcher.submitPracticeDeep({
        questionId: id,
        content,
        durationMs: elapsed * 1000,
        exerciseType: 'question_bank',
      });
      if (res.success && res.data) {
        router.replace(`/(student)/essays/${res.data.essayId}`);
      } else {
        setLoadError(res.error ?? '深度批改提交失败');
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : '深度批改提交失败');
    } finally {
      setIsDeepSubmitting(false);
    }
  };

  if (isLoading) return <Loading fullScreen colors={colors} />;
  if (loadError && !question) return <Loading fullScreen colors={colors} />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[ps.container, { backgroundColor: colors.bgPrimary }]}
    >
      <ScrollView contentContainerStyle={ps.scrollContent} keyboardShouldPersistTaps="handled">
        {question ? (
          <>
            <View style={ps.header}>
              <View style={ps.headerLeft}>
                <View style={ps.badgeRow}>
                  <Badge variant="secondary" colors={colors}>
                    {getTopicTypeLabel(question.topicType)}
                  </Badge>
                  <Text style={[ps.timerText, { color: colors.textSecondary }]}>
                    已用 {formatTime(elapsed)}
                  </Text>
                </View>
                <Text style={[ps.title, { color: colors.textPrimary }]}>{question.title}</Text>
                <Text style={[ps.requirements, { color: colors.textSecondary }]}>
                  {question.requirements}
                </Text>
              </View>
              <View style={localStyles.wordCountBox}>
                <Text style={[localStyles.wordCountValue, { color: colors.textPrimary }]}>
                  {wordCount}
                </Text>
                <Text style={[localStyles.wordCountLabel, { color: colors.textSecondary }]}>
                  词 / {question.wordLimitMin}-{question.wordLimitMax}
                </Text>
              </View>
            </View>

            {question.keyPoints && question.keyPoints.length > 0 && (
              <Card colors={colors} style={ps.pointsCard}>
                <Text style={[ps.sectionTitle, { color: colors.textPrimary }]}>写作要点</Text>
                {question.keyPoints.map((kp) => (
                  <Text key={kp} style={[ps.pointText, { color: colors.textSecondary }]}>
                    • {kp}
                  </Text>
                ))}
              </Card>
            )}

            <Card colors={colors} style={ps.editorCard}>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="在此输入你的英语作文..."
                placeholderTextColor={colors.textTertiary}
                multiline
                textAlignVertical="top"
                style={[
                  ps.textarea,
                  { color: colors.textPrimary, backgroundColor: colors.bgElevated },
                ]}
                spellCheck={false}
                autoCapitalize="none"
              />
            </Card>

            {loadError ? (
              <Text style={[ps.errorText, { color: colors.error }]}>{loadError}</Text>
            ) : null}

            <Button
              title={isSubmitting ? '提交中...' : '提交并即时反馈'}
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || wordCount < 10}
              colors={colors}
            />

            {feedbackErrors !== null && (
              <FeedbackCard colors={colors} feedbackErrors={feedbackErrors}>
                <View style={[ps.divider, { backgroundColor: colors.border }]} />
                <Text style={[localStyles.deepHint, { color: colors.textTertiary }]}>
                  需要更详细的评分与建议？尝试深度批改，将由 AI 给出完整四维度评分。
                </Text>
                <Button
                  title={isDeepSubmitting ? '提交中...' : '深度批改'}
                  variant="secondary"
                  onPress={handleDeepSubmit}
                  loading={isDeepSubmitting}
                  disabled={isDeepSubmitting}
                  colors={colors}
                />
              </FeedbackCard>
            )}
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const localStyles = StyleSheet.create({
  wordCountBox: {
    alignItems: 'center',
    minWidth: 80,
  },
  wordCountValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  wordCountLabel: {
    fontSize: 12,
  },
  deepHint: {
    fontSize: 13,
    lineHeight: 18,
  },
});
