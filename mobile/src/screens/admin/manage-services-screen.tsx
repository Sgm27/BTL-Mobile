import { useCallback, useEffect, useMemo, useState } from 'react';
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
  figmaShadows,
  figmaSpacing,
} from '../../constants/theme';
import {
  createServiceApi,
  deleteServiceApi,
  fetchAdminServices,
  updateServiceApi,
} from '../../services/admin.service';
import type { Service } from '../../types';

const HEADER_GRADIENT = ['#5856D6', '#3634A3'] as const;

function categoryIcon(category?: string): string {
  const c = (category ?? '').toLowerCase();
  if (c.includes('xét nghiệm') || c.includes('lab')) return '🧪';
  if (c.includes('chẩn đoán') || c.includes('hình ảnh') || c.includes('siêu âm')) return '🩻';
  if (c.includes('khám')) return '🩺';
  if (c.includes('tiêm') || c.includes('vắc')) return '💉';
  if (c.includes('răng') || c.includes('nha')) return '🦷';
  if (c.includes('mắt')) return '👁️';
  return '⚕️';
}

function formatVnd(value: number | string): string {
  return `${Number(value).toLocaleString('vi-VN')}₫`;
}

interface ServiceFormState {
  id?: string;
  name: string;
  category: string;
  price: string;
}

const EMPTY_FORM: ServiceFormState = { name: '', category: '', price: '' };

export function ManageServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ServiceFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchAdminServices();
      setServices(data);
    } catch (error) {
      console.error('Failed to load services:', error);
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
    if (!q) return services;
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.category ?? '').toLowerCase().includes(q),
    );
  }, [services, search]);

  const openCreate = useCallback(() => {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((service: Service) => {
    setForm({
      id: service.id,
      name: service.name,
      category: service.category ?? '',
      price: String(service.price),
    });
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên dịch vụ.');
      return;
    }
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      Alert.alert('Giá không hợp lệ', 'Vui lòng nhập giá hợp lệ.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim() || undefined,
        price,
      };
      if (form.id) {
        await updateServiceApi(form.id, payload);
      } else {
        await createServiceApi(payload);
      }
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await loadData();
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu dịch vụ.');
    } finally {
      setSaving(false);
    }
  }, [form, loadData]);

  const handleDelete = useCallback(
    (service: Service) => {
      Alert.alert(
        'Xóa dịch vụ',
        `Bạn có chắc muốn xóa "${service.name}"?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xóa',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteServiceApi(service.id);
                await loadData();
              } catch {
                Alert.alert('Lỗi', 'Không thể xóa dịch vụ.');
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
          title="Quản lý dịch vụ"
          subtitle={`${filtered.length} dịch vụ`}
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
          <FadeInView delay={40}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Tìm dịch vụ..."
              style={styles.search}
            />
          </FadeInView>

          {filtered.length === 0 ? (
            <FadeInView delay={100}>
              <EmptyState
                icon="medical-bag"
                title="Chưa có dịch vụ nào"
                message="Nhấn nút + để thêm dịch vụ đầu tiên."
              />
            </FadeInView>
          ) : (
            <View style={styles.list}>
              {filtered.map((service, i) => (
                <FadeInView key={service.id} delay={100 + i * 30}>
                  <GlassCard style={styles.card}>
                    <View style={styles.cardRow}>
                      <View style={styles.iconCircle}>
                        <Text style={styles.iconText}>
                          {categoryIcon(service.category)}
                        </Text>
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardName} numberOfLines={1}>
                          {service.name}
                        </Text>
                        {service.category ? (
                          <Text style={styles.cardCategory} numberOfLines={1}>
                            {service.category}
                          </Text>
                        ) : null}
                        <Text style={styles.cardPrice}>{formatVnd(service.price)}</Text>
                      </View>
                    </View>
                    <View style={styles.cardActions}>
                      <Pressable onPress={() => openEdit(service)} hitSlop={8} style={styles.iconAction}>
                        <MaterialCommunityIcons name="pencil-outline" size={18} color={HEADER_GRADIENT[0]} />
                      </Pressable>
                      <Pressable onPress={() => handleDelete(service)} hitSlop={8} style={styles.iconAction}>
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={figmaColors.error} />
                      </Pressable>
                    </View>
                  </GlassCard>
                </FadeInView>
              ))}
            </View>
          )}
        </View>
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
              {form.id ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ'}
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Tên dịch vụ</Text>
              <TextInput
                value={form.name}
                onChangeText={(t) => setForm({ ...form, name: t })}
                placeholder="VD: Khám tổng quát"
                placeholderTextColor={figmaColors.textMuted}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Danh mục</Text>
              <TextInput
                value={form.category}
                onChangeText={(t) => setForm({ ...form, category: t })}
                placeholder="VD: Xét nghiệm"
                placeholderTextColor={figmaColors.textMuted}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Giá (VND)</Text>
              <TextInput
                value={form.price}
                onChangeText={(t) => setForm({ ...form, price: t.replace(/[^0-9]/g, '') })}
                placeholder="0"
                placeholderTextColor={figmaColors.textMuted}
                keyboardType="numeric"
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
  body: {
    paddingTop: figmaSpacing.lg,
    gap: figmaSpacing.md,
  },
  search: {
    marginHorizontal: figmaSpacing.lg,
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
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: figmaRadius.md,
    backgroundColor: figmaColors.pastelPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 24 },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: figmaFonts.weights.bold,
    color: figmaColors.textPrimary,
  },
  cardCategory: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
  },
  cardPrice: {
    fontSize: figmaFonts.sizes.md,
    fontWeight: figmaFonts.weights.semibold,
    color: HEADER_GRADIENT[0],
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: figmaSpacing.sm,
    position: 'absolute',
    top: 12,
    right: 12,
  },
  iconAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: figmaColors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
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
