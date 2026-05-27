import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { figmaColors, figmaRadius, figmaSpacing } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  EmptyState,
  FadeInView,
  GradientHeader,
  ScreenContainer,
} from '../../components/shared';
import { api, extractData, extractPaginatedData } from '../../services/api';
import type { Appointment, Review } from '../../types';

const HEADER_COLORS = [figmaColors.info, '#00695C'] as const;

type StarFilter = 'ALL' | 1 | 2 | 3 | 4 | 5;

const FILTERS: { key: StarFilter; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 5, label: '5★' },
  { key: 4, label: '4★' },
  { key: 3, label: '3★' },
  { key: 2, label: '2★' },
  { key: 1, label: '1★' },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${d.getFullYear()}`;
}

export function DoctorReviewsScreen() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<StarFilter>('ALL');

  const fetchReviews = useCallback(async () => {
    try {
      // Get own doctorId from a CONFIRMED/COMPLETED appointment (not PENDING)
      const apptsRes = await api.get('/appointments/me', {
        params: { limit: 50 },
      });
      const { data: appts } = extractPaginatedData<Appointment[]>(apptsRes);
      const ownAppt = appts.find((a) => a.status !== 'PENDING');
      const doctorId = ownAppt?.doctorId;
      if (!doctorId) {
        setReviews([]);
        return;
      }
      const reviewsRes = await api.get(`/doctors/${doctorId}/reviews`, {
        params: { limit: 100 },
      });
      // API may return { data: [...] } or { data: { items: [...] } }
      const raw = extractData<Review[] | { items: Review[] }>(reviewsRes);
      if (Array.isArray(raw)) {
        setReviews(raw);
      } else if (raw && Array.isArray((raw as { items: Review[] }).items)) {
        setReviews((raw as { items: Review[] }).items);
      } else {
        setReviews([]);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReviews();
    setRefreshing(false);
  }, [fetchReviews]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg =
      total === 0
        ? 0
        : reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / total;
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) {
      const k = Math.round(r.rating);
      if (k >= 1 && k <= 5) dist[k] += 1;
    }
    return { total, avg, dist };
  }, [reviews]);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return reviews;
    return reviews.filter((r) => Math.round(r.rating) === filter);
  }, [reviews, filter]);

  const renderReview = ({ item, index }: { item: Review; index: number }) => {
    const name = item.patient?.name ?? 'Bệnh nhân';
    return (
      <FadeInView delay={index * 50}>
        <GlassCard style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewAvatar}>
              <Text style={styles.reviewAvatarText}>{getInitials(name)}</Text>
            </View>
            <View style={styles.reviewInfo}>
              <Text style={styles.reviewName} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
            </View>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <MaterialCommunityIcons
                  key={s}
                  name={s <= item.rating ? 'star' : 'star-outline'}
                  size={16}
                  color={figmaColors.warning}
                />
              ))}
            </View>
          </View>
          {item.comment ? <Text style={styles.reviewComment}>{item.comment}</Text> : null}
        </GlassCard>
      </FadeInView>
    );
  };

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      <GradientHeader
        title="Đánh giá của tôi"
        subtitle={`${stats.total} đánh giá`}
        colors={HEADER_COLORS}
      />

      {/* Stats Card */}
      <View style={styles.statsWrap}>
        <FadeInView delay={100}>
          <GlassCard style={styles.statsCard}>
            <View style={styles.statsTopRow}>
              <View style={styles.avgWrap}>
                <Text style={styles.avgValue}>{stats.avg.toFixed(1)}</Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <MaterialCommunityIcons
                      key={s}
                      name={s <= Math.round(stats.avg) ? 'star' : 'star-outline'}
                      size={18}
                      color={figmaColors.warning}
                    />
                  ))}
                </View>
                <Text style={styles.avgLabel}>{stats.total} đánh giá</Text>
              </View>
              <View style={styles.distWrap}>
                {[5, 4, 3, 2, 1].map((s) => {
                  const count = stats.dist[s] ?? 0;
                  const pct = stats.total === 0 ? 0 : (count / stats.total) * 100;
                  return (
                    <View key={s} style={styles.distRow}>
                      <Text style={styles.distLabel}>{s}★</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${pct}%`, backgroundColor: figmaColors.warning },
                          ]}
                        />
                      </View>
                      <Text style={styles.distCount}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </GlassCard>
        </FadeInView>
      </View>

      {/* Filter Chips */}
      <FadeInView delay={150}>
        <View style={styles.chipsRow}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={String(f.key)}
                onPress={() => setFilter(f.key)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </FadeInView>

      {loading ? (
        <View style={styles.loadingWrap}>
          <LottieView
            source={require('../../assets/animations/loading.json')}
            autoPlay
            loop
            style={{ width: 100, height: 100 }}
          />
        </View>
      ) : filtered.length === 0 ? (
        <FadeInView delay={200}>
          <EmptyState icon="star-outline" title="Chưa có đánh giá nào" />
        </FadeInView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderReview}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statsWrap: {
    marginHorizontal: figmaSpacing.lg,
    marginTop: figmaSpacing.lg,
  },
  statsCard: {
    borderRadius: figmaRadius.lg,
    padding: figmaSpacing.lg,
  },
  statsTopRow: {
    flexDirection: 'row',
    gap: figmaSpacing.lg,
  },
  avgWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: figmaSpacing.lg,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: figmaColors.border,
    minWidth: 110,
  },
  avgValue: {
    fontSize: 40,
    fontWeight: '700',
    color: figmaColors.textPrimary,
    lineHeight: 44,
  },
  avgLabel: {
    fontSize: 12,
    color: figmaColors.textSecondary,
    marginTop: 4,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  distWrap: {
    flex: 1,
    gap: figmaSpacing.xs,
    justifyContent: 'center',
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.sm,
  },
  distLabel: {
    fontSize: 12,
    color: figmaColors.textSecondary,
    width: 22,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: figmaColors.surfaceMuted,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  distCount: {
    fontSize: 12,
    color: figmaColors.textSecondary,
    width: 22,
    textAlign: 'right',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: figmaSpacing.sm,
    paddingHorizontal: figmaSpacing.lg,
    marginTop: figmaSpacing.lg,
    marginBottom: figmaSpacing.md,
  },
  chip: {
    paddingHorizontal: figmaSpacing.md,
    paddingVertical: figmaSpacing.xs + 2,
    borderRadius: figmaRadius.pill,
    backgroundColor: figmaColors.surfaceMuted,
  },
  chipActive: {
    backgroundColor: figmaColors.info,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: figmaColors.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: figmaSpacing.lg,
    gap: figmaSpacing.sm + 2,
  },
  reviewCard: {
    borderRadius: figmaRadius.lg,
    padding: figmaSpacing.md + 2,
    marginBottom: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.md,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: figmaColors.infoBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: figmaColors.info,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: figmaColors.textPrimary,
  },
  reviewDate: {
    fontSize: 12,
    color: figmaColors.textMuted,
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 13,
    color: figmaColors.textSecondary,
    marginTop: figmaSpacing.sm,
    lineHeight: 19,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: figmaSpacing['3xl'],
  },
});
