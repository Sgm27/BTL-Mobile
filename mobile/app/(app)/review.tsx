import { useLocalSearchParams } from 'expo-router';
import { ReviewScreen } from '../../src/screens/booking/review-screen';

export default function ReviewRoute() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  return appointmentId ? <ReviewScreen appointmentId={appointmentId} /> : null;
}
