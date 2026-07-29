import { StyleSheet } from 'react-native';

/**
 * Shared styles for practice writing pages ([id] and mock)
 */
export const practiceStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  timerText: {
    fontSize: 13,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  requirements: {
    fontSize: 14,
    lineHeight: 20,
  },
  pointsCard: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  pointText: {
    fontSize: 14,
    lineHeight: 20,
  },
  editorCard: {
    padding: 0,
    overflow: 'hidden',
  },
  textarea: {
    minHeight: 260,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  feedbackCard: {
    gap: 12,
  },
  successText: {
    fontSize: 14,
  },
  feedbackDesc: {
    fontSize: 14,
  },
  errorItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
    gap: 6,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  divider: {
    height: 1,
    marginVertical: 4,
  },
});
