import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Avatar, Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  EmptyState,
  FadeInView,
  GradientHeader,
  ScreenContainer,
  SearchBar,
} from '../../components/shared';
import {
  figmaColors,
  figmaFonts,
  figmaRadius,
  figmaSpacing,
} from '../../constants/theme';
import {
  approveDoctorApi,
  fetchAdminDoctors,
  rejectDoctorApi,
  type AdminDoctor,
} from '../../services/admin.service';

const HEADER_GRADIENT = ['#5856D6', '#3634A3'] as const;

type StatusFilter = 'ALL' | 'ACTIVE' | 'PENDING' | 'REJECTED';

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'ACTIVE', label: 'Đang hoạt động' },
  { key: 'PENDING', label: 'Chờ duyệt' },
  { key: 'REJECTED', label: 'Từ chối' },
];

function formatVnd(value: number): string {
  return `${value.toLocaleString('vi-VN')}₫`;
}

function statusMeta(status: AdminDoctor['status']) {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Đang hoạt động', color: figmaColors.success, bg: figmaColors.successBg };
    case 'PENDING':
      return { label: 'Chờ duyệt', color: '#B26A00', bg: figmaColors.warningBg };
    case 'REJECTED':
      return { label: 'Từ chối', color: figmaColors.error, bg: figmaColors.errorBg };
  }
}

