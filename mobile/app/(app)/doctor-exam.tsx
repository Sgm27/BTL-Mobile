import { useLocalSearchParams } from 'expo-router';
import { DoctorExamScreen } from '../../src/screens/doctor-portal/doctor-exam-screen';

export default function DoctorExamRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id) return null;
  return <DoctorExamScreen appointmentId={id} />;
}
