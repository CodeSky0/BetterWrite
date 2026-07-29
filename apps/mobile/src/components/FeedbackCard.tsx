import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { practiceStyles as styles } from '../theme/practice-styles';
import type { ThemeColors } from '../theme/tokens';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';

interface FeedbackError {
  original: string;
  corrected: string;
  type: string;
  explanation: string;
}

interface FeedbackCardProps {
  colors: ThemeColors;
  feedbackErrors: FeedbackError[];
  children?: ReactNode;
}

export function FeedbackCard({ colors, feedbackErrors, children }: FeedbackCardProps) {
  return (
    <Card colors={colors} style={styles.feedbackCard}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>即时反馈</Text>
      {feedbackErrors.length === 0 ? (
        <Text style={[styles.successText, { color: colors.success }]}>很棒，未发现语法错误</Text>
      ) : (
        <>
          <Text style={[styles.feedbackDesc, { color: colors.textSecondary }]}>
            发现 {feedbackErrors.length} 处可改进，以下为修改建议：
          </Text>
          {feedbackErrors.map((err, idx) => (
            <View key={`${err.original}-${err.corrected}-${idx}`} style={styles.errorItem}>
              <View style={styles.errorHeader}>
                <Text style={[styles.errorOriginal, { color: colors.error }]}>{err.original}</Text>
                <Text style={[styles.errorArrow, { color: colors.textTertiary }]}>→</Text>
                <Text style={[styles.errorCorrected, { color: colors.success }]}>
                  {err.corrected}
                </Text>
                <Badge variant="outline" colors={colors}>
                  {err.type}
                </Badge>
              </View>
              <Text style={[styles.errorExplanation, { color: colors.textTertiary }]}>
                {err.explanation}
              </Text>
            </View>
          ))}
        </>
      )}
      {children}
    </Card>
  );
}
