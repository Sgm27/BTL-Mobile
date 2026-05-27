import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Snackbar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  EmptyState,
  FadeInView,
  GradientHeader,
  ScreenContainer,
} from '../../components/shared';
import {
  figmaColors,
  figmaFonts,
  figmaRadius,
  figmaSpacing,
} from '../../constants/theme';
import { getMyAppointments } from '../../services/appointments.service';
import type { Appointment } from '../../types';

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

type FilterKey = 'ALL' | 'LAST_30_DAYS' | 'LAST_6_MONTHS' | 'THIS_YEAR';

interface FilterOption {
  key: FilterKey;
  label: string;
}

const FILTERS: FilterOption[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'LAST_30_DAYS', label: '30 ngày qua' },
  { key: 'LAST_6_MONTHS', label: '6 tháng qua' },
  { key: 'THIS_YEAR', label: 'Năm nay' },
];

function filterAppointments(items: Appointment[], filter: FilterKey): Appointment[] {
  if (filter === 'ALL') return items;
  const now = new Date();
  let threshold: Date;
  if (filter === 'LAST_30_DAYS') {
    threshold = new Date(now);
    threshold.setDate(threshold.getDate() - 30);
  } else if (filter === 'LAST_6_MONTHS') {
    threshold = new Date(now);
    threshold.setMonth(threshold.getMonth() - 6);
  } else {
    threshold = new Date(now.getFullYear(), 0, 1);
  }
  return items.filter((a) => {
    const dateStr = a.timeSlot?.date;
    if (!dateStr) return false;
    return new Date(dateStr + 'T00:00:00').getTime() >= threshold.getTime();
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatShortDate(value?: string): string {
  if (!value) return '';
  return new Date(value + 'T00:00:00').toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatLongDate(value?: string): string {
  if (!value) return '';
  return new Date(value + 'T00:00:00').toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function timeOf(appt: Appointment): number {
  const dateStr = appt.timeSlot?.date ?? appt.createdAt;
  return new Date(dateStr).getTime();
}

// ---------------------------------------------------------------------------
// Filter chip
// ---------------------------------------------------------------------------

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function FilterChip({ label, active, onPress }: FilterChipProps) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onPressIn={() => {
        Animated.spring(scale, {
          toValue: 0.94,
          friction: 6,
          tension: 200,
          useNativeDriver: true,
        }).start();
      }}
      onPressOut={() => {
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 200,
          useNativeDriver: true,
        }).start();
      }}
    >
      <Animated.View
        style={[
          chipStyles.chip,
          active && chipStyles.chipActive,
          { transform: [{ scale }] },
        ]}
      >
        <Text style={[chipStyles.chipText, active && chipStyles.chipTextActive]}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: figmaRadius.lg,
    backgroundColor: figmaColors.surface,
    borderWidth: 1.5,
    borderColor: figmaColors.border,
  },
  chipActive: {
    backgroundColor: figmaColors.primary,
    borderColor: figmaColors.primary,
  },
  chipText: {
    fontSize: figmaFonts.sizes.base,
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
  },
});

// ---------------------------------------------------------------------------
// Stats card
// ---------------------------------------------------------------------------

interface StatsCardProps {
  total: number;
  topSpecialty: string;
  lastVisit: string;
}

function StatsCard({ total, topSpecialty, lastVisit }: StatsCardProps) {
  return (
    <GlassCard style={statsStyles.card} glassStyle="regular">
      <View style={statsStyles.row}>
        <View style={statsStyles.statBox}>
          <View style={[statsStyles.iconCircle, { backgroundColor: figmaColors.pastelBlue }]}>
            <MaterialCommunityIcons name="calendar-check" size={20} color={figmaColors.primary} />
          </View>
          <Text style={statsStyles.value}>{total}</Text>
          <Text style={statsStyles.label}>Tổng số lần khám</Text>
        </View>

        <View style={statsStyles.divider} />

        <View style={statsStyles.statBox}>
          <View style={[statsStyles.iconCircle, { backgroundColor: figmaColors.pastelPurple }]}>
            <MaterialCommunityIcons name="heart-pulse" size={20} color="#8E24AA" />
          </View>
          <Text style={statsStyles.value} numberOfLines={1}>
            {topSpecialty || '-'}
          </Text>
          <Text style={statsStyles.label}>Khám nhiều nhất</Text>
        </View>

        <View style={statsStyles.divider} />

        <View style={statsStyles.statBox}>
          <View style={[statsStyles.iconCircle, { backgroundColor: figmaColors.pastelOrange }]}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#F57C00" />
          </View>
          <Text style={statsStyles.value} numberOfLines={1}>
            {lastVisit || '-'}
          </Text>
          <Text style={statsStyles.label}>Lần gần nhất</Text>
        </View>
      </View>
    </GlassCard>
  );
}

const statsStyles = StyleSheet.create({
  card: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: figmaColors.border,
    marginHorizontal: 4,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  value: {
    fontSize: figmaFonts.sizes.md,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textPrimary,
    textAlign: 'center',
  },
  label: {
    fontSize: figmaFonts.sizes.xs,
    color: figmaColors.textSecondary,
    textAlign: 'center',
  },
});

// ---------------------------------------------------------------------------
// Timeline item
// ---------------------------------------------------------------------------

interface TimelineItemProps {
  appointment: Appointment;
  isFirst: boolean;
  isLast: boolean;
}

