export const colors = {
  // Accent — 梅 ume (light)
  accent: '#c56473',
  accentHover: '#a85568',
  accentLight: '#f4dce0',
  accentDark: '#f596aa', // 桃 momo (dark accent, field retained)

  // Neutral 1-10 — 暖米白 (warm parchment undertone, R > G > B)
  // Tier 1 (1-4): surface / fill
  // Tier 2 (5-7): border / icon / secondary text
  // Tier 3 (8-10): body / heading
  // n-5 must NEVER be used for text.
  neutral1: '#f9f8f5',
  neutral2: '#f0efeb',
  neutral3: '#e3e1db',
  neutral4: '#d0cec6',
  neutral5: '#a8a69f',
  neutral6: '#787670',
  neutral7: '#5c5a55',
  neutral8: '#403f3a',
  neutral9: '#24231f',
  neutral10: '#141312',

  // Surface
  paper: '#fefefb',
  border: '#e3e1db',

  // Semantic — 和色 (Japanese traditional). Restraint matched to accent.
  info: '#3d6896', // 縹 hanada
  success: '#5e9f7e', // 若竹 wakatake
  warning: '#a87a3d', // 朽葉 kuchiba
  error: '#a64953', // 蘇芳 suoh

  // ── Legacy aliases (transition, mirror web's P5 cleanup)
  bgPrimary: '#fefefb',
  bgSecondary: '#f0efeb',
  bgTertiary: '#e3e1db',
  bgElevated: '#f9f8f5',
  textPrimary: '#141312',
  textSecondary: '#403f3a',
  textTertiary: '#5c5a55',
  textDisabled: '#787670',
  borderHover: '#d0cec6',
} as const;

export const darkColors = {
  // Accent — 桃 momo (dark)
  accent: '#f596aa',
  accentHover: '#f7a8ba',
  accentLight: '#3d2a30',
  accentDark: '#c56473', // 梅 ume (field retained)

  // Neutral 反相纯灰 (R=G=B). Warmth carried solely by paper.
  neutral1: '#141312',
  neutral2: '#1c1c1e',
  neutral3: '#242426',
  neutral4: '#2c2c2e',
  neutral5: '#5a5a5e',
  neutral6: '#7a7a7e',
  neutral7: '#9a9a9e',
  neutral8: '#b8b8bc',
  neutral9: '#d8d8dc',
  neutral10: '#f9f8f5',

  paper: 'rgb(28, 28, 30)',
  border: 'rgba(255, 255, 255, 0.1)',

  // Semantic (unchanged in dark — 和色 saturation is already balanced)
  info: '#3d6896',
  success: '#5e9f7e',
  warning: '#a87a3d',
  error: '#a64953',

  // Legacy aliases (transition)
  bgPrimary: 'rgb(28, 28, 30)',
  bgSecondary: '#1c1c1e',
  bgTertiary: '#242426',
  bgElevated: '#2c2c2e',
  textPrimary: '#f9f8f5',
  textSecondary: '#b8b8bc',
  textTertiary: '#9a9a9e',
  textDisabled: '#7a7a7e',
  borderHover: '#3a3a3c',
} as const;

export type ThemeColors = { [K in keyof typeof colors]: string };

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

export type Spacing = keyof typeof spacing;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export type Radius = keyof typeof radius;

/**
 * Yohaku role+px 字号尺度 —— 与 apps/web @theme 的 --text-* 令牌对齐。
 * CJK 禁用合成粗体：标题字重至多 font-medium (500)。
 */
export const fontSizes = {
  caption10: 10,
  label12: 12,
  copy13: 13,
  copy14: 14,
  copy15: 15,
  copy16: 16,
  title20: 20,
  title24: 24,
  title28: 28,
  display36: 36,
  display48: 48,
} as const;

export type FontSize = keyof typeof fontSizes;

export const fontWeights = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export type FontWeight = keyof typeof fontWeights;

/**
 * 与字号令牌一一绑定的行高（RN 使用绝对 px）。
 * 比例与 web --text-*--line-height 一致。
 */
export const lineHeights = {
  caption10: 14,
  label12: 18,
  copy13: 20,
  copy14: 22,
  copy15: 24,
  copy16: 26,
  title20: 28,
  title24: 32,
  title28: 36,
  display36: 44,
  display48: 56,
} as const;

export type LineHeight = keyof typeof lineHeights;
