import { useAuthStore } from '../../../src/store/auth.store';
import { AppointmentsScreen } from '../../../src/screens/booking/appointments-screen';
import { DoctorPatientsScreen } from '../../../src/screens/doctor-portal/doctor-patients-screen';
import { DoctorPendingScreen } from '../../../src/screens/doctor-portal/doctor-pending-screen';
import { ManageDoctorsScreen } from '../../../src/screens/admin/manage-doctors-screen';

export default function AppointmentsRoute() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'DOCTOR') {
    if (user.doctorStatus !== 'ACTIVE') return <DoctorPendingScreen />;
    return <DoctorPatientsScreen />;
  }
  if (user?.role === 'ADMIN') return <ManageDoctorsScreen />;
  return <AppointmentsScreen />;
}
