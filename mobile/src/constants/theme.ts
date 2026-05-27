/**
 * Theme - Figma design tokens (extracted from prototype)
 *
 * Source: Figma file irHzbqppinqWTMxxliY6GK
 * Style: Healthcare appointment app (Vietnamese), Inter font, blue primary
 */
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useThemeStore } from '../store/theme.store';

// =============================================================
// FIGMA DESIGN TOKENS
// =============================================================

export const figmaColors = {
  // Brand
  primary: '#1565C0', // Denim - main blue
  primaryDark: '#0D47A1', // gradient end
  primaryLight: '#1976D2',

  // Text
  textPrimary: '#1A1A2E', // Mirage - headings, important text
  textSecondary: '#6B7280', // Pale Sky - subtitles, meta
  textMuted: '#9CA3AF', // Gray Chateau - placeholders, hints

  // Surfaces
  background: '#F5F7FA', // Catskill White - app background
  surface: '#FFFFFF', // White - cards
  surfaceMuted: '#F0F2F5', // Iron - search bar, icon button bg
  border: '#E0E3E8', // Athens Gray - separators, dividers

  // Status
  success: '#388E3C', // Apple green
  successBg: '#D7F5D7', // Blue Romance
  warning: '#FFC107', // Amber - stars, ratings
  warningBg: '#FFF8E1',
  info: '#00897B', // Teal
  infoBg: '#C8F5E0', // Spring green
  error: '#D32F2F',
  errorBg: '#FFEBEE',

  // Specialty pastels (icon backgrounds)
  pastelRed: '#FFEBEE', // Tim mạch
  pastelOrange: '#FFF3E0', // Nha khoa, Mắt
  pastelTeal: '#E0F7FA', // Thần kinh, Hô hấp
  pastelBlue: '#D1E4FF', // avatars, generic
  pastelPurple: '#F3E5F5',
  pastelGreen: '#E8F5E9',
} as const;

export const figmaFonts = {
  family: 'Inter',
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  sizes: {
    xs: 11, // captions, nav labels
    sm: 12, // body small, meta
    base: 13, // body
    md: 14, // body large, status bar
    lg: 16, // titles small, list item
    xl: 18, // section titles, banner title
    '2xl': 20, // hero greeting name
    '3xl': 24, // hero icons, avatar text
    '4xl': 28, // big numbers (rating)
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.5,
  },
} as const;

export const figmaSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

export const figmaRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const figmaShadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  banner: {
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  pop: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

// =============================================================
// DARK MODE COLORS
// =============================================================

export const figmaColorsDark = {
  // Brand (same hue, slightly brighter for dark bg)
  primary: '#42A5F5',
  primaryDark: '#1565C0',
  primaryLight: '#64B5F6',

  // Text (inverted)
  textPrimary: '#E8EAED',
  textSecondary: '#9AA0A6',
  textMuted: '#6B7280',

  // Surfaces
  background: '#121212',
  surface: '#1E1E1E',
  surfaceMuted: '#2C2C2C',
  border: '#3C3C3C',

  // Status (same, slightly adjusted for dark bg)
  success: '#66BB6A',
  successBg: '#1B3A1B',
  warning: '#FFD54F',
  warningBg: '#3E3214',
  info: '#4DB6AC',
  infoBg: '#0D3028',
  error: '#EF5350',
  errorBg: '#3B1414',

  // Specialty pastels (darkened)
  pastelRed: '#3B1414',
  pastelOrange: '#3E2E14',
  pastelTeal: '#0D2E2E',
  pastelBlue: '#142840',
  pastelPurple: '#2A1433',
  pastelGreen: '#143014',
} as const;

export type FigmaColorKeys = keyof typeof figmaColors;
export type FigmaColors = Record<FigmaColorKeys, string>;

/**
 * Hook that returns the correct color palette based on dark mode state.
 * Use this in components instead of importing `figmaColors` directly
 * when you want dark mode support.
 */
export function useColors(): FigmaColors {
  const isDark = useThemeStore((s) => s.isDark);
  return isDark ? figmaColorsDark : figmaColors;
}

// =============================================================
// REACT NATIVE PAPER THEME
// =============================================================

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: figmaColors.primary,
    primaryContainer: figmaColors.pastelBlue,
    secondary: figmaColors.success,
    secondaryContainer: figmaColors.successBg,
    tertiary: figmaColors.info,
    error: figmaColors.error,
    errorContainer: figmaColors.errorBg,
    background: figmaColors.background,
    surface: figmaColors.surface,
    surfaceVariant: figmaColors.surfaceMuted,
    outline: figmaColors.border,
    onSurface: figmaColors.textPrimary,
    onSurfaceVariant: figmaColors.textSecondary,
    onBackground: figmaColors.textPrimary,
  },
  roundness: figmaRadius.lg,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: figmaColorsDark.primary,
    primaryContainer: figmaColorsDark.pastelBlue,
    secondary: figmaColorsDark.success,
    secondaryContainer: figmaColorsDark.successBg,
    tertiary: figmaColorsDark.info,
    error: figmaColorsDark.error,
    errorContainer: figmaColorsDark.errorBg,
    background: figmaColorsDark.background,
    surface: figmaColorsDark.surface,
    surfaceVariant: figmaColorsDark.surfaceMuted,
    outline: figmaColorsDark.border,
    onSurface: figmaColorsDark.textPrimary,
    onSurfaceVariant: figmaColorsDark.textSecondary,
    onBackground: figmaColorsDark.textPrimary,
  },
  roundness: figmaRadius.lg,
};

// =============================================================
// LEGACY EXPORTS (for backwards compat with existing screens)
// =============================================================

// systemColors kept for any iOS-style references that haven't been migrated yet
export const systemColors = {
  blue: figmaColors.primary,
  green: figmaColors.success,
  indigo: '#5856D6',
  orange: '#FF9500',
  pink: '#FF2D55',
  purple: '#AF52DE',
  red: figmaColors.error,
  teal: figmaColors.info,
  yellow: figmaColors.warning,
  gray: figmaColors.textSecondary,
  gray2: figmaColors.textMuted,
  gray3: '#C7C7CC',
  gray4: '#D1D1D6',
  gray5: figmaColors.border,
  gray6: figmaColors.surfaceMuted,
} as const;

export const spacing = figmaSpacing;
