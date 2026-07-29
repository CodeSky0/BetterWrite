import { StyleSheet } from 'react-native';

/**
 * Shared styles for student pages with common layouts and cards
 */
export const pageStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

/**
 * Shared styles for pages with text areas / editors
 */
export const editorStyles = StyleSheet.create({
  textarea: {
    minHeight: 140,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
    borderWidth: 1,
    borderRadius: 8,
  },
});

/**
 * Shared styles for list pages with cards
 */
export const listStyles = StyleSheet.create({
  card: {
    gap: 12,
  },
  listItem: {
    paddingVertical: 10,
  },
  listItemHeader: {
    gap: 6,
    alignItems: 'flex-start',
  },
});