function TimelineItem({ appointment, isFirst, isLast }: TimelineItemProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const doctor = appointment.doctor;
  const timeSlot = appointment.timeSlot;
  const diagnosis = appointment.diagnosis ?? 'Chưa có chẩn đoán';

  return (
    <View style={timelineStyles.row}>
      <View style={timelineStyles.spineCol}>
        <View
          style={[
            timelineStyles.line,
            { backgroundColor: isFirst ? 'transparent' : figmaColors.border },
          ]}
        />
        <View style={timelineStyles.dotOuter}>
          <View style={timelineStyles.dotInner} />
        </View>
        <View
          style={[
            timelineStyles.line,
            { backgroundColor: isLast ? 'transparent' : figmaColors.border, flex: 1 },
          ]}
        />
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        style={timelineStyles.cardWrap}
        onPress={() =>
          router.push({
            pathname: '/appointment-detail',
            params: { id: appointment.id },
          })
        }
        onPressIn={() => {
          Animated.spring(scale, {
            toValue: 0.97,
            friction: 6,
            tension: 200,
            useNativeDriver: true,
          }).start();
        }}
        onPressOut={() => {
          Animated.spring(scale, {
            toValue: 1,
            friction: 6,
            tension: 200,
            useNativeDriver: true,
          }).start();
        }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <GlassCard style={timelineStyles.card} glassStyle="regular">
            <View style={timelineStyles.cardInner}>
              <Text style={timelineStyles.dateText}>
                {formatLongDate(timeSlot?.date)}
                {timeSlot?.startTime ? `  -  ${timeSlot.startTime}` : ''}
              </Text>
              <View style={timelineStyles.doctorRow}>
                <MaterialCommunityIcons name="doctor" size={16} color={figmaColors.primary} />
                <Text style={timelineStyles.doctorName} numberOfLines={1}>
                  {doctor?.name ?? 'Bác sĩ'}
                </Text>
              </View>
              {doctor?.specialty?.name && (
                <View style={timelineStyles.specialtyBadge}>
                  <Text style={timelineStyles.specialtyText}>{doctor.specialty.name}</Text>
                </View>
              )}
              <Text style={timelineStyles.diagnosisText} numberOfLines={2}>
                {diagnosis}
              </Text>
            </View>
          </GlassCard>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const timelineStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  spineCol: {
    width: 24,
    alignItems: 'center',
  },
  line: {
    width: 2,
    minHeight: 8,
  },
  dotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: figmaColors.pastelBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: figmaColors.primary,
  },
  cardWrap: {
    flex: 1,
    paddingBottom: 14,
  },
  card: {},
  cardInner: {
    gap: 6,
  },
  dateText: {
    fontSize: figmaFonts.sizes.sm,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  doctorName: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textPrimary,
    flex: 1,
  },
  specialtyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: figmaColors.pastelBlue,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  specialtyText: {
    fontSize: figmaFonts.sizes.sm,
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.primary,
  },
  diagnosisText: {
    fontSize: figmaFonts.sizes.base,
    color: figmaColors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function MedicalHistoryScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [notice, setNotice] = useState('');

  const fetchHistory = useCallback(async () => {
    try {
      const result = await getMyAppointments({ status: 'COMPLETED', limit: 100 });
      const sorted = [...result.data].sort((a, b) => timeOf(b) - timeOf(a));
      setAppointments(sorted);
    } catch {
      setNotice('Không thể tải lịch sử khám bệnh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  }

  const filtered = useMemo(
    () => filterAppointments(appointments, filter),
    [appointments, filter]
  );

  const stats = useMemo(() => {
    const total = appointments.length;
    const counts = new Map<string, number>();
    for (const a of appointments) {
      const name = a.doctor?.specialty?.name;
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    let topSpecialty = '';
    let topCount = 0;
    counts.forEach((value, key) => {
      if (value > topCount) {
        topCount = value;
        topSpecialty = key;
      }
    });
    const lastVisit = appointments[0]?.timeSlot?.date
      ? formatShortDate(appointments[0].timeSlot.date)
      : '';
    return { total, topSpecialty, lastVisit };
  }, [appointments]);

  return (
    <>
      <ScreenContainer
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
      >
        <GradientHeader
          title="Lịch sử khám bệnh"
          subtitle="Các lần khám đã hoàn thành"
          colors={[figmaColors.primary, figmaColors.primaryDark]}
          leftSlot={
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
            </TouchableOpacity>
          }
        />

        <View style={styles.body}>
          <FadeInView delay={0}>
            <StatsCard
              total={stats.total}
              topSpecialty={stats.topSpecialty}
              lastVisit={stats.lastVisit}
            />
          </FadeInView>

          <FadeInView delay={80}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {FILTERS.map((f) => (
                <FilterChip
                  key={f.key}
                  label={f.label}
                  active={filter === f.key}
                  onPress={() => setFilter(f.key)}
                />
              ))}
            </ScrollView>
          </FadeInView>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={figmaColors.primary} />
            </View>
          ) : filtered.length === 0 ? (
            <FadeInView delay={160}>
              <EmptyState
                icon="history"
                title="Chưa có lịch sử khám bệnh"
                message="Các lần khám đã hoàn thành sẽ hiển thị ở đây."
              />
            </FadeInView>
          ) : (
            <View style={styles.timeline}>
              {filtered.map((appt, i) => (
                <FadeInView key={appt.id} delay={160 + i * 80}>
                  <TimelineItem
                    appointment={appt}
                    isFirst={i === 0}
                    isLast={i === filtered.length - 1}
                  />
                </FadeInView>
              ))}
            </View>
          )}
        </View>
      </ScreenContainer>

      <Snackbar
        visible={Boolean(notice)}
        onDismiss={() => setNotice('')}
        duration={3000}
      >
        {notice}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: figmaSpacing.lg,
    gap: figmaSpacing.md,
    marginTop: figmaSpacing.lg,
  },
  chipsRow: {
    gap: figmaSpacing.sm,
    paddingVertical: 4,
    paddingRight: figmaSpacing.sm,
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  timeline: {
    marginTop: 4,
  },
});
