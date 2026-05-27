import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { figmaColors, figmaRadius, figmaSpacing } from '../../constants/theme';
import type { Clinic } from '../../types';

interface ClinicMapViewProps {
  clinics: Clinic[];
  selectedClinicId: string;
  onSelectClinic: (clinicId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export function ClinicMapView({ clinics }: ClinicMapViewProps) {
  return (
    <View style={styles.placeholder}>
      <MaterialCommunityIcons name="map-outline" size={36} color={figmaColors.primary} />
      <Text style={styles.title}>Bản đồ phòng khám</Text>
      <Text style={styles.subtitle}>
        {clinics.length} phòng khám gần bạn
      </Text>
      <Text style={styles.note}>
        (Bản đồ chỉ hiển thị trên ứng dụng di động)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: figmaColors.pastelBlue,
    borderRadius: figmaRadius.lg,
    paddingVertical: figmaSpacing['2xl'],
    paddingHorizontal: figmaSpacing.lg,
    alignItems: 'center',
    gap: 6,
    marginBottom: figmaSpacing.md,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: figmaColors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: figmaColors.textSecondary,
  },
  note: {
    fontSize: 11,
    color: figmaColors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
