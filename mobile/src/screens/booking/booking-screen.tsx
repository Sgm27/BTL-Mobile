import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, RadioButton, Snackbar, Text, TextInput } from 'react-native-paper';
import { GlassCard } from '../../components/ui/GlassCard';
import { FadeInView, GradientHeader, ScreenContainer } from '../../components/shared';
import { formatLongDate, formatVND, getErrorMessage } from '../../utils/format';
import { router, useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { figmaColors, theme } from '../../constants/theme';
import { getSpecialties, getClinics } from '../../services/specialties.service';
import {
  createAppointment,
  getAvailableSlots,
  type AvailableSlot,
} from '../../services/appointments.service';
import type { CreatePaymentResponse } from '../../services/payment.service';
import type { Specialty, Clinic, Appointment } from '../../types';
import { ClinicMapView } from '../../components/maps/ClinicMapView';
import { useUserLocation } from '../../hooks/use-user-location';

// Local color tokens (figmaColors doesn't include these accents)
const ACCENT_ORANGE = '#F57C00';
const ACCENT_PURPLE = '#7C4DFF';
const ACCENT_INDIGO = '#5856D6';
const ACCENT_PINK = '#FF2D55';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const H_MARGIN = 16;
const SECTION_GAP = 20;
const ELEMENT_GAP = 12;

const SPECIALTY_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  cardiology: 'heart-pulse',
  dermatology: 'hand-back-right-outline',
  neurology: 'brain',
  pediatrics: 'baby-face-outline',
  orthopedics: 'bone',
  ophthalmology: 'eye-outline',
  dentistry: 'tooth-outline',
  psychiatry: 'head-cog-outline',
  general: 'stethoscope',
};

const SPECIALTY_COLORS: string[] = [
  figmaColors.error,
  figmaColors.primary,
  ACCENT_PURPLE,
  ACCENT_ORANGE,
  figmaColors.info,
  figmaColors.success,
  ACCENT_INDIGO,
  ACCENT_PINK,
  figmaColors.warning,
];

function getSpecialtyIcon(name: string): keyof typeof MaterialCommunityIcons.glyphMap {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(SPECIALTY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return 'stethoscope';
}

function getSpecialtyColor(index: number): string {
  return SPECIALTY_COLORS[index % SPECIALTY_COLORS.length];
}

// ---------------------------------------------------------------------------
// Conditional reveal wrapper (uses shared FadeInView when visible)
// ---------------------------------------------------------------------------

interface RevealProps {
  visible: boolean;
  delay?: number;
  children: React.ReactNode;
}

function Reveal({ visible, delay = 0, children }: RevealProps) {
  if (!visible) return null;
  return <FadeInView delay={delay}>{children}</FadeInView>;
}

// ---------------------------------------------------------------------------
// Section header with step number
// ---------------------------------------------------------------------------

interface SectionHeaderProps {
  step: number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  title: string;
}

function SectionHeader({ step, icon, iconColor, title }: SectionHeaderProps) {
  return (
    <View style={sectionHeaderStyles.container}>
      <View style={[sectionHeaderStyles.stepBadge, { backgroundColor: iconColor }]}>
        <Text style={sectionHeaderStyles.stepText}>{step}</Text>
      </View>
      <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
      <Text style={sectionHeaderStyles.title}>{title}</Text>
    </View>
  );
}

const sectionHeaderStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
});

// ---------------------------------------------------------------------------
// Specialty card (2-column grid)
// ---------------------------------------------------------------------------

interface SpecialtyCardProps {
  specialty: Specialty;
  index: number;
  selected: boolean;
  onPress: () => void;
}

