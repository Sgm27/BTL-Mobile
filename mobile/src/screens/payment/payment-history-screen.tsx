import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard } from '../../components/ui/GlassCard';
import { ScreenBackground } from '../../components/ui/ScreenBackground';
import {
  EmptyState,
  FadeInView,
  GradientHeader,
} from '../../components/shared';
import {
  figmaColors,
  figmaFonts,
  figmaRadius,
  figmaShadows,
  figmaSpacing,
} from '../../constants/theme';
import {
  getPaymentHistory,
  type PaymentWithDetails,
} from '../../services/payment.service';
import { formatVND, formatShortDate } from '../../utils/format';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HISTORY_GRADIENT = [figmaColors.primary, figmaColors.primaryDark] as const;
const PAGE_SIZE = 5;

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

interface StatusMeta {
  label: string;
  color: string;
  background: string;
  icon: IconName;
}

const STATUS_MAP: Record<PaymentStatus, StatusMeta> = {
  PENDING: {
    label: 'Chờ thanh toán',
    color: '#B8860B',
    background: figmaColors.warningBg,
    icon: 'clock-outline',
  },
  PAID: {
    label: 'Đã thanh toán',
    color: figmaColors.success,
    background: figmaColors.successBg,
    icon: 'check-circle',
  },
  FAILED: {
    label: 'Thất bại',
    color: figmaColors.error,
    background: figmaColors.errorBg,
    icon: 'close-circle',
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    color: '#6A1B9A',
    background: figmaColors.pastelPurple,
    icon: 'backup-restore',
  },
};

const METHOD_META: Record<string, { label: string; icon: IconName }> = {
  CASH: { label: 'Tiền mặt', icon: 'cash' },
  VNPAY: { label: 'VNPAY', icon: 'credit-card-outline' },
  MOMO: { label: 'Momo', icon: 'wallet-outline' },
};

type FilterKey = 'ALL' | 'PAID' | 'PENDING';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PAID', label: 'Đã thanh toán' },
  { key: 'PENDING', label: 'Chờ thanh toán' },
];

// ---------------------------------------------------------------------------
// Payment row
// ---------------------------------------------------------------------------

