import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useAuthStore } from '../../store/auth.store';
import { figmaColors, figmaRadius, figmaSpacing } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  EmptyState,
  FadeInView,
  GradientHeader,
  ScreenContainer,
  SectionTitle,
} from '../../components/shared';
import { api, extractPaginatedData } from '../../services/api';
import type { Appointment } from '../../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(t?: string): string {
  if (!t) return '';
  return t.slice(0, 5);
}

function isToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  const today = new Date().toISOString().slice(0, 10);
  return dateStr.slice(0, 10) === today;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  PENDING: { color: figmaColors.warning, bg: figmaColors.warningBg, label: 'Chờ xác nhận' },
  CONFIRMED: { color: figmaColors.primary, bg: figmaColors.pastelBlue, label: 'Đã xác nhận' },
  AWAITING_PAYMENT: { color: '#7C4DFF', bg: figmaColors.pastelPurple, label: 'Chờ thanh toán' },
  COMPLETED: { color: figmaColors.success, bg: figmaColors.successBg, label: 'Hoàn thành' },
  CANCELED: { color: figmaColors.error, bg: figmaColors.errorBg, label: 'Đã hủy' },
};

const HEADER_COLORS = [figmaColors.info, '#00695C'] as const;

// ---------------------------------------------------------------------------
// Animated Stat Card
// ---------------------------------------------------------------------------

interface StatCardProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: number;
  label: string;
  color: string;
  bg: string;
  delay: number;
}

function StatCard({ icon, value, label, color, bg, delay }: StatCardProps) {
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      delay,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [delay, scale]);

  return (
    <Animated.View style={[styles.statCardWrap, { transform: [{ scale }] }]}>
      <GlassCard style={styles.statCard}>
        <View style={[styles.statIconCircle, { backgroundColor: bg }]}>
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </GlassCard>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Spring-animated Pressable button
// ---------------------------------------------------------------------------

interface SpringButtonProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  iconColor: string;
  iconBg: string;
  onPress: () => void;
}

function SpringButton({ icon, label, iconColor, iconBg, onPress }: SpringButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      friction: 5,
      tension: 140,
      useNativeDriver: true,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 140,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.quickActionWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.quickActionBtn}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
        </View>
        <Text style={styles.quickActionLabel}>{label}</Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={figmaColors.textMuted}
        />
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// DoctorHomeScreen
// ---------------------------------------------------------------------------

