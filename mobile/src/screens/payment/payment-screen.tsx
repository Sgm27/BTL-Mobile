import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Snackbar, Text } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { GlassCard } from '../../components/ui/GlassCard';
import {
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
import {
  createPayment,
  type CreatePaymentResponse,
} from '../../services/payment.service';
import { api, extractData } from '../../services/api';
import { formatVND, formatLongDate, getErrorMessage } from '../../utils/format';
import type { Appointment } from '../../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAYMENT_GRADIENT = [figmaColors.success, '#1B5E20'] as const;

type PaymentMethodOption = 'CASH' | 'VNPAY' | 'MOMO';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface PaymentMethod {
  key: PaymentMethodOption;
  label: string;
  icon: IconName;
  desc: string;
}

const METHODS: PaymentMethod[] = [
  { key: 'CASH', label: 'Tiền mặt', icon: 'cash', desc: 'Thanh toán tại phòng khám' },
  { key: 'VNPAY', label: 'VNPAY', icon: 'credit-card-outline', desc: 'Thanh toán qua VNPAY' },
  { key: 'MOMO', label: 'Momo', icon: 'wallet-outline', desc: 'Thanh toán qua ví Momo' },
];

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function PaymentScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption>('CASH');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCashConfirm, setShowCashConfirm] = useState(false);

  useEffect(() => {
    if (!appointmentId) return;
    api
      .get(`/appointments/${appointmentId}`)
      .then((res) => setAppointment(extractData<Appointment>(res)))
      .catch(() => setNotice('Không thể tải thông tin lịch hẹn.'));
  }, [appointmentId]);

  const handlePay = useCallback(async () => {
    if (!appointmentId) return;
    setSubmitting(true);
    try {
      const result: CreatePaymentResponse = await createPayment({
        appointmentId,
        method: selectedMethod,
      });

      if (selectedMethod === 'CASH') {
        setShowCashConfirm(true);
        setTimeout(() => {
          setShowCashConfirm(false);
          setShowSuccess(true);
        }, 2000);
      } else if (result.paymentUrl) {
        setPaymentUrl(result.paymentUrl);
        setShowWebView(true);
      }
    } catch (err) {
      setNotice(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }, [appointmentId, selectedMethod]);

  const handleWebViewMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'PAYMENT_RESULT' && data.success) {
        setShowWebView(false);
        setShowSuccess(true);
      } else if (data.type === 'PAYMENT_RESULT' && !data.success) {
        setShowWebView(false);
        setNotice('Thanh toán không thành công. Vui lòng thử lại.');
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const handleSuccessFinish = useCallback(() => {
    setShowSuccess(false);
    router.replace('/appointments');
  }, []);

  // --- WebView overlay ---
  if (showWebView && paymentUrl) {
    return (
      <View style={styles.root}>
        <View style={styles.webViewHeader}>
          <Button
            icon="close"
            mode="text"
            onPress={() => {
              setShowWebView(false);
              setNotice('Đã hủy thanh toán');
            }}
            textColor="#fff"
          >
            Hủy
          </Button>
          <Text style={styles.webViewTitle}>Thanh toán</Text>
          <View style={{ width: 80 }} />
        </View>
        <WebView
          source={{ uri: paymentUrl }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
        />
      </View>
    );
  }

  // --- Success overlay ---
  if (showSuccess) {
    return <SuccessOverlay onFinish={handleSuccessFinish} />;
  }

  // --- Cash confirmation overlay ---
  if (showCashConfirm) {
    return (
      <View style={styles.cashOverlay}>
        <LinearGradient colors={PAYMENT_GRADIENT} style={styles.cashGradient}>
          <MaterialCommunityIcons name="cash-check" size={80} color="#fff" />
          <Text style={styles.cashTitle}>Thanh toán tại phòng khám</Text>
          <Text style={styles.cashSubtitle}>
            Vui lòng thanh toán tại quầy lễ tân khi đến khám.
          </Text>
          {appointment ? (
            <Text style={styles.cashAmount}>{formatVND(appointment.totalAmount)}</Text>
          ) : null}
        </LinearGradient>
      </View>
    );
  }

  const doctor = appointment?.doctor;
  const timeSlot = appointment?.timeSlot;

  return (
    <>
      <ScreenContainer showsVerticalScrollIndicator={false}>
        <GradientHeader
          title="Thanh toán"
          subtitle="Hoàn tất đặt lịch của bạn"
          colors={PAYMENT_GRADIENT}
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
          {/* Appointment summary */}
          {appointment ? (
            <FadeInView delay={0}>
              <Text style={styles.sectionLabel}>Thông tin lịch hẹn</Text>
              <GlassCard style={styles.card} glassStyle="regular">
                <View style={styles.cardInner}>
                  {doctor ? (
                    <SummaryRow
                      icon="doctor"
                      label="Bác sĩ"
                      value={doctor.name}
                    />
                  ) : null}
                  {doctor?.specialty ? (
                    <SummaryRow
                      icon="stethoscope"
                      label="Chuyên khoa"
                      value={doctor.specialty.name}
                    />
                  ) : null}
                  {timeSlot ? (
                    <>
                      <SummaryRow
                        icon="calendar"
                        label="Ngày khám"
                        value={formatLongDate(timeSlot.date)}
                      />
                      <SummaryRow
                        icon="clock-outline"
                        label="Thời gian"
                        value={`${timeSlot.startTime} - ${timeSlot.endTime}`}
                      />
                    </>
                  ) : null}
                </View>
              </GlassCard>
            </FadeInView>
          ) : null}

          {/* Payment method selector */}
          <FadeInView delay={80}>
            <Text style={styles.sectionLabel}>Chọn phương thức thanh toán</Text>
            <View style={styles.methodList}>
              {METHODS.map((method) => {
                const isSelected = selectedMethod === method.key;
                return (
                  <Pressable
                    key={method.key}
                    onPress={() => setSelectedMethod(method.key)}
                    style={[
                      styles.methodCard,
                      isSelected && styles.methodCardSelected,
                    ]}
                  >
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected ? <View style={styles.radioInner} /> : null}
                    </View>
                    <View
                      style={[
                        styles.methodIconWrap,
                        isSelected && styles.methodIconWrapSelected,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={method.icon}
                        size={22}
                        color={isSelected ? figmaColors.success : figmaColors.textSecondary}
                      />
                    </View>
                    <View style={styles.methodInfo}>
                      <Text
                        style={[
                          styles.methodLabel,
                          isSelected && { color: figmaColors.success },
                        ]}
                      >
                        {method.label}
                      </Text>
                      <Text style={styles.methodDesc}>{method.desc}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </FadeInView>

          {/* Total */}
          {appointment ? (
            <FadeInView delay={160}>
              <Text style={styles.sectionLabel}>Tổng tiền</Text>
              <GlassCard style={styles.card} glassStyle="regular">
                <View style={styles.totalRow}>
                  <View style={styles.totalLabelWrap}>
                    <MaterialCommunityIcons
                      name="cash-multiple"
                      size={22}
                      color={figmaColors.success}
                    />
                    <Text style={styles.totalLabel}>Số tiền cần thanh toán</Text>
                  </View>
                  <Text style={styles.totalValue}>
                    {formatVND(appointment.totalAmount)}
                  </Text>
                </View>
              </GlassCard>
            </FadeInView>
          ) : null}

          {/* Actions */}
          <FadeInView delay={240}>
            <View style={styles.actions}>
              <Button
                mode="contained"
                onPress={handlePay}
                loading={submitting}
                disabled={submitting || !appointment}
                icon={selectedMethod === 'CASH' ? 'cash' : 'credit-card-check'}
                buttonColor={figmaColors.success}
                textColor="#fff"
                style={styles.payBtn}
                contentStyle={styles.payBtnContent}
                labelStyle={styles.payBtnLabel}
              >
                Thanh toán ngay
              </Button>
              <Button
                mode="outlined"
                onPress={() => router.back()}
                disabled={submitting}
                textColor={figmaColors.textSecondary}
                style={styles.cancelBtn}
                contentStyle={styles.payBtnContent}
                labelStyle={styles.cancelBtnLabel}
              >
                Hủy
              </Button>
            </View>
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

// ---------------------------------------------------------------------------
// Summary row
// ---------------------------------------------------------------------------

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <MaterialCommunityIcons name={icon} size={18} color={figmaColors.success} />
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Success overlay
// ---------------------------------------------------------------------------

function SuccessOverlay({ onFinish }: { onFinish: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onFinish();
    }, 2500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onFinish]);

  return (
    <View style={styles.successOverlay}>
      <LinearGradient colors={PAYMENT_GRADIENT} style={styles.successGradient}>
        <LottieView
          source={require('../../assets/animations/success.json')}
          autoPlay
          loop={false}
          style={styles.successLottie}
        />
        <Text style={styles.successTitle}>Thanh toán thành công</Text>
        <Pressable onPress={onFinish} style={styles.successBtn}>
          <Text style={styles.successBtnLabel}>Quay lại</Text>
        </Pressable>
      </LinearGradient>
    </View>
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
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.sm,
  },
  summaryLabel: {
    fontSize: figmaFonts.sizes.base,
    color: figmaColors.textSecondary,
    width: 96,
  },
  summaryValue: {
    flex: 1,
    fontSize: figmaFonts.sizes.md,
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.textPrimary,
    textAlign: 'right',
  },
  methodList: {
    gap: figmaSpacing.sm,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.md,
    padding: figmaSpacing.md,
    borderRadius: figmaRadius.md,
    borderWidth: 1.5,
    borderColor: figmaColors.border,
    backgroundColor: figmaColors.surface,
    ...figmaShadows.card,
  },
  methodCardSelected: {
    borderColor: figmaColors.success,
    backgroundColor: `${figmaColors.success}0D`,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: figmaColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: figmaColors.success,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: figmaColors.success,
  },
  methodIconWrap: {
    width: 40,
    height: 40,
    borderRadius: figmaRadius.md,
    backgroundColor: figmaColors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIconWrapSelected: {
    backgroundColor: `${figmaColors.success}1A`,
  },
  methodInfo: {
    flex: 1,
  },
  methodLabel: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.textPrimary,
  },
  methodDesc: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: figmaSpacing.sm,
  },
  totalLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.sm,
    flex: 1,
  },
  totalLabel: {
    fontSize: figmaFonts.sizes.md,
    color: figmaColors.textSecondary,
  },
  totalValue: {
    fontSize: figmaFonts.sizes['2xl'],
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.success,
  },
  actions: {
    gap: figmaSpacing.sm,
  },
  payBtn: {
    borderRadius: figmaRadius.md,
  },
  payBtnContent: {
    paddingVertical: 6,
  },
  payBtnLabel: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.bold,
  },
  cancelBtn: {
    borderRadius: figmaRadius.md,
    borderColor: figmaColors.border,
  },
  cancelBtnLabel: {
    fontSize: figmaFonts.sizes.md,
    fontWeight: figmaFonts.weights.semibold,
  },
  // WebView
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 8,
    backgroundColor: figmaColors.success,
  },
  webViewTitle: {
    fontSize: figmaFonts.sizes.xl,
    fontWeight: figmaFonts.weights.bold,
    color: '#fff',
  },
  webView: {
    flex: 1,
  },
  // Cash overlay
  cashOverlay: {
    flex: 1,
  },
  cashGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: figmaSpacing['3xl'],
    gap: figmaSpacing.md,
  },
  cashTitle: {
    fontSize: figmaFonts.sizes['2xl'],
    fontWeight: figmaFonts.weights.bold,
    color: '#fff',
    textAlign: 'center',
  },
  cashSubtitle: {
    fontSize: figmaFonts.sizes.md,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  cashAmount: {
    fontSize: figmaFonts.sizes['3xl'],
    fontWeight: figmaFonts.weights.bold,
    color: '#fff',
    marginTop: figmaSpacing.sm,
  },
  // Success overlay
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
  successGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: figmaSpacing['3xl'],
  },
  successLottie: {
    width: 200,
    height: 200,
  },
  successTitle: {
    fontSize: figmaFonts.sizes['2xl'],
    fontWeight: figmaFonts.weights.bold,
    color: '#fff',
    marginTop: figmaSpacing.md,
  },
  successBtn: {
    marginTop: figmaSpacing['2xl'],
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: figmaRadius.md,
    paddingHorizontal: figmaSpacing['2xl'],
    paddingVertical: figmaSpacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  successBtnLabel: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.bold,
    color: '#fff',
  },
});

