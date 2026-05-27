import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { GlassCard } from '../../components/ui/GlassCard';
import { FadeInView, ScreenContainer } from '../../components/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDoctorDetail } from '../../hooks/use-doctor-detail';
import {
  figmaColors,
  figmaFonts,
  figmaRadius,
  figmaSpacing,
  theme,
} from '../../constants/theme';
import {
  getDoctorReviews,
  type DoctorRatingStats,
  type DoctorReviewItem,
} from '../../services/doctors.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STAGGER_DELAY = 120;

interface DoctorDetailScreenProps {
  doctorId: string;
}

/* ------------------------------------------------------------------ */
/*  Skeleton placeholder                                              */
/* ------------------------------------------------------------------ */

function SkeletonBlock({
  width,
  height,
  style,
}: {
  width: number | string;
  height: number;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          width: width as number,
          height,
          borderRadius: figmaRadius.sm,
          backgroundColor: figmaColors.border,
        },
        style,
      ]}
    />
  );
}

function LoadingSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonHeader}>
        <SkeletonBlock width={SCREEN_WIDTH * 0.5} height={28} />
        <SkeletonBlock width={SCREEN_WIDTH * 0.35} height={16} style={{ marginTop: 10 }} />
        <SkeletonBlock width={SCREEN_WIDTH * 0.6} height={16} style={{ marginTop: 8 }} />
      </View>
      <View style={styles.skeletonCard}>
        <SkeletonBlock width={80} height={18} />
        <SkeletonBlock width={'100%' as unknown as number} height={14} style={{ marginTop: 12 }} />
        <SkeletonBlock width={'90%' as unknown as number} height={14} style={{ marginTop: 8 }} />
        <SkeletonBlock width={'70%' as unknown as number} height={14} style={{ marginTop: 8 }} />
      </View>
      <View style={styles.skeletonCard}>
        <SkeletonBlock width={90} height={18} />
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.serviceRow, { marginTop: 12 }]}>
            <SkeletonBlock width={SCREEN_WIDTH * 0.4} height={14} />
            <SkeletonBlock width={80} height={14} />
          </View>
        ))}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Reviews sub-components                                            */
/* ------------------------------------------------------------------ */

function RatingBar({
  star,
  count,
  total,
  delay,
}: {
  star: number;
  count: number;
  total: number;
  delay: number;
}) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const percent = total > 0 ? count / total : 0;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: percent,
      friction: 8,
      tension: 40,
      delay,
      useNativeDriver: false,
    }).start();
  }, [percent, delay, widthAnim]);

  const widthInterpolate = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.barRow}>
      <View style={styles.barStarLabel}>
        <Text style={styles.barStarText}>{star}</Text>
        <MaterialCommunityIcons name="star" size={12} color={figmaColors.warning} />
      </View>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width: widthInterpolate }]} />
      </View>
      <Text style={styles.barCount}>{count}</Text>
    </View>
  );
}

function ReviewStars({ rating, size = 14 }: { rating: number; size?: number }) {
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  return (
    <View style={styles.reviewStarsRow}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <MaterialCommunityIcons
          key={`f-${i}`}
          name="star"
          size={size}
          color={figmaColors.warning}
        />
      ))}
      {halfStar && (
        <MaterialCommunityIcons
          name="star-half-full"
          size={size}
          color={figmaColors.warning}
        />
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <MaterialCommunityIcons
          key={`e-${i}`}
          name="star-outline"
          size={size}
          color={figmaColors.warning}
        />
      ))}
    </View>
  );
}

