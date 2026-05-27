import { useAuthStore } from '../../../src/store/auth.store';
import { HomeScreen } from '../../../src/screens/home/home-screen';
import { DoctorHomeScreen } from '../../../src/screens/doctor-portal/doctor-home-screen';
import { DoctorPendingScreen } from '../../../src/screens/doctor-portal/doctor-pending-screen';
import { AdminDashboardScreen } from '../../../src/screens/admin/admin-dashboard-screen';

export default function HomeRoute() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'DOCTOR') {
    if (user.doctorStatus !== 'ACTIVE') return <DoctorPendingScreen />;
    return <DoctorHomeScreen />;
  }
  if (user?.role === 'ADMIN') return <AdminDashboardScreen />;
  return <HomeScreen />;
}