export function DoctorHomeScreen() {
  const user = useAuthStore((s) => s.user);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      const apptRes = await api.get('/appointments/me', { params: { limit: 50, sort: 'date', order: 'asc' } });
      const { data } = extractPaginatedData<Appointment[]>(apptRes);
      console.log('[doctor-home] fetched', data.length, 'appointments');
      setAppointments(data);
    } catch (err) {
      console.error('[doctor-home] fetch appointments failed:', err);
    } finally {
      setLoading(false);
    }

  }, []);

  useEffect(() => {
    void fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  }, [fetchAppointments]);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  const handleConfirm = async (id: string) => {
    setActionLoading(id);
    try {
      await api.put(`/appointments/${id}/confirm`);
      await fetchAppointments();
    } catch {
      // silently handle
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = (id: string) => {
    Alert.prompt(
      'Từ chối lịch hẹn',
      'Vui lòng nhập lý do từ chối:',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: async (reason?: string) => {
            if (!reason?.trim()) return;
            setActionLoading(id);
            try {
              await api.put(`/appointments/${id}/reject`, { reason: reason.trim() });
              await fetchAppointments();
            } catch { /* ignore */ } finally {
              setActionLoading(null);
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };


  // -----------------------------------------------------------------------
  // Computed
  // -----------------------------------------------------------------------

  // All PENDING in specialty (any date) + today's non-PENDING non-CANCELED
  const pendingAll = appointments.filter((a) => a.status === 'PENDING');
  const todayNonPending = appointments.filter(
    (a) => isToday(a.timeSlot?.date) && a.status !== 'CANCELED' && a.status !== 'PENDING'
  );
  const displayAppointments = [...pendingAll, ...todayNonPending];
  const todayCompleted = displayAppointments.filter((a) => a.status === 'COMPLETED' || a.status === 'AWAITING_PAYMENT').length;
  const todayPending = pendingAll.length;

  console.log('[doctor-home] appointments total:', appointments.length, 'pending:', pendingAll.length, 'display:', displayAppointments.length);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const renderAppointmentCard = ({ item, index }: { item: Appointment; index: number }) => {
    const isExpanded = expandedId === item.id;
    const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;
    const patientName = item.patient?.name ?? 'Bệnh nhân';
    const slotStart = formatTime(item.timeSlot?.startTime);
    const slotEnd = formatTime(item.timeSlot?.endTime);
    const isProcessing = actionLoading === item.id;

    return (
      <FadeInView delay={index * 60}>
        <Pressable onPress={() => setExpandedId(isExpanded ? null : item.id)}>
          <GlassCard style={styles.appointmentCard}>
            <View style={styles.cardRow}>
              <View style={[styles.avatarCircle, { backgroundColor: status.bg }]}>
                <MaterialCommunityIcons name="account" size={24} color={status.color} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.patientName} numberOfLines={1}>
                  {patientName}
                </Text>
                <View style={styles.timeRow}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={13}
                    color={figmaColors.textSecondary}
                  />
                  <Text style={styles.timeText}>
                    {slotStart}
                    {slotEnd ? ` - ${slotEnd}` : ''}
                  </Text>
                </View>
                {item.notes ? (
                  <Text style={styles.notesPreview} numberOfLines={1}>
                    {item.notes}
                  </Text>
                ) : null}
              </View>
              <View style={styles.cardRight}>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.label}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={figmaColors.textMuted}
                />
              </View>
            </View>

            {isExpanded && (
              <View style={styles.expandedSection}>
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={14}
                    color={figmaColors.textSecondary}
                  />
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailText} numberOfLines={1}>
                    {item.patient?.email ?? 'N/A'}
                  </Text>
                </View>
                {item.patient?.phone ? (
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons
                      name="phone-outline"
                      size={14}
                      color={figmaColors.textSecondary}
                    />
                    <Text style={styles.detailLabel}>Số điện thoại:</Text>
                    <Text style={styles.detailText}>{item.patient.phone}</Text>
                  </View>
                ) : null}
                {item.notes ? (
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons
                      name="note-text-outline"
                      size={14}
                      color={figmaColors.textSecondary}
                    />
                    <Text style={styles.detailLabel}>Triệu chứng:</Text>
                    <Text style={styles.detailText}>{item.notes}</Text>
                  </View>
                ) : null}
                {item.diagnosis ? (
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons
                      name="stethoscope"
                      size={14}
                      color={figmaColors.success}
                    />
                    <Text style={[styles.detailLabel, { color: figmaColors.success }]}>
                      Chẩn đoán:
                    </Text>
                    <Text style={[styles.detailText, { color: figmaColors.success }]}>
                      {item.diagnosis}
                    </Text>
                  </View>
                ) : null}

                {item.status === 'PENDING' && (
                  <View style={styles.actionRow}>
                    <Button
                      mode="contained"
                      onPress={() => handleConfirm(item.id)}
                      loading={isProcessing}
                      disabled={isProcessing}
                      style={styles.actionButton}
                      buttonColor={figmaColors.primary}
                      icon="check"
                    >
                      Chấp nhận
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => handleReject(item.id)}
                      disabled={isProcessing}
                      style={styles.actionButton}
                      textColor={figmaColors.error}
                      icon="close"
                    >
                      Từ chối
                    </Button>
                  </View>
                )}

                {(item.status === 'CONFIRMED' || item.status === 'AWAITING_PAYMENT') && (
                  <Button
                    mode="contained"
                    onPress={() => router.push(`/doctor-exam?id=${item.id}`)}
                    style={styles.actionButton}
                    buttonColor={item.status === 'CONFIRMED' ? figmaColors.info : '#7C4DFF'}
                    icon={item.status === 'CONFIRMED' ? 'stethoscope' : 'eye'}
                  >
                    {item.status === 'CONFIRMED' ? 'Khám bệnh' : 'Xem chi tiết'}
                  </Button>
                )}
              </View>
            )}
          </GlassCard>
        </Pressable>
      </FadeInView>
    );
  };

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      <GradientHeader
        title={user?.name?.startsWith('BS.') ? user.name : `BS. ${user?.name ?? 'Bác sĩ'}`}
        subtitle="Chào mừng quay lại"
        colors={HEADER_COLORS}
      />

      <View style={styles.statsRow}>
        <StatCard
          icon="account-group"
          value={displayAppointments.length}
          label="Tổng lịch hẹn"
          color={figmaColors.info}
          bg={figmaColors.infoBg}
          delay={100}
        />
        <StatCard
          icon="check-circle"
          value={todayCompleted}
          label="Đã hoàn thành"
          color={figmaColors.success}
          bg={figmaColors.successBg}
          delay={180}
        />
        <StatCard
          icon="clock-outline"
          value={todayPending}
          label="Chờ xác nhận"
          color={figmaColors.warning}
          bg={figmaColors.warningBg}
          delay={260}
        />
      </View>

      <FadeInView delay={300}>
        <View style={styles.sectionWrap}>
          <SectionTitle title="Hành động nhanh" />
        </View>
        <View style={styles.quickActions}>
          <SpringButton
            icon="calendar-text"
            label="Xem tất cả lịch khám"
            iconColor={figmaColors.primary}
            iconBg={figmaColors.pastelBlue}
            onPress={() => router.push('/appointments' as never)}
          />
          <SpringButton
            icon="calendar-edit"
            label="Quản lý lịch làm việc"
            iconColor={figmaColors.info}
            iconBg={figmaColors.infoBg}
            onPress={() => router.push('/doctor-schedule' as never)}
          />
        </View>
      </FadeInView>

      <FadeInView delay={400}>
        <View style={styles.sectionWrap}>
          <SectionTitle title="Lịch hẹn" />
        </View>
      </FadeInView>

      {loading ? (
        <View style={styles.loadingWrap}>
          <LottieView
            source={require('../../assets/animations/loading.json')}
            autoPlay
            loop
            style={{ width: 100, height: 100 }}
          />
        </View>
      ) : displayAppointments.length === 0 ? (
        <FadeInView delay={450}>
          <EmptyState
            icon="calendar-blank"
            title="Hôm nay chưa có lịch khám nào"
          />
        </FadeInView>
      ) : (
        <FlatList
          data={displayAppointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointmentCard}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  /* Stats */
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: figmaSpacing.lg,
    marginTop: figmaSpacing.lg,
    gap: figmaSpacing.md,
  },
  statCardWrap: {
    flex: 1,
  },
  statCard: {
    borderRadius: figmaRadius.lg,
    paddingVertical: figmaSpacing.md + 2,
    paddingHorizontal: figmaSpacing.sm + 2,
    alignItems: 'center',
  },
  statIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: figmaSpacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: figmaColors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: figmaColors.textSecondary,
    textAlign: 'center',
  },

  /* Section spacing */
  sectionWrap: {
    marginTop: figmaSpacing['2xl'],
  },

  /* Quick Actions */
  quickActions: {
    flexDirection: 'row',
    marginHorizontal: figmaSpacing.lg,
    gap: figmaSpacing.md,
  },
  quickActionWrap: {
    flex: 1,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.sm + 2,
    backgroundColor: figmaColors.surface,
    borderRadius: figmaRadius.lg,
    paddingVertical: figmaSpacing.md + 2,
    paddingHorizontal: figmaSpacing.md + 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: figmaColors.textPrimary,
    flex: 1,
  },

  /* Appointment Cards */
  listContent: {
    paddingHorizontal: figmaSpacing.lg,
    gap: figmaSpacing.sm + 2,
  },
  appointmentCard: {
    borderRadius: figmaRadius.lg,
    paddingVertical: figmaSpacing.md + 2,
    paddingHorizontal: figmaSpacing.md + 2,
    marginBottom: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: figmaColors.textPrimary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.xs,
  },
  timeText: {
    fontSize: 13,
    color: figmaColors.textSecondary,
  },
  notesPreview: {
    fontSize: 12,
    color: figmaColors.textMuted,
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: figmaSpacing.xs + 2,
  },
  statusBadge: {
    paddingHorizontal: figmaSpacing.sm,
    paddingVertical: 3,
    borderRadius: figmaRadius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Expanded */
  expandedSection: {
    marginTop: figmaSpacing.md + 2,
    paddingTop: figmaSpacing.md + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: figmaColors.border,
    gap: figmaSpacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.sm,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: figmaColors.textSecondary,
  },
  detailText: {
    fontSize: 13,
    color: figmaColors.textSecondary,
    flex: 1,
  },
  completeSection: {
    gap: figmaSpacing.sm + 2,
    marginTop: figmaSpacing.xs,
  },
  diagnosisInput: {
    backgroundColor: figmaColors.surface,
    fontSize: 14,
  },
  servicePickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: figmaColors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  serviceChips: {
    gap: 6,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: figmaRadius.sm,
    borderWidth: 1,
    borderColor: figmaColors.border,
    backgroundColor: figmaColors.surface,
  },
  serviceChipActive: {
    borderColor: figmaColors.primary,
    backgroundColor: figmaColors.pastelBlue,
  },
  serviceChipText: {
    flex: 1,
    fontSize: 13,
    color: figmaColors.textSecondary,
  },
  serviceChipTextActive: {
    color: figmaColors.primary,
    fontWeight: '600',
  },
  serviceChipPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: figmaColors.textMuted,
  },
  totalText: {
    fontSize: 14,
    fontWeight: '700',
    color: figmaColors.primary,
    textAlign: 'right',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: figmaSpacing.xs,
  },
  actionButton: {
    borderRadius: figmaRadius.md,
    flex: 1,
  },

  /* Loading */
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: figmaSpacing['3xl'],
  },
});
