import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, View } from 'react-native';
import { Snackbar, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { figmaColors, figmaRadius, figmaSpacing } from '../../constants/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  FadeInView,
  GradientHeader,
  ScreenContainer,
  SectionTitle,
} from '../../components/shared';
import { router } from 'expo-router';
import { api, extractData } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import type { Appointment, User } from '../../types';

const HEADER_COLORS = [figmaColors.info, '#00695C'] as const;

interface DoctorMeta {
  doctorId?: string;
  specialtyName?: string;
  clinicName?: string;
  experienceYears?: number;
  bio?: string;
  licenseNumber?: string;
  consultationFee?: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface SpringPressableProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: object;
  disabled?: boolean;
}

function SpringPressable({ onPress, children, style, disabled }: SpringPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.96, friction: 5, tension: 140, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export function DoctorProfileScreen() {
  const setUser = useAuthStore((s) => s.setUser);
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  function handleLogout() {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  }

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [licenseNumber, setLicenseNumber] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [bio, setBio] = useState('');
  const [fee, setFee] = useState('');

  const [meta, setMeta] = useState<DoctorMeta>({});

  const fetchProfile = useCallback(async () => {
    try {
      const userRes = await api.get('/users/me');
      const user = extractData<User>(userRes);
      setName(user.name ?? '');
      setEmail(user.email ?? '');
      setPhone(user.phone ?? '');

      // Try to find current doctor profile via appointments → doctor.id, then GET /doctors/:id
      try {
        const apptsRes = await api.get('/appointments/me', { params: { limit: 1 } });
        const data = apptsRes.data?.data as Appointment[] | undefined;
        const doctorId = data?.[0]?.doctorId;
        if (doctorId) {
          const docRes = await api.get(`/doctors/${doctorId}`);
          const doc = extractData<{
            id: string;
            specialty?: { name?: string };
            clinic?: { name?: string } | null;
            experienceYears?: number;
            bio?: string | null;
            licenseNumber?: string | null;
            consultationFee?: number;
          }>(docRes);
          setMeta({
            doctorId: doc.id,
            specialtyName: doc.specialty?.name,
            clinicName: doc.clinic?.name ?? undefined,
            experienceYears: doc.experienceYears,
            bio: doc.bio ?? undefined,
            licenseNumber: doc.licenseNumber ?? undefined,
            consultationFee: doc.consultationFee,
          });
          setLicenseNumber(doc.licenseNumber ?? '');
          setExperienceYears(doc.experienceYears != null ? String(doc.experienceYears) : '');
          setBio(doc.bio ?? '');
          setFee(doc.consultationFee != null ? String(doc.consultationFee) : '');
        }
      } catch {
        // ignore — profile still usable for user fields
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/users/me', { name, phone });
      const updated = extractData<User>(res);
      setUser(updated);
      setSnack('Đã lưu thay đổi');
    } catch {
      setSnack('Không thể lưu, vui lòng thử lại');
    } finally {
      setSaving(false);
    }
  };

  const displayName = name || authUser?.name || 'Bác sĩ';

  if (loading) {
    return (
      <ScreenContainer>
        <GradientHeader title="Hồ sơ của tôi" colors={HEADER_COLORS} />
        <View style={styles.loadingWrap}>
          <LottieView
            source={require('../../assets/animations/loading.json')}
            autoPlay
            loop
            style={{ width: 100, height: 100 }}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <>
      <ScreenContainer>
        <GradientHeader
          title="Hồ sơ của tôi"
          subtitle="Cập nhật thông tin cá nhân"
          colors={HEADER_COLORS}
        />

        {/* Avatar */}
        <FadeInView delay={80}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarBig}>
              <Text style={styles.avatarBigText}>{getInitials(displayName)}</Text>
            </View>
            <SpringPressable onPress={() => setSnack('Tính năng đang phát triển')}>
              <View style={styles.changePhotoBtn}>
                <MaterialCommunityIcons name="camera" size={14} color={figmaColors.info} />
                <Text style={styles.changePhotoText}>Đổi ảnh đại diện</Text>
              </View>
            </SpringPressable>
          </View>
        </FadeInView>

        {/* Personal Info */}
        <FadeInView delay={140}>
          <View style={styles.sectionWrap}>
            <SectionTitle title="Thông tin cá nhân" />
          </View>
          <View style={styles.formWrap}>
            <GlassCard style={styles.formCard}>
              <TextInput
                mode="outlined"
                label="Họ và tên"
                value={name}
                onChangeText={setName}
                style={styles.input}
                outlineColor={figmaColors.border}
                activeOutlineColor={figmaColors.info}
              />
              <TextInput
                mode="outlined"
                label="Số điện thoại"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={styles.input}
                outlineColor={figmaColors.border}
                activeOutlineColor={figmaColors.info}
              />
              <TextInput
                mode="outlined"
                label="Email"
                value={email}
                disabled
                style={styles.input}
                outlineColor={figmaColors.border}
              />
            </GlassCard>
          </View>
        </FadeInView>

        {/* Professional Info */}
        <FadeInView delay={200}>
          <View style={styles.sectionWrap}>
            <SectionTitle title="Thông tin nghề nghiệp" />
          </View>
          <View style={styles.formWrap}>
            <GlassCard style={styles.formCard}>
              <TextInput
                mode="outlined"
                label="Số chứng chỉ hành nghề"
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                style={styles.input}
                outlineColor={figmaColors.border}
                activeOutlineColor={figmaColors.info}
              />
              <TextInput
                mode="outlined"
                label="Năm kinh nghiệm"
                value={experienceYears}
                onChangeText={setExperienceYears}
                keyboardType="number-pad"
                style={styles.input}
                outlineColor={figmaColors.border}
                activeOutlineColor={figmaColors.info}
              />
              <TextInput
                mode="outlined"
                label="Giới thiệu"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                style={[styles.input, styles.bioInput]}
                outlineColor={figmaColors.border}
                activeOutlineColor={figmaColors.info}
              />
              <TextInput
                mode="outlined"
                label="Phí khám (VND)"
                value={fee}
                onChangeText={setFee}
                keyboardType="number-pad"
                style={styles.input}
                outlineColor={figmaColors.border}
                activeOutlineColor={figmaColors.info}
              />
            </GlassCard>
          </View>
        </FadeInView>

        {/* Specialty / Clinic */}
        <FadeInView delay={260}>
          <View style={styles.sectionWrap}>
            <SectionTitle title="Chuyên khoa & Phòng khám" />
          </View>
          <View style={styles.formWrap}>
            <GlassCard style={styles.formCard}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: figmaColors.pastelTeal }]}>
                  <MaterialCommunityIcons name="stethoscope" size={20} color={figmaColors.info} />
                </View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Chuyên khoa</Text>
                  <Text style={styles.infoValue}>{meta.specialtyName ?? 'Chưa cập nhật'}</Text>
                </View>
                <SpringPressable onPress={() => setSnack('Tính năng đang phát triển')}>
                  <Text style={styles.changeText}>Đổi</Text>
                </SpringPressable>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: figmaColors.pastelBlue }]}>
                  <MaterialCommunityIcons name="hospital-building" size={20} color={figmaColors.primary} />
                </View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>Phòng khám</Text>
                  <Text style={styles.infoValue}>{meta.clinicName ?? 'Chưa cập nhật'}</Text>
                </View>
              </View>
            </GlassCard>
          </View>
        </FadeInView>

        {/* Save big button */}
        <FadeInView delay={320}>
          <View style={styles.saveBigWrap}>
            <SpringPressable onPress={handleSave} disabled={saving} style={styles.saveBigBtn}>
              <MaterialCommunityIcons name="content-save" size={20} color="#FFFFFF" />
              <Text style={styles.saveBigText}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Text>
            </SpringPressable>
          </View>
        </FadeInView>

        {/* Đăng xuất */}
        <FadeInView delay={400}>
          <GlassCard style={styles.logoutCard}>
            <Pressable onPress={handleLogout} style={styles.logoutRow}>
              <View style={styles.logoutIcon}>
                <MaterialCommunityIcons name="logout" size={20} color={figmaColors.error} />
              </View>
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </Pressable>
          </GlassCard>
        </FadeInView>
      </ScreenContainer>

      <Snackbar
        visible={!!snack}
        onDismiss={() => setSnack(null)}
        duration={2200}
        style={{ marginBottom: 100 }}
      >
        {snack ?? ''}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  saveBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: figmaSpacing.md,
    paddingVertical: figmaSpacing.xs + 2,
    borderRadius: figmaRadius.pill,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: figmaSpacing['3xl'],
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: -figmaSpacing.xl,
    gap: figmaSpacing.sm,
  },
  avatarBig: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: figmaColors.infoBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarBigText: {
    fontSize: 32,
    fontWeight: '700',
    color: figmaColors.info,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.xs,
    paddingHorizontal: figmaSpacing.md,
    paddingVertical: figmaSpacing.xs + 2,
    backgroundColor: figmaColors.infoBg,
    borderRadius: figmaRadius.pill,
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '600',
    color: figmaColors.info,
  },
  sectionWrap: {
    marginTop: figmaSpacing['2xl'],
  },
  formWrap: {
    paddingHorizontal: figmaSpacing.lg,
  },
  formCard: {
    borderRadius: figmaRadius.lg,
    padding: figmaSpacing.md,
    gap: figmaSpacing.sm,
  },
  input: {
    backgroundColor: figmaColors.surface,
    fontSize: 14,
  },
  bioInput: {
    minHeight: 100,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.md,
    paddingVertical: figmaSpacing.sm,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: figmaColors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: figmaColors.textPrimary,
    marginTop: 2,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    color: figmaColors.info,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: figmaColors.border,
  },
  saveBigWrap: {
    paddingHorizontal: figmaSpacing.lg,
    marginTop: figmaSpacing['2xl'],
  },
  saveBigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: figmaSpacing.sm,
    backgroundColor: figmaColors.info,
    paddingVertical: figmaSpacing.md + 2,
    borderRadius: figmaRadius.lg,
  },
  saveBigText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  logoutCard: {
    marginHorizontal: figmaSpacing.lg,
    marginTop: figmaSpacing.xl,
    paddingVertical: figmaSpacing.xs,
    paddingHorizontal: 0,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: figmaSpacing.lg,
  },
  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: figmaRadius.md,
    backgroundColor: figmaColors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: figmaColors.error,
  },
});
