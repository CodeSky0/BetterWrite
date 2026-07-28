import type { TextStyle, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import { colors, darkColors, fontSizes, fontWeights, lineHeights, spacing } from './tokens';

export type ThemedStyles = {
  container: ViewStyle;
  card: ViewStyle;
  row: ViewStyle;
  center: ViewStyle;
  centerVertical: ViewStyle;
  spaceBetween: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  body: TextStyle;
  label: TextStyle;
  caption: TextStyle;
  divider: ViewStyle;
  input: TextStyle;
  inputLabel: TextStyle;
  inputError: TextStyle;
};

export function createThemedStyles(isDark: boolean): ThemedStyles {
  const c = isDark ? darkColors : colors;
  return StyleSheet.create<ThemedStyles>({
    container: {
      flex: 1,
      backgroundColor: c.bgPrimary,
      paddingHorizontal: spacing[4],
    },
    card: {
      // Yohaku：禁用硬阴影，以 1px 边框分隔层级（对应 web 的 ring-1 ring-border）
      backgroundColor: c.bgElevated,
      borderRadius: 12,
      padding: spacing[4],
      borderWidth: 1,
      borderColor: c.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    centerVertical: {
      justifyContent: 'center',
    },
    spaceBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      // CJK 标题至多 font-medium，禁止合成粗体
      fontSize: fontSizes.title24,
      fontWeight: fontWeights.medium,
      color: c.textPrimary,
      lineHeight: lineHeights.title24,
    },
    subtitle: {
      fontSize: fontSizes.title20,
      fontWeight: fontWeights.medium,
      color: c.textSecondary,
      lineHeight: lineHeights.title20,
    },
    body: {
      fontSize: fontSizes.copy16,
      fontWeight: fontWeights.normal,
      color: c.textPrimary,
      lineHeight: lineHeights.copy16,
    },
    label: {
      fontSize: fontSizes.copy14,
      fontWeight: fontWeights.medium,
      color: c.textSecondary,
      lineHeight: lineHeights.copy14,
    },
    caption: {
      fontSize: fontSizes.label12,
      fontWeight: fontWeights.normal,
      color: c.textTertiary,
      lineHeight: lineHeights.label12,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
      marginVertical: spacing[2],
    },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[3],
      fontSize: fontSizes.copy16,
      color: c.textPrimary,
      backgroundColor: c.bgElevated,
    },
    inputLabel: {
      fontSize: fontSizes.copy14,
      fontWeight: fontWeights.medium,
      color: c.textSecondary,
      marginBottom: spacing[2],
    },
    inputError: {
      fontSize: fontSizes.label12,
      color: c.error,
      marginTop: spacing[1],
    },
  });
}
