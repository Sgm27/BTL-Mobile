import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Snackbar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { figmaColors, figmaRadius, figmaSpacing } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  EmptyState,
  FadeInView,
  GradientHeader,
  ScreenContainer,
  SectionTitle,
} from '../../components/shared';
import { api, extractData } from '../../services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorkSchedule {
  id: string;
  date: string;
  shift: 'MORNING' | 'AFTERNOON';
  startTime: string;
  endTime: string;
  isRegistered?: boolean;
}

interface RegisteredShift {
  id: string;
  room?: string | null;
  workSchedule: {
    id: string;
    date: string;
    shift: 'MORNING' | 'AFTERNOON';
    startTime: string;
    endTime: string;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VN_DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const HEADER_COLORS = [figmaColors.info, '#00695C'] as const;

function getWeekDays(): { label: string; date: string; isToday: boolean }[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
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

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { error?: { message?: string } } } }).response;
    return resp?.data?.error?.message ?? 'Không thể đăng ký ca này';
  }
  return 'Không thể đăng ký ca này';
}

// ---------------------------------------------------------------------------
// Spring Button
// ---------------------------------------------------------------------------

function SpringPressable({
  children,
  onPress,
  disabled,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  style?: object;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => {
          Animated.spring(scale, {
            toValue: 0.96,
            friction: 5,
            tension: 140,
            useNativeDriver: true,
          }).start();
        }}
        onPressOut={() => {
          Animated.spring(scale, {
            toValue: 1,
            friction: 4,
            tension: 140,
            useNativeDriver: true,
          }).start();
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// DoctorScheduleScreen
// ---------------------------------------------------------------------------

export function DoctorScheduleScreen() {
  const weekDays = getWeekDays();

  const [selectedDate, setSelectedDate] = useState(
    weekDays.find((d) => d.isToday)?.date ?? weekDays[0].date
  );
  const [registeredShifts, setRegisteredShifts] = useState<RegisteredShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registerLoading, setRegisterLoading] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const availableShifts: WorkSchedule[] = [
    {
      id: `${selectedDate}-morning`,
      date: selectedDate,
      shift: 'MORNING',
      startTime: '08:00',
      endTime: '12:00',
    },
    {
      id: `${selectedDate}-afternoon`,
      date: selectedDate,
      shift: 'AFTERNOON',
      startTime: '13:00',
      endTime: '17:00',
    },
  ];

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await api.get('/schedules/doctor/me');
      const data = extractData<RegisteredShift[]>(res);
      setRegisteredShifts(data);
    } catch {
      setRegisteredShifts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSchedule();
  }, [fetchSchedule]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSchedule();
    setRefreshing(false);
  }, [fetchSchedule]);

  const isShiftRegistered = (shift: WorkSchedule): boolean => {
    return registeredShifts.some(
      (s) => s.workSchedule.date?.slice(0, 10) === shift.date && s.workSchedule.shift === shift.shift
    );
  };

  const handleRegister = async (shift: WorkSchedule) => {
    setRegisterLoading(shift.id);
    try {
      await api.post('/schedules/doctor/register', {
        date: shift.date,
        shift: shift.shift,
        startTime: shift.startTime,
        endTime: shift.endTime,
      });
      setSnackbar({ visible: true, message: 'Đăng ký ca thành công' });
      await fetchSchedule();
    } catch (err) {
      setSnackbar({ visible: true, message: getErrorMessage(err) });
    } finally {
      setRegisterLoading(null);
    }
  };

  const shiftsForDate = registeredShifts.filter(
    (s) => s.workSchedule.date?.slice(0, 10) === selectedDate
  );

  return (
    <View style={styles.root}>
      <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
        <GradientHeader
          title="Lịch làm việc"
          subtitle="Đăng ký ca làm việc"
          colors={HEADER_COLORS}
        />

        <FadeInView delay={100}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekRow}
          >
            {weekDays.map((day) => {
              const isSelected = day.date === selectedDate;
              return (
                <SpringPressable
                  key={day.date}
                  onPress={() => setSelectedDate(day.date)}
                >
                  <View
                    style={[
                      styles.dayPill,
                      isSelected && styles.dayPillSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayPillLabel,
                        isSelected && styles.dayPillLabelSelected,
                      ]}
                    >
                      {day.label}
                    </Text>
                    <Text
                      style={[
                        styles.dayPillDate,
                        isSelected && styles.dayPillDateSelected,
                      ]}
                    >
                      {formatDateLabel(day.date)}
                    </Text>
                    {day.isToday && (
                      <View
                        style={[
                          styles.todayDot,
                          isSelected && styles.todayDotSelected,
                        ]}
                      />
                    )}
                  </View>
                </SpringPressable>
              );
            })}
          </ScrollView>
        </FadeInView>

        <FadeInView delay={200}>
          <View style={styles.sectionWrap}>
            <SectionTitle title="Ca làm việc" />
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <LottieView
                source={require('../../assets/animations/loading.json')}
                autoPlay
                loop
                style={{ width: 80, height: 80 }}
              />
            </View>
          ) : (
            <View style={styles.shiftsList}>
              {availableShifts.map((shift) => {
                const registered = isShiftRegistered(shift);
                const isProcessing = registerLoading === shift.id;
                const isMorning = shift.shift === 'MORNING';
                const shiftLabel = isMorning
                  ? `Ca sáng (${shift.startTime} - ${shift.endTime})`
                  : `Ca chiều (${shift.startTime} - ${shift.endTime})`;

                return (
                  <GlassCard key={shift.id} style={styles.shiftCard}>
                    <View style={styles.shiftRow}>
                      <View
                        style={[
                          styles.shiftIconCircle,
                          {
                            backgroundColor: isMorning
                              ? figmaColors.warningBg
                              : figmaColors.pastelPurple,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={isMorning ? 'weather-sunny' : 'weather-sunset'}
                          size={24}
                          color={isMorning ? figmaColors.warning : '#7B4FBF'}
                        />
                      </View>
                      <View style={styles.shiftInfo}>
                        <Text style={styles.shiftName}>{shiftLabel}</Text>
                      </View>
                      <Button
                        mode={registered ? 'outlined' : 'contained'}
                        onPress={() => handleRegister(shift)}
                        loading={isProcessing}
                        disabled={isProcessing || registered}
                        compact
                        buttonColor={registered ? undefined : figmaColors.info}
                        textColor={registered ? figmaColors.success : undefined}
                        style={[
                          styles.registerBtn,
                          registered && {
                            borderColor: figmaColors.success,
                          },
                        ]}
                        labelStyle={styles.registerBtnLabel}
                        icon={registered ? 'check-circle' : undefined}
                      >
                        {registered ? 'Đã đăng ký' : 'Đăng ký ca này'}
                      </Button>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          )}
        </FadeInView>

        <FadeInView delay={300}>
          <View style={styles.sectionWrap}>
            <SectionTitle title="Ca làm đã đăng ký" />
          </View>

          {shiftsForDate.length === 0 ? (
            <EmptyState
              icon="calendar-blank-outline"
              title="Bạn chưa đăng ký ca nào cho ngày này"
            />
          ) : (
            <View style={styles.shiftsList}>
              {shiftsForDate.map((shift) => {
                const isMorning = shift.workSchedule.shift === 'MORNING';
                const start = shift.workSchedule.startTime?.slice(0, 5);
                const end = shift.workSchedule.endTime?.slice(0, 5);
                const shiftLabel = isMorning
                  ? `Ca sáng (${start} - ${end})`
                  : `Ca chiều (${start} - ${end})`;
                return (
                  <GlassCard key={shift.id} style={styles.shiftCard}>
                    <View style={styles.shiftRow}>
                      <View
                        style={[
                          styles.shiftIconCircle,
                          { backgroundColor: figmaColors.successBg },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="check-decagram"
                          size={22}
                          color={figmaColors.success}
                        />
                      </View>
                      <View style={styles.shiftInfo}>
                        <Text style={styles.shiftName}>{shiftLabel}</Text>
                      </View>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          )}
        </FadeInView>
      </ScreenContainer>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
        action={{ label: 'OK', onPress: () => {} }}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  /* Week selector */
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: figmaSpacing.lg,
    paddingTop: figmaSpacing.xl,
    paddingBottom: figmaSpacing.xs,
    gap: figmaSpacing.sm + 2,
  },
  dayPill: {
    alignItems: 'center',
    paddingVertical: figmaSpacing.md,
    paddingHorizontal: figmaSpacing.lg,
    borderRadius: figmaRadius.lg,
    backgroundColor: figmaColors.surface,
    minWidth: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  dayPillSelected: {
    backgroundColor: figmaColors.info,
  },
  dayPillLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: figmaColors.textPrimary,
    marginBottom: figmaSpacing.xs,
  },
  dayPillLabelSelected: {
    color: '#fff',
  },
  dayPillDate: {
    fontSize: 12,
    color: figmaColors.textSecondary,
  },
  dayPillDateSelected: {
    color: 'rgba(255,255,255,0.9)',
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: figmaColors.info,
    marginTop: figmaSpacing.xs,
  },
  todayDotSelected: {
    backgroundColor: '#fff',
  },

  /* Section spacing */
  sectionWrap: {
    marginTop: figmaSpacing['2xl'],
  },

  /* Shifts */
  shiftsList: {
    paddingHorizontal: figmaSpacing.lg,
    gap: figmaSpacing.sm + 2,
  },
  shiftCard: {
    borderRadius: figmaRadius.lg,
    paddingVertical: figmaSpacing.md + 2,
    paddingHorizontal: figmaSpacing.md + 2,
  },
  shiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.md,
  },
  shiftIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftInfo: {
    flex: 1,
    gap: 2,
  },
  shiftName: {
    fontSize: 15,
    fontWeight: '600',
    color: figmaColors.textPrimary,
  },
  registerBtn: {
    borderRadius: figmaRadius.md,
  },
  registerBtnLabel: {
    fontSize: 12,
  },

  /* Loading */
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: figmaSpacing['3xl'],
  },
});
