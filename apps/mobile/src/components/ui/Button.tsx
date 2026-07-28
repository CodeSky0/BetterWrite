import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ThemeColors } from '../../theme/tokens';
import { fontSizes, fontWeights, spacing } from '../../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  title?: string;
  children?: ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  colors: ThemeColors;
};

const sizeHeights: Record<ButtonSize, number> = { sm: 36, md: 44, lg: 52 };
const sizePaddings: Record<ButtonSize, number> = { sm: 12, md: 16, lg: 24 };
// Yohaku role+px 字号令牌
const sizeFontSizes: Record<ButtonSize, number> = {
  sm: fontSizes.copy13,
  md: fontSizes.copy15,
  lg: fontSizes.copy16,
};

export function Button({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  colors,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const baseStyle = getBaseStyle(variant, colors);
  const sizeStyle = {
    height: sizeHeights[size],
    paddingHorizontal: sizePaddings[size],
  };
  const textStyle = {
    fontSize: sizeFontSizes[size],
    color: getTextColor(variant, colors),
    fontWeight: fontWeights.medium,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        baseStyle,
        sizeStyle,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor(variant, colors)} size="small" />
      ) : children ? (
        children
      ) : (
        <View style={styles.content}>
          <Text style={[styles.text, textStyle]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

function getBaseStyle(
  variant: ButtonVariant,
  c: ThemeColors,
): { backgroundColor: string; borderWidth: number; borderColor: string } {
  switch (variant) {
    case 'primary':
      return { backgroundColor: c.accent, borderWidth: 0, borderColor: 'transparent' };
    case 'secondary':
      return { backgroundColor: c.bgSecondary, borderWidth: 0, borderColor: 'transparent' };
    case 'outline':
      return { backgroundColor: 'transparent', borderWidth: 1, borderColor: c.border };
    case 'ghost':
      return { backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent' };
  }
}

function getTextColor(variant: ButtonVariant, c: ThemeColors): string {
  switch (variant) {
    case 'primary':
      // 暗色下 neutral1 反相为深色，保证桃色底上的文字对比度
      return c.neutral1;
    case 'secondary':
      return c.textPrimary;
    case 'outline':
      return c.textPrimary;
    case 'ghost':
      return c.accent;
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  text: {
    fontWeight: fontWeights.medium,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
});