export function ManageDoctorsScreen() {
  const [doctors, setDoctors] = useState<AdminDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('ALL');

  const loadData = useCallback(async () => {
    try {
      const data = await fetchAdminDoctors();
      setDoctors(data);
    } catch (error) {
      console.error('Failed to load doctors:', error);
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return doctors.filter((d) => {
      if (filter !== 'ALL' && d.status !== filter) return false;
      if (!q) return true;
      return (
        d.user.name.toLowerCase().includes(q) ||
        d.specialty.name.toLowerCase().includes(q) ||
        d.user.email.toLowerCase().includes(q)
      );
    });
  }, [doctors, filter, search]);

  const handleAdd = useCallback(() => {
    Alert.alert(
      'Thêm bác sĩ',
      'Tính năng đang được phát triển. Vui lòng quay lại sau.',
      [{ text: 'Đã hiểu' }],
    );
  }, []);

  const handleApprove = useCallback(
    (doctor: AdminDoctor) => {
      Alert.alert(
        'Duyệt bác sĩ',
        `Xác nhận duyệt hồ sơ BS. ${doctor.user.name}?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Duyệt',
            onPress: async () => {
              try {
                await approveDoctorApi(doctor.id);
                await loadData();
                Alert.alert('Thành công', `Đã duyệt BS. ${doctor.user.name}`);
              } catch {
                Alert.alert('Lỗi', 'Không thể duyệt bác sĩ.');
              }
            },
          },
        ],
      );
    },
    [loadData],
  );

  const handleReject = useCallback(
    (doctor: AdminDoctor) => {
      Alert.prompt(
        'Từ chối bác sĩ',
        `Nhập lý do từ chối BS. ${doctor.user.name}:`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Từ chối',
            style: 'destructive',
            onPress: async (reason?: string) => {
              try {
                await rejectDoctorApi(doctor.id, reason?.trim() || 'Hồ sơ không đạt yêu cầu');
                await loadData();
                Alert.alert('Đã từ chối', `BS. ${doctor.user.name}`);
              } catch {
                Alert.alert('Lỗi', 'Không thể từ chối bác sĩ.');
              }
            },
          },
        ],
        'plain-text',
        '',
        'default',
      );
    },
    [loadData],
  );

  const handleDelete = useCallback(
    (doctor: AdminDoctor) => {
      Alert.alert(
        'Xóa bác sĩ',
        `Bạn có chắc muốn xóa BS. ${doctor.user.name}?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xóa',
            style: 'destructive',
            onPress: () => {
              setDoctors((prev) => prev.filter((d) => d.id !== doctor.id));
              Alert.alert('Đã xóa', `BS. ${doctor.user.name}`);
            },
          },
        ],
      );
    },
    [],
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={figmaColors.primary} />
      </View>
    );
  }

  return (
    <ScreenContainer
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentStyle={styles.content}
    >
      <GradientHeader
        title="Quản lý bác sĩ"
        subtitle={`${filtered.length} bác sĩ`}
        colors={HEADER_GRADIENT}
        leftSlot={
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
          </TouchableOpacity>
        }
        rightSlot={
          <TouchableOpacity
            onPress={handleAdd}
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="plus" size={26} color="#fff" />
          </TouchableOpacity>
        }
      />

      <View style={styles.body}>
        <FadeInView delay={40}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm bác sĩ, chuyên khoa..."
            style={styles.search}
          />
        </FadeInView>

        <FadeInView delay={80}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {FILTERS.map((f) => {
              const active = f.key === filter;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  style={[
                    styles.chip,
                    active && { backgroundColor: HEADER_GRADIENT[0], borderColor: HEADER_GRADIENT[0] },
                  ]}
                >
                  <Text style={[styles.chipText, active && { color: '#fff' }]}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </FadeInView>

        {filtered.length === 0 ? (
          <FadeInView delay={120}>
            <EmptyState
              icon="doctor"
              title="Không có bác sĩ nào"
              message="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
            />
          </FadeInView>
        ) : (
          <View style={styles.list}>
            {filtered.map((doctor, i) => {
              const meta = statusMeta(doctor.status);
              const initials = doctor.user.name
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              return (
                <FadeInView key={doctor.id} delay={120 + i * 40}>
                  <GlassCard style={styles.card}>
                    <View style={styles.cardTop}>
                      <Avatar.Text
                        size={56}
                        label={initials}
                        style={{ backgroundColor: figmaColors.pastelBlue }}
                        labelStyle={styles.avatarLabel}
                      />
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardName} numberOfLines={1}>
                          BS. {doctor.user.name}
                        </Text>
                        <Text style={styles.cardSpec} numberOfLines={1}>
                          {doctor.specialty.name}
                        </Text>
                        <Text style={styles.cardFee}>
                          {formatVnd(doctor.consultationFee)}
                        </Text>
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.statusText, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardActions}>
                      {doctor.status === 'PENDING' ? (
                        <>
                          <Button
                            mode="contained"
                            onPress={() => handleApprove(doctor)}
                            compact
                            style={styles.actionBtn}
                            buttonColor={figmaColors.success}
                            icon="check"
                          >
                            Duyệt
                          </Button>
                          <Button
                            mode="outlined"
                            onPress={() => handleReject(doctor)}
                            compact
                            style={[styles.actionBtn, { borderColor: figmaColors.error }]}
                            textColor={figmaColors.error}
                            icon="close"
                          >
                            Từ chối
                          </Button>
                        </>
                      ) : (
                        <Button
                          mode="outlined"
                          onPress={() => handleDelete(doctor)}
                          compact
                          style={[styles.actionBtn, { borderColor: figmaColors.error }]}
                          textColor={figmaColors.error}
                          icon="trash-can-outline"
                        >
                          Xóa
                        </Button>
                      )}
                    </View>
                  </GlassCard>
                </FadeInView>
              );
            })}
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 120 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: figmaColors.background,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: figmaRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  body: {
    paddingTop: figmaSpacing.lg,
    gap: figmaSpacing.md,
  },
  search: {
    marginHorizontal: figmaSpacing.lg,
  },
  chipsRow: {
    paddingHorizontal: figmaSpacing.lg,
    gap: figmaSpacing.sm,
  },
  chip: {
    paddingHorizontal: figmaSpacing.lg,
    paddingVertical: figmaSpacing.sm,
    borderRadius: figmaRadius.pill,
    backgroundColor: figmaColors.surface,
    borderWidth: 1,
    borderColor: figmaColors.border,
  },
  chipText: {
    fontSize: figmaFonts.sizes.sm,
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.textSecondary,
  },
  list: {
    paddingHorizontal: figmaSpacing.lg,
    gap: figmaSpacing.md,
    marginTop: figmaSpacing.sm,
  },
  card: {
    padding: figmaSpacing.lg,
    gap: figmaSpacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.md,
  },
  avatarLabel: {
    color: '#5856D6',
    fontWeight: figmaFonts.weights.bold,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textPrimary,
  },
  cardSpec: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
  },
  cardFee: {
    fontSize: figmaFonts.sizes.sm,
    fontWeight: figmaFonts.weights.semibold,
    color: HEADER_GRADIENT[0],
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: figmaSpacing.sm,
    paddingVertical: 4,
    borderRadius: figmaRadius.pill,
  },
  statusText: {
    fontSize: figmaFonts.sizes.xs,
    fontWeight: figmaFonts.weights.semibold,
  },
  cardActions: {
    flexDirection: 'row',
    gap: figmaSpacing.md,
  },
  actionBtn: {
    flex: 1,
    borderRadius: figmaRadius.md,
  },
});