function PaymentRow({ item, index }: { item: PaymentWithDetails; index: number }) {
  const statusKey = (STATUS_MAP[item.status as PaymentStatus]
    ? (item.status as PaymentStatus)
    : 'PENDING') as PaymentStatus;
  const status = STATUS_MAP[statusKey];
  const method = METHOD_META[item.method] ?? { label: item.method, icon: 'cash' as IconName };

  const timeSlot = item.appointment.timeSlot;
  const doctor = item.appointment.doctor;

  return (
    <FadeInView delay={Math.min(index * 60, 240)}>
      <GlassCard style={styles.paymentCard} glassStyle="regular">
        <View style={styles.cardInner}>
          {/* Header: doctor + status */}
          <View style={styles.cardHeader}>
            <View style={styles.doctorInfo}>
              <View style={styles.doctorIconWrap}>
                <MaterialCommunityIcons
                  name="doctor"
                  size={18}
                  color={figmaColors.primary}
                />
              </View>
              <View style={styles.doctorTextWrap}>
                <Text style={styles.doctorName} numberOfLines={1}>
                  {doctor.name}
                </Text>
                <Text style={styles.specialtyText} numberOfLines={1}>
                  {doctor.specialty.name}
                </Text>
              </View>
            </View>
            <View
              style={[styles.statusChip, { backgroundColor: status.background }]}
            >
              <MaterialCommunityIcons
                name={status.icon}
                size={14}
                color={status.color}
              />
              <Text style={[styles.statusLabel, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          </View>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name="calendar"
                size={14}
                color={figmaColors.textSecondary}
              />
              <Text style={styles.metaText}>{formatShortDate(timeSlot.date)}</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={14}
                color={figmaColors.textSecondary}
              />
              <Text style={styles.metaText}>{timeSlot.startTime}</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons
                name={method.icon}
                size={14}
                color={figmaColors.textSecondary}
              />
              <Text style={styles.metaText}>{method.label}</Text>
            </View>
          </View>

          {/* Footer: amount */}
          <View style={styles.cardFooter}>
            <Text style={styles.amountLabel}>Tổng tiền</Text>
            <Text style={styles.amount}>{formatVND(item.amount)}</Text>
          </View>
        </View>
      </GlassCard>
    </FadeInView>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function PaymentHistoryScreen() {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPayments = useCallback(async () => {
    try {
      const data = await getPaymentHistory();
      setPayments(data);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setVisibleCount(PAGE_SIZE);
    void loadPayments();
  }, [loadPayments]);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return payments;
    return payments.filter((p) => p.status === filter);
  }, [payments, filter]);

  const visible = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  const canLoadMore = visibleCount < filtered.length;

  const handleLoadMore = useCallback(() => {
    if (!canLoadMore || loadingMore) return;
    setLoadingMore(true);
    // small UX delay for feedback
    setTimeout(() => {
      setVisibleCount((prev) => prev + PAGE_SIZE);
      setLoadingMore(false);
    }, 200);
  }, [canLoadMore, loadingMore]);

  const handleFilterChange = useCallback((key: FilterKey) => {
    setFilter(key);
    setVisibleCount(PAGE_SIZE);
  }, []);

  return (
    <ScreenBackground>
      <View style={styles.root}>
        <GradientHeader
          title="Lịch sử thanh toán"
          subtitle={`${payments.length} giao dịch`}
          colors={HISTORY_GRADIENT}
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

        {/* Filter chips */}
        <View style={styles.filterBar}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => handleFilterChange(f.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipLabel,
                    active && styles.filterChipLabelActive,
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={figmaColors.primary}
            />
          }
        >
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={figmaColors.primary} size="large" />
            </View>
          ) : visible.length === 0 ? (
            <EmptyState
              icon="receipt"
              title="Chưa có giao dịch nào"
              message="Lịch sử thanh toán của bạn sẽ hiển thị tại đây."
            />
          ) : (
            <>
              {visible.map((item, idx) => (
                <PaymentRow key={item.id} item={item} index={idx} />
              ))}

              {canLoadMore ? (
                <Pressable
                  onPress={handleLoadMore}
                  disabled={loadingMore}
                  style={styles.loadMoreBtn}
                >
                  {loadingMore ? (
                    <ActivityIndicator color={figmaColors.primary} size="small" />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="chevron-down"
                        size={18}
                        color={figmaColors.primary}
                      />
                      <Text style={styles.loadMoreLabel}>Tải thêm</Text>
                    </>
                  )}
                </Pressable>
              ) : null}
            </>
          )}
        </ScrollView>
      </View>
    </ScreenBackground>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    gap: figmaSpacing.sm,
    paddingHorizontal: figmaSpacing.lg,
    paddingTop: figmaSpacing.lg,
    paddingBottom: figmaSpacing.sm,
  },
  filterChip: {
    paddingHorizontal: figmaSpacing.lg,
    paddingVertical: figmaSpacing.sm,
    borderRadius: figmaRadius.pill,
    backgroundColor: figmaColors.surface,
    borderWidth: 1,
    borderColor: figmaColors.border,
    ...figmaShadows.card,
  },
  filterChipActive: {
    backgroundColor: figmaColors.primary,
    borderColor: figmaColors.primary,
  },
  filterChipLabel: {
    fontSize: figmaFonts.sizes.base,
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.textSecondary,
  },
  filterChipLabelActive: {
    color: '#fff',
  },
  list: {
    paddingHorizontal: figmaSpacing.lg,
    paddingTop: figmaSpacing.sm,
    paddingBottom: figmaSpacing['4xl'],
    gap: figmaSpacing.md,
  },
  loadingWrap: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  paymentCard: {
    ...figmaShadows.card,
  },
  cardInner: {
    gap: figmaSpacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: figmaSpacing.sm,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.sm,
    flex: 1,
  },
  doctorIconWrap: {
    width: 36,
    height: 36,
    borderRadius: figmaRadius.md,
    backgroundColor: figmaColors.pastelBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorTextWrap: {
    flex: 1,
  },
  doctorName: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textPrimary,
  },
  specialtyText: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
    marginTop: 2,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: figmaSpacing.sm,
    paddingVertical: 4,
    borderRadius: figmaRadius.pill,
  },
  statusLabel: {
    fontSize: figmaFonts.sizes.xs,
    fontWeight: figmaFonts.weights.semibold,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: figmaSpacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: figmaColors.border,
    paddingTop: figmaSpacing.sm,
  },
  amountLabel: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
  },
  amount: {
    fontSize: figmaFonts.sizes.xl,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.primary,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: figmaSpacing.xs,
    paddingVertical: figmaSpacing.md,
    borderRadius: figmaRadius.md,
    backgroundColor: figmaColors.surface,
    borderWidth: 1,
    borderColor: figmaColors.border,
    marginTop: figmaSpacing.sm,
  },
  loadMoreLabel: {
    fontSize: figmaFonts.sizes.md,
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.primary,
  },
});