function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function ReviewRow({ review, index }: { review: DoctorReviewItem; index: number }) {
  const translateY = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 50,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 50,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, translateY, scale]);

  const initial = review.patient.name?.trim().charAt(0).toUpperCase() || '?';

  return (
    <Animated.View
      style={[
        styles.reviewRow,
        { transform: [{ translateY }, { scale }] },
      ]}
    >
      <View style={styles.reviewAvatar}>
        {review.patient.avatarUrl ? (
          <Image
            source={{ uri: review.patient.avatarUrl }}
            style={styles.reviewAvatarImg}
          />
        ) : (
          <Text style={styles.reviewAvatarInitial}>{initial}</Text>
        )}
      </View>
      <View style={styles.reviewBody}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewName} numberOfLines={1}>
            {review.patient.name}
          </Text>
          <Text style={styles.reviewDate}>{formatReviewDate(review.createdAt)}</Text>
        </View>
        <ReviewStars rating={review.rating} />
        {review.comment ? (
          <Text style={styles.reviewComment}>{review.comment}</Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

function ReviewsSection({ doctorId }: { doctorId: string }) {
  const [reviews, setReviews] = useState<DoctorReviewItem[]>([]);
  const [stats, setStats] = useState<DoctorRatingStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadPage = useCallback(
    async (nextPage: number) => {
      if (nextPage === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const result = await getDoctorReviews(doctorId, nextPage);
        setStats(result.data.stats);
        setTotalPages(result.meta.totalPages);
        setReviews((prev) =>
          nextPage === 1 ? result.data.items : [...prev, ...result.data.items]
        );
        setPage(nextPage);
      } catch {
        // Silent
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [doctorId]
  );

  useEffect(() => {
    void loadPage(1);
  }, [loadPage]);

  const hasMore = page < totalPages;
  const total = stats?.totalReviews ?? 0;
  const avg = stats?.averageRating ?? 0;

  return (
    <GlassCard style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.sectionTitleRow}>
          <MaterialCommunityIcons
            name="star-circle-outline"
            size={20}
            color={figmaColors.primary}
          />
          <Text style={styles.sectionTitle}>Đánh giá</Text>
        </View>

        {isLoading ? (
          <View style={styles.reviewsLoading}>
            <ActivityIndicator color={figmaColors.primary} />
          </View>
        ) : total === 0 ? (
          <View style={styles.reviewsEmpty}>
            <MaterialCommunityIcons
              name="comment-text-outline"
              size={36}
              color={figmaColors.textMuted}
            />
            <Text style={styles.reviewsEmptyText}>Chưa có đánh giá nào</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryLeft}>
                <Text style={styles.summaryAvg}>{avg.toFixed(1)}</Text>
                <ReviewStars rating={avg} size={16} />
                <Text style={styles.summaryLabel}>Đánh giá trung bình</Text>
              </View>
              <View style={styles.summaryBars}>
                {[5, 4, 3, 2, 1].map((star, idx) => (
                  <RatingBar
                    key={star}
                    star={star}
                    count={stats?.distribution[String(star) as '1'] ?? 0}
                    total={total}
                    delay={idx * 80}
                  />
                ))}
                <Text style={styles.summaryTotal}>Tổng đánh giá: {total}</Text>
              </View>
            </View>

            <View style={styles.reviewsDivider} />

            <View style={styles.reviewsList}>
              {reviews.map((review, i) => (
                <ReviewRow key={review.id} review={review} index={i} />
              ))}
            </View>

            {hasMore && (
              <Pressable
                onPress={() => loadPage(page + 1)}
                disabled={isLoadingMore}
                style={({ pressed }) => [
                  styles.loadMore,
                  pressed && styles.loadMorePressed,
                ]}
              >
                {isLoadingMore ? (
                  <ActivityIndicator color={figmaColors.primary} size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="chevron-down"
                      size={18}
                      color={figmaColors.primary}
                    />
                    <Text style={styles.loadMoreText}>Xem thêm đánh giá</Text>
                  </>
                )}
              </Pressable>
            )}
          </>
        )}
      </View>
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Main screen                                                       */
/* ------------------------------------------------------------------ */

export function DoctorDetailScreen({ doctorId }: DoctorDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { doctor, isLoading } = useDoctorDetail(doctorId);

  if (isLoading) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={[styles.backRow, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backIconBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={figmaColors.textPrimary} />
          </Pressable>
        </View>
        <LoadingSkeleton />
      </ScrollView>
    );
  }

  if (!doctor) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={[styles.backRow, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backIconBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={figmaColors.textPrimary} />
          </Pressable>
        </View>
        <GlassCard style={styles.card}>
          <View style={styles.cardContent}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={40}
              color={figmaColors.error}
              style={{ alignSelf: 'center' }}
            />
            <Text style={{ textAlign: 'center', color: figmaColors.textSecondary }}>
              Không tải được thông tin bác sĩ.
            </Text>
          </View>
        </GlassCard>
      </ScrollView>
    );
  }

  const initials = doctor.name.split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase();

  return (
    <ScreenContainer contentStyle={styles.content}>
      {/* ---- Gradient header ---- */}
      <FadeInView delay={0 * STAGGER_DELAY} duration={450} distance={24}>
        <LinearGradient
          colors={[figmaColors.primary, figmaColors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientHeader, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.headerBar}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={styles.headerBackBtn}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>Chi tiết bác sĩ</Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text style={styles.heroName}>{doctor.name}</Text>
          <Text style={styles.heroSpecialty}>
            {doctor.specialty.name}
            {doctor.clinic ? ` \u2022 ${doctor.clinic.name}` : ''}
          </Text>

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <MaterialCommunityIcons name="briefcase-outline" size={16} color="#fff" />
              <Text style={styles.badgeText}>
                {doctor.experienceYears} năm kinh nghiệm
              </Text>
            </View>
            <View style={styles.badge}>
              <MaterialCommunityIcons name="cash" size={16} color="#fff" />
              <Text style={styles.badgeText}>
                Phí khám {doctor.consultationFee.toLocaleString('vi-VN')}đ
              </Text>
            </View>
          </View>
        </LinearGradient>
      </FadeInView>

      {/* ---- About ---- */}
      <FadeInView delay={1 * STAGGER_DELAY} duration={450} distance={24}>
        <GlassCard style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons
                name="information-outline"
                size={20}
                color={figmaColors.primary}
              />
              <Text style={styles.sectionTitle}>Giới thiệu</Text>
            </View>
            <Text style={styles.bodyText}>
              {doctor.bio || 'Hồ sơ đang được cập nhật.'}
            </Text>
          </View>
        </GlassCard>
      </FadeInView>

      {/* ---- Reviews ---- */}
      <FadeInView delay={2 * STAGGER_DELAY} duration={450} distance={24}>
        <ReviewsSection doctorId={doctorId} />
      </FadeInView>

      {/* ---- Services ---- */}
      {doctor.doctorServices && doctor.doctorServices.length > 0 && (
        <FadeInView delay={3 * STAGGER_DELAY} duration={450} distance={24}>
          <GlassCard style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons
                  name="medical-bag"
                  size={20}
                  color={figmaColors.primary}
                />
                <Text style={styles.sectionTitle}>Dịch vụ</Text>
              </View>
              {doctor.doctorServices.map((service) => (
                <View key={service.id} style={styles.serviceRow}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <View style={styles.priceTag}>
                    <Text style={styles.priceText}>
                      {service.price.toLocaleString('vi-VN')}đ
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </GlassCard>
        </FadeInView>
      )}

      {/* ---- Book button ---- */}
      <FadeInView delay={4 * STAGGER_DELAY} duration={450} distance={24}>
        <Pressable
          onPress={() => router.push('/booking')}
          style={({ pressed }) => [
            styles.bookButton,
            pressed && styles.bookButtonPressed,
          ]}
        >
          <MaterialCommunityIcons name="calendar-check" size={20} color="#fff" />
          <Text style={styles.bookButtonLabel}>Đặt lịch với chuyên khoa này</Text>
        </Pressable>
      </FadeInView>
    </ScreenContainer>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: figmaColors.background,
  },
  content: {
    paddingBottom: 40,
    gap: figmaSpacing.lg,
  },

  /* Back row (loading/error) */
  backRow: {
    paddingHorizontal: figmaSpacing.lg,
    paddingBottom: figmaSpacing.md,
  },
  backIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: figmaColors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Gradient header */
  gradientHeader: {
    paddingBottom: figmaSpacing['2xl'] + 4,
    paddingHorizontal: figmaSpacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
    gap: figmaSpacing.sm,
  },
  headerBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: figmaSpacing.md,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.bold,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: figmaSpacing.xs,
  },
  avatarText: {
    fontSize: figmaFonts.sizes['3xl'],
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.primary,
  },
  heroName: {
    fontSize: figmaFonts.sizes['2xl'],
    fontWeight: figmaFonts.weights.bold,
    color: '#fff',
    textAlign: 'center',
  },
  heroSpecialty: {
    fontSize: figmaFonts.sizes.md,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: figmaSpacing.md,
    marginTop: figmaSpacing.xs,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: figmaSpacing.md,
    paddingVertical: 6,
    borderRadius: figmaRadius.md,
  },
  badgeText: {
    color: '#fff',
    fontSize: figmaFonts.sizes.base,
    fontWeight: figmaFonts.weights.semibold,
  },

  /* Cards */
  card: {
    marginHorizontal: figmaSpacing.lg,
  },
  cardContent: {
    gap: figmaSpacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.sm,
  },
  sectionTitle: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textPrimary,
  },
  bodyText: {
    color: figmaColors.textSecondary,
    fontSize: figmaFonts.sizes.md,
    lineHeight: 22,
  },

  /* Services */
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: figmaSpacing.md,
  },
  serviceName: {
    flex: 1,
    fontSize: figmaFonts.sizes.md,
    color: figmaColors.textPrimary,
  },
  priceTag: {
    backgroundColor: figmaColors.pastelBlue,
    paddingHorizontal: figmaSpacing.md,
    paddingVertical: figmaSpacing.xs,
    borderRadius: figmaRadius.md,
  },
  priceText: {
    color: figmaColors.primary,
    fontWeight: figmaFonts.weights.bold,
    fontSize: figmaFonts.sizes.base,
  },

  /* Book button */
  bookButton: {
    marginHorizontal: figmaSpacing.lg,
    backgroundColor: figmaColors.primary,
    borderRadius: figmaRadius.lg,
    paddingVertical: figmaSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: figmaSpacing.sm,
  },
  bookButtonPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: figmaColors.primaryDark,
  },
  bookButtonLabel: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.bold,
    color: '#fff',
    letterSpacing: 0.3,
  },

  /* Reviews */
  reviewsLoading: {
    paddingVertical: figmaSpacing['2xl'],
    alignItems: 'center',
  },
  reviewsEmpty: {
    paddingVertical: figmaSpacing['2xl'],
    alignItems: 'center',
    gap: figmaSpacing.xs,
  },
  reviewsEmptyText: {
    color: figmaColors.textSecondary,
    fontSize: figmaFonts.sizes.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: figmaSpacing.lg,
    alignItems: 'center',
  },
  summaryLeft: {
    alignItems: 'center',
    minWidth: 96,
    gap: figmaSpacing.xs,
  },
  summaryAvg: {
    fontSize: figmaFonts.sizes['4xl'] + 10,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textPrimary,
    lineHeight: 44,
  },
  summaryLabel: {
    fontSize: figmaFonts.sizes.xs,
    color: figmaColors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  summaryTotal: {
    fontSize: figmaFonts.sizes.xs,
    color: figmaColors.textSecondary,
    marginTop: figmaSpacing.xs,
  },
  summaryBars: {
    flex: 1,
    gap: figmaSpacing.xs + 2,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.sm,
  },
  barStarLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    width: 22,
  },
  barStarText: {
    fontSize: figmaFonts.sizes.sm,
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: figmaColors.border,
  },
  barFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: figmaColors.warning,
  },
  barCount: {
    fontSize: figmaFonts.sizes.xs,
    color: figmaColors.textSecondary,
    width: 22,
    textAlign: 'right',
  },
  reviewsDivider: {
    height: 1,
    backgroundColor: figmaColors.border,
    marginVertical: figmaSpacing.md,
  },
  reviewsList: {
    gap: figmaSpacing.lg,
  },
  reviewRow: {
    flexDirection: 'row',
    gap: figmaSpacing.md,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: figmaColors.pastelBlue,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  reviewAvatarImg: {
    width: 40,
    height: 40,
  },
  reviewAvatarInitial: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.primary,
  },
  reviewBody: {
    flex: 1,
    gap: figmaSpacing.xs,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewName: {
    fontSize: figmaFonts.sizes.md,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textPrimary,
    flex: 1,
  },
  reviewDate: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  reviewComment: {
    fontSize: figmaFonts.sizes.md,
    color: figmaColors.textSecondary,
    lineHeight: 20,
    marginTop: 2,
  },
  loadMore: {
    marginTop: figmaSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: figmaSpacing.xs,
    paddingVertical: figmaSpacing.md,
    borderRadius: figmaRadius.md,
    backgroundColor: figmaColors.pastelBlue,
  },
  loadMorePressed: {
    transform: [{ scale: 0.97 }],
  },
  loadMoreText: {
    color: figmaColors.primary,
    fontSize: figmaFonts.sizes.md,
    fontWeight: figmaFonts.weights.semibold,
  },

  /* Skeleton */
  skeletonContainer: {
    padding: figmaSpacing.xl,
    gap: figmaSpacing.xl,
  },
  skeletonHeader: {
    gap: figmaSpacing.xs,
    alignItems: 'center',
    paddingVertical: figmaSpacing.lg,
  },
  skeletonCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: figmaRadius.xl,
    borderWidth: 1,
    borderColor: figmaColors.border,
    padding: figmaSpacing.lg,
  },
});
