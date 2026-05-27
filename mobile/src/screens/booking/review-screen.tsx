/**
 * ReviewScreen — Màn hình viết đánh giá bác sĩ
 * Thuộc phần của Ngô Đức Sơn — module Booking & Appointment.
 *
 * Cho phép bệnh nhân gửi đánh giá (1–5 sao + nhận xét văn bản) cho bác sĩ
 * sau khi lịch hẹn đã hoàn thành và đã thanh toán.
 *
 * Luồng chính:
 *   1. Fetch GET /api/v1/appointments/:id → hiện thông tin bác sĩ để xác nhận context
 *   2. Người dùng chọn số sao (1–5) + nhập nhận xét (tuỳ chọn)
 *   3. Nhấn "Gửi đánh giá" → POST /api/v1/reviews { appointmentId, rating, comment }
 *   4. Thành công → hiện snackbar → router.back() sau 800ms
 */
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GlassCard } from '../../components/ui/GlassCard';
import { ScreenBackground } from '../../components/ui/ScreenBackground';
import { FadeInView, GradientHeader } from '../../components/shared';
import {
  figmaColors,
  figmaFonts,
  figmaRadius,
  figmaSpacing,
} from '../../constants/theme';
import { api, extractData } from '../../services/api';
import type { Appointment } from '../../types';

// ---------------------------------------------------------------------------
// Component chọn số sao đánh giá
// ---------------------------------------------------------------------------

function StarRating({
  rating,
  onRate,
}: {
  rating: number;
  onRate: (value: number) => void;
}) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onRate(star)} hitSlop={8}>
          <MaterialCommunityIcons
            name={star <= rating ? 'star' : 'star-outline'}
            size={40}
            color={star <= rating ? figmaColors.warning : figmaColors.textMuted}
          />
        </Pressable>
      ))}
    </View>
  );
}

const RATING_HINTS: Record<number, string> = {
  1: 'Rất tệ',
  2: 'Tệ',
  3: 'Bình thường',
  4: 'Tốt',
  5: 'Rất tốt',
};

// ---------------------------------------------------------------------------
// Màn hình chính
// ---------------------------------------------------------------------------

interface ReviewScreenProps {
  appointmentId: string;
}

