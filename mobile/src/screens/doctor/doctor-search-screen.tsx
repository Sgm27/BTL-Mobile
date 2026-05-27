import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  DoctorCard,
  EmptyState,
  FadeInView,
  GradientHeader,
  SearchBar,
  SkeletonCard,
} from '../../components/shared';
import { GlassCard } from '../../components/ui/GlassCard';
import { ScreenBackground } from '../../components/ui/ScreenBackground';
import {
  figmaColors,
  figmaFonts,
  figmaRadius,
  figmaSpacing,
} from '../../constants/theme';
import { getDoctors } from '../../services/doctors.service';
import { getSpecialties } from '../../services/specialties.service';
import type { Doctor, Specialty } from '../../types';

type SortKey = 'rating' | 'fee' | 'experience';

interface FilterState {
  specialtyId: string | null;
  minRating: number; // 0 = any
  sort: SortKey;
}

const SORT_LABELS: Record<SortKey, string> = {
  rating: 'Đánh giá cao',
  fee: 'Phí thấp',
  experience: 'Kinh nghiệm',
};

const SORT_ICONS: Record<SortKey, keyof typeof MaterialCommunityIcons.glyphMap> = {
  rating: 'star',
  fee: 'cash',
  experience: 'briefcase',
};

const DEFAULT_FILTERS: FilterState = {
  specialtyId: null,
  minRating: 0,
  sort: 'rating',
};

export function DoctorSearchScreen() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Load specialties once
  useEffect(() => {
    void (async () => {
      try {
        const list = await getSpecialties();
        setSpecialties(list);
      } catch {
        // ignore
      }
    })();
  }, []);

  const loadDoctors = useCallback(
    async (opts?: { refresh?: boolean }) => {
      if (opts?.refresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      try {
        const result = await getDoctors({
          q: debounced.trim() || undefined,
          specialtyId: filters.specialtyId ?? undefined,
          limit: 30,
        });
        setDoctors(result.data);
      } catch {
        setDoctors([]);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [debounced, filters.specialtyId]
  );

  useEffect(() => {
    void loadDoctors();
  }, [loadDoctors]);

  // Apply client-side rating filter + sort
  const visibleDoctors = useMemo(() => {
    let list = doctors.slice();
    if (filters.minRating > 0) {
      list = list.filter((d) => (d.averageRating ?? 0) >= filters.minRating);
    }
    list.sort((a, b) => {
      if (filters.sort === 'rating') {
        return (b.averageRating ?? 0) - (a.averageRating ?? 0);
      }
      if (filters.sort === 'fee') {
        return (a.consultationFee ?? 0) - (b.consultationFee ?? 0);
      }
      return (b.experienceYears ?? 0) - (a.experienceYears ?? 0);
    });
    return list;
  }, [doctors, filters.minRating, filters.sort]);

  const activeFilterCount =
    (filters.specialtyId ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.sort !== 'rating' ? 1 : 0);

  const hasAnyFilter =
    filters.specialtyId !== null ||
    filters.minRating > 0 ||
    filters.sort !== 'rating';

  return (
    <ScreenBackground>
      <GradientHeader
        title="Tìm bác sĩ"
        leftSlot={
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={12}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </Pressable>
        }
      >
        <View style={styles.searchBarWrap}>
          <SearchBar
            placeholder="Tên bác sĩ, chuyên khoa..."
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </GradientHeader>

      {/* Filter chips row */}
      <View style={styles.chipsRow}>
        <FilterChip
          label="Tất cả"
          icon="filter-variant"
          active={!hasAnyFilter}
          onPress={() => setFilters(DEFAULT_FILTERS)}
        />
        <FilterChip
          label={
            filters.specialtyId
              ? specialties.find((s) => s.id === filters.specialtyId)?.name ??
                'Chuyên khoa'
              : 'Chuyên khoa'
          }
          icon="medical-bag"
          active={!!filters.specialtyId}
          onPress={() => setShowFilters((v) => !v)}
        />
        <FilterChip
          label={filters.minRating > 0 ? `${filters.minRating}+` : 'Đánh giá'}
          icon="star"
          active={filters.minRating > 0}
          onPress={() => setShowFilters((v) => !v)}
        />
        <FilterChip
          label={
            filters.sort !== 'rating' ? SORT_LABELS[filters.sort] : 'Sắp xếp'
          }
          icon={SORT_ICONS[filters.sort]}
          active={filters.sort !== 'rating'}
          onPress={() => setShowFilters((v) => !v)}
        />
      </View>

      {/* Filter sheet */}
      {showFilters && (
        <FadeInView distance={12} duration={260}>
          <View style={styles.sheetWrap}>
            <GlassCard style={styles.sheetCard}>
              <Text style={styles.sheetTitle}>Lọc và sắp xếp</Text>

              <Text style={styles.sheetSectionTitle}>Chuyên khoa</Text>
              <View style={styles.sheetWrapRow}>
                <SheetChip
                  label="Tất cả"
                  active={filters.specialtyId === null}
                  onPress={() =>
                    setFilters((f) => ({ ...f, specialtyId: null }))
                  }
                />
                {specialties.map((s) => (
                  <SheetChip
                    key={s.id}
                    label={s.name}
                    active={filters.specialtyId === s.id}
                    onPress={() =>
                      setFilters((f) => ({ ...f, specialtyId: s.id }))
                    }
                  />
                ))}
              </View>

              <Text style={styles.sheetSectionTitle}>Đánh giá</Text>
              <View style={styles.sheetWrapRow}>
                {[0, 3, 4, 4.5].map((r) => (
                  <SheetChip
                    key={r}
                    label={r === 0 ? 'Tất cả' : `${r}+`}
                    active={filters.minRating === r}
                    onPress={() => setFilters((f) => ({ ...f, minRating: r }))}
                    icon={r > 0 ? 'star' : undefined}
                  />
                ))}
              </View>

              <Text style={styles.sheetSectionTitle}>Sắp xếp</Text>
              <View style={styles.sheetWrapRow}>
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <SheetChip
                    key={key}
                    label={SORT_LABELS[key]}
                    active={filters.sort === key}
                    onPress={() => setFilters((f) => ({ ...f, sort: key }))}
                    icon={SORT_ICONS[key]}
                  />
                ))}
              </View>

              <View style={styles.sheetActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.resetBtn,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={() => setFilters(DEFAULT_FILTERS)}
                >
                  <Text style={styles.resetBtnText}>Đặt lại</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.applyBtn,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={() => setShowFilters(false)}
                >
                  <Text style={styles.applyBtnText}>Áp dụng</Text>
                </Pressable>
              </View>
            </GlassCard>
          </View>
        </FadeInView>
      )}

      <FlatList
        data={visibleDoctors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDoctors({ refresh: true })}
          />
        }
        renderItem={({ item, index }) => (
          <FadeInView delay={index * 60} distance={20} duration={380}>
            <DoctorCard
              name={item.name}
              specialty={
                item.specialty?.name +
                (item.clinic ? ` • ${item.clinic.name}` : '')
              }
              rating={item.averageRating}
              totalReviews={item.totalReviews}
              onPress={() =>
                router.push({ pathname: '/doctor-view', params: { id: item.id } })
              }
            />
          </FadeInView>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletonWrap}>
              <SkeletonCard rows={4} />
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <EmptyState
                icon="doctor"
                title="Không tìm thấy bác sĩ phù hợp"
              />
            </View>
          )
        }
      />
      {activeFilterCount > 0 && !showFilters ? null : null}
    </ScreenBackground>
  );
}

