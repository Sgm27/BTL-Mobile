import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Avatar, Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  FadeInView,
  GradientHeader,
  SectionTitle,
} from '../../components/shared';
import { ScreenBackground } from '../../components/ui/ScreenBackground';
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

function formatVnd(value: number): string {
  return `${value.toLocaleString('vi-VN')}₫`;
}

const PLACEHOLDER_DOCS = [
  { id: 'd1', name: 'CCCD mặt trước.jpg', size: '1.2 MB' },
  { id: 'd2', name: 'CCCD mặt sau.jpg', size: '1.1 MB' },
  { id: 'd3', name: 'Chứng chỉ hành nghề.pdf', size: '2.4 MB' },
  { id: 'd4', name: 'Bằng tốt nghiệp.pdf', size: '3.1 MB' },
];

export function ApproveDoctorScreen() {
  const params = useLocalSearchParams<{ doctorId?: string }>();
  const doctorId = params.doctorId ?? '';

  const [doctor, setDoctor] = useState<AdminDoctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const all = await fetchAdminDoctors();
      const found = all.find((d) => d.id === doctorId);
      setDoctor(found ?? null);
    } catch (error) {
      console.error('Failed to load doctor:', error);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = useCallback(() => {
    if (!doctor) return;
    Alert.alert(
      'Duyệt bác sĩ',
      `Xác nhận duyệt BS. ${doctor.user.name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Duyệt',
          onPress: async () => {
            setSubmitting(true);
            try {
              await approveDoctorApi(doctor.id);
              Alert.alert('Đã duyệt', `BS. ${doctor.user.name}`, [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch {
              Alert.alert('Lỗi', 'Không thể duyệt bác sĩ.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  }, [doctor]);

  const handleReject = useCallback(() => {
    if (!doctor) return;
    Alert.prompt(
      'Lý do từ chối',
      'Nhập lý do từ chối...',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: async (reason?: string) => {
            if (!reason?.trim()) {
              Alert.alert('Thiếu thông tin', 'Vui lòng nhập lý do từ chối.');
              return;
            }
            setSubmitting(true);
            try {
              await rejectDoctorApi(doctor.id, reason.trim());
              Alert.alert('Đã từ chối', `BS. ${doctor.user.name}`, [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch {
              Alert.alert('Lỗi', 'Không thể từ chối bác sĩ.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
      'plain-text',
    );
  }, [doctor]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={figmaColors.primary} />
      </View>
    );
  }

  if (!doctor) {
    return (
      <ScreenBackground>
        <GradientHeader
          title="Duyệt tài khoản bác sĩ"
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
        />
        <View style={styles.notFound}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={64}
            color={figmaColors.textMuted}
          />
          <Text style={styles.notFoundText}>Không tìm thấy bác sĩ</Text>
        </View>
      </ScreenBackground>
    );
  }

  const initials = doctor.user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <ScreenBackground>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <GradientHeader
          title="Duyệt tài khoản bác sĩ"
          subtitle={doctor.specialty.name}
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
        />

        <View style={styles.body}>
          {/* Hero card */}
          <FadeInView delay={40}>
            <GlassCard style={styles.heroCard}>
              <Avatar.Text
                size={80}
                label={initials}
                style={{ backgroundColor: figmaColors.pastelBlue }}
                labelStyle={styles.avatarLabel}
              />
              <Text style={styles.heroName}>BS. {doctor.user.name}</Text>
              <Text style={styles.heroEmail}>{doctor.user.email}</Text>
              {doctor.user.phone ? (
                <Text style={styles.heroEmail}>{doctor.user.phone}</Text>
              ) : null}
            </GlassCard>
          </FadeInView>

          {/* Personal info */}
          <FadeInView delay={100}>
            <SectionTitle title="Thông tin cá nhân" />
            <GlassCard style={styles.infoCard}>
              <InfoRow label="Họ tên" value={doctor.user.name} />
              <Divider />
              <InfoRow label="Email" value={doctor.user.email} />
              <Divider />
              <InfoRow label="Số điện thoại" value={doctor.user.phone ?? '—'} />
              <Divider />
              <InfoRow label="Số CCCD" value="—" />
            </GlassCard>
          </FadeInView>

          {/* Credentials */}
          <FadeInView delay={160}>
            <SectionTitle title="Chứng chỉ & kinh nghiệm" />
            <GlassCard style={styles.infoCard}>
              <InfoRow
                label="Số chứng chỉ hành nghề"
                value={doctor.licenseNumber ?? '—'}
              />
              <Divider />
              <InfoRow
                label="Kinh nghiệm"
                value={`${doctor.experienceYears} năm`}
              />
              <Divider />
              <InfoRow label="Bằng cấp" value="—" />
              <Divider />
              <InfoRow
                label="Phí khám"
                value={formatVnd(doctor.consultationFee)}
              />
            </GlassCard>
          </FadeInView>

          {/* Specialty + clinic */}
          <FadeInView delay={220}>
            <SectionTitle title="Chuyên khoa & phòng khám" />
            <GlassCard style={styles.infoCard}>
              <InfoRow label="Chuyên khoa" value={doctor.specialty.name} />
              <Divider />
              <InfoRow
                label="Phòng khám"
                value={doctor.clinic?.name ?? 'Chưa gán'}
              />
            </GlassCard>
          </FadeInView>

          {/* Documents */}
          <FadeInView delay={280}>
            <SectionTitle title="Tài liệu đính kèm" />
            <GlassCard style={styles.infoCard}>
              {PLACEHOLDER_DOCS.map((doc, i) => (
                <View key={doc.id}>
                  <View style={styles.docRow}>
                    <View style={styles.docIcon}>
                      <MaterialCommunityIcons
                        name="file-document-outline"
                        size={22}
                        color={HEADER_GRADIENT[0]}
                      />
                    </View>
                    <View style={styles.docInfo}>
                      <Text style={styles.docName} numberOfLines={1}>
                        {doc.name}
                      </Text>
                      <Text style={styles.docSize}>{doc.size}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert('Sắp ra mắt', 'Xem tài liệu sẽ sớm có mặt.')
                      }
                      style={styles.docViewBtn}
                    >
                      <Text style={styles.docViewText}>Xem</Text>
                    </TouchableOpacity>
                  </View>
                  {i < PLACEHOLDER_DOCS.length - 1 ? <Divider /> : null}
                </View>
              ))}
            </GlassCard>
          </FadeInView>
        </View>
      </ScrollView>

      {/* Sticky bottom actions */}
      <View style={styles.bottomBar}>
        <Button
          mode="outlined"
          onPress={handleReject}
          disabled={submitting}
          textColor={figmaColors.error}
          style={[styles.bottomBtn, { borderColor: figmaColors.error }]}
        >
          Từ chối
        </Button>
        <Button
          mode="contained"
          onPress={handleApprove}
          loading={submitting}
          disabled={submitting}
          buttonColor={figmaColors.success}
          style={styles.bottomBtn}
        >
          Duyệt
        </Button>
      </View>
    </ScreenBackground>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: 140 },
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
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: figmaSpacing.md,
    paddingTop: 80,
  },
  notFoundText: {
    fontSize: figmaFonts.sizes.lg,
    color: figmaColors.textSecondary,
  },
  body: {
    paddingTop: figmaSpacing.lg,
    gap: figmaSpacing.lg,
  },
  heroCard: {
    marginHorizontal: figmaSpacing.lg,
    padding: figmaSpacing['2xl'],
    alignItems: 'center',
    gap: figmaSpacing.sm,
  },
  avatarLabel: {
    color: '#5856D6',
    fontWeight: figmaFonts.weights.bold,
    fontSize: figmaFonts.sizes['2xl'],
  },
  heroName: {
    fontSize: figmaFonts.sizes.xl,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textPrimary,
    marginTop: figmaSpacing.sm,
  },
  heroEmail: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
  },
  infoCard: {
    marginHorizontal: figmaSpacing.lg,
    padding: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: figmaSpacing.lg,
    paddingVertical: figmaSpacing.md,
    gap: figmaSpacing.md,
  },
  infoLabel: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
    fontWeight: figmaFonts.weights.medium,
    flexShrink: 0,
  },
  infoValue: {
    flex: 1,
    fontSize: figmaFonts.sizes.md,
    color: figmaColors.textPrimary,
    fontWeight: figmaFonts.weights.semibold,
    textAlign: 'right',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: figmaColors.border,
    marginHorizontal: figmaSpacing.lg,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.md,
    paddingHorizontal: figmaSpacing.lg,
    paddingVertical: figmaSpacing.md,
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: figmaRadius.md,
    backgroundColor: figmaColors.pastelPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: { flex: 1, gap: 2 },
  docName: {
    fontSize: figmaFonts.sizes.md,
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.textPrimary,
  },
  docSize: {
    fontSize: figmaFonts.sizes.xs,
    color: figmaColors.textMuted,
  },
  docViewBtn: {
    paddingHorizontal: figmaSpacing.md,
    paddingVertical: figmaSpacing.sm,
    borderRadius: figmaRadius.pill,
    backgroundColor: figmaColors.pastelBlue,
  },
  docViewText: {
    fontSize: figmaFonts.sizes.sm,
    fontWeight: figmaFonts.weights.semibold,
    color: HEADER_GRADIENT[0],
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: figmaSpacing.md,
    paddingHorizontal: figmaSpacing.lg,
    paddingTop: figmaSpacing.md,
    paddingBottom: figmaSpacing['2xl'],
    backgroundColor: figmaColors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: figmaColors.border,
  },
  bottomBtn: {
    flex: 1,
    borderRadius: figmaRadius.md,
  },
});