function SpecialtyCard({ specialty, index, selected, onPress }: SpecialtyCardProps) {
  const color = getSpecialtyColor(index);
  const icon = getSpecialtyIcon(specialty.name);

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.specialtyCardWrapper}>
      <View
        style={[
          specCardStyles.card,
          selected && { borderColor: color, backgroundColor: color + '10' },
        ]}
      >
        <View style={[specCardStyles.iconCircle, { backgroundColor: color + '18' }]}>
          <MaterialCommunityIcons name={icon} size={24} color={color} />
        </View>
        <Text style={[specCardStyles.name, selected && { color }]} numberOfLines={1}>
          {specialty.name}
        </Text>
        {specialty.description ? (
          <Text style={specCardStyles.desc} numberOfLines={2}>
            {specialty.description}
          </Text>
        ) : null}
        {selected && (
          <View style={[specCardStyles.checkBadge, { backgroundColor: color }]}>
            <MaterialCommunityIcons name="check" size={12} color="#fff" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const specCardStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  desc: {
    fontSize: 11,
    color: figmaColors.textSecondary,
    lineHeight: 15,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ---------------------------------------------------------------------------
// Clinic card
// ---------------------------------------------------------------------------

interface ClinicCardProps {
  clinic: Clinic | null; // null = "Any clinic"
  selected: boolean;
  onPress: () => void;
}

function ClinicCard({ clinic, selected, onPress }: ClinicCardProps) {
  const isAny = !clinic;
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <View
        style={[
          clinicCardStyles.card,
          selected && {
            borderColor: figmaColors.info,
            backgroundColor: figmaColors.info + '10',
          },
        ]}
      >
        <View
          style={[
            clinicCardStyles.iconCircle,
            { backgroundColor: (isAny ? figmaColors.primary : figmaColors.info) + '18' },
          ]}
        >
          <MaterialCommunityIcons
            name={isAny ? 'map-marker-radius-outline' : 'hospital-building'}
            size={22}
            color={isAny ? figmaColors.primary : figmaColors.info}
          />
        </View>
        <View style={clinicCardStyles.textCol}>
          <Text
            style={[clinicCardStyles.name, selected && { color: figmaColors.info }]}
            numberOfLines={1}
          >
            {isAny ? 'Bất kỳ phòng khám nào' : clinic.name}
          </Text>
          <Text style={clinicCardStyles.address} numberOfLines={1}>
            {isAny ? 'Hệ thống sẽ tự động chọn phòng khám phù hợp' : clinic.address}
          </Text>
        </View>
        {selected && (
          <MaterialCommunityIcons name="check-circle" size={22} color={figmaColors.info} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const clinicCardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: figmaColors.border,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  address: {
    fontSize: 12,
    color: figmaColors.textSecondary,
    marginTop: 2,
  },
});

// ---------------------------------------------------------------------------
// Time slot card (grid)
// ---------------------------------------------------------------------------

interface SlotCardProps {
  slot: AvailableSlot;
  selected: boolean;
  onPress: () => void;
}

function SlotCard({ slot, selected, onPress }: SlotCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.slotCardWrapper}>
      <View
        style={[
          slotCardStyles.card,
          selected && {
            borderColor: figmaColors.success,
            backgroundColor: figmaColors.success + '10',
          },
        ]}
      >
        <Text style={[slotCardStyles.time, selected && { color: figmaColors.success }]}>
          {slot.startTime}
        </Text>
        <Text style={slotCardStyles.dash}>-</Text>
        <Text style={[slotCardStyles.endTime, selected && { color: figmaColors.success }]}>
          {slot.endTime}
        </Text>
        <View style={slotCardStyles.availBadge}>
          <Text style={slotCardStyles.availText}>Còn {slot.availableCount}</Text>
        </View>
        {selected && (
          <View style={slotCardStyles.checkDot}>
            <MaterialCommunityIcons name="check" size={10} color="#fff" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const slotCardStyles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: figmaColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    position: 'relative',
  },
  time: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  dash: {
    fontSize: 11,
    color: figmaColors.textMuted,
    marginVertical: 1,
  },
  endTime: {
    fontSize: 13,
    fontWeight: '500',
    color: figmaColors.textSecondary,
  },
  availBadge: {
    marginTop: 6,
    backgroundColor: figmaColors.surfaceMuted,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  availText: {
    fontSize: 10,
    fontWeight: '600',
    color: figmaColors.textSecondary,
  },
  checkDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: figmaColors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ---------------------------------------------------------------------------
// Summary row
// ---------------------------------------------------------------------------

interface SummaryRowProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
}

function SummaryRow({ icon, iconColor, label, value }: SummaryRowProps) {
  return (
    <View style={summaryStyles.row}>
      <View style={[summaryStyles.iconCircle, { backgroundColor: iconColor + '14' }]}>
        <MaterialCommunityIcons name={icon} size={16} color={iconColor} />
      </View>
      <View style={summaryStyles.textCol}>
        <Text style={summaryStyles.label}>{label}</Text>
        <Text style={summaryStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: figmaColors.textSecondary,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: 1,
  },
});

// ---------------------------------------------------------------------------
// Payment method option
// ---------------------------------------------------------------------------

type PaymentMethod = 'CASH' | 'VNPAY' | 'MOMO';

interface PaymentMethodInfo {
  value: PaymentMethod;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  desc: string;
}

const PAYMENT_METHODS: PaymentMethodInfo[] = [
  {
    value: 'CASH',
    label: 'Tiền mặt',
    icon: 'cash',
    color: figmaColors.success,
    desc: 'Thanh toán tại phòng khám',
  },
  {
    value: 'VNPAY',
    label: 'VNPAY',
    icon: 'bank-outline',
    color: figmaColors.primary,
    desc: 'Thanh toán qua cổng VNPAY',
  },
  {
    value: 'MOMO',
    label: 'Momo',
    icon: 'wallet-outline',
    color: ACCENT_PINK,
    desc: 'Thanh toán qua ví Momo',
  },
];

// ---------------------------------------------------------------------------
// Success result type
// ---------------------------------------------------------------------------

interface BookingResult {
  appointment: Appointment;
  payment: CreatePaymentResponse | null;
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function BookingScreen() {
  const { specialtyId } = useLocalSearchParams<{ specialtyId?: string }>();

  // --- Data state ---
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const { location: userLocation } = useUserLocation();

  // --- Selection state ---
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(specialtyId ?? '');
  const [selectedClinic, setSelectedClinic] = useState<string>('');
  const [dateObj, setDateObj] = useState(new Date());
  const [date, setDate] = useState(getTodayDate());
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

  // --- UI state ---
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  // --- Load initial data ---
  useEffect(() => {
    Promise.all([getSpecialties(), getClinics()])
      .then(([specs, cls]) => {
        setSpecialties(specs);
        setClinics(cls);
      })
      .catch(() => setNotice('Không thể tải dữ liệu. Vui lòng thử lại.'))
      .finally(() => setInitialLoading(false));
  }, []);

  // --- Auto-select specialty from route params ---
  useEffect(() => {
    if (specialtyId && specialties.length > 0) {
      const match = specialties.find((s) => s.id === specialtyId);
      if (match) {
        setSelectedSpecialty(match.id);
      }
    }
  }, [specialtyId, specialties]);

  // --- Load slots when specialty + date change ---
  const loadSlots = useCallback(async () => {
    if (!selectedSpecialty || !date) return;
    setSlotsLoading(true);
    setSelectedTime('');
    try {
      const result = await getAvailableSlots({
        specialtyId: selectedSpecialty,
        clinicId: selectedClinic || undefined,
        date,
      });
      setSlots(result);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedSpecialty, selectedClinic, date]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  // --- Date picker handler ---
  function onDateChange(_event: unknown, selectedDate?: Date) {
    if (selectedDate) {
      setDateObj(selectedDate);
      setDate(selectedDate.toISOString().slice(0, 10));
    }
  }

  // --- Book + Pay ---
  async function handleConfirm(): Promise<void> {
    if (!selectedSpecialty || !selectedTime) {
      setNotice('Vui lòng chọn chuyên khoa và khung giờ khám.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create appointment
      const appointment = await createAppointment({
        specialtyId: selectedSpecialty,
        clinicId: selectedClinic || undefined,
        date,
        startTime: selectedTime,
        serviceIds: [],
        notes: notes.trim() || undefined,
      });

      setBookingResult({ appointment, payment: null });
      setShowSuccess(true);
    } catch (err) {
      setNotice(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  // --- Derived ---
  const selectedSpecObj = specialties.find((s) => s.id === selectedSpecialty);
  const selectedClinicObj = clinics.find((c) => c.id === selectedClinic);
  const selectedSlot = slots.find((s) => s.startTime === selectedTime);
  const estimatedFee = formatVND(selectedSlot?.avgFee ?? 0);

  const showClinic = Boolean(selectedSpecialty);
  const showDate = Boolean(selectedSpecialty);
  const showSlots = Boolean(selectedSpecialty && date);
  const showReview = Boolean(selectedTime);

  // --- Render ---
  if (initialLoading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <LottieView
          source={require('../../assets/animations/loading.json')}
          autoPlay
          loop
          style={{ width: 120, height: 120 }}
        />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <>
    <ScreenContainer
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <GradientHeader
        title="Đặt lịch khám"
        subtitle="Hoàn thành các bước để xác nhận lịch khám"
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
      <View style={styles.content}>
        {/* Step 1: Specialty Selection */}
        <Reveal visible delay={0}>
          <SectionHeader
            step={1}
            icon="stethoscope"
            iconColor={figmaColors.primary}
            title="Chọn chuyên khoa"
          />
          <View style={styles.specialtyGrid}>
            {specialties.map((spec, i) => (
              <SpecialtyCard
                key={spec.id}
                specialty={spec}
                index={i}
                selected={selectedSpecialty === spec.id}
                onPress={() => {
                  setSelectedSpecialty(spec.id);
                  setSelectedTime('');
                }}
              />
            ))}
          </View>
        </Reveal>

        {/* Step 2: Clinic Selection */}
        <Reveal visible={showClinic} delay={100}>
          <SectionHeader
            step={2}
            icon="hospital-building"
            iconColor={figmaColors.info}
            title="Chọn phòng khám"
          />
          <ClinicMapView
            clinics={clinics}
            selectedClinicId={selectedClinic}
            onSelectClinic={setSelectedClinic}
            userLocation={userLocation}
          />
          <View style={styles.clinicList}>
            <ClinicCard
              clinic={null}
              selected={selectedClinic === ''}
              onPress={() => setSelectedClinic('')}
            />
            {clinics.map((clinic) => (
              <ClinicCard
                key={clinic.id}
                clinic={clinic}
                selected={selectedClinic === clinic.id}
                onPress={() => setSelectedClinic(clinic.id)}
              />
            ))}
          </View>
        </Reveal>

        {/* Step 3: Date Selection */}
        <Reveal visible={showDate} delay={200}>
          <SectionHeader
            step={3}
            icon="calendar"
            iconColor={ACCENT_ORANGE}
            title="Chọn ngày khám"
          />
          <GlassCard style={styles.card} glassStyle="regular">
            <DateTimePicker
              value={dateObj}
              mode="date"
              display="inline"
              minimumDate={new Date()}
              onChange={onDateChange}
              themeVariant="light"
              locale="vi-VN"
            />
          </GlassCard>
        </Reveal>

        {/* Step 4: Time Slot Selection */}
        <Reveal visible={showSlots} delay={300}>
          <SectionHeader
            step={4}
            icon="clock-outline"
            iconColor={ACCENT_INDIGO}
            title="Chọn giờ khám"
          />
          {slotsLoading ? (
            <View style={styles.slotsLoadingContainer}>
              <LottieView
                source={require('../../assets/animations/loading.json')}
                autoPlay
                loop
                style={{ width: 80, height: 80 }}
              />
              <Text style={styles.loadingText}>Đang tìm khung giờ trống...</Text>
            </View>
          ) : slots.length > 0 ? (
            <View style={styles.slotsGrid}>
              {slots.map((slot) => (
                <SlotCard
                  key={slot.startTime}
                  slot={slot}
                  selected={selectedTime === slot.startTime}
                  onPress={() => setSelectedTime(slot.startTime)}
                />
              ))}
            </View>
          ) : (
            <GlassCard style={styles.card} glassStyle="regular">
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="calendar-remove"
                  size={40}
                  color={figmaColors.textMuted}
                />
                <Text style={styles.emptyText}>
                  Không có khung giờ trống cho ngày này.
                </Text>
                <Text style={styles.emptyHint}>
                  Vui lòng chọn ngày khác hoặc phòng khám khác.
                </Text>
              </View>
            </GlassCard>
          )}
        </Reveal>

        {/* Step 5: Notes */}
        <Reveal visible={showReview} delay={100}>
          <SectionHeader
            step={5}
            icon="text-box-outline"
            iconColor={ACCENT_PURPLE}
            title="Triệu chứng / Ghi chú"
          />
          <TextInput
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="Mô tả triệu chứng hoặc ghi chú thêm cho bác sĩ..."
            value={notes}
            onChangeText={setNotes}
            outlineColor={figmaColors.border}
            activeOutlineColor={ACCENT_PURPLE}
            outlineStyle={{ borderRadius: 14 }}
            style={styles.notesInput}
          />
        </Reveal>

        {/* Step 6: Review & Payment */}
        <Reveal visible={showReview} delay={200}>
          <SectionHeader
            step={6}
            icon="check-decagram"
            iconColor={figmaColors.success}
            title="Xác nhận đặt lịch"
          />
          <GlassCard style={styles.card} glassStyle="regular">
            {/* Summary */}
            <View style={styles.summaryCard}>
              <SummaryRow
                icon="stethoscope"
                iconColor={figmaColors.primary}
                label="Chuyên khoa"
                value={selectedSpecObj?.name ?? '--'}
              />
              <View style={styles.divider} />
              <SummaryRow
                icon="hospital-building"
                iconColor={figmaColors.info}
                label="Phòng khám"
                value={selectedClinicObj?.name ?? 'Bất kỳ phòng khám nào'}
              />
              <View style={styles.divider} />
              <SummaryRow
                icon="calendar"
                iconColor={ACCENT_ORANGE}
                label="Ngày khám"
                value={formatLongDate(date)}
              />
              <View style={styles.divider} />
              <SummaryRow
                icon="clock-outline"
                iconColor={ACCENT_INDIGO}
                label="Giờ khám"
                value={
                  selectedSlot
                    ? `${selectedSlot.startTime} - ${selectedSlot.endTime}`
                    : selectedTime
                }
              />
              <View style={styles.divider} />
              <SummaryRow
                icon="cash"
                iconColor={figmaColors.success}
                label="Tổng tiền dự kiến"
                value={estimatedFee}
              />
            </View>

            <Text style={styles.paymentNote}>
              Thanh toán sẽ được thực hiện sau khi bác sĩ hoàn tất khám.
            </Text>

            {/* Confirm button */}
            <Button
              mode="contained"
              onPress={handleConfirm}
              loading={submitting}
              disabled={submitting}
              icon="check-circle"
              buttonColor={figmaColors.success}
              textColor="#fff"
              contentStyle={styles.confirmBtnContent}
              labelStyle={styles.confirmBtnLabel}
              style={styles.confirmBtn}
            >
              {submitting ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
            </Button>
          </GlassCard>
        </Reveal>
      </View>

      {/* Success Modal */}
      <Modal visible={showSuccess} animationType="fade" transparent statusBarTranslucent>
        <View style={successStyles.backdrop}>
          <View style={successStyles.card}>
            <LottieView
              source={require('../../assets/animations/success.json')}
              autoPlay
              loop={false}
              style={successStyles.lottie}
            />
            <Text style={successStyles.title}>Đặt lịch thành công</Text>
            <Text style={successStyles.subtitle}>
              Lịch hẹn đang chờ bác sĩ xác nhận. Bạn sẽ nhận thông báo khi có bác sĩ nhận lịch.
            </Text>

            {bookingResult?.appointment && (
              <View style={successStyles.detailCard}>
                <SummaryRow
                  icon="calendar"
                  iconColor={ACCENT_ORANGE}
                  label="Ngày khám"
                  value={
                    bookingResult.appointment.timeSlot
                      ? formatLongDate(bookingResult.appointment.timeSlot.date)
                      : formatLongDate(date)
                  }
                />
                <SummaryRow
                  icon="clock-outline"
                  iconColor={ACCENT_INDIGO}
                  label="Giờ khám"
                  value={
                    bookingResult.appointment.timeSlot
                      ? `${bookingResult.appointment.timeSlot.startTime} - ${bookingResult.appointment.timeSlot.endTime}`
                      : selectedTime
                  }
                />
              </View>
            )}

            <Button
              mode="contained"
              onPress={() => {
                setShowSuccess(false);
                if (bookingResult?.appointment) {
                  router.push(
                    `/appointment-detail?id=${bookingResult.appointment.id}` as never,
                  );
                } else {
                  router.replace('/appointments' as never);
                }
              }}
              icon="eye-outline"
              buttonColor={figmaColors.primary}
              textColor="#fff"
              contentStyle={{ paddingVertical: 4 }}
              labelStyle={{ fontWeight: '700', fontSize: 15 }}
              style={{ borderRadius: 14, width: '100%' }}
            >
              Xem chi tiết lịch hẹn
            </Button>

            <Button
              mode="text"
              onPress={() => {
                setShowSuccess(false);
                // Navigate to home tab
                router.navigate('/(tabs)/home' as never);
              }}
              textColor={figmaColors.textSecondary}
              labelStyle={{ fontSize: 14 }}
              style={{ marginTop: 4 }}
            >
              Quay về trang chủ
            </Button>
          </View>
        </View>
      </Modal>

    </ScreenContainer>
    <Snackbar
      visible={Boolean(notice)}
      onDismiss={() => setNotice('')}
      duration={3500}
      action={{ label: 'OK', onPress: () => setNotice('') }}
    >
      {notice}
    </Snackbar>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: figmaColors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: H_MARGIN,
    paddingTop: 16,
    paddingBottom: 32,
    gap: SECTION_GAP,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  specialtyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  specialtyCardWrapper: {
    width: '48%',
    flexGrow: 1,
  },
  clinicList: {
    gap: 8,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotCardWrapper: {
    width: '30%',
    flexGrow: 1,
  },
  slotsLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
    color: figmaColors.textSecondary,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: figmaColors.textSecondary,
  },
  emptyHint: {
    fontSize: 13,
    color: figmaColors.textMuted,
  },
  notesInput: {
    backgroundColor: '#fff',
    fontSize: 14,
  },
  summaryCard: {
    backgroundColor: figmaColors.surfaceMuted,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: ELEMENT_GAP,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: figmaColors.border,
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  paymentNote: {
    fontSize: 13,
    color: figmaColors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 8,
  },
  paymentMethods: {
    gap: 8,
    marginBottom: ELEMENT_GAP,
  },
  paymentOption: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: figmaColors.border,
    backgroundColor: '#fff',
    padding: 12,
  },
  paymentOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTextCol: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  paymentDesc: {
    fontSize: 12,
    color: figmaColors.textSecondary,
    marginTop: 1,
  },
  confirmBtn: {
    borderRadius: 14,
    marginTop: 4,
  },
  confirmBtnContent: {
    paddingVertical: 6,
  },
  confirmBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
});

const successStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  lottie: {
    width: 140,
    height: 140,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: figmaColors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: figmaColors.surfaceMuted,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    width: '100%',
    marginBottom: 20,
  },
});
