import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Snackbar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  AppointmentCard,
  EmptyState,
  FadeInView,
  GradientHeader,
  ScreenContainer,
} from '../../components/shared';
import {
  figmaColors,
  figmaFonts,
  figmaRadius,
  figmaShadows,
  figmaSpacing,
} from '../../constants/theme';
import { api, extractData } from '../../services/api';
import {
  getAvailableSlots,
  rescheduleAppointment,
  type AvailableSlot,
} from '../../services/appointments.service';
import { formatLongDate, formatShortDate, getErrorMessage } from '../../utils/format';
import type { Appointment } from '../../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RESCHEDULE_GRADIENT = ['#7C4DFF', '#5E35B1'] as const;

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ---------------------------------------------------------------------------
// Slot button
// ---------------------------------------------------------------------------

interface SlotButtonProps {
  slot: AvailableSlot;
  selected: boolean;
  onPress: () => void;
}

function SlotButton({ slot, selected, onPress }: SlotButtonProps) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={slotStyles.wrapper}>
      <View
        style={[
          slotStyles.card,
          selected && {
            borderColor: RESCHEDULE_GRADIENT[0],
            backgroundColor: `${RESCHEDULE_GRADIENT[0]}14`,
          },
        ]}
      >
        <Text
          style={[slotStyles.time, selected && { color: RESCHEDULE_GRADIENT[1] }]}
        >
          {slot.startTime}
        </Text>
        <Text style={slotStyles.dash}>-</Text>
        <Text
          style={[slotStyles.endTime, selected && { color: RESCHEDULE_GRADIENT[1] }]}
        >
          {slot.endTime}
        </Text>
        <View style={slotStyles.availBadge}>
          <Text style={slotStyles.availText}>Còn {slot.availableCount}</Text>
        </View>
        {selected && (
          <View style={slotStyles.checkDot}>
            <MaterialCommunityIcons name="check" size={10} color="#fff" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const slotStyles = StyleSheet.create({
  wrapper: {
    width: '31%',
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: figmaColors.surface,
    borderRadius: figmaRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: figmaColors.border,
    position: 'relative',
    ...figmaShadows.card,
  },
  time: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textPrimary,
  },
  dash: {
    fontSize: 11,
    color: figmaColors.textMuted,
    marginVertical: 1,
  },
  endTime: {
    fontSize: figmaFonts.sizes.base,
    fontWeight: figmaFonts.weights.medium,
    color: figmaColors.textSecondary,
  },
  availBadge: {
    marginTop: 6,
    backgroundColor: figmaColors.surfaceMuted,
    borderRadius: figmaRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  availText: {
    fontSize: 10,
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.textSecondary,
  },
  checkDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: RESCHEDULE_GRADIENT[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

interface RescheduleScreenProps {
  appointmentId: string;
}

export function RescheduleScreen({ appointmentId }: RescheduleScreenProps) {
  const insets = useSafeAreaInsets();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<string>(getTodayDate());
  const [pickerDate, setPickerDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notice, setNotice] = useState('');

  const [buttonScale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await extractData<Appointment>(
          await api.get(`/appointments/${appointmentId}`)
        );
        if (!mounted) return;
        setAppointment(data);
        const apptDate = data.timeSlot?.date;
        if (apptDate) {
          const d = new Date(apptDate + 'T00:00:00');
          if (d.getTime() >= new Date(getTodayDate() + 'T00:00:00').getTime()) {
            setPickerDate(d);
            setDate(toDateOnly(d));
          }
        }
      } catch {
        if (mounted) setNotice('Không thể tải lịch hẹn.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [appointmentId]);

  const loadSlots = useCallback(async () => {
    if (!appointment?.doctor?.specialty?.id) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const data = await getAvailableSlots({
        specialtyId: appointment.doctor.specialty.id,
        clinicId: appointment.doctor.clinic?.id,
        date,
      });
      setSlots(data);
    } catch {
      setSlots([]);
      setNotice('Không thể tải khung giờ cho ngày này.');
    } finally {
      setSlotsLoading(false);
    }
  }, [appointment, date]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  function handleDateChange(_: unknown, picked?: Date) {
    if (picked) {
      setPickerDate(picked);
      setDate(toDateOnly(picked));
    }
  }

  function pressInButton() {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 6,
      tension: 200,
    }).start();
  }

  function pressOutButton() {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 200,
    }).start();
  }

  async function handleConfirm() {
    if (!selectedSlot) {
      setNotice('Vui lòng chọn ngày và giờ mới');
      return;
    }
    setSubmitting(true);
    try {
      await rescheduleAppointment(appointmentId, {
        date,
        startTime: selectedSlot.startTime,
      });
      setSuccess(true);
      setTimeout(() => {
        router.back();
      }, 1400);
    } catch (error: unknown) {
      setNotice(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top + 60 }]}>
        <ActivityIndicator size="large" color={RESCHEDULE_GRADIENT[0]} />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top + 60 }]}>
        <EmptyState
          icon="alert-circle-outline"
          title="Không tìm thấy lịch hẹn"
          message="Chúng tôi không thể tải lịch hẹn này."
          action={{ label: 'Quay lại', onPress: () => router.back() }}
        />
      </View>
    );
  }

  if (success) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top + 80 }]}>
        <LottieView
          source={require('../../assets/animations/success.json')}
          autoPlay
          loop={false}
          style={styles.successLottie}
        />
        <Text style={styles.successText}>Đổi lịch thành công</Text>
        <Text style={styles.successSub}>
          {formatLongDate(date)} lúc {selectedSlot?.startTime}
        </Text>
      </View>
    );
  }

  const doctor = appointment.doctor;
  const currentSlot = appointment.timeSlot;
  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 60);

  return (
    <>
      <ScreenContainer showsVerticalScrollIndicator={false}>
        <GradientHeader
          title="Đổi lịch hẹn"
          subtitle="Chọn ngày và giờ mới"
          colors={RESCHEDULE_GRADIENT}
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
          {/* Current appointment */}
          <FadeInView delay={0}>
            <Text style={styles.sectionLabel}>Lịch hẹn hiện tại</Text>
            {doctor && currentSlot ? (
              <AppointmentCard
                doctorName={doctor.name}
                specialty={doctor.specialty?.name ?? ''}
                date={formatShortDate(currentSlot.date)}
                startTime={currentSlot.startTime}
                endTime={currentSlot.endTime}
                status={appointment.status}
              />
            ) : null}
          </FadeInView>

          {/* Date picker */}
          <FadeInView delay={80}>
            <Text style={styles.sectionLabel}>Chọn ngày mới</Text>
            <GlassCard style={styles.card} glassStyle="regular">
              <View style={styles.cardInner}>
                <View style={styles.pickerWrap}>
                  <DateTimePicker
                    value={pickerDate}
                    mode="date"
                    display="inline"
                    minimumDate={minDate}
                    maximumDate={maxDate}
                    onChange={handleDateChange}
                    accentColor={RESCHEDULE_GRADIENT[0]}
                  />
                </View>
                <Text style={styles.dateLabel}>{formatLongDate(date)}</Text>
              </View>
            </GlassCard>
          </FadeInView>

          {/* Slots */}
          <FadeInView delay={160}>
            <Text style={styles.sectionLabel}>Chọn giờ mới</Text>
            <GlassCard style={styles.card} glassStyle="regular">
              <View style={styles.cardInner}>
                {slotsLoading ? (
                  <View style={styles.slotsLoading}>
                    <ActivityIndicator color={RESCHEDULE_GRADIENT[0]} />
                  </View>
                ) : slots.length === 0 ? (
                  <View style={styles.slotsEmpty}>
                    <MaterialCommunityIcons
                      name="calendar-remove-outline"
                      size={40}
                      color={figmaColors.textMuted}
                    />
                    <Text style={styles.emptyText}>
                      Không có khung giờ trống cho ngày này
                    </Text>
                  </View>
                ) : (
                  <View style={styles.slotsGrid}>
                    {slots.map((slot, i) => (
                      <FadeInView
                        key={`${slot.startTime}-${slot.endTime}`}
                        delay={i * 40}
                      >
                        <SlotButton
                          slot={slot}
                          selected={
                            selectedSlot?.startTime === slot.startTime &&
                            selectedSlot?.endTime === slot.endTime
                          }
                          onPress={() => setSelectedSlot(slot)}
                        />
                      </FadeInView>
                    ))}
                  </View>
                )}
              </View>
            </GlassCard>
          </FadeInView>

          {/* Confirm button */}
          <FadeInView delay={240}>
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <Button
                mode="contained"
                onPress={handleConfirm}
                onPressIn={pressInButton}
                onPressOut={pressOutButton}
                loading={submitting}
                disabled={submitting || !selectedSlot}
                buttonColor={RESCHEDULE_GRADIENT[0]}
                textColor="#fff"
                icon="calendar-check"
                style={styles.confirmBtn}
                contentStyle={styles.confirmBtnContent}
                labelStyle={styles.confirmBtnLabel}
              >
                Xác nhận đổi lịch
              </Button>
            </Animated.View>
          </FadeInView>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: figmaColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: figmaSpacing['2xl'],
  },
  successLottie: {
    width: 180,
    height: 180,
  },
  successText: {
    fontSize: figmaFonts.sizes['2xl'],
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textPrimary,
    marginTop: figmaSpacing.md,
  },
  successSub: {
    fontSize: figmaFonts.sizes.md,
    color: figmaColors.textSecondary,
    marginTop: figmaSpacing.xs,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: figmaSpacing.lg,
    gap: figmaSpacing.lg,
    marginTop: figmaSpacing.lg,
  },
  sectionLabel: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textPrimary,
    marginBottom: figmaSpacing.sm,
  },
  card: {
    ...figmaShadows.card,
  },
  cardInner: {
    gap: figmaSpacing.sm,
  },
  pickerWrap: {
    marginHorizontal: -8,
  },
  dateLabel: {
    fontSize: figmaFonts.sizes.base,
    color: figmaColors.textSecondary,
    textAlign: 'center',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotsLoading: {
    paddingVertical: figmaSpacing['2xl'],
    alignItems: 'center',
  },
  slotsEmpty: {
    paddingVertical: figmaSpacing['2xl'],
    alignItems: 'center',
    gap: figmaSpacing.sm,
  },
  emptyText: {
    fontSize: figmaFonts.sizes.base,
    color: figmaColors.textSecondary,
  },
  confirmBtn: {
    borderRadius: figmaRadius.md,
    marginTop: figmaSpacing.xs,
  },
  confirmBtnContent: {
    paddingVertical: 6,
  },
  confirmBtnLabel: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.bold,
  },
});
