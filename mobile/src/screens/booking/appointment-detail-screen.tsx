/**
 * AppointmentDetailScreen — Màn hình chi tiết lịch hẹn
 * Thuộc phần của Ngô Đức Sơn — module Booking & Appointment.
 *
 * Hiển thị toàn bộ thông tin một lịch hẹn: bác sĩ, lịch khám, dịch vụ,
 * thanh toán, ghi chú bệnh nhân, chẩn đoán, đánh giá đã gửi.
 *
 * Luồng chính:
 *   1. Fetch GET /api/v1/appointments/:id → hiện thông tin lịch hẹn
 *   2. Fetch GET /api/v1/payments/appointment/:id → hiện trạng thái thanh toán (nếu có)
 *   3. Dựa trên status, hiện các nút hành động phù hợp:
 *      - canReschedule (PENDING)          → nút "Đổi lịch" → RescheduleScreen
 *      - canCancel (PENDING | CONFIRMED)  → nút "Huỷ lịch" → Alert xác nhận → PUT .../cancel
 *      - canPay (AWAITING_PAYMENT)        → QR VietQR + nút "Xác nhận đã thanh toán" → PUT .../pay
 *      - canReview (COMPLETED + chưa có review) → nút "Viết đánh giá" → ReviewScreen
 */
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Snackbar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { GlassCard } from '../../components/ui/GlassCard';
import { FadeInView, GradientHeader, ScreenContainer } from '../../components/shared';
import { figmaColors, theme } from '../../constants/theme';
import { formatLongDate, formatShortDate, formatVND } from '../../utils/format';
import { api, extractData } from '../../services/api';
import { cancelAppointment } from '../../services/appointments.service';
import type { Appointment, Payment } from '../../types';

// ---------------------------------------------------------------------------
// Hằng số màu sắc
// ---------------------------------------------------------------------------

const ORANGE = '#F57C00';
const PURPLE = '#7C4DFF';
const INDIGO = '#5856D6';

const STATUS_CONFIG: Record<
  string,
  {
    color: string;
    bgColor: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
  }
> = {
  PENDING: {
    color: '#fff',
    bgColor: ORANGE,
    icon: 'clock-outline',
    label: 'Chờ xác nhận',
  },
  CONFIRMED: {
    color: '#fff',
    bgColor: figmaColors.primary,
    icon: 'check-circle-outline',
    label: 'Đã xác nhận',
  },
  AWAITING_PAYMENT: {
    color: '#fff',
    bgColor: PURPLE,
    icon: 'cash-clock',
    label: 'Chờ thanh toán',
  },
  COMPLETED: {
    color: '#fff',
    bgColor: figmaColors.success,
    icon: 'check-decagram',
    label: 'Đã hoàn thành',
  },
  CANCELED: {
    color: '#fff',
    bgColor: figmaColors.error,
    icon: 'close-circle-outline',
    label: 'Đã huỷ',
  },
};

const PAYMENT_STATUS_CONFIG: Record<
  string,
  { color: string; label: string }
> = {
  PENDING: { color: ORANGE, label: 'Chờ thanh toán' },
  PAID: { color: figmaColors.success, label: 'Đã thanh toán' },
  FAILED: { color: figmaColors.error, label: 'Thất bại' },
  REFUNDED: { color: PURPLE, label: 'Đã hoàn tiền' },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  VNPAY: 'VNPAY',
  MOMO: 'Momo',
};

// ---------------------------------------------------------------------------
// Component hàng thông tin (icon + nhãn + giá trị)
// ---------------------------------------------------------------------------

interface InfoRowProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
}

function InfoRow({ icon, iconColor, label, value }: InfoRowProps) {
  return (
    <View style={infoStyles.row}>
      <View style={[infoStyles.iconCircle, { backgroundColor: iconColor + '14' }]}>
        <MaterialCommunityIcons name={icon} size={16} color={iconColor} />
      </View>
      <View style={infoStyles.textCol}>
        <Text style={infoStyles.label}>{label}</Text>
        <Text style={infoStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    color: figmaColors.textPrimary,
    marginTop: 1,
  },
});

// ---------------------------------------------------------------------------
// Component hiển thị đánh giá sao
// ---------------------------------------------------------------------------

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <MaterialCommunityIcons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={18}
          color={star <= rating ? figmaColors.warning : figmaColors.textMuted}
        />
      ))}
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
  },
});

