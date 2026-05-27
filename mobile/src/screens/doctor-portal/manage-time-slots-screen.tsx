import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Snackbar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { figmaColors, figmaRadius, figmaSpacing } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  FadeInView,
  GradientHeader,
  ScreenContainer,
  SectionTitle,
} from '../../components/shared';
import { api, extractData } from '../../services/api';

const HEADER_COLORS = [figmaColors.info, '#00695C'] as const;
const VN_DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

type SlotState = 'AVAILABLE' | 'BOOKED' | 'NONE';

interface Slot {
  id: string;
  time: string;
  state: SlotState;
}

function buildSlots(): Slot[] {
  const slots: Slot[] = [];
  for (let h = 8; h <= 17; h++) {
    for (const m of [0, 30]) {
      if (h === 17 && m === 30) continue;
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      slots.push({ id: time, time, state: 'NONE' });
    }
  }
  return slots;
}

function getWeekDays(): { label: string; date: string; isToday: boolean }[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const days: { label: string; date: string; isToday: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    const dateStr = d.toISOString().slice(0, 10);
    days.push({
      label: VN_DAY_LABELS[i],
      date: dateStr,
      isToday: dateStr === today.toISOString().slice(0, 10),
    });
  }
  return days;
}

function formatDayNum(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return String(d.getDate());
}

function nextState(s: SlotState): SlotState {
  if (s === 'NONE') return 'AVAILABLE';
  if (s === 'AVAILABLE') return 'NONE';
  return 'BOOKED'; // booked is not toggleable
}

interface SpringPressableProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: object;
  disabled?: boolean;
}

