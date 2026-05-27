import { useLocalSearchParams } from 'expo-router';
import { DoctorDetailScreen } from '../../src/screens/doctor/doctor-detail-screen';

export default function DoctorDetailRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  console.log('[doctor-view route] mounted with params:', params);
  if (!params.id) {
    console.log('[doctor-view route] no id → returning null');
    return null;
  }
  return <DoctorDetailScreen doctorId={params.id} />;
}