export function ReviewScreen({ appointmentId }: ReviewScreenProps) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  useEffect(() => {
    fetchAppointment();
  }, [appointmentId]);

  // Fetch thông tin lịch hẹn để hiện card bác sĩ ở đầu màn hình
  // GET /api/v1/appointments/:id
  async function fetchAppointment() {
    try {
      setLoading(true);
      const data = extractData<Appointment>(
        await api.get(`/appointments/${appointmentId}`)
      );
      setAppointment(data);
    } catch {
      setSnackbar({ visible: true, message: 'Không tải được lịch hẹn.' });
    } finally {
      setLoading(false);
    }
  }

  // Gửi đánh giá: validate → POST /api/v1/reviews { appointmentId, rating, comment }
  // Nếu comment rỗng thì không gửi field đó (undefined) để backend bỏ qua
  async function handleSubmit() {
    if (rating === 0) {
      setSnackbar({ visible: true, message: 'Vui lòng chọn mức đánh giá.' });
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/reviews', {
        appointmentId,
        rating,
        comment: comment.trim() || undefined,
      });
      setSnackbar({ visible: true, message: 'Đã gửi đánh giá!' });
      setTimeout(() => router.back(), 800);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { error?: { message?: string } } } })
              .response?.data?.error?.message ?? 'Không gửi được đánh giá.')
          : 'Không gửi được đánh giá.';
      setSnackbar({ visible: true, message: msg });
    } finally {
      setSubmitting(false);
    }
  }

  const doctorInitials =
    appointment?.doctor?.name
      ?.split(' ')
      .slice(-2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() ?? '?';

  return (
    <ScreenBackground>
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <GradientHeader
            title="Viết đánh giá"
            leftSlot={
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                style={styles.backBtn}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={22}
                  color="#fff"
                />
              </Pressable>
            }
          />

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={figmaColors.primary} />
            </View>
          ) : (
            <>
              {/* Thông tin bác sĩ */}
              <FadeInView delay={80} distance={20}>
                <GlassCard style={styles.card}>
                  <View style={styles.doctorRow}>
                    <View style={styles.doctorAvatar}>
                      <Text style={styles.doctorAvatarText}>{doctorInitials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.doctorName}>
                        {appointment?.doctor?.name ?? 'Bác sĩ'}
                      </Text>
                      <Text style={styles.doctorSpecialty}>
                        {appointment?.doctor?.specialty?.name ?? 'Chuyên khoa'}
                      </Text>
                      {appointment?.doctor?.clinic?.name && (
                        <Text style={styles.clinicName}>
                          {appointment.doctor.clinic.name}
                        </Text>
                      )}
                    </View>
                  </View>
                </GlassCard>
              </FadeInView>

              {/* Chọn số sao */}
              <FadeInView delay={160} distance={20}>
                <GlassCard style={styles.card}>
                  <View style={styles.ratingSection}>
                    <Text style={styles.ratingQuestion}>
                      Bạn đánh giá thế nào về bác sĩ?
                    </Text>
                    <StarRating rating={rating} onRate={setRating} />
                    {rating > 0 ? (
                      <Text style={styles.ratingHint}>{RATING_HINTS[rating]}</Text>
                    ) : (
                      <Text style={styles.ratingHintMuted}>
                        Chạm vào sao để đánh giá
                      </Text>
                    )}
                  </View>
                </GlassCard>
              </FadeInView>

              {/* Nhận xét văn bản */}
              <FadeInView delay={240} distance={20}>
                <GlassCard style={styles.card}>
                  <Text style={styles.sectionLabel}>Nhận xét của bạn</Text>
                  <TextInput
                    mode="outlined"
                    placeholder="Chia sẻ trải nghiệm của bạn..."
                    value={comment}
                    onChangeText={setComment}
                    multiline
                    numberOfLines={4}
                    style={styles.textInput}
                    outlineStyle={{ borderRadius: figmaRadius.md }}
                  />
                </GlassCard>
              </FadeInView>

              {/* Nút gửi */}
              <FadeInView delay={320} distance={20}>
                <Pressable
                  onPress={handleSubmit}
                  disabled={submitting || rating === 0}
                  style={({ pressed }) => [
                    styles.submitBtn,
                    (submitting || rating === 0) && styles.submitBtnDisabled,
                    pressed && styles.submitBtnPressed,
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="send"
                        size={20}
                        color="#fff"
                      />
                      <Text style={styles.submitBtnLabel}>Gửi đánh giá</Text>
                    </>
                  )}
                </Pressable>
              </FadeInView>
            </>
          )}
        </ScrollView>

        <Snackbar
          visible={snackbar.visible}
          onDismiss={() => setSnackbar({ visible: false, message: '' })}
          duration={2500}
        >
          {snackbar.message}
        </Snackbar>
      </View>
    </ScreenBackground>
  );
}

// ---------------------------------------------------------------------------
// Style
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    paddingBottom: 120,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    paddingVertical: figmaSpacing['4xl'],
    alignItems: 'center',
  },
  card: {
    marginHorizontal: figmaSpacing.lg,
    marginTop: figmaSpacing.lg,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.md,
    padding: figmaSpacing.xs,
  },
  doctorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: figmaColors.pastelBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorAvatarText: {
    fontSize: figmaFonts.sizes.xl,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.primary,
  },
  doctorName: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textPrimary,
  },
  doctorSpecialty: {
    fontSize: figmaFonts.sizes.base,
    color: figmaColors.textSecondary,
    marginTop: 2,
  },
  clinicName: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textMuted,
    marginTop: 2,
  },
  ratingSection: {
    alignItems: 'center',
    paddingVertical: figmaSpacing.md,
    gap: figmaSpacing.md,
  },
  ratingQuestion: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textPrimary,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: figmaSpacing.md,
  },
  ratingHint: {
    fontSize: figmaFonts.sizes.md,
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.primary,
  },
  ratingHintMuted: {
    fontSize: figmaFonts.sizes.md,
    color: figmaColors.textMuted,
  },
  sectionLabel: {
    fontSize: figmaFonts.sizes.md,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textPrimary,
    marginBottom: figmaSpacing.sm,
  },
  textInput: {
    backgroundColor: figmaColors.surface,
  },
  submitBtn: {
    marginHorizontal: figmaSpacing.lg,
    marginTop: figmaSpacing['2xl'],
    backgroundColor: figmaColors.primary,
    borderRadius: figmaRadius.lg,
    paddingVertical: figmaSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: figmaSpacing.sm,
  },
  submitBtnPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: figmaColors.primaryDark,
  },
  submitBtnDisabled: {
    backgroundColor: figmaColors.textMuted,
  },
  submitBtnLabel: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.bold,
    color: '#fff',
    letterSpacing: 0.3,
  },
});
