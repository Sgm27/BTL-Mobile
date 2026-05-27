import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/theme.store';

interface ScreenBackgroundProps {
  children: React.ReactNode;
}

const LIGHT_COLORS = ['#E8EFF5', '#F2F2F7', '#EDE7F6'] as const;
const DARK_COLORS = ['#121212', '#1A1A2E', '#1E1E2E'] as const;

/**
 * Gradient background for screens — makes GlassCard / Liquid Glass visible.
 * Glass effects need varied background content to be perceivable.
 */
export function ScreenBackground({ children }: ScreenBackgroundProps) {
  const isDark = useThemeStore((s) => s.isDark);

  return (
    <LinearGradient
      colors={isDark ? DARK_COLORS : LIGHT_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
