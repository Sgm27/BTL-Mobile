import { Alert, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Avatar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  FadeInView,
  GradientHeader,
  ListRow,
  ScreenContainer,
  SectionTitle,
} from '../../components/shared';
import {
  figmaColors,
  figmaFonts,
  figmaRadius,
  figmaSpacing,
} from '../../constants/theme';
import { useAuthStore } from '../../store/auth.store';

const HEADER_GRADIENT = ['#5856D6', '#3634A3'] as const;

export function AdminSettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
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

  function comingSoon(label: string) {
    Alert.alert('Sắp ra mắt', `${label} sẽ sớm có mặt.`);
  }

  const initials = (user?.name ?? 'A')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <ScreenContainer showsVerticalScrollIndicator={false}>
      <GradientHeader
        title="Cài đặt"
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
      >
        <FadeInView delay={80}>
          <View style={styles.profileBlock}>
            <Avatar.Text
              size={80}
              label={initials}
              style={styles.avatar}
              labelStyle={styles.avatarLabel}
            />
            <Text style={styles.name}>{user?.name ?? 'Quản trị viên'}</Text>
            <Text style={styles.email}>{user?.email ?? '—'}</Text>
            <View style={styles.roleBadge}>
              <MaterialCommunityIcons name="shield-crown" size={14} color="#fff" />
              <Text style={styles.roleText}>QUẢN TRỊ VIÊN</Text>
            </View>
          </View>
        </FadeInView>
      </GradientHeader>

      <View style={styles.body}>
        <FadeInView delay={120}>
          <SectionTitle title="Tài khoản" />
          <GlassCard style={styles.card}>
            <ListRow
              icon="account-outline"
              iconBgColor={figmaColors.pastelBlue}
              title="Thông tin cá nhân"
              subtitle="Họ tên, email, số điện thoại"
              onPress={() => comingSoon('Chỉnh sửa thông tin cá nhân')}
            />
            <View style={styles.divider} />
            <ListRow
              icon="lock-outline"
              iconBgColor={figmaColors.pastelOrange}
              iconColor="#F57C00"
              title="Đổi mật khẩu"
              subtitle="Bảo mật tài khoản"
              onPress={() => comingSoon('Đổi mật khẩu')}
            />
          </GlassCard>
        </FadeInView>

        <FadeInView delay={200}>
          <SectionTitle title="Hệ thống" />
          <GlassCard style={styles.card}>
            <ListRow
              icon="database-outline"
              iconBgColor={figmaColors.pastelGreen}
              iconColor={figmaColors.success}
              title="Sao lưu dữ liệu"
              subtitle="Sao lưu cơ sở dữ liệu định kỳ"
              onPress={() => comingSoon('Sao lưu dữ liệu')}
            />
            <View style={styles.divider} />
            <ListRow
              icon="cog-outline"
              iconBgColor={figmaColors.surfaceMuted}
              iconColor={figmaColors.textSecondary}
              title="Cài đặt hệ thống"
              subtitle="Cấu hình chung của ứng dụng"
              onPress={() => comingSoon('Cài đặt hệ thống')}
            />
            <View style={styles.divider} />
            <ListRow
              icon="bell-outline"
              iconBgColor={figmaColors.pastelPurple}
              iconColor="#7C4DFF"
              title="Thông báo"
              subtitle="Quản lý thông báo gửi đi"
              onPress={() => router.push('/notifications')}
            />
          </GlassCard>
        </FadeInView>

        <FadeInView delay={280}>
          <SectionTitle title="Quản lý" />
          <GlassCard style={styles.card}>
            <ListRow
              icon="stethoscope"
              iconBgColor={figmaColors.pastelTeal}
              iconColor={figmaColors.info}
              title="Quản lý bác sĩ"
              subtitle="Danh sách và trạng thái bác sĩ"
              onPress={() => router.push('/admin-doctors')}
            />
            <View style={styles.divider} />
            <ListRow
              icon="hospital-building"
              iconBgColor={figmaColors.pastelBlue}
              title="Quản lý phòng khám"
              subtitle="Địa điểm và thông tin liên hệ"
              onPress={() => router.push('/admin-clinics')}
            />
            <View style={styles.divider} />
            <ListRow
              icon="medical-bag"
              iconBgColor={figmaColors.pastelPurple}
              iconColor="#7C4DFF"
              title="Quản lý dịch vụ"
              subtitle="Danh mục và bảng giá"
              onPress={() => router.push('/admin-services')}
            />
          </GlassCard>
        </FadeInView>

        <FadeInView delay={360}>
          <GlassCard style={[styles.card, styles.logoutCard]}>
            <Pressable onPress={handleLogout} style={styles.logoutRow}>
              <View style={[styles.logoutIcon, { backgroundColor: figmaColors.errorBg }]}>
                <MaterialCommunityIcons name="logout" size={20} color={figmaColors.error} />
              </View>
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </Pressable>
          </GlassCard>
        </FadeInView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: figmaRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  profileBlock: {
    alignItems: 'center',
    marginTop: figmaSpacing.lg,
    gap: 6,
  },
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  avatarLabel: {
    color: '#fff',
    fontWeight: figmaFonts.weights.bold,
  },
  name: {
    color: '#fff',
    fontSize: figmaFonts.sizes['2xl'],
    fontWeight: figmaFonts.weights.bold,
    marginTop: 8,
  },
  email: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: figmaFonts.sizes.md,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: figmaSpacing.md,
    paddingVertical: 4,
    borderRadius: figmaRadius.md,
    marginTop: 4,
  },
  roleText: {
    color: '#fff',
    fontSize: figmaFonts.sizes.xs,
    fontWeight: figmaFonts.weights.bold,
  },
  body: {
    marginTop: figmaSpacing.xl,
    gap: figmaSpacing.lg,
    paddingBottom: figmaSpacing.xl,
  },
  card: {
    marginHorizontal: figmaSpacing.lg,
    paddingVertical: figmaSpacing.xs,
    paddingHorizontal: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: figmaColors.border,
    marginLeft: 68,
  },
  logoutCard: {
    marginTop: figmaSpacing.sm,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIconText: {
    fontSize: 20,
  },
  logoutText: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.error,
  },
});
