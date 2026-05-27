/**
 * Skeleton - Shimmering placeholder block.
 *
 * Uses translateX gradient sweep (NO opacity animation, glass-safe).
 * Compose multiple Skeleton blocks to build list/card placeholders.
 */
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native';
import { figmaColors, figmaRadius } from '../../constants/theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = '100%', height = 14, radius = 6, style }: SkeletonProps) {
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  const translateX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 400],
  });

  return (
    <View
      style={[
        styles.base,
        { width, height, borderRadius: radius },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          { transform: [{ translateX }] },
        ]}
      />
    </View>
  );
}

interface SkeletonCardProps {
  /** Number of placeholder rows to render */
  rows?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * SkeletonCard - typical "list item" placeholder: avatar + 2 text lines.
 */
export function SkeletonCard({ rows = 1, style }: SkeletonCardProps) {
  return (
    <View style={[styles.card, style]}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.row}>
          <Skeleton width={56} height={56} radius={figmaRadius.pill} />
          <View style={styles.lines}>
            <Skeleton width="65%" height={16} />
            <Skeleton width="40%" height={12} />
            <Skeleton width="30%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: figmaColors.surfaceMuted,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: 'rgba(255,255,255,0.55)',
    opacity: 0.6,
  },
  card: {
    backgroundColor: figmaColors.surface,
    borderRadius: figmaRadius.lg,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: figmaColors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  lines: {
    flex: 1,
    gap: 8,
  },
});
