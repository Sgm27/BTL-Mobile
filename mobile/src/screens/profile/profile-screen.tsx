import { Alert, Linking, StyleSheet, View, Pressable } from 'react-native';
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
import { useAuthStore } from '../../store/auth.store';
import { figmaColors, figmaFonts, figmaRadius, figmaSpacing } from '../../constants/theme';

export function ProfileScreen() {
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

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <ScreenContainer showsVerticalScrollIndicator={false}>
      <GradientHeader
        title="Cá nhân"
        colors={[figmaColors.primary, figmaColors.primaryDark]}
      >
        <FadeInView delay={80}>
          <View style={styles.profileBlock}>
            <Avatar.Text size={80} label={initials} style={styles.avatar} labelStyle={styles.avatarLabel} />
            <Text style={styles.name}>{user?.name ?? 'User'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            {user?.role ? (
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user.role}</Text>
              </View>
            ) : null}
          </View>
        </FadeInView>
      </GradientHeader>

      <View style={styles.body}>
        {/* Sức khỏe */}
        <FadeInView delay={120}>
          <SectionTitle title="Sức khỏe" />
          <GlassCard style={styles.card}>
            <ListRow
              icon="heart-pulse"
              iconBgColor={figmaColors.pastelRed}
              iconColor={figmaColors.error}
              title="Theo dõi sức khỏe"
              subtitle="Nhịp tim, huyết áp, chỉ số cơ thể"
              onPress={() => router.push('/health')}
            />
            <View style={styles.divider} />
            <ListRow
              icon="camera-outline"
              iconBgColor={figmaColors.pastelOrange}
              iconColor="#F57C00"
              title="Quét đơn thuốc"
              subtitle="Trích xuất thông tin thuốc từ ảnh"
              onPress={() => router.push('/ocr')}
            />
            <View style={styles.divider} />
            <ListRow
              icon="clipboard-text-outline"
              iconBgColor={figmaColors.pastelTeal}
              iconColor={figmaColors.info}
              title="Lịch sử khám bệnh"
              subtitle="Các lần khám đã hoàn thành"
              onPress={() => router.push('/medical-history')}
            />
          </GlassCard>
        </FadeInView>

        {/* Tài khoản */}
        <FadeInView delay={200}>
          <SectionTitle title="Tài khoản" />
          <GlassCard style={styles.card}>
            <ListRow
              icon="bell-outline"
              iconBgColor={figmaColors.pastelPurple}
              iconColor="#7C4DFF"
              title="Thông báo"
              subtitle="Nhắc hẹn, tin tức, cập nhật"
              onPress={() => router.push('/notifications')}
            />
            <View style={styles.divider} />
            <ListRow
              icon="credit-card-outline"
              iconBgColor={figmaColors.pastelGreen}
              iconColor={figmaColors.success}
              title="Lịch sử thanh toán"
              subtitle="Các hoá đơn đã thanh toán"
              onPress={() => router.push('/payment-history')}
            />
            <View style={styles.divider} />
            <ListRow
              icon="account-edit-outline"
              iconBgColor={figmaColors.pastelBlue}
              title="Chỉnh sửa hồ sơ"
              subtitle="Thông tin cá nhân, ảnh đại diện"
              onPress={() => router.push('/edit-profile')}
            />
            <View style={styles.divider} />
            <ListRow
              icon="lock-outline"
              iconBgColor={figmaColors.pastelOrange}
              iconColor="#F57C00"
              title="Đổi mật khẩu"
              subtitle="Bảo mật tài khoản"
              onPress={() => router.push('/settings')}
            />
            <View style={styles.divider} />
            <ListRow
              icon="shield-check-outline"
              iconBgColor={figmaColors.pastelPurple}
              iconColor="#7C4DFF"
              title="Quyền ứng dụng"
              subtitle="Camera, thông báo, vị trí"
              onPress={() => Linking.openSettings()}
            />
          </GlassCard>
        </FadeInView>

        {/* Hệ thống */}
        <FadeInView delay={280}>
          <SectionTitle title="Hệ thống" />
          <GlassCard style={styles.card}>
            <ListRow
              icon="cog-outline"
              iconBgColor={figmaColors.surfaceMuted}
              iconColor={figmaColors.textSecondary}
              title="Cài đặt"
              subtitle="Thông báo, giao diện, hỗ trợ"
              onPress={() => router.push('/settings')}
            />
            {user?.role === 'ADMIN' ? (
              <>
                <View style={styles.divider} />
                <ListRow
                  icon="shield-crown-outline"
                  iconBgColor={figmaColors.pastelPurple}
                  iconColor="#7C4DFF"
                  title="Trang quản trị"
                  subtitle="Quản lý hệ thống"
                  onPress={() => router.push('/admin')}
                />
              </>
            ) : null}
          </GlassCard>
        </FadeInView>

        {/* Đăng xuất */}
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: figmaSpacing.md,
    paddingVertical: 4,
    borderRadius: figmaRadius.md,
    marginTop: 4,
  },
  roleText: {
    color: '#fff',
    fontSize: figmaFonts.sizes.xs,
    fontWeight: figmaFonts.weights.semibold,
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
