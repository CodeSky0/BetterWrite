import { formatScore } from '@betterwrite/shared';
import type { CorrectionDetail } from '@betterwrite/shared';
import { StyleSheet, Text, View } from 'react-native';
import type { ThemeColors } from '../theme/tokens';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';

/**
 * Shared essay correction detail view (scores, errors, suggestions, revised essay)
 */
export function EssayCorrectionView({
  correction,
  colors,
}: {
  correction: CorrectionDetail;
  colors: ThemeColors;
}) {
  return (
    <>
      <Card colors={colors} style={essayStyles.sectionCard}>
        <Text style={[essayStyles.sectionTitle, { color: colors.textPrimary }]}>总分</Text>
        <View style={essayStyles.scoreRow}>
          <Text style={[essayStyles.totalScore, { color: colors.accent }]}>
            {formatScore(correction.totalScore)}
          </Text>
          <Text style={[essayStyles.scoreTier, { color: colors.textSecondary }]}>
            {correction.scoreTier ?? ''}
          </Text>
        </View>
        <View style={essayStyles.dimensionRow}>
          <DimensionItem label="审题扣题" value={correction.topicAdherenceScore} colors={colors} />
          <DimensionItem label="内容" value={correction.contentScore} colors={colors} />
          <DimensionItem label="语言" value={correction.languageScore} colors={colors} />
          <DimensionItem label="结构" value={correction.structureScore} colors={colors} />
          <DimensionItem label="书写" value={correction.presentationScore} colors={colors} />
        </View>
      </Card>

      {correction.errors.length > 0 && (
        <Card colors={colors} style={essayStyles.sectionCard}>
          <Text style={[essayStyles.sectionTitle, { color: colors.textPrimary }]}>错误分析</Text>
          {correction.errors.map((err, idx) => (
            <View key={`${err.original}-${err.corrected}-${idx}`} style={essayStyles.errorItem}>
              <View style={essayStyles.errorHeader}>
                <Text style={[essayStyles.errorOriginal, { color: colors.error }]}>
                  {err.original}
                </Text>
                <Text style={[essayStyles.errorArrow, { color: colors.textTertiary }]}>→</Text>
                <Text style={[essayStyles.errorCorrected, { color: colors.success }]}>
                  {err.corrected}
                </Text>
                <Badge variant="outline" colors={colors}>
                  {err.type}
                </Badge>
              </View>
              <Text style={[essayStyles.errorExplanation, { color: colors.textSecondary }]}>
                {err.explanation}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {correction.suggestions.length > 0 && (
        <Card colors={colors} style={essayStyles.sectionCard}>
          <Text style={[essayStyles.sectionTitle, { color: colors.textPrimary }]}>提升建议</Text>
          {correction.suggestions.map((s, idx) => (
            <View key={`${s.category}-${idx}`} style={essayStyles.suggestionItem}>
              <Badge
                variant={
                  s.priority === 'high'
                    ? 'error'
                    : s.priority === 'medium'
                      ? 'warning'
                      : 'secondary'
                }
                colors={colors}
              >
                {s.priority}
              </Badge>
              <Text style={[essayStyles.suggestionText, { color: colors.textSecondary }]}>
                {s.suggestion}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {correction.revisedEssay ? (
        <Card colors={colors} style={essayStyles.sectionCard}>
          <Text style={[essayStyles.sectionTitle, { color: colors.textPrimary }]}>改写范文</Text>
          <Text style={[essayStyles.contentText, { color: colors.textPrimary }]}>
            {correction.revisedEssay}
          </Text>
        </Card>
      ) : null}
    </>
  );
}

function DimensionItem({
  label,
  value,
  colors,
}: {
  label: string;
  value: number | null;
  colors: { textPrimary: string; textSecondary: string };
}) {
  return (
    <View style={essayStyles.dimensionItem}>
      <Text style={[essayStyles.dimensionValue, { color: colors.textPrimary }]}>
        {formatScore(value)}
      </Text>
      <Text style={[essayStyles.dimensionLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

export const essayStyles = StyleSheet.create({
  sectionCard: {
    marginBottom: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 24,
  },
  statusCard: {
    marginBottom: 16,
    alignItems: 'center',
    paddingVertical: 24,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusDesc: {
    fontSize: 13,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 16,
  },
  totalScore: {
    fontSize: 42,
    fontWeight: '700',
  },
  scoreTier: {
    fontSize: 16,
  },
  dimensionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dimensionItem: {
    alignItems: 'center',
  },
  dimensionValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  dimensionLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  errorItem: {
    marginBottom: 12,
    paddingBottom: 12,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  errorOriginal: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  errorArrow: {
    fontSize: 14,
  },
  errorCorrected: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorExplanation: {
    fontSize: 13,
    lineHeight: 18,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
