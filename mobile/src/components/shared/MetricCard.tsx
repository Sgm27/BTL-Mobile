/**
 * MetricCard - Health metric display: icon + value + label + optional trend
 * Matches Figma `div.metric-card` pattern.
 */
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { figmaColors, figmaFonts } from '../../constants/theme';

interface MetricCardProps {
  icon: string; // emoji
  value: string | number;
  unit?: string;
  label: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  iconBgColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function MetricCard({
  icon,
  value,
  unit,
  label,
  trend,
  trendValue,
  iconBgColor = figmaColors.pastelBlue,
  style,
}: MetricCardProps) {
  const trendColor = trend === 'up' ? figmaColors.success : trend === 'down' ? figmaColors.error : figmaColors.textMuted;
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <GlassCard style={[styles.card, style]}>
      <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
      {trend && trendValue ? (
        <View style={styles.trendRow}>
          <Text style={[styles.trendIcon, { color: trendColor }]}>{trendIcon}</Text>
          <Text style={[styles.trendValue, { color: trendColor }]}>{trendValue}</Text>
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 20,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: figmaFonts.sizes['3xl'],
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textPrimary,
  },
  unit: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textMuted,
  },
  label: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  trendIcon: {
    fontSize: figmaFonts.sizes.md,
    fontWeight: figmaFonts.weights.bold,
  },
  trendValue: {
    fontSize: figmaFonts.sizes.sm,
    fontWeight: figmaFonts.weights.semibold,
  },
});
