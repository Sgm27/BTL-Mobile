/**
 * DoctorCard - Doctor list card with avatar, info, stars, meta
 * Matches Figma `div.doctor-card` pattern.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '../ui/GlassCard';
import { figmaColors, figmaFonts, figmaRadius } from '../../constants/theme';

interface DoctorCardProps {
  name: string;
  specialty: string;
  rating?: number;
  totalReviews?: number;
  patientCount?: number;
  fee?: number;
  avatarText?: string; // initials
  avatarBgColor?: string;
  avatarTextColor?: string;
  onPress?: () => void;
}

export function DoctorCard({
  name,
  specialty,
  rating,
  totalReviews,
  patientCount,
  fee,
  avatarText,
  avatarBgColor = figmaColors.pastelBlue,
  avatarTextColor = figmaColors.primary,
  onPress,
}: DoctorCardProps) {
  const initials = avatarText || name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();
  const safeRating = typeof rating === 'number' ? rating : 0;
  const stars = '⭐'.repeat(Math.max(0, Math.min(5, Math.round(safeRating))));

  return (
    <Pressable
      onPress={() => {
        console.log('[DoctorCard] press:', name);
        onPress?.();
      }}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: avatarBgColor }]}>
            <Text style={[styles.avatarText, { color: avatarTextColor }]}>{initials}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={styles.specialty} numberOfLines={1}>{specialty}</Text>
            {(rating !== undefined || totalReviews !== undefined) && (
              <View style={styles.metaRow}>
                <Text style={styles.stars}>{stars || '☆☆☆☆☆'}</Text>
                <Text style={styles.ratingText}>{safeRating.toFixed(1)}</Text>
              </View>
            )}
            {patientCount !== undefined ? (
              <Text style={styles.patientCount}>👥 {patientCount}+ bệnh nhân</Text>
            ) : null}
          </View>
          {fee !== undefined ? (
            <View style={styles.feeBox}>
              <Text style={styles.feeText}>{fee.toLocaleString('vi-VN')}đ</Text>
            </View>
          ) : null}
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  card: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: figmaRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: figmaFonts.sizes['3xl'],
    fontWeight: figmaFonts.weights.bold,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textPrimary,
  },
  specialty: {
    fontSize: figmaFonts.sizes.base,
    color: figmaColors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  stars: {
    fontSize: figmaFonts.sizes.lg,
    color: figmaColors.warning,
  },
  ratingText: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
  },
  patientCount: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
    marginTop: 2,
  },
  feeBox: {
    alignSelf: 'center',
  },
  feeText: {
    fontSize: figmaFonts.sizes.md,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.primary,
  },
});
