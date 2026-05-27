import { useLocalSearchParams } from 'expo-router';
import { RescheduleScreen } from '../../src/screens/booking/reschedule-screen';

export default function Route() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return id ? <RescheduleScreen appointmentId={id} /> : null;
}
