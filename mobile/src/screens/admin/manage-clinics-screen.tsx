import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  EmptyState,
  FadeInView,
  GradientHeader,
  ScreenContainer,
} from '../../components/shared';
import {
  figmaColors,
  figmaFonts,
  figmaRadius,
  figmaShadows,
  figmaSpacing,
} from '../../constants/theme';
import {
  createClinicApi,
  deleteClinicApi,
  fetchAdminClinics,
  updateClinicApi,
} from '../../services/admin.service';
import type { Clinic } from '../../types';

const HEADER_GRADIENT = ['#5856D6', '#3634A3'] as const;

const CARD_GRADIENTS: readonly (readonly [string, string])[] = [
  ['#5856D6', '#3634A3'],
  ['#1565C0', '#0D47A1'],
  ['#00897B', '#00695C'],
  ['#7C4DFF', '#5E35B1'],
  ['#EC407A', '#AD1457'],
] as const;

interface ClinicFormState {
  id?: string;
  name: string;
  address: string;
  phone: string;
  openingHours: string;
}

const EMPTY_FORM: ClinicFormState = {
  name: '',
  address: '',
  phone: '',
  openingHours: '',
};

export function ManageClinicsScreen() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ClinicFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchAdminClinics();
      setClinics(data);
    } catch (error) {
      console.error('Failed to load clinics:', error);
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

  const openCreate = useCallback(() => {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((clinic: Clinic) => {
    setForm({
      id: clinic.id,
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone ?? '',
      openingHours: clinic.openingHours ?? '',
    });
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim() || !form.address.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên và địa chỉ phòng khám.');
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<Clinic> = {
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim() || undefined,
        openingHours: form.openingHours.trim() || undefined,
      };
      if (form.id) {
        await updateClinicApi(form.id, payload);
      } else {
        await createClinicApi(payload);
      }
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await loadData();
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu phòng khám.');
    } finally {
      setSaving(false);
    }
  }, [form, loadData]);

  const handleDelete = useCallback(
    (clinic: Clinic) => {
      Alert.alert(
        'Xóa phòng khám',
        `Bạn có chắc muốn xóa "${clinic.name}"?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xóa',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteClinicApi(clinic.id);
                await loadData();
              } catch {
                Alert.alert('Lỗi', 'Không thể xóa phòng khám.');
              }
            },
          },
        ],
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

  return (
    <>
      <ScreenContainer
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentStyle={styles.content}
      >
        <GradientHeader
          title="Quản lý phòng khám"
          subtitle={`${clinics.length} phòng khám`}
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

        {clinics.length === 0 ? (
          <FadeInView delay={80}>
            <EmptyState
              icon="hospital-building"
              title="Chưa có phòng khám nào"
              message="Nhấn nút + để thêm phòng khám đầu tiên."
            />
          </FadeInView>
        ) : (
          <View style={styles.list}>
            {clinics.map((clinic, i) => {
              const grad = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
              return (
                <FadeInView key={clinic.id} delay={80 + i * 40}>
                  <GlassCard style={styles.card}>
                    <LinearGradient
                      colors={grad}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.banner}
                    >
                      <MaterialCommunityIcons
                        name="hospital-building"
                        size={48}
                        color="rgba(255,255,255,0.9)"
                      />
                    </LinearGradient>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardName}>{clinic.name}</Text>
                      <View style={styles.row}>
                        <MaterialCommunityIcons
                          name="map-marker"
                          size={16}
                          color={figmaColors.textSecondary}
                        />
                        <Text style={styles.metaText} numberOfLines={2}>
                          {clinic.address}
                        </Text>
                      </View>
                      {clinic.phone ? (
                        <View style={styles.row}>
                          <MaterialCommunityIcons
                            name="phone"
                            size={16}
                            color={figmaColors.textSecondary}
                          />
                          <Text style={styles.metaText}>{clinic.phone}</Text>
                        </View>
                      ) : null}
                      {clinic.openingHours ? (
                        <View style={styles.row}>
                          <MaterialCommunityIcons
                            name="clock-outline"
                            size={16}
                            color={figmaColors.textSecondary}
                          />
                          <Text style={styles.metaText}>{clinic.openingHours}</Text>
                        </View>
                      ) : null}
                      <View style={styles.actions}>
                        <Button
                          mode="outlined"
                          compact
                          onPress={() => openEdit(clinic)}
                          textColor={HEADER_GRADIENT[0]}
                          style={styles.actionBtn}
                        >
                          Chỉnh sửa
                        </Button>
                        <Button
                          mode="outlined"
                          compact
                          onPress={() => handleDelete(clinic)}
                          textColor={figmaColors.error}
                          style={[styles.actionBtn, { borderColor: figmaColors.error }]}
                        >
                          Xóa
                        </Button>
                      </View>
                    </View>
                  </GlassCard>
                </FadeInView>
              );
            })}
          </View>
        )}
      </ScreenContainer>

      {/* FAB */}
      <Pressable onPress={openCreate} style={styles.fab}>
        <View style={styles.fabInner}>
          <MaterialCommunityIcons name="plus" size={28} color="#fff" />
        </View>
      </Pressable>

      {/* Modal form */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          <Pressable style={styles.backdrop} onPress={() => setModalOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {form.id ? 'Chỉnh sửa phòng khám' : 'Thêm phòng khám'}
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Tên</Text>
              <TextInput
                value={form.name}
                onChangeText={(t) => setForm({ ...form, name: t })}
                placeholder="VD: Phòng khám ABC"
                placeholderTextColor={figmaColors.textMuted}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Địa chỉ</Text>
              <TextInput
                value={form.address}
                onChangeText={(t) => setForm({ ...form, address: t })}
                placeholder="Số nhà, đường, quận, thành phố"
                placeholderTextColor={figmaColors.textMuted}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Số điện thoại</Text>
              <TextInput
                value={form.phone}
                onChangeText={(t) => setForm({ ...form, phone: t })}
                placeholder="0xx xxx xxxx"
                placeholderTextColor={figmaColors.textMuted}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Giờ mở cửa</Text>
              <TextInput
                value={form.openingHours}
                onChangeText={(t) => setForm({ ...form, openingHours: t })}
                placeholder="VD: 08:00 - 20:00"
                placeholderTextColor={figmaColors.textMuted}
                style={styles.input}
              />
            </View>

            <View style={styles.sheetActions}>
              <Button
                mode="outlined"
                onPress={() => setModalOpen(false)}
                style={styles.sheetBtn}
                textColor={figmaColors.textSecondary}
              >
                Hủy
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                loading={saving}
                disabled={saving}
                style={styles.sheetBtn}
                buttonColor={HEADER_GRADIENT[0]}
              >
                Lưu
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
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
  list: {
    paddingHorizontal: figmaSpacing.lg,
    gap: figmaSpacing.lg,
    paddingTop: figmaSpacing.lg,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  banner: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: figmaSpacing.lg,
    gap: figmaSpacing.sm,
  },
  cardName: {
    fontSize: figmaFonts.sizes.xl,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textPrimary,
    marginBottom: figmaSpacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.sm,
  },
  metaText: {
    flex: 1,
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: figmaSpacing.md,
    marginTop: figmaSpacing.md,
  },
  actionBtn: {
    flex: 1,
    borderRadius: figmaRadius.md,
  },
  fab: {
    position: 'absolute',
    right: figmaSpacing.lg,
    bottom: 100,
  },
  fabInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: HEADER_GRADIENT[0],
    alignItems: 'center',
    justifyContent: 'center',
    ...figmaShadows.banner,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: figmaColors.surface,
    borderTopLeftRadius: figmaRadius.xl,
    borderTopRightRadius: figmaRadius.xl,
    padding: figmaSpacing['2xl'],
    paddingBottom: figmaSpacing['3xl'],
    gap: figmaSpacing.lg,
  },
  sheetHandle: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: figmaColors.border,
    alignSelf: 'center',
  },
  sheetTitle: {
    fontSize: figmaFonts.sizes.xl,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textPrimary,
    textAlign: 'center',
  },
  field: {
    gap: figmaSpacing.xs,
  },
  label: {
    fontSize: figmaFonts.sizes.sm,
    fontWeight: figmaFonts.weights.semibold,
    color: figmaColors.textSecondary,
  },
  input: {
    backgroundColor: figmaColors.surfaceMuted,
    borderRadius: figmaRadius.md,
    paddingHorizontal: figmaSpacing.lg,
    paddingVertical: figmaSpacing.md,
    fontSize: figmaFonts.sizes.md,
    color: figmaColors.textPrimary,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: figmaSpacing.md,
    marginTop: figmaSpacing.sm,
  },
  sheetBtn: {
    flex: 1,
    borderRadius: figmaRadius.md,
  },
});
