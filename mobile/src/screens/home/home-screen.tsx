import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth.store';
import { useDoctors } from '../../hooks/use-doctors';
import {
  ScreenContainer,
  FadeInView,
  SectionTitle,
  PromoBanner,
  SpecialtyChip,
  DoctorCard,
  AppointmentCard,
  SearchBar,
  SkeletonCard,
} from '../../components/shared';
import { figmaColors, figmaFonts, figmaSpacing } from '../../constants/theme';
import { api, extractData, extractPaginatedData } from '../../services/api';
import type { Appointment, Specialty } from '../../types';

// ---------------------------------------------------------------------------
// Specialty visual mapping
// ---------------------------------------------------------------------------

interface SpecialtyVisual {
  icon: string;
  bgColor: string;
}

const SPECIALTY_VISUALS: Record<string, SpecialtyVisual> = {
  'Tim mạch': { icon: '🫀', bgColor: figmaColors.pastelRed },
  'Thần kinh': { icon: '🧠', bgColor: figmaColors.pastelTeal },
  'Tiêu hóa': { icon: '🫃', bgColor: figmaColors.pastelOrange },
  'Da liễu': { icon: '🧴', bgColor: figmaColors.pastelPurple },
  'Nhi khoa': { icon: '👶', bgColor: figmaColors.pastelGreen },
  'Mắt': { icon: '👁️', bgColor: figmaColors.pastelOrange },
  'Đa khoa': { icon: '🏥', bgColor: figmaColors.pastelBlue },
};

const DEFAULT_SPECIALTY: SpecialtyVisual = {
  icon: '🏥',
  bgColor: figmaColors.pastelBlue,
};