/* ----------------- Sub-components ----------------- */

function FilterChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.94,
          useNativeDriver: true,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }).start()
      }
    >
      <Animated.View
        style={[
          styles.chip,
          active && styles.chipActive,
          { transform: [{ scale }] },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={14}
          color={active ? '#fff' : figmaColors.primary}
        />
        <Text style={[styles.chipText, active && styles.chipTextActive]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function SheetChip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.sheetChip, active && styles.sheetChipActive]}
    >
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={13}
          color={active ? '#fff' : figmaColors.primary}
        />
      ) : null}
      <Text
        style={[
          styles.sheetChipText,
          active && styles.sheetChipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ----------------- Styles ----------------- */

const styles = StyleSheet.create({
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarWrap: {
    marginTop: figmaSpacing.lg,
  },

  /* Chips */
  chipsRow: {
    flexDirection: 'row',
    gap: figmaSpacing.sm,
    paddingHorizontal: figmaSpacing.lg,
    paddingTop: figmaSpacing.md,
    paddingBottom: figmaSpacing.xs,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: figmaSpacing.md,
    paddingVertical: 7,
    borderRadius: figmaRadius.pill,
    backgroundColor: figmaColors.pastelBlue,
  },
  chipActive: {
    backgroundColor: figmaColors.primary,
  },
  chipText: {
    fontSize: figmaFonts.sizes.base,
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.primary,
  },
  chipTextActive: {
    color: '#fff',
  },

  /* Sheet */
  sheetWrap: {
    paddingHorizontal: figmaSpacing.lg,
    paddingTop: figmaSpacing.sm,
    paddingBottom: figmaSpacing.sm,
  },
  sheetCard: {
    padding: figmaSpacing.lg,
  },
  sheetTitle: {
    fontSize: figmaFonts.sizes.xl,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textPrimary,
    marginBottom: figmaSpacing.sm,
  },
  sheetSectionTitle: {
    fontSize: figmaFonts.sizes.sm,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: figmaSpacing.md,
    marginBottom: figmaSpacing.sm,
  },
  sheetWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: figmaSpacing.sm,
  },
  sheetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: figmaSpacing.md,
    paddingVertical: figmaSpacing.sm,
    borderRadius: figmaRadius.md,
    backgroundColor: figmaColors.surfaceMuted,
  },
  sheetChipActive: {
    backgroundColor: figmaColors.primary,
  },
  sheetChipText: {
    fontSize: figmaFonts.sizes.base,
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.textPrimary,
  },
  sheetChipTextActive: {
    color: '#fff',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: figmaSpacing.md,
    marginTop: figmaSpacing.lg,
  },
  resetBtn: {
    flex: 1,
    backgroundColor: figmaColors.surfaceMuted,
    borderRadius: figmaRadius.md,
    paddingVertical: figmaSpacing.md,
    alignItems: 'center',
  },
  resetBtnText: {
    color: figmaColors.textPrimary,
    fontSize: figmaFonts.sizes.md,
    fontWeight: figmaFonts.weights.bold,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: figmaColors.primary,
    borderRadius: figmaRadius.md,
    paddingVertical: figmaSpacing.md,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: figmaFonts.sizes.md,
    fontWeight: figmaFonts.weights.bold,
  },
  btnPressed: {
    transform: [{ scale: 0.97 }],
  },

  /* List */
  listContent: {
    paddingHorizontal: figmaSpacing.lg,
    paddingTop: figmaSpacing.md,
    paddingBottom: 120,
    gap: figmaSpacing.md,
  },
  skeletonWrap: {
    paddingTop: figmaSpacing.md,
    gap: figmaSpacing.md,
  },
  emptyWrap: {
    paddingTop: figmaSpacing['3xl'],
  },
});
