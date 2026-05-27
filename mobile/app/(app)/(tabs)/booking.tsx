import { useAuthStore } from '../../../src/store/auth.store';
import { BookingScreen } from '../../../src/screens/booking/booking-screen';
import { DoctorScheduleScreen } from '../../../src/screens/doctor-portal/doctor-schedule-screen';
import { DoctorPendingScreen } from '../../../src/screens/doctor-portal/doctor-pending-screen';
import { ManageClinicsScreen } from '../../../src/screens/admin/manage-clinics-screen';

export default function BookingRoute() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'DOCTOR') {
    if (user.doctorStatus !== 'ACTIVE') return <DoctorPendingScreen />;
    return <DoctorScheduleScreen />;
  }
  if (user?.role === 'ADMIN') return <ManageClinicsScreen />;
  return <BookingScreen />;
}
