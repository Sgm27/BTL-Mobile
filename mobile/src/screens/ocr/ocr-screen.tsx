import { useCallback, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  IconButton,
  Text,
  TextInput,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import {
  FadeInView,
  GradientHeader,
  ScreenContainer,
} from '../../components/shared';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  figmaColors,
  figmaFonts,
  figmaRadius,
  figmaSpacing,
} from '../../constants/theme';
import {
  ocrPrescription,
  savePrescription,
  type OcrMedicine,
  type OcrResult,
} from '../../services/prescription.service';

const HEADER_COLORS = ['#5AC8FA', figmaColors.primary] as const;

export function OcrScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [medicines, setMedicines] = useState<OcrMedicine[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const pickImage = useCallback(async (source: 'camera' | 'gallery') => {
    try {
      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Cần cấp quyền',
            'Vui lòng cho phép truy cập camera để quét đơn thuốc.'
          );
          return;
        }
        try {
          result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
          });
        } catch (camErr) {
          console.log('[ocr] camera unavailable, fallback to gallery:', camErr);
          Alert.alert(
            'Camera không khả dụng',
            'Thiết bị này không có camera (simulator). Mở thư viện ảnh thay thế.',
            [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Mở thư viện',
                onPress: () => void pickImage('gallery'),
              },
            ]
          );
          return;
        }
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Cần cấp quyền',
            'Vui lòng cho phép truy cập thư viện ảnh.'
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setOcrResult(null);
        setMedicines([]);
        setSaved(false);
      }
    } catch (err) {
      console.error('[ocr] pickImage error:', err);
      Alert.alert('Lỗi', 'Không thể mở ảnh. Vui lòng thử lại.');
    }
  }, []);

  const handleScan = useCallback(async () => {
    if (!imageUri) return;

    setScanning(true);
    try {
      const result = await ocrPrescription(imageUri);
      setOcrResult(result);
      setMedicines(result.medicines);
    } catch (error) {
      console.error('OCR failed:', error);
      Alert.alert(
        'Quét thất bại',
        'Không thể nhận dạng. Vui lòng chụp lại.'
      );
    } finally {
      setScanning(false);
    }
  }, [imageUri]);

  const updateMedicine = useCallback(
    (index: number, field: keyof OcrMedicine, value: string) => {
      setMedicines((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!ocrResult) return;

    setSaving(true);
    try {
      await savePrescription(ocrResult.imageUrl, {
        medicines,
        rawText: ocrResult.rawText,
      });
      setSaved(true);
      Alert.alert('Đã lưu', 'Đơn thuốc đã được lưu vào hồ sơ.');
    } catch (error) {
      console.error('Save failed:', error);
      Alert.alert('Lưu thất bại', 'Không thể lưu đơn thuốc. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }, [ocrResult, medicines]);

  const handleReset = useCallback(() => {
    setImageUri(null);
    setOcrResult(null);
    setMedicines([]);
    setSaved(false);
  }, []);

  return (
    <ScreenContainer>
      <GradientHeader
        title="Quét đơn thuốc"
        showBack
        subtitle="Chụp ảnh hoặc tải lên để nhận dạng thuốc tự động"
        colors={HEADER_COLORS}
      />

      {/* Section: Chụp ảnh đơn thuốc */}
      {!ocrResult && (
        <FadeInView delay={80}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chụp ảnh đơn thuốc</Text>
          </View>
        </FadeInView>
      )}

      {/* Image Picker */}
      {!imageUri && (
        <FadeInView delay={120}>
          <GlassCard style={styles.pickerCard}>
            <View style={styles.pickerContent}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={64}
                color={figmaColors.textMuted}
              />
              <Text style={styles.pickerText}>
                Chọn một ảnh đơn thuốc để bắt đầu
              </Text>
              <View style={styles.pickerButtons}>
                <Button
                  mode="contained"
                  icon="camera"
                  onPress={() => pickImage('camera')}
                  style={styles.pickerBtn}
                  buttonColor={figmaColors.primary}
                >
                  Chụp ảnh
                </Button>
                <Button
                  mode="outlined"
                  icon="image"
                  onPress={() => pickImage('gallery')}
                  style={styles.pickerBtn}
                  textColor={figmaColors.primary}
                >
                  Chọn từ thư viện
                </Button>
              </View>
            </View>
          </GlassCard>
        </FadeInView>
      )}

      {/* Image Preview */}
      {imageUri && !ocrResult && !scanning && (
        <FadeInView delay={120}>
          <GlassCard style={styles.previewCard}>
            <View>
              <Image
                source={{ uri: imageUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              <View style={styles.previewActions}>
                <Button
                  mode="outlined"
                  icon="refresh"
                  onPress={handleReset}
                  style={styles.actionBtn}
                  textColor={figmaColors.primary}
                >
                  Quét lại
                </Button>
                <Button
                  mode="contained"
                  icon="text-recognition"
                  onPress={handleScan}
                  style={styles.actionBtn}
                  buttonColor={figmaColors.primary}
                >
                  Nhận dạng
                </Button>
              </View>
            </View>
          </GlassCard>
        </FadeInView>
      )}

      {/* Scanning State */}
      {scanning && (
        <FadeInView>
          <GlassCard style={styles.scanningCard}>
            <View style={styles.scanningContent}>
              <LottieView
                source={require('../../assets/animations/empty-state.json')}
                autoPlay
                loop
                style={styles.scanningAnimation}
              />
              <Text style={styles.scanningText}>Đang phân tích đơn thuốc...</Text>
              <Text style={styles.scanningSubtext}>
                AI đang trích xuất thông tin thuốc
              </Text>
              <ActivityIndicator
                size="small"
                color={figmaColors.primary}
                style={{ marginTop: figmaSpacing.sm }}
              />
            </View>
          </GlassCard>
        </FadeInView>
      )}

      {/* Results */}
      {ocrResult && medicines.length > 0 && (
        <>
          <FadeInView delay={100}>
            <View style={styles.resultsHeader}>
              <View>
                <Text style={styles.sectionTitle}>Kết quả nhận dạng</Text>
                <Text style={styles.resultsSub}>
                  Đã nhận dạng được {medicines.length} loại thuốc
                </Text>
              </View>
              <IconButton
                icon="refresh"
                size={20}
                onPress={handleReset}
                iconColor={figmaColors.primary}
                accessibilityLabel="Quét lại"
              />
            </View>
          </FadeInView>

          {medicines.map((medicine, index) => (
            <FadeInView key={index} delay={150 + index * 80}>
              <GlassCard style={styles.medicineCard}>
                <View>
                  <View style={styles.medicineHeader}>
                    <View style={styles.medicineIconContainer}>
                      <MaterialCommunityIcons
                        name="pill"
                        size={24}
                        color={figmaColors.primary}
                      />
                    </View>
                    <Text style={styles.medicineNumber}>Thuốc #{index + 1}</Text>
                  </View>

                  <TextInput
                    label="Tên thuốc"
                    value={medicine.name}
                    onChangeText={(v) => updateMedicine(index, 'name', v)}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={figmaColors.border}
                    activeOutlineColor={figmaColors.primary}
                    dense
                  />
                  <View style={styles.inputRow}>
                    <TextInput
                      label="Liều lượng"
                      value={medicine.dosage}
                      onChangeText={(v) => updateMedicine(index, 'dosage', v)}
                      mode="outlined"
                      style={[styles.input, styles.inputHalf]}
                      outlineColor={figmaColors.border}
                      activeOutlineColor={figmaColors.primary}
                      dense
                    />
                    <TextInput
                      label="Số lượng"
                      value={medicine.quantity}
                      onChangeText={(v) => updateMedicine(index, 'quantity', v)}
                      mode="outlined"
                      style={[styles.input, styles.inputHalf]}
                      outlineColor={figmaColors.border}
                      activeOutlineColor={figmaColors.primary}
                      dense
                    />
                  </View>
                  <TextInput
                    label="Tần suất"
                    value={medicine.frequency}
                    onChangeText={(v) => updateMedicine(index, 'frequency', v)}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={figmaColors.border}
                    activeOutlineColor={figmaColors.primary}
                    dense
                  />
                </View>
              </GlassCard>
            </FadeInView>
          ))}

          <FadeInView delay={150 + medicines.length * 80}>
            <Button
              mode="contained"
              icon={saved ? 'check' : 'content-save'}
              onPress={handleSave}
              loading={saving}
              disabled={saving || saved}
              style={styles.saveBtn}
              buttonColor={saved ? figmaColors.success : figmaColors.primary}
            >
              {saved ? 'Đã lưu' : 'Lưu vào hồ sơ'}
            </Button>
          </FadeInView>
        </>
      )}

      {/* No medicines found */}
      {ocrResult && medicines.length === 0 && (
        <FadeInView delay={100}>
          <GlassCard style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={48}
                color={figmaColors.warning}
              />
              <Text style={styles.emptyTitle}>Không tìm thấy thuốc</Text>
              <Text style={styles.emptyText}>
                Không thể nhận dạng. Vui lòng chụp lại.
              </Text>
              <Button
                mode="outlined"
                icon="camera"
                onPress={handleReset}
                style={{ marginTop: figmaSpacing.md }}
                textColor={figmaColors.primary}
              >
                Quét lại
              </Button>
            </View>
          </GlassCard>
        </FadeInView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginHorizontal: figmaSpacing.lg,
    marginTop: figmaSpacing.lg,
  },
  sectionTitle: {
    fontSize: figmaFonts.sizes.xl,
    fontWeight: '700',
    color: figmaColors.textPrimary,
  },
  // Picker
  pickerCard: {
    marginHorizontal: figmaSpacing.lg,
    marginTop: figmaSpacing.md,
  },
  pickerContent: {
    alignItems: 'center',
    paddingVertical: figmaSpacing.xl,
    gap: figmaSpacing.md,
  },
  pickerText: {
    color: figmaColors.textSecondary,
    fontSize: figmaFonts.sizes.md,
    textAlign: 'center',
  },
  pickerButtons: {
    flexDirection: 'row',
    gap: figmaSpacing.md,
    marginTop: figmaSpacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pickerBtn: {
    borderRadius: figmaRadius.md,
  },
  // Preview
  previewCard: {
    marginHorizontal: figmaSpacing.lg,
    marginTop: figmaSpacing.md,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: figmaRadius.md,
    backgroundColor: figmaColors.surfaceMuted,
  },
  previewActions: {
    flexDirection: 'row',
    gap: figmaSpacing.md,
    marginTop: figmaSpacing.md,
  },
  actionBtn: {
    flex: 1,
    borderRadius: figmaRadius.md,
  },
  // Scanning
  scanningCard: {
    marginHorizontal: figmaSpacing.lg,
    marginTop: figmaSpacing.lg,
  },
  scanningContent: {
    alignItems: 'center',
    paddingVertical: figmaSpacing.lg,
  },
  scanningAnimation: {
    width: 120,
    height: 120,
  },
  scanningText: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: '600',
    color: figmaColors.textPrimary,
    marginTop: figmaSpacing.sm,
  },
  scanningSubtext: {
    color: figmaColors.textSecondary,
    marginTop: figmaSpacing.xs,
    fontSize: figmaFonts.sizes.sm,
  },
  // Results
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: figmaSpacing.lg,
    marginTop: figmaSpacing.lg,
  },
  resultsSub: {
    fontSize: figmaFonts.sizes.sm,
    color: figmaColors.textSecondary,
    marginTop: 2,
  },
  medicineCard: {
    marginHorizontal: figmaSpacing.lg,
    marginTop: figmaSpacing.sm,
  },
  medicineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: figmaSpacing.sm,
    marginBottom: figmaSpacing.sm,
  },
  medicineIconContainer: {
    width: 36,
    height: 36,
    borderRadius: figmaRadius.md,
    backgroundColor: figmaColors.pastelBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicineNumber: {
    fontSize: figmaFonts.sizes.md,
    fontWeight: '600',
    color: figmaColors.textPrimary,
  },
  input: {
    backgroundColor: figmaColors.surface,
    marginBottom: figmaSpacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    gap: figmaSpacing.sm,
  },
  inputHalf: {
    flex: 1,
  },
  saveBtn: {
    marginHorizontal: figmaSpacing.lg,
    marginTop: figmaSpacing.lg,
    borderRadius: figmaRadius.md,
    paddingVertical: 4,
  },
  // Empty
  emptyCard: {
    marginHorizontal: figmaSpacing.lg,
    marginTop: figmaSpacing.lg,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: figmaSpacing.lg,
    gap: figmaSpacing.xs,
  },
  emptyTitle: {
    fontSize: figmaFonts.sizes.lg,
    fontWeight: '600',
    color: figmaColors.textPrimary,
    marginTop: figmaSpacing.sm,
  },
  emptyText: {
    color: figmaColors.textSecondary,
    textAlign: 'center',
    fontSize: figmaFonts.sizes.sm,
  },
});
