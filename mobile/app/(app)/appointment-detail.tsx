import { useLocalSearchParams } from 'expo-router';
import { AppointmentDetailScreen } from '../../src/screens/booking/appointment-detail-screen';

export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return id ? <AppointmentDetailScreen appointmentId={id} /> : null;
}
