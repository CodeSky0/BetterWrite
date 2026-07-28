import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ThemeColors } from '../../theme/tokens';
import { radius, spacing } from '../../theme/tokens';

export type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  colors: ThemeColors;
};

export function Card({ children, style, onPress, colors }: CardProps) {
  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.bgElevated,
      borderColor: colors.border,
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [cardStyle, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    // Yohaku：禁用硬阴影，以 1px 边框分隔层级（对应 web 的 ring-1 ring-border）
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