function getSpecialtyVisual(name: string): SpecialtyVisual {
  return SPECIALTY_VISUALS[name] ?? DEFAULT_SPECIALTY;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(t?: string): string {
  if (!t) return '';
  return t.slice(0, 5);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// HomeScreen
// ---------------------------------------------------------------------------

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { doctors, isLoading: doctorsLoading } = useDoctors('');

  const [upcomingAppointment, setUpcomingAppointment] = useState<Appointment | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHomeData = useCallback(async () => {
    try {
      const [confirmedRes, pendingRes, specialtiesRes] = await Promise.allSettled([
        api.get('/appointments/me', {
          params: { status: 'CONFIRMED', limit: 1, sort: 'date', order: 'asc' },
        }),
        api.get('/appointments/me', {
          params: { status: 'PENDING', limit: 1, sort: 'date', order: 'asc' },
        }),
        api.get('/specialties'),
      ]);

      let upcoming: Appointment | null = null;
      if (confirmedRes.status === 'fulfilled') {
        const { data } = extractPaginatedData<Appointment[]>(confirmedRes.value);
        if (data.length > 0) upcoming = data[0];
      }
      if (!upcoming && pendingRes.status === 'fulfilled') {
        const { data } = extractPaginatedData<Appointment[]>(pendingRes.value);
        if (data.length > 0) upcoming = data[0];
      }
      setUpcomingAppointment(upcoming);

      if (specialtiesRes.status === 'fulfilled') {
        setSpecialties(extractData<Specialty[]>(specialtiesRes.value));
      }
    } catch {
      // Silent — partial data is fine
    }
  }, []);

  useEffect(() => {
    void fetchHomeData();
  }, [fetchHomeData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHomeData();
    setRefreshing(false);
  }, [fetchHomeData]);

  const userName = user?.name ?? 'Bạn';
  const topDoctors = doctors.slice(0, 3);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      {/* Greeting Header */}
      <View style={[styles.header, { paddingTop: insets.top + figmaSpacing.lg + 60, marginTop: -60 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.greetingHi}>Xin chào,</Text>
          <Text style={styles.greetingName}>{userName} 👋</Text>
          <Text style={styles.greetingSub}>Hôm nay bạn cảm thấy thế nào?</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push('/notifications' as never)}
            style={styles.iconBtn}
          >
            <MaterialCommunityIcons name="bell-outline" size={20} color={figmaColors.textPrimary} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/settings' as never)}
            style={styles.iconBtn}
          >
            <MaterialCommunityIcons name="cog-outline" size={20} color={figmaColors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Search Bar */}
      <FadeInView delay={0}>
        <View style={styles.searchWrap}>
          <SearchBar
            placeholder="Tìm bác sĩ, chuyên khoa..."
            onPress={() => router.push('/doctor-search' as never)}
          />
        </View>
      </FadeInView>

      {/* Promo Banner */}
      <FadeInView delay={80}>
        <View style={styles.bannerWrap}>
          <PromoBanner
            title="Khám sức khỏe định kỳ"
            subtitle="Đặt lịch ngay để được ưu đãi 20%"
            ctaLabel="Đặt ngay"
            decorativeIcon="🏥"
            onPress={() => router.push('/booking' as never)}
          />
        </View>
      </FadeInView>

      {/* Specialties */}
      <FadeInView delay={160}>
        <View style={styles.sectionHeader}>
          <SectionTitle
            title="Chuyên khoa"
            action={{
              label: 'Xem tất cả',
              onPress: () => router.push('/doctor-search' as never),
            }}
          />
        </View>
        <FlatList
          horizontal
          data={specialties}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.specialtiesList}
          renderItem={({ item }) => {
            const visual = getSpecialtyVisual(item.name);
            return (
              <SpecialtyChip
                icon={visual.icon}
                label={item.name}
                bgColor={visual.bgColor}
                onPress={() =>
                  router.push({
                    pathname: '/booking',
                    params: { specialtyId: item.id },
                  } as never)
                }
              />
            );
          }}
        />
      </FadeInView>

      {/* Featured Doctors */}
      <FadeInView delay={240}>
        <View style={styles.sectionHeader}>
          <SectionTitle
            title="Bác sĩ nổi bật"
            action={{
              label: 'Xem tất cả',
              onPress: () => router.push('/doctor-search' as never),
            }}
          />
        </View>
        <View style={styles.doctorsList}>
          {doctorsLoading && topDoctors.length === 0 ? (
            <SkeletonCard rows={3} />
          ) : (
            topDoctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                name={doctor.name}
                specialty={doctor.specialty?.name ?? ''}
                rating={doctor.averageRating ?? 0}
                avatarText={getInitials(doctor.name)}
                onPress={() => {
                  console.log('[home] push doctor-view, id=', doctor.id);
                  router.push(`/doctor-view?id=${doctor.id}`);
                }}
              />
            ))
          )}
        </View>
      </FadeInView>

      {/* Upcoming Appointment */}
      <FadeInView delay={320}>
        <View style={styles.sectionHeader}>
          <SectionTitle
            title="Lịch hẹn sắp tới"
            action={{
              label: 'Xem tất cả',
              onPress: () => router.push('/appointments' as never),
            }}
          />
        </View>
        <View style={styles.appointmentWrap}>
          {upcomingAppointment ? (
            <AppointmentCard
              doctorName={upcomingAppointment.doctor?.name ?? 'Bác sĩ'}
              specialty={upcomingAppointment.doctor?.specialty?.name ?? ''}
              date={formatDate(
                upcomingAppointment.timeSlot?.date ?? upcomingAppointment.createdAt,
              )}
              startTime={formatTime(upcomingAppointment.timeSlot?.startTime)}
              endTime={formatTime(upcomingAppointment.timeSlot?.endTime)}
              status={upcomingAppointment.status}
              avatarText={getInitials(upcomingAppointment.doctor?.name ?? 'BS')}
              onPress={() =>
                router.push(`/appointment-detail?id=${upcomingAppointment.id}`)
              }
            />
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>Bạn chưa có lịch hẹn nào</Text>
              <Pressable
                onPress={() => router.push('/booking' as never)}
                style={({ pressed }) => [styles.emptyBtn, pressed && styles.emptyBtnPressed]}
              >
                <Text style={styles.emptyBtnText}>Đặt lịch ngay</Text>
              </Pressable>
            </View>
          )}
        </View>
      </FadeInView>
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  /* -- Header -- */
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: figmaColors.surface,
    paddingHorizontal: figmaSpacing.xl,
    paddingBottom: figmaSpacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  greetingHi: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.medium,
    color: figmaColors.textSecondary,
  },
  greetingName: {
    fontSize: figmaFonts.sizes['2xl'],
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textPrimary,
    marginTop: 2,
  },
  greetingSub: {
    fontSize: figmaFonts.sizes.base,
    color: figmaColors.textSecondary,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: figmaSpacing.sm,
  },
  iconBtn: {
    width: 37,
    height: 37,
    borderRadius: 18.5,
    backgroundColor: figmaColors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    fontSize: 18,
  },

  /* -- Sections -- */
  searchWrap: {
    paddingHorizontal: figmaSpacing.lg,
    marginTop: figmaSpacing.sm,
  },
  bannerWrap: {
    marginTop: figmaSpacing.xl,
  },
  sectionHeader: {
    marginTop: figmaSpacing['2xl'],
  },

  /* -- Specialties -- */
  specialtiesList: {
    paddingHorizontal: figmaSpacing.lg,
    gap: figmaSpacing.lg,
    paddingBottom: figmaSpacing.xs,
  },

  /* -- Doctors -- */
  doctorsList: {
    paddingHorizontal: figmaSpacing.lg,
    gap: figmaSpacing.md,
  },
  emptyText: {
    fontSize: figmaFonts.sizes.base,
    color: figmaColors.textSecondary,
    textAlign: 'center',
    paddingVertical: figmaSpacing.xl,
  },

  /* -- Appointment -- */
  appointmentWrap: {
    paddingHorizontal: figmaSpacing.lg,
  },
  emptyCard: {
    backgroundColor: figmaColors.surface,
    borderRadius: 16,
    paddingVertical: figmaSpacing['2xl'],
    paddingHorizontal: figmaSpacing.xl,
    alignItems: 'center',
    gap: figmaSpacing.md,
    borderWidth: 1,
    borderColor: figmaColors.border,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: figmaFonts.sizes.md,
    color: figmaColors.textSecondary,
    fontWeight: figmaFonts.weights.medium,
  },
  emptyBtn: {
    backgroundColor: figmaColors.primary,
    paddingHorizontal: figmaSpacing.xl,
    paddingVertical: figmaSpacing.md,
    borderRadius: 10,
    marginTop: figmaSpacing.xs,
  },
  emptyBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: figmaFonts.sizes.md,
    fontWeight: figmaFonts.weights.bold,
  },
});