// ---------------------------------------------------------------------------
// Màn hình chính
// ---------------------------------------------------------------------------

interface AppointmentDetailScreenProps {
  appointmentId: string;
}

export function AppointmentDetailScreen({
  appointmentId,
}: AppointmentDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState('');
  const [canceling, setCanceling] = useState(false);

  // Fetch chi tiết lịch hẹn (GET /api/v1/appointments/:id) và thông tin thanh toán song song
  const fetchDetail = useCallback(async () => {
    try {
      const data = await extractData<Appointment>(
        await api.get(`/appointments/${appointmentId}`)
      );
      setAppointment(data);

      // Thử lấy thông tin payment
      // Thông tin payment có thể chưa tồn tại (lịch mới tạo) → bắt lỗi im lặng
      try {
        const paymentData = await extractData<Payment>(
          await api.get(`/payments/appointment/${appointmentId}`)
        );
        setPayment(paymentData);
      } catch {
        setPayment(null);
      }
    } catch {
      setNotice('Không thể tải chi tiết lịch hẹn.');
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDetail();
    setRefreshing(false);
  }, [fetchDetail]);

  async function performCancel() {
    setCanceling(true);
    try {
      const updated = await cancelAppointment(appointmentId);
      setAppointment(updated);
      setNotice('Đã huỷ lịch hẹn thành công.');
    } catch {
      setNotice('Không thể huỷ lịch hẹn.');
    } finally {
      setCanceling(false);
    }
  }

  function handleCancel() {
    Alert.alert(
      'Huỷ lịch hẹn',
      'Bạn có chắc muốn huỷ lịch hẹn này? Hành động này không thể hoàn tác.',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Huỷ lịch',
          style: 'destructive',
          onPress: () => {
            void performCancel();
          },
        },
      ],
    );
  }

  const [paying, setPaying] = useState(false);

  // Xác nhận thanh toán: PUT /api/v1/appointments/:id/pay
  // Sau khi thành công → delay 1.2s → điều hướng đến ReviewScreen để bệnh nhân đánh giá
  async function handlePay() {
    setPaying(true);
    try {
      const res = await api.put(`/appointments/${appointmentId}/pay`, { method: 'VNPAY' });
      const updated = extractData<Appointment>(res);
      setAppointment(updated);
      setNotice('Thanh toán thành công!');
      // Sau một khoảng trễ ngắn, điều hướng đến màn hình đánh giá
      setTimeout(() => {
        router.push({ pathname: '/review', params: { appointmentId } });
      }, 1200);
    } catch {
      setNotice('Thanh toán thất bại. Vui lòng thử lại.');
    } finally {
      setPaying(false);
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top + 60 }]}>
        <ActivityIndicator size="large" color={figmaColors.primary} />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top + 60 }]}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={48}
          color={figmaColors.textMuted}
        />
        <Text style={styles.errorText}>Không tìm thấy lịch hẹn</Text>
        <Button
          mode="contained"
          onPress={() => router.back()}
          buttonColor={figmaColors.primary}
          textColor="#fff"
          style={{ marginTop: 16, borderRadius: 12 }}
        >
          Quay lại
        </Button>
      </View>
    );
  }

  const statusCfg = STATUS_CONFIG[appointment.status] ?? STATUS_CONFIG.PENDING;
  const doctor = appointment.doctor;
  const timeSlot = appointment.timeSlot;
  const services = appointment.services ?? [];
  const review = appointment.review;
  // Điều kiện hiện nút theo trạng thái lịch hẹn
  const canCancel =
    appointment.status === 'PENDING' || appointment.status === 'CONFIRMED';
  const canReschedule = appointment.status === 'PENDING'; // Chỉ đổi được khi chưa có bác sĩ nhận
  const canPay = appointment.status === 'AWAITING_PAYMENT'; // Bác sĩ đã hoàn tất → cần thanh toán
  const canReview =
    appointment.status === 'COMPLETED' && !review; // Chỉ đánh giá 1 lần, sau khi hoàn thành

  return (
    <>
    <ScreenContainer
      refreshing={refreshing}
      onRefresh={handleRefresh}
      showsVerticalScrollIndicator={false}
    >
      {/* Tiêu đề */}
      <GradientHeader
        title="Chi tiết lịch hẹn"
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

        {/* Status Banner */}
        <FadeInView delay={0}>
          <View
            style={[styles.statusBanner, { backgroundColor: statusCfg.bgColor }]}
          >
            <MaterialCommunityIcons
              name={statusCfg.icon}
              size={20}
              color={statusCfg.color}
            />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        </FadeInView>

        <View style={styles.cardList}>
          {/* Thẻ bác sĩ — ẩn khi PENDING vì chưa có bác sĩ được phân công */}
          {doctor && appointment.status !== 'PENDING' && (
            <FadeInView delay={60}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  router.push({ pathname: '/doctor-view', params: { id: doctor.id } })
                }
              >
                <GlassCard style={styles.card} glassStyle="regular">
                  <View style={styles.cardInner}>
                    <View style={styles.sectionHeader}>
                      <MaterialCommunityIcons
                        name="doctor"
                        size={18}
                        color={figmaColors.primary}
                      />
                      <Text style={styles.sectionTitle}>Bác sĩ</Text>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={18}
                        color={figmaColors.textMuted}
                        style={{ marginLeft: 'auto' }}
                      />
                    </View>
                    <View style={styles.doctorRow}>
                      <View style={styles.avatarContainer}>
                        <Image
                          source={{
                            uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.name)}&background=1565C0&color=fff&size=80`,
                          }}
                          style={styles.avatar}
                        />
                      </View>
                      <View style={styles.doctorInfo}>
                        <Text style={styles.doctorName} numberOfLines={1}>
                          {doctor.name}
                        </Text>
                        <Text style={styles.specialtyText} numberOfLines={1}>
                          {doctor.specialty?.name ?? 'Chuyên khoa'}
                        </Text>
                        {doctor.clinic && (
                          <Text style={styles.clinicSmallText} numberOfLines={1}>
                            {doctor.clinic.name}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            </FadeInView>
          )}

          {/* Thẻ lịch khám */}
          <FadeInView delay={120}>
            <GlassCard style={styles.card} glassStyle="regular">
              <View style={styles.cardInner}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons
                    name="calendar-clock"
                    size={18}
                    color={ORANGE}
                  />
                  <Text style={styles.sectionTitle}>Lịch khám</Text>
                </View>
                <InfoRow
                  icon="calendar"
                  iconColor={ORANGE}
                  label="Ngày"
                  value={formatLongDate(timeSlot?.date)}
                />
                <View style={styles.divider} />
                <InfoRow
                  icon="clock-outline"
                  iconColor={INDIGO}
                  label="Giờ"
                  value={
                    timeSlot
                      ? `${timeSlot.startTime} - ${timeSlot.endTime}`
                      : 'Chưa xếp lịch'
                  }
                />
                {doctor?.clinic && (
                  <>
                    <View style={styles.divider} />
                    <InfoRow
                      icon="map-marker"
                      iconColor={figmaColors.error}
                      label="Phòng khám"
                      value={doctor.clinic.address}
                    />
                  </>
                )}
              </View>
            </GlassCard>
          </FadeInView>

          {/* Thẻ dịch vụ */}
          {services.length > 0 && (
            <FadeInView delay={180}>
              <GlassCard style={styles.card} glassStyle="regular">
                <View style={styles.cardInner}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons
                      name="medical-bag"
                      size={18}
                      color={figmaColors.info}
                    />
                    <Text style={styles.sectionTitle}>Dịch vụ</Text>
                  </View>
                  {services.map((svc, idx) => (
                    <View key={svc.id}>
                      {idx > 0 && <View style={styles.divider} />}
                      <View style={styles.serviceRow}>
                        <Text style={styles.serviceName} numberOfLines={1}>
                          {svc.service?.name ?? 'Dịch vụ'}
                        </Text>
                        <Text style={styles.servicePrice}>
                          {formatVND(svc.price)}
                        </Text>
                      </View>
                    </View>
                  ))}
                  <View style={styles.divider} />
                  <View style={styles.serviceRow}>
                    <Text style={styles.totalLabel}>Tổng tiền</Text>
                    <Text style={styles.totalAmount}>
                      {formatVND(appointment.totalAmount)}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </FadeInView>
          )}

          {/* Tổng tiền (khi không có dịch vụ chi tiết) */}
          {services.length === 0 && appointment.totalAmount > 0 && (
            <FadeInView delay={180}>
              <GlassCard style={styles.card} glassStyle="regular">
                <View style={styles.cardInner}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons
                      name="cash"
                      size={18}
                      color={figmaColors.success}
                    />
                    <Text style={styles.sectionTitle}>Tổng tiền</Text>
                  </View>
                  <View style={styles.serviceRow}>
                    <Text style={styles.totalLabel}>Tổng tiền</Text>
                    <Text style={styles.totalAmount}>
                      {formatVND(appointment.totalAmount)}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </FadeInView>
          )}

          {/* Trạng thái thanh toán */}
          <FadeInView delay={240}>
            <GlassCard style={styles.card} glassStyle="regular">
              <View style={styles.cardInner}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons
                    name="credit-card-outline"
                    size={18}
                    color={INDIGO}
                  />
                  <Text style={styles.sectionTitle}>Thanh toán</Text>
                </View>
                {payment ? (
                  <View style={styles.paymentContent}>
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Phương thức</Text>
                      <Text style={styles.paymentValue}>
                        {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
                      </Text>
                    </View>
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Trạng thái</Text>
                      <View
                        style={[
                          styles.paymentBadge,
                          {
                            backgroundColor:
                              (PAYMENT_STATUS_CONFIG[payment.status]?.color ??
                                figmaColors.textSecondary) + '18',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.paymentBadgeText,
                            {
                              color:
                                PAYMENT_STATUS_CONFIG[payment.status]?.color ??
                                figmaColors.textSecondary,
                            },
                          ]}
                        >
                          {PAYMENT_STATUS_CONFIG[payment.status]?.label ??
                            payment.status}
                        </Text>
                      </View>
                    </View>
                    {payment.paidAt && (
                      <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Ngày thanh toán</Text>
                        <Text style={styles.paymentValue}>
                          {formatShortDate(payment.paidAt)}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.paymentContent}>
                    <Text style={styles.noPaymentText}>
                      {canPay
                        ? 'Bác sĩ đã hoàn tất khám. Vui lòng thanh toán bên dưới.'
                        : 'Chưa có thông tin thanh toán.'}
                    </Text>
                  </View>
                )}
              </View>
            </GlassCard>
          </FadeInView>

          {/* Ghi chú bệnh nhân */}
          {appointment.notes && (
            <FadeInView delay={300}>
              <GlassCard style={styles.card} glassStyle="regular">
                <View style={styles.cardInner}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons
                      name="note-text-outline"
                      size={18}
                      color={PURPLE}
                    />
                    <Text style={styles.sectionTitle}>Ghi chú của bệnh nhân</Text>
                  </View>
                  <Text style={styles.notesText}>{appointment.notes}</Text>
                </View>
              </GlassCard>
            </FadeInView>
          )}

          {/* Chẩn đoán */}
          {appointment.diagnosis && (
            <FadeInView delay={360}>
              <GlassCard style={styles.card} glassStyle="regular">
                <View style={styles.cardInner}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons
                      name="stethoscope"
                      size={18}
                      color={figmaColors.success}
                    />
                    <Text style={styles.sectionTitle}>Chẩn đoán</Text>
                  </View>
                  <Text style={styles.notesText}>{appointment.diagnosis}</Text>
                </View>
              </GlassCard>
            </FadeInView>
          )}

          {/* Đánh giá (nếu đã có) */}
          {review && (
            <FadeInView delay={420}>
              <GlassCard style={styles.card} glassStyle="regular">
                <View style={styles.cardInner}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons
                      name="star"
                      size={18}
                      color={figmaColors.warning}
                    />
                    <Text style={styles.sectionTitle}>Đánh giá của bạn</Text>
                  </View>
                  <StarRating rating={review.rating} />
                  {review.comment && (
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  )}
                  <Text style={styles.reviewDate}>
                    {formatShortDate(review.createdAt)}
                  </Text>
                </View>
              </GlassCard>
            </FadeInView>
          )}

          {/* Khu vực hành động: các nút hiện/ẩn tuỳ theo status lịch hẹn */}
          <FadeInView delay={480}>
            <View style={styles.actionsSection}>
              {canReschedule && (
                <Button
                  mode="contained"
                  onPress={() => router.push(`/reschedule?id=${appointment.id}`)}
                  buttonColor={PURPLE}
                  textColor="#fff"
                  icon="calendar-refresh-outline"
                  style={styles.rescheduleBtn}
                  contentStyle={styles.actionBtnContent}
                >
                  Đổi lịch
                </Button>
              )}
              {canCancel && (
                <Button
                  mode="outlined"
                  onPress={handleCancel}
                  loading={canceling}
                  disabled={canceling}
                  textColor={figmaColors.error}
                  icon="close-circle-outline"
                  style={styles.cancelBtn}
                  contentStyle={styles.actionBtnContent}
                >
                  Huỷ lịch hẹn
                </Button>
              )}

              {/* canPay: hiện mã QR VietQR sandbox + nút xác nhận thanh toán */}
              {canPay && (
                <>
                  <GlassCard style={styles.qrCard}>
                    <View style={styles.qrContent}>
                      <Text style={styles.qrTitle}>Quét mã QR để thanh toán</Text>
                      <Image
                        source={{
                          uri: `https://img.vietqr.io/image/970422-0123456789-compact2.png?amount=${Math.round(appointment.totalAmount)}&addInfo=BTL+${appointment.id.slice(0, 8)}&accountName=BTL+Healthcare`,
                        }}
                        style={styles.qrImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.qrAmount}>
                        {formatVND(appointment.totalAmount)}
                      </Text>
                      <Text style={styles.qrNote}>
                        MB Bank • STK: 0123456789
                      </Text>
                    </View>
                  </GlassCard>
                  <Button
                    mode="contained"
                    onPress={handlePay}
                    loading={paying}
                    disabled={paying}
                    buttonColor={figmaColors.success}
                    textColor="#fff"
                    icon="check-circle"
                    style={styles.payBtn}
                    contentStyle={styles.actionBtnContent}
                  >
                    {paying ? 'Đang xử lý...' : 'Xác nhận đã thanh toán'}
                  </Button>
                </>
              )}

              {canReview && (
                <Button
                  mode="contained"
                  onPress={() =>
                    router.push({
                      pathname: '/review',
                      params: { appointmentId: appointment.id },
                    })
                  }
                  buttonColor={figmaColors.warning}
                  textColor="#000"
                  icon="star-outline"
                  style={styles.reviewBtn}
                  contentStyle={styles.actionBtnContent}
                >
                  Viết đánh giá
                </Button>
              )}
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
// Style
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: figmaColors.textSecondary,
    marginTop: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardList: {
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 12,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardInner: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: figmaColors.textPrimary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: figmaColors.border,
  },
  // Bác sĩ
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: figmaColors.surfaceMuted,
  },
  avatar: {
    width: 56,
    height: 56,
  },
  doctorInfo: {
    flex: 1,
    gap: 2,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: figmaColors.textPrimary,
  },
  specialtyText: {
    fontSize: 14,
    color: figmaColors.primary,
    fontWeight: '500',
  },
  clinicSmallText: {
    fontSize: 13,
    color: figmaColors.textSecondary,
  },
  // Dịch vụ
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  serviceName: {
    fontSize: 14,
    color: figmaColors.textPrimary,
    flex: 1,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: figmaColors.textPrimary,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: figmaColors.textPrimary,
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: figmaColors.success,
  },
  // Thanh toán
  paymentContent: {
    gap: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentLabel: {
    fontSize: 14,
    color: figmaColors.textSecondary,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: figmaColors.textPrimary,
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  paymentBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  noPaymentText: {
    fontSize: 14,
    color: figmaColors.textSecondary,
    fontStyle: 'italic',
  },
  payNowBtn: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  // Ghi chú / Chẩn đoán
  notesText: {
    fontSize: 14,
    color: figmaColors.textPrimary,
    lineHeight: 20,
  },
  // Đánh giá
  reviewComment: {
    fontSize: 14,
    color: figmaColors.textPrimary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  reviewDate: {
    fontSize: 12,
    color: figmaColors.textSecondary,
  },
  // Nút hành động
  actionsSection: {
    gap: 12,
    marginTop: 4,
  },
  cancelBtn: {
    borderColor: figmaColors.error + '40',
    borderRadius: 14,
  },
  rescheduleBtn: {
    borderRadius: 14,
  },
  reviewBtn: {
    borderRadius: 14,
  },
  payBtn: {
    borderRadius: 14,
  },
  qrCard: {
    marginBottom: 12,
  },
  qrContent: {
    alignItems: 'center',
    gap: 12,
  },
  qrTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: figmaColors.textPrimary,
  },
  qrImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
  },
  qrAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: figmaColors.primary,
  },
  qrNote: {
    fontSize: 12,
    color: figmaColors.textMuted,
  },
  actionBtnContent: {
    paddingVertical: 4,
  },
});
