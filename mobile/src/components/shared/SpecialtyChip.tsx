/**
 * SpecialtyChip - 56x56 colored icon background + label below
 * Matches Figma `div.specialty-item` pattern.
 * Used in horizontal scroll list on Home screen.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { figmaColors, figmaFonts, figmaRadius } from '../../constants/theme';

interface SpecialtyChipProps {
  icon: string; // emoji
  label: string;
  bgColor?: string;
  onPress?: () => void;
}

export function SpecialtyChip({ icon, label, bgColor = figmaColors.pastelRed, onPress }: SpecialtyChipProps) {
  return (
    <Pressable
      onPress={() => {
        console.log('[SpecialtyChip] press:', label);
        onPress?.();
      }}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 72,
    alignItems: 'center',
    gap: 6,
  },
  pressed: {
    opacity: 0.7,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: figmaRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  label: {
    fontSize: figmaFonts.sizes.xs,
    fontWeight: figmaFonts.weights.medium,
    color: figmaColors.textSecondary,
    textAlign: 'center',
  },
});
