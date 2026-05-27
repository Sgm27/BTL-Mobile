import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  EmptyState,
  FadeInView,
  GradientHeader,
  MetricCard,
  ScreenContainer,
  SectionTitle,
} from '../../components/shared';
import { figmaColors, figmaFonts, figmaRadius, figmaSpacing } from '../../constants/theme';
import {
  approveDoctorApi,
  fetchAdminDoctors,
  fetchDashboard,
  rejectDoctorApi,
  type AdminDoctor,
  type DashboardData,
} from '../../services/admin.service';

const HEADER_GRADIENT = ['#5856D6', '#3634A3'] as const;

function formatVnd(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} triệu`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${value}`;
}

export function AdminDashboardScreen() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [pendingDoctors, setPendingDoctors] = useState<AdminDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [dashData, doctors] = await Promise.all([
        fetchDashboard(),
        fetchAdminDoctors('PENDING'),
      ]);
      setDashboard(dashData);
      setPendingDoctors(doctors);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleApprove = useCallback(
    async (doctor: AdminDoctor) => {
      try {
        await approveDoctorApi(doctor.id);
        Alert.alert('Đã duyệt bác sĩ', `BS. ${doctor.user.name}`);
        loadData();
      } catch {
        Alert.alert('Lỗi', 'Không thể duyệt bác sĩ.');
      }
    },
    [loadData],
  );

  const handleReject = useCallback(
    (doctor: AdminDoctor) => {
      Alert.prompt(
        'Lý do từ chối',
        'Nhập lý do...',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Từ chối',
            style: 'destructive',
            onPress: async (reason?: string) => {
              if (!reason?.trim()) {
                Alert.alert('Lỗi', 'Vui lòng nhập lý do từ chối.');
                return;
              }
              try {
                await rejectDoctorApi(doctor.id, reason.trim());
                Alert.alert('Đã từ chối', `BS. ${doctor.user.name}`);
                loadData();
              } catch {
                Alert.alert('Lỗi', 'Không thể từ chối bác sĩ.');
              }
            },
          },
        ],
        'plain-text',
      );
    },
    [loadData],
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={figmaColors.primary} />
      </View>
    );
  }

  const cancelRate = dashboard?.cancelRate ?? 0;
  const cancelColor = cancelRate > 20 ? figmaColors.error : figmaColors.success;

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh} contentStyle={styles.content}>
      <GradientHeader
        title="Trang quản trị"
        subtitle="Tổng quan hệ thống"
        colors={HEADER_GRADIENT}
      />

      {/* Stats */}
      <FadeInView delay={60}>
        <View style={styles.sectionHeader}>
          <SectionTitle title="Thống kê" />
        </View>
        <View style={styles.statsGrid}>
          <MetricCard
            icon="👥"
            value={dashboard?.totalPatients ?? 0}
            label="Bệnh nhân"
            iconBgColor={figmaColors.pastelBlue}
            style={styles.statCard}
          />
          <MetricCard
            icon="🩺"
            value={dashboard?.totalDoctors ?? 0}
            label="Bác sĩ"
            iconBgColor={figmaColors.pastelGreen}
            style={styles.statCard}
          />
        </View>
        <View style={styles.statsGrid}>
          <MetricCard
            icon="📅"
            value={dashboard?.appointmentsThisMonth ?? 0}
            label="Lịch hẹn tháng này"
            iconBgColor={figmaColors.pastelOrange}
            style={styles.statCard}
          />
          <MetricCard
            icon="💰"
            value={formatVnd(dashboard?.revenueThisMonth ?? 0)}
            unit="₫"
            label="Doanh thu tháng này"
            iconBgColor={figmaColors.pastelPurple}
            style={styles.statCard}
          />
        </View>
      </FadeInView>

      {/* Monthly Overview */}
      {dashboard && (
        <FadeInView delay={140}>
          <View style={styles.sectionHeader}>
            <SectionTitle title="Hoạt động tháng" />
          </View>
          <GlassCard style={styles.sectionCard}>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Tỷ lệ hủy</Text>
              <Text style={[styles.overviewValue, { color: cancelColor }]}>
                {cancelRate}%
              </Text>
            </View>
          </GlassCard>
        </FadeInView>
      )}

      {/* Top Doctors */}
      {dashboard && dashboard.topDoctors.length > 0 && (
        <FadeInView delay={200}>
          <View style={styles.sectionHeader}>
            <SectionTitle title="Top bác sĩ" />
          </View>
          <GlassCard style={styles.sectionCard}>
            {dashboard.topDoctors.map((doc, i) => (
              <View
                key={doc.doctorId}
                style={[
                  styles.topDoctorRow,
                  i < dashboard.topDoctors.length - 1 && styles.topDoctorRowBorder,
                ]}
              >
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{i + 1}</Text>
                </View>
                <Text style={styles.topDoctorName} numberOfLines={1}>
                  BS. {doc.name}
                </Text>
                <Text style={styles.topDoctorCount}>{doc.appointmentCount} lịch hẹn</Text>
              </View>
            ))}
          </GlassCard>
        </FadeInView>
      )}

      {/* Pending Doctors */}
      <FadeInView delay={260}>
        <View style={styles.sectionHeader}>
          <SectionTitle title="Bác sĩ chờ duyệt" />
        </View>
        {pendingDoctors.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState icon="check-circle-outline" title="Không có bác sĩ nào chờ duyệt" />
          </View>
        ) : (
          <View style={styles.pendingList}>
            {pendingDoctors.map((doctor) => (
              <GlassCard key={doctor.id} style={styles.doctorCard}>
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>BS. {doctor.user.name}</Text>
                  <Text style={styles.doctorMeta}>{doctor.specialty.name}</Text>
                  {doctor.clinic ? (
                    <Text style={styles.doctorMeta}>{doctor.clinic.name}</Text>
                  ) : null}
                  <Text style={styles.doctorMeta}>{doctor.user.email}</Text>
                  {doctor.licenseNumber ? (
                    <Text style={styles.doctorMeta}>GPHN: {doctor.licenseNumber}</Text>
                  ) : null}
                </View>
                <View style={styles.doctorActions}>
                  <Button
                    mode="contained"
                    onPress={() => handleApprove(doctor)}
                    buttonColor={figmaColors.success}
                    textColor="#fff"
                    compact
                    style={styles.actionBtn}
                  >
                    Duyệt
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => handleReject(doctor)}
                    textColor={figmaColors.error}
                    compact
                    style={[styles.actionBtn, { borderColor: figmaColors.error }]}
                  >
                    Từ chối
                  </Button>
                </View>
              </GlassCard>
            ))}
          </View>
        )}
      </FadeInView>

      {/* Quick Actions */}
      <FadeInView delay={320}>
        <View style={styles.sectionHeader}>
          <SectionTitle title="Thao tác nhanh" />
        </View>
        <View style={styles.quickLinks}>
          <Pressable
            style={styles.quickLink}
            onPress={() => router.push('/admin-clinics')}
          >
            <LinearGradient colors={HEADER_GRADIENT} style={styles.quickLinkGradient}>
              <MaterialCommunityIcons name="hospital-building" size={28} color="#fff" />
              <Text style={styles.quickLinkLabel}>Quản lý phòng khám</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            style={styles.quickLink}
            onPress={() => router.push('/admin-services')}
          >
            <LinearGradient
              colors={[figmaColors.primary, figmaColors.primaryDark]}
              style={styles.quickLinkGradient}
            >
              <MaterialCommunityIcons name="medical-bag" size={28} color="#fff" />
              <Text style={styles.quickLinkLabel}>Quản lý dịch vụ</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </FadeInView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: figmaColors.background,
  },
  sectionHeader: {
    marginTop: figmaSpacing['2xl'],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: figmaSpacing.md,
    paddingHorizontal: figmaSpacing.lg,
    marginBottom: figmaSpacing.md,
  },
  statCard: {
    flex: 1,
  },
  sectionCard: {
    marginHorizontal: figmaSpacing.lg,
    padding: figmaSpacing.lg,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: figmaFonts.sizes.md,
    color: figmaColors.textSecondary,
    fontWeight: figmaFonts.weights.medium,
  },
  overviewValue: {
    fontSize: figmaFonts.sizes.xl,
    fontWeight: figmaFonts.weights.bold,
  },
  topDoctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.md,
    paddingVertical: figmaSpacing.md,
  },
  topDoctorRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: figmaColors.border,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: figmaRadius.pill,
    backgroundColor: figmaColors.pastelPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: figmaFonts.sizes.sm,
    fontWeight: figmaFonts.weights.bold,
    color: '#5856D6',
  },
  topDoctorName: {
    flex: 1,
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.medium,
    color: figmaColors.textPrimary,
  },
  topDoctorCount: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
  },
  emptyWrap: {
    paddingHorizontal: figmaSpacing.lg,
  },
  pendingList: {
    paddingHorizontal: figmaSpacing.lg,
    gap: figmaSpacing.md,
  },
  doctorCard: {
    padding: figmaSpacing.lg,
    gap: figmaSpacing.md,
  },
  doctorInfo: {
    gap: 2,
  },
  doctorName: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.textPrimary,
    marginBottom: 2,
  },
  doctorMeta: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
  },
  doctorActions: {
    flexDirection: 'row',
    gap: figmaSpacing.md,
  },
  actionBtn: {
    flex: 1,
    borderRadius: figmaRadius.md,
  },
  quickLinks: {
    flexDirection: 'row',
    gap: figmaSpacing.md,
    paddingHorizontal: figmaSpacing.lg,
  },
  quickLink: {
    flex: 1,
    borderRadius: figmaRadius.lg,
    overflow: 'hidden',
  },
  quickLinkGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: figmaSpacing['2xl'],
    gap: figmaSpacing.sm,
  },
  quickLinkLabel: {
    color: '#fff',
    fontSize: figmaFonts.sizes.md,
    fontWeight: figmaFonts.weights.semibold,
  },
});
