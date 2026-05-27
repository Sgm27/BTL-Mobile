/**
 * GlassCard - iOS 26 Liquid Glass with native GlassView
 *
 * IMPORTANT: GlassView (UIVisualEffectView under the hood) can swallow touch
 * events on iOS. To keep child Pressables clickable, we render the GlassView
 * absolutely positioned as a background layer, and put the actual content in
 * a sibling View on top. Touches go straight to the content layer.
 */
import React from 'react';
import { Platform, StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useThemeStore } from '../../store/theme.store';

const CAN_USE_GLASS = (() => {
  if (Platform.OS !== 'ios') return false;
  try {
    const ok = isLiquidGlassAvailable();
    // eslint-disable-next-line no-console
    console.log('[GlassCard] isLiquidGlassAvailable:', ok, 'GlassView:', typeof GlassView);
    return ok;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('[GlassCard] isLiquidGlassAvailable threw:', e);
    return false;
  }
})();

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Glass effect style for iOS 26+. 'clear' is more transparent, 'regular' is more opaque. */
  glassStyle?: 'clear' | 'regular';
  /** Tint color for the glass effect */
  tintColor?: string;
  /** Whether glass should respond to touch */
  interactive?: boolean;
}

export function GlassCard({
  children,
  style,
  glassStyle = 'clear',
  tintColor,
  interactive = false,
}: GlassCardProps) {
  const isDark = useThemeStore((s) => s.isDark);

  if (CAN_USE_GLASS) {
    return (
      <View style={[styles.wrap, style]}>
        <GlassView
          style={StyleSheet.absoluteFill}
          glassEffectStyle={glassStyle}
          tintColor={tintColor}
          isInteractive={interactive}
          pointerEvents="none"
        />
        {children}
      </View>
    );
  }

  return (
    <View style={[isDark ? styles.fallbackDark : styles.fallback, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 16,
    backgroundColor: 'transparent',
  },
  fallback: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  fallbackDark: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 60, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
});

export default GlassCard;
