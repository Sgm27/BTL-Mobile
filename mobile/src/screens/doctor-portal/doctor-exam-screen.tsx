import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  FadeInView,
  GradientHeader,
  ScreenContainer,
  SectionTitle,
} from '../../components/shared';
import { api, extractData } from '../../services/api';
import { figmaColors, figmaFonts, figmaRadius, figmaSpacing } from '../../constants/theme';
import type { Appointment } from '../../types';

const HEADER_COLORS = [figmaColors.info, '#00695C'] as const;

interface Medicine {
  name: string;
  dosage: string;
  notes: string;
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface Props {
  appointmentId: string;
}

export function DoctorExamScreen({ appointmentId }: Props) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // Exam inputs
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [completing, setCompleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Add medicine form
  const [showAddMed, setShowAddMed] = useState(false);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medNotes, setMedNotes] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [apptRes, svcRes] = await Promise.allSettled([
        api.get(`/appointments/${appointmentId}`),
        api.get('/services'),
      ]);
      if (apptRes.status === 'fulfilled') {
        const data = extractData<Appointment>(apptRes.value);
        setAppointment(data);
        if (data.diagnosis) setDiagnosis(data.diagnosis);
      }
      if (svcRes.status === 'fulfilled') {
        const data = extractData<ServiceItem[]>(svcRes.value);
        setServices(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [appointmentId]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addMedicine = () => {
    if (!medName.trim()) return;
    setMedicines((prev) => [...prev, { name: medName.trim(), dosage: medDosage.trim(), notes: medNotes.trim() }]);
    setMedName('');
    setMedDosage('');
    setMedNotes('');
    setShowAddMed(false);
  };

  const removeMedicine = (index: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = services
    .filter((s) => selectedServiceIds.includes(s.id))
    .reduce((sum, s) => sum + Number(s.price ?? 0), 0);

  const handleComplete = async () => {
    if (!diagnosis.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập chẩn đoán trước khi hoàn thành.');
      return;
    }
    setCompleting(true);
    try {
      await api.put(`/appointments/${appointmentId}/complete`, {
        diagnosis: diagnosis.trim(),
        serviceIds: selectedServiceIds.length > 0 ? selectedServiceIds : undefined,
      });
      setShowSuccess(true);
    } catch {
      Alert.alert('Lỗi', 'Không thể hoàn thành ca khám. Vui lòng thử lại.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading || !appointment) {
    return (
      <View style={styles.loadingWrap}>
        <LottieView
          source={require('../../assets/animations/loading.json')}
          autoPlay loop style={{ width: 100, height: 100 }}
        />
      </View>
    );
  }

  const patient = appointment.patient;
  const timeSlot = appointment.timeSlot;
  const isCompleted = appointment.status === 'AWAITING_PAYMENT' || appointment.status === 'COMPLETED';

  return (
    <>
      <ScreenContainer>
        <GradientHeader
          title="Ca khám"
          showBack
          subtitle={patient?.name ?? 'Bệnh nhân'}
          colors={HEADER_COLORS}
        />

        <View style={styles.body}>
          {/* Patient info */}
          <FadeInView delay={80}>
            <GlassCard style={styles.card}>
              <View style={styles.patientRow}>
                <View style={styles.avatarCircle}>
                  <MaterialCommunityIcons name="account" size={28} color={figmaColors.primary} />
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{patient?.name}</Text>
                  <Text style={styles.patientMeta}>{patient?.phone} · {patient?.email}</Text>
                  {timeSlot && (
                    <Text style={styles.patientMeta}>
                      {timeSlot.date} · {timeSlot.startTime} - {timeSlot.endTime}
                    </Text>
                  )}
                </View>
              </View>
              {appointment.notes && (
                <View style={styles.notesBox}>
                  <Text style={styles.notesLabel}>Triệu chứng:</Text>
                  <Text style={styles.notesText}>{appointment.notes}</Text>
                </View>
              )}
            </GlassCard>
          </FadeInView>

          {/* Diagnosis */}
          <FadeInView delay={160}>
            <SectionTitle title="Chẩn đoán" />
            <View style={styles.inputWrap}>
              <TextInput
                mode="outlined"
                label="Nhập chẩn đoán..."
                value={diagnosis}
                onChangeText={setDiagnosis}
                multiline
                numberOfLines={3}
                style={styles.input}
                outlineColor={figmaColors.border}
                activeOutlineColor={figmaColors.info}
                disabled={isCompleted}
              />
            </View>
          </FadeInView>

          {/* Prescription */}
          <FadeInView delay={240}>
            <SectionTitle
              title="Đơn thuốc"
              action={!isCompleted ? { label: 'Thêm thuốc', onPress: () => setShowAddMed(true) } : undefined}
            />
            {medicines.length === 0 ? (
              <View style={styles.emptyMeds}>
                <Text style={styles.emptyText}>Chưa có thuốc nào</Text>
              </View>
            ) : (
              <View style={styles.medsList}>
                {medicines.map((med, i) => (
                  <GlassCard key={i} style={styles.medCard}>
                    <View style={styles.medRow}>
                      <MaterialCommunityIcons name="pill" size={20} color={figmaColors.primary} />
                      <View style={styles.medInfo}>
                        <Text style={styles.medName}>{med.name}</Text>
                        {med.dosage ? <Text style={styles.medDetail}>Liều: {med.dosage}</Text> : null}
                        {med.notes ? <Text style={styles.medDetail}>{med.notes}</Text> : null}
                      </View>
                      {!isCompleted && (
                        <Pressable onPress={() => removeMedicine(i)} hitSlop={8}>
                          <MaterialCommunityIcons name="close-circle" size={20} color={figmaColors.error} />
                        </Pressable>
                      )}
                    </View>
                  </GlassCard>
                ))}
              </View>
            )}
          </FadeInView>

          {/* Services */}
          <FadeInView delay={320}>
            <SectionTitle title="Dịch vụ đã sử dụng" />
            <View style={styles.servicesList}>
              {services.map((svc) => {
                const selected = selectedServiceIds.includes(svc.id);
                return (
                  <Pressable
                    key={svc.id}
                    onPress={() => !isCompleted && toggleService(svc.id)}
                    style={[styles.serviceChip, selected && styles.serviceChipActive]}
                  >
                    <MaterialCommunityIcons
                      name={selected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                      size={18}
                      color={selected ? figmaColors.primary : figmaColors.textMuted}
                    />
                    <Text style={[styles.serviceText, selected && styles.serviceTextActive]}>
                      {svc.name}
                    </Text>
                    <Text style={styles.servicePrice}>
                      {Number(svc.price).toLocaleString('vi-VN')}đ
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {totalAmount > 0 && (
              <Text style={styles.totalText}>
                Tổng: {totalAmount.toLocaleString('vi-VN')}đ
              </Text>
            )}
          </FadeInView>

          {/* Complete button */}
          {!isCompleted && (
            <FadeInView delay={400}>
              <Button
                mode="contained"
                onPress={handleComplete}
                loading={completing}
                disabled={completing}
                buttonColor={figmaColors.success}
                textColor="#fff"
                icon="check-circle"
                style={styles.completeBtn}
                contentStyle={styles.completeBtnContent}
              >
                {completing ? 'Đang xử lý...' : 'Hoàn thành ca khám'}
              </Button>
            </FadeInView>
          )}

          {isCompleted && (
            <FadeInView delay={400}>
              <View style={styles.completedBanner}>
                <MaterialCommunityIcons name="check-decagram" size={24} color={figmaColors.success} />
                <Text style={styles.completedText}>Ca khám đã hoàn thành — chờ bệnh nhân thanh toán</Text>
              </View>
            </FadeInView>
          )}
        </View>
      </ScreenContainer>

      {/* Add medicine modal */}
      <Modal visible={showAddMed} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm thuốc</Text>
            <TextInput
              mode="outlined"
              label="Tên thuốc *"
              value={medName}
              onChangeText={setMedName}
              style={styles.modalInput}
              outlineColor={figmaColors.border}
              activeOutlineColor={figmaColors.primary}
            />
            <TextInput
              mode="outlined"
              label="Liều lượng (vd: 500mg, 2 viên/ngày)"
              value={medDosage}
              onChangeText={setMedDosage}
              style={styles.modalInput}
              outlineColor={figmaColors.border}
              activeOutlineColor={figmaColors.primary}
            />
            <TextInput
              mode="outlined"
              label="Ghi chú (vd: uống sau ăn)"
              value={medNotes}
              onChangeText={setMedNotes}
              style={styles.modalInput}
              outlineColor={figmaColors.border}
              activeOutlineColor={figmaColors.primary}
            />
            <View style={styles.modalActions}>
              <Button mode="outlined" onPress={() => setShowAddMed(false)} textColor={figmaColors.textSecondary}>
                Hủy
              </Button>
              <Button mode="contained" onPress={addMedicine} buttonColor={figmaColors.primary} disabled={!medName.trim()}>
                Thêm
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successContent}>
            <LottieView
              source={require('../../assets/animations/success.json')}
              autoPlay
              loop={false}
              style={{ width: 120, height: 120 }}
            />
            <Text style={styles.successTitle}>Hoàn thành ca khám!</Text>
            <Text style={styles.successSub}>
              Ca khám đã chuyển sang trạng thái chờ thanh toán.
            </Text>
            <View style={styles.successActions}>
              <Button
                mode="contained"
                onPress={() => {
                  setShowSuccess(false);
                  router.navigate('/(tabs)/home' as never);
                }}
                buttonColor={figmaColors.primary}
                icon="home"
              >
                Về trang chủ
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  setShowSuccess(false);
                  void fetchData();
                }}
                textColor={figmaColors.info}
                icon="eye"
              >
                Xem chi tiết
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: figmaColors.background },
  body: { gap: figmaSpacing.lg, paddingBottom: figmaSpacing['3xl'] },
  card: { marginHorizontal: figmaSpacing.lg },
  inputWrap: { marginHorizontal: figmaSpacing.lg },
  input: { backgroundColor: figmaColors.surface, fontSize: 14 },

  // Patient
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: figmaColors.pastelBlue,
    alignItems: 'center', justifyContent: 'center',
  },
  patientInfo: { flex: 1, gap: 2 },
  patientName: { fontSize: figmaFonts.sizes.lg, fontWeight: '700', color: figmaColors.textPrimary },
  patientMeta: { fontSize: figmaFonts.sizes.sm, color: figmaColors.textSecondary },
  notesBox: {
    marginTop: 12, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: figmaColors.border,
  },
  notesLabel: { fontSize: 12, fontWeight: '600', color: figmaColors.textMuted, marginBottom: 4 },
  notesText: { fontSize: 14, color: figmaColors.textPrimary },

  // Medicines
  emptyMeds: { marginHorizontal: figmaSpacing.lg, paddingVertical: 16, alignItems: 'center' },
  emptyText: { fontSize: 13, color: figmaColors.textMuted },
  medsList: { marginHorizontal: figmaSpacing.lg, gap: 8 },
  medCard: { paddingVertical: 8, paddingHorizontal: 12 },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  medInfo: { flex: 1, gap: 2 },
  medName: { fontSize: 14, fontWeight: '600', color: figmaColors.textPrimary },
  medDetail: { fontSize: 12, color: figmaColors.textSecondary },

  // Services
  servicesList: { marginHorizontal: figmaSpacing.lg, gap: 6 },
  serviceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: figmaRadius.sm,
    borderWidth: 1, borderColor: figmaColors.border,
    backgroundColor: figmaColors.surface,
  },
  serviceChipActive: { borderColor: figmaColors.primary, backgroundColor: figmaColors.pastelBlue },
  serviceText: { flex: 1, fontSize: 14, color: figmaColors.textSecondary },
  serviceTextActive: { color: figmaColors.primary, fontWeight: '600' },
  servicePrice: { fontSize: 13, fontWeight: '600', color: figmaColors.textMuted },
  totalText: {
    fontSize: 16, fontWeight: '700', color: figmaColors.primary,
    textAlign: 'right', marginHorizontal: figmaSpacing.lg, marginTop: 8,
  },

  // Complete
  completeBtn: { marginHorizontal: figmaSpacing.lg, borderRadius: figmaRadius.md },
  completeBtnContent: { paddingVertical: 6 },
  completedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: figmaSpacing.lg, padding: 16,
    borderRadius: figmaRadius.md,
    backgroundColor: figmaColors.successBg,
  },
  completedText: { flex: 1, fontSize: 13, fontWeight: '600', color: figmaColors.success },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalContent: {
    width: '100%', backgroundColor: figmaColors.surface,
    borderRadius: figmaRadius.xl, padding: 24, gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: figmaColors.textPrimary, marginBottom: 4 },
  modalInput: { backgroundColor: figmaColors.surface },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },

  // Success
  successContent: {
    backgroundColor: figmaColors.surface,
    borderRadius: figmaRadius.xl, padding: 32,
    alignItems: 'center', gap: 12, width: '100%',
  },
  successTitle: { fontSize: 20, fontWeight: '700', color: figmaColors.success },
  successSub: { fontSize: 14, color: figmaColors.textSecondary, textAlign: 'center' },
  successActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
});
