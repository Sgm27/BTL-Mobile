import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import {
  Avatar,
  Button,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { GlassCard } from '../../components/ui/GlassCard';
import { FadeInView, GradientHeader, ScreenContainer } from '../../components/shared';
import {
  figmaColors,
  figmaFonts,
  figmaRadius,
  figmaSpacing,
} from '../../constants/theme';
import { api, extractData } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import type { User } from '../../types';

export function EditProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [insuranceId, setInsuranceId] = useState(user?.insuranceId ?? '');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(
    user?.dateOfBirth ? new Date(user.dateOfBirth) : null
  );
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl ?? null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function handlePickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setAvatarUri(asset.uri);

      try {
        const formData = new FormData();
        formData.append('avatar', {
          uri: asset.uri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as unknown as Blob);
        await api.put('/users/me/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch {
        setSnackbar({ visible: true, message: 'Tải ảnh đại diện thất bại. Sẽ thử lại khi lưu.' });
      }
    }
  }

  function handleDateChange(_event: unknown, selectedDate?: Date) {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  }

  function formatDisplayDate(date: Date | null): string {
    if (!date) return 'Chưa thiết lập';
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  async function handleSave() {
    if (!name.trim()) {
      setSnackbar({ visible: true, message: 'Vui lòng nhập họ và tên.' });
      return;
    }
    try {
      setSaving(true);
      const body: Record<string, string | undefined> = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        insuranceId: insuranceId.trim() || undefined,
        dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : undefined,
      };
      const updated = extractData<User>(await api.put('/users/me', body));
      setUser(updated);
      setSnackbar({ visible: true, message: 'Đã cập nhật hồ sơ!' });
      setTimeout(() => router.back(), 800);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { error?: { message?: string } } } })
              .response?.data?.error?.message ?? 'Không thể lưu hồ sơ.')
          : 'Không thể lưu hồ sơ.';
      setSnackbar({ visible: true, message: msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <ScreenContainer showsVerticalScrollIndicator={false}>
        <GradientHeader
          title="Chỉnh sửa hồ sơ"
          showBack
          colors={[figmaColors.primary, figmaColors.primaryDark]}
        />

        {/* Avatar */}
        <FadeInView delay={80}>
          <View style={styles.avatarSection}>
            {avatarUri ? (
              <Avatar.Image size={96} source={{ uri: avatarUri }} />
            ) : (
              <Avatar.Text
                size={96}
                label={initials}
                style={styles.avatarPlaceholder}
                labelStyle={styles.avatarLabel}
              />
            )}
            <Button
              mode="text"
              icon="camera"
              onPress={handlePickImage}
              textColor={figmaColors.primary}
              style={styles.changePhotoBtn}
              labelStyle={styles.changePhotoLabel}
            >
              Đổi ảnh đại diện
            </Button>
          </View>
        </FadeInView>

        <View style={styles.body}>
          <FadeInView delay={160}>
            <GlassCard style={styles.card}>
              <Text style={styles.sectionLabel}>Thông tin cá nhân</Text>
              <TextInput
                mode="outlined"
                label="Họ và tên"
                value={name}
                onChangeText={setName}
                left={<TextInput.Icon icon="account" />}
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />
              <TextInput
                mode="outlined"
                label="Số điện thoại"
                value={phone}
                onChangeText={setPhone}
                keyboardType="numeric"
                left={<TextInput.Icon icon="phone" />}
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />
            </GlassCard>
          </FadeInView>

          <FadeInView delay={240}>
            <GlassCard style={styles.card}>
              <Text style={styles.sectionLabel}>Ngày sinh</Text>
              <Pressable onPress={() => setShowDatePicker(true)} style={styles.dateRow}>
                <MaterialCommunityIcons name="calendar" size={20} color={figmaColors.primary} />
                <Text style={styles.dateText}>{formatDisplayDate(dateOfBirth)}</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={figmaColors.textMuted}
                />
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={dateOfBirth ?? new Date(2000, 0, 1)}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={handleDateChange}
                />
              )}
            </GlassCard>
          </FadeInView>

          <FadeInView delay={320}>
            <GlassCard style={styles.card}>
              <Text style={styles.sectionLabel}>Thông tin bổ sung</Text>
              <TextInput
                mode="outlined"
                label="Địa chỉ"
                value={address}
                onChangeText={setAddress}
                left={<TextInput.Icon icon="map-marker" />}
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />
              <TextInput
                mode="outlined"
                label="Mã bảo hiểm y tế"
                value={insuranceId}
                onChangeText={setInsuranceId}
                left={<TextInput.Icon icon="card-account-details" />}
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />
            </GlassCard>
          </FadeInView>

          <FadeInView delay={400}>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              icon="content-save"
              style={styles.saveBtn}
              contentStyle={styles.saveBtnContent}
              labelStyle={styles.saveBtnLabel}
            >
              Lưu thay đổi
            </Button>
          </FadeInView>
        </View>
      </ScreenContainer>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={2500}
      >
        {snackbar.message}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSave: {
    color: '#fff',
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.semibold,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: figmaSpacing.xl,
    gap: figmaSpacing.sm,
  },
  avatarPlaceholder: {
    backgroundColor: figmaColors.pastelBlue,
  },
  avatarLabel: {
    color: figmaColors.primary,
    fontWeight: figmaFonts.weights.bold,
  },
  changePhotoBtn: {
    marginTop: 4,
  },
  changePhotoLabel: {
    fontSize: figmaFonts.sizes.md,
    fontWeight: figmaFonts.weights.semibold,
  },
  body: {
    marginTop: figmaSpacing.lg,
    gap: figmaSpacing.lg,
  },
  card: {
    marginHorizontal: figmaSpacing.lg,
  },
  sectionLabel: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.textPrimary,
    marginBottom: figmaSpacing.md,
  },
  input: {
    backgroundColor: figmaColors.surface,
    marginBottom: figmaSpacing.md,
  },
  inputOutline: {
    borderRadius: figmaRadius.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.md,
    paddingVertical: figmaSpacing.md,
    paddingHorizontal: 4,
  },
  dateText: {
    flex: 1,
    fontSize: figmaFonts.sizes.lg,
    color: figmaColors.textPrimary,
  },
  saveBtn: {
    marginHorizontal: figmaSpacing.lg,
    marginTop: figmaSpacing.sm,
    borderRadius: figmaRadius.lg,
    backgroundColor: figmaColors.primary,
  },
  saveBtnContent: {
    paddingVertical: 6,
  },
  saveBtnLabel: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.semibold,
  },
});
