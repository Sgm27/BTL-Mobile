/**
 * AppointmentCard - Compact minimalist appointment card.
 * Single-row layout: status dot + doctor + time + status badge.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { figmaColors, figmaFonts, figmaRadius } from '../../constants/theme';

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'AWAITING_PAYMENT' | 'COMPLETED' | 'CANCELED';

interface AppointmentCardProps {
  doctorName: string;
  specialty: string;
  date: string;
  startTime: string;
  endTime?: string;
  status: AppointmentStatus;
  avatarText?: string;
  avatarBgColor?: string;
  avatarTextColor?: string;
  onPress?: () => void;
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  AWAITING_PAYMENT: 'Chờ thanh toán',
  COMPLETED: 'Hoàn thành',
  CANCELED: 'Đã hủy',
};

const STATUS_CFG: Record<AppointmentStatus, { color: string; bg: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  PENDING: { color: '#F57C00', bg: '#FFF3E0', icon: 'clock-outline' },
  CONFIRMED: { color: figmaColors.success, bg: figmaColors.successBg, icon: 'check-circle-outline' },
  AWAITING_PAYMENT: { color: '#7C4DFF', bg: figmaColors.pastelPurple, icon: 'cash-clock' },
  COMPLETED: { color: figmaColors.info, bg: figmaColors.infoBg, icon: 'checkbox-marked-circle-outline' },
  CANCELED: { color: figmaColors.error, bg: figmaColors.errorBg, icon: 'close-circle-outline' },
};

export function AppointmentCard({
  doctorName,
  specialty,
  date,
  startTime,
  endTime,
  status,
  onPress,
}: AppointmentCardProps) {
  const cfg = STATUS_CFG[status];

  return (
    <Pressable
      onPress={() => {
        console.log('[AppointmentCard] press:', doctorName);
        onPress?.();
      }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {/* Status accent */}
      <View style={[styles.accent, { backgroundColor: cfg.color }]} />

      <View style={styles.body}>
        {/* Row 1: doctor + status */}
        <View style={styles.topRow}>
          <View style={styles.doctorInfo}>
            <Text style={styles.name} numberOfLines={1}>{doctorName}</Text>
            <Text style={styles.specialty} numberOfLines={1}>{specialty}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <MaterialCommunityIcons name={cfg.icon} size={12} color={cfg.color} />
            <Text style={[styles.badgeText, { color: cfg.color }]}>{STATUS_LABELS[status]}</Text>
          </View>
        </View>

        {/* Row 2: date + time */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="calendar-outline" size={14} color={figmaColors.textMuted} />
            <Text style={styles.metaText}>{date}</Text>
          </View>
          <View style={styles.dot} />
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={figmaColors.textMuted} />
            <Text style={styles.metaText}>
              {startTime}{endTime ? ` – ${endTime}` : ''}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: figmaColors.surface,
    borderRadius: figmaRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: figmaColors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  accent: {
    width: 3,
  },
  body: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  doctorInfo: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontSize: figmaFonts.sizes.md,
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.textPrimary,
  },
  specialty: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: figmaRadius.pill,
  },
  badgeText: {
    fontSize: figmaFonts.sizes.xs,
    fontWeight: figmaFonts.weights.semibold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: figmaColors.textMuted,
  },
});