function SpringPressable({ onPress, children, style, disabled }: SpringPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.94, friction: 5, tension: 140, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export function ManageTimeSlotsScreen() {
  const weekDays = useMemo(() => getWeekDays(), []);
  const todayStr = new Date().toISOString().slice(0, 10);
  const initialDate = weekDays.find((d) => d.isToday)?.date ?? weekDays[0].date;

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [slotsByDate, setSlotsByDate] = useState<Record<string, Slot[]>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  const loadSlots = useCallback(async (dateStr: string) => {
    try {
      const res = await api.get('/schedules/doctor/time-slots', {
        params: { date: dateStr },
      });
      const data = extractData<
        { startTime: string; endTime: string; isBooked: boolean }[]
      >(res);
      const base = buildSlots();
      for (const s of base) {
        const match = data.find((d) => d.startTime === s.time);
        if (match) s.state = match.isBooked ? 'BOOKED' : 'AVAILABLE';
      }
      return base;
    } catch {
      return buildSlots();
    }
  }, []);

  const loadCurrentDate = useCallback(async (dateStr: string) => {
    setRefreshing(true);
    const slots = await loadSlots(dateStr);
    setSlotsByDate((prev) => ({ ...prev, [dateStr]: slots }));
    setRefreshing(false);
  }, [loadSlots]);

  useEffect(() => {
    loadCurrentDate(selectedDate);
  }, [selectedDate, loadCurrentDate]);

  const onRefresh = useCallback(async () => {
    await loadCurrentDate(selectedDate);
  }, [selectedDate, loadCurrentDate]);

  const currentSlots = slotsByDate[selectedDate] ?? [];

  const counts = useMemo(() => {
    let available = 0;
    let booked = 0;
    for (const s of currentSlots) {
      if (s.state === 'AVAILABLE') available++;
      if (s.state === 'BOOKED') booked++;
    }
    return { available, booked, total: currentSlots.length };
  }, [currentSlots]);

  const toggleSlot = (slotId: string) => {
    setSlotsByDate((prev) => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] ?? []).map((s) =>
        s.id === slotId && s.state !== 'BOOKED' ? { ...s, state: nextState(s.state) } : s
      ),
    }));
  };

  const handleSave = async () => {
    const available = currentSlots.filter((s) => s.state === 'AVAILABLE');
    setSaving(true);
    try {
      await api.put('/schedules/doctor/time-slots', {
        date: selectedDate,
        slots: available.map((s) => {
          const [h, m] = s.time.split(':').map(Number);
          const endMin = m + 30;
          const endH = h + Math.floor(endMin / 60);
          const endM = endMin % 60;
          const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
          return { startTime: s.time, endTime };
        }),
      });
      setSnack('Đã lưu thay đổi');
    } catch {
      setSnack('Lỗi khi lưu. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
        <GradientHeader
          title="Quản lý slot thời gian"
          subtitle="Tùy chỉnh khung giờ làm việc"
          colors={HEADER_COLORS}
        />

        {/* Week selector */}
        <FadeInView delay={80}>
          <View style={styles.weekRow}>
            {weekDays.map((d) => {
              const active = d.date === selectedDate;
              return (
                <SpringPressable key={d.date} onPress={() => setSelectedDate(d.date)}>
                  <View style={[styles.dayChip, active && styles.dayChipActive]}>
                    <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>
                      {d.label}
                    </Text>
                    <Text style={[styles.dayNum, active && styles.dayNumActive]}>
                      {formatDayNum(d.date)}
                    </Text>
                    {d.isToday ? <View style={styles.todayDot} /> : null}
                  </View>
                </SpringPressable>
              );
            })}
          </View>
        </FadeInView>

        {/* Stats */}
        <FadeInView delay={140}>
          <View style={styles.statsWrap}>
            <GlassCard style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: figmaColors.success }]}>
                  {counts.available}
                </Text>
                <Text style={styles.statLabel}>Sẵn sàng</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: figmaColors.textSecondary }]}>
                  {counts.booked}
                </Text>
                <Text style={styles.statLabel}>Đã đặt</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: figmaColors.info }]}>
                  {counts.total}
                </Text>
                <Text style={styles.statLabel}>Tổng slot</Text>
              </View>
            </GlassCard>
          </View>
        </FadeInView>

        {/* Slot grid */}
        <FadeInView delay={200}>
          <View style={styles.sectionWrap}>
            <SectionTitle title="Khung giờ" />
          </View>
          <View style={styles.gridWrap}>
            <View style={styles.grid}>
              {currentSlots.map((slot) => {
                const isAvailable = slot.state === 'AVAILABLE';
                const isBooked = slot.state === 'BOOKED';
                return (
                  <SpringPressable
                    key={slot.id}
                    onPress={() => toggleSlot(slot.id)}
                    disabled={isBooked}
                  >
                    <View
                      style={[
                        styles.slotCell,
                        isAvailable && styles.slotAvailable,
                        isBooked && styles.slotBooked,
                      ]}
                    >
                      <Text
                        style={[
                          styles.slotText,
                          isAvailable && styles.slotTextAvailable,
                          isBooked && styles.slotTextBooked,
                        ]}
                      >
                        {slot.time}
                      </Text>
                    </View>
                  </SpringPressable>
                );
              })}
            </View>
          </View>
        </FadeInView>

        {/* Legend */}
        <FadeInView delay={260}>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.slotAvailable]} />
              <Text style={styles.legendText}>Sẵn sàng</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.slotBooked]} />
              <Text style={styles.legendText}>Đã đặt</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.slotCellEmpty]} />
              <Text style={styles.legendText}>Chưa đăng ký</Text>
            </View>
          </View>
        </FadeInView>

        {/* Save */}
        <FadeInView delay={320}>
          <View style={styles.saveBigWrap}>
            <SpringPressable
              onPress={handleSave}
              style={[styles.saveBigBtn, saving && { opacity: 0.6 }]}
              disabled={saving}
            >
              <MaterialCommunityIcons name="content-save" size={20} color="#FFFFFF" />
              <Text style={styles.saveBigText}>
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Text>
            </SpringPressable>
          </View>
        </FadeInView>
      </ScreenContainer>

      <Snackbar
        visible={!!snack}
        onDismiss={() => setSnack(null)}
        duration={2200}
        style={{ marginBottom: 100 }}
      >
        {snack ?? ''}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: figmaSpacing.xs,
    paddingHorizontal: figmaSpacing.lg,
    marginTop: -figmaSpacing.md,
  },
  dayChip: {
    width: 44,
    paddingVertical: figmaSpacing.sm,
    borderRadius: figmaRadius.md,
    backgroundColor: figmaColors.surface,
    alignItems: 'center',
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  dayChipActive: {
    backgroundColor: figmaColors.info,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: figmaColors.textSecondary,
  },
  dayLabelActive: {
    color: '#FFFFFF',
  },
  dayNum: {
    fontSize: 16,
    fontWeight: '700',
    color: figmaColors.textPrimary,
  },
  dayNumActive: {
    color: '#FFFFFF',
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: figmaColors.warning,
    marginTop: 2,
  },
  statsWrap: {
    marginHorizontal: figmaSpacing.lg,
    marginTop: figmaSpacing.lg,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: figmaSpacing.md,
    borderRadius: figmaRadius.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: figmaColors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: '60%',
    backgroundColor: figmaColors.border,
  },
  sectionWrap: {
    marginTop: figmaSpacing['2xl'],
  },
  gridWrap: {
    paddingHorizontal: figmaSpacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: figmaSpacing.sm,
  },
  slotCell: {
    width: 70,
    paddingVertical: figmaSpacing.sm + 2,
    borderRadius: figmaRadius.md,
    borderWidth: 1.5,
    borderColor: figmaColors.border,
    alignItems: 'center',
    backgroundColor: figmaColors.surface,
  },
  slotCellEmpty: {
    width: 16,
    height: 16,
    paddingVertical: 0,
    borderRadius: 4,
  },
  slotAvailable: {
    backgroundColor: figmaColors.successBg,
    borderColor: figmaColors.success,
  },
  slotBooked: {
    backgroundColor: figmaColors.surfaceMuted,
    borderColor: figmaColors.border,
  },
  slotText: {
    fontSize: 13,
    fontWeight: '600',
    color: figmaColors.textPrimary,
  },
  slotTextAvailable: {
    color: figmaColors.success,
  },
  slotTextBooked: {
    color: figmaColors.textMuted,
    textDecorationLine: 'line-through',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: figmaSpacing.lg,
    marginTop: figmaSpacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.xs + 2,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  legendText: {
    fontSize: 11,
    color: figmaColors.textSecondary,
  },
  saveBigWrap: {
    paddingHorizontal: figmaSpacing.lg,
    marginTop: figmaSpacing['2xl'],
  },
  saveBigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: figmaSpacing.sm,
    backgroundColor: figmaColors.info,
    paddingVertical: figmaSpacing.md + 2,
    borderRadius: figmaRadius.lg,
  },
  saveBigText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
