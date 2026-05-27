/**
 * PromoBanner - Gradient banner with decorative bg icon and CTA button
 * Matches Figma `div.banner-card` pattern.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { figmaColors, figmaFonts, figmaRadius, figmaShadows } from '../../constants/theme';

interface PromoBannerProps {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onPress?: () => void;
  decorativeIcon?: string; // emoji
}

export function PromoBanner({
  title,
  subtitle,
  ctaLabel,
  onPress,
  decorativeIcon = '🏥',
}: PromoBannerProps) {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[figmaColors.primary, figmaColors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={styles.bgIcon}>{decorativeIcon}</Text>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {ctaLabel && onPress ? (
            <Pressable onPress={onPress} style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
              <Text style={styles.btnText}>{ctaLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 20,
    ...figmaShadows.banner,
  },
  gradient: {
    borderRadius: figmaRadius.lg,
    paddingVertical: 20,
    paddingHorizontal: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  bgIcon: {
    position: 'absolute',
    right: -10,
    top: -10,
    fontSize: 80,
    opacity: 0.12,
  },
  content: {
    gap: 4,
  },
  title: {
    fontSize: figmaFonts.sizes.xl,
    fontWeight: figmaFonts.weights.semibold,
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: figmaFonts.sizes.base,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 12,
  },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: figmaRadius.sm,
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  btnText: {
    fontSize: figmaFonts.sizes.base,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.primary,
  },
});
