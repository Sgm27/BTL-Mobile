import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import MapView, { Marker, Callout, type Region } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { figmaColors } from '../../constants/theme';
import type { Clinic } from '../../types';

interface ClinicMapViewProps {
  clinics: Clinic[];
  selectedClinicId: string;
  onSelectClinic: (clinicId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
}

const DEFAULT_REGION: Region = {
  latitude: 21.0285,
  longitude: 105.8542,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export function ClinicMapView({
  clinics,
  selectedClinicId,
  onSelectClinic,
  userLocation,
}: ClinicMapViewProps) {
  const clinicsWithCoords = clinics.filter(
    (c): c is Clinic & { lat: number; lng: number } =>
      c.lat != null && c.lng != null
  );

  const initialRegion: Region = userLocation
    ? {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : clinicsWithCoords.length > 0
      ? {
          latitude: clinicsWithCoords[0].lat,
          longitude: clinicsWithCoords[0].lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }
      : DEFAULT_REGION;

  if (clinicsWithCoords.length === 0) {
    return (
      <View style={styles.empty}>
        <MaterialCommunityIcons name="map-marker-off" size={32} color={figmaColors.textSecondary} />
        <Text style={styles.emptyText}>Chưa có dữ liệu vị trí phòng khám</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion}>
        {userLocation && (
          <Marker
            coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
            title="Vị trí của bạn"
            pinColor={figmaColors.primary}
          />
        )}
        {clinicsWithCoords.map((clinic) => (
          <Marker
            key={clinic.id}
            coordinate={{ latitude: clinic.lat, longitude: clinic.lng }}
            pinColor={
              clinic.id === selectedClinicId ? figmaColors.info : figmaColors.error
            }
            onCalloutPress={() => onSelectClinic(clinic.id)}
          >
            <Callout tooltip={false}>
              <View style={styles.callout}>
                <Text style={styles.calloutName} numberOfLines={1}>
                  {clinic.name}
                </Text>
                <Text style={styles.calloutAddress} numberOfLines={2}>
                  {clinic.address}
                </Text>
                <Text style={styles.calloutTap}>Nhấn để chọn</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  map: {
    height: 220,
    width: '100%',
  },
  empty: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: figmaColors.background + '80',
    borderRadius: 14,
    marginBottom: 12,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: figmaColors.textSecondary,
  },
  callout: {
    width: 180,
    padding: 8,
  },
  calloutName: {
    fontSize: 14,
    fontWeight: '600',
    color: figmaColors.text,
    marginBottom: 2,
  },
  calloutAddress: {
    fontSize: 12,
    color: figmaColors.textSecondary,
    marginBottom: 4,
  },
  calloutTap: {
    fontSize: 11,
    color: figmaColors.info,
    fontWeight: '500',
  },
});
