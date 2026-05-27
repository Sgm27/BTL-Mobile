import { useAuthStore } from '../../../src/store/auth.store';
import { ProfileScreen } from '../../../src/screens/profile/profile-screen';
import { DoctorProfileScreen } from '../../../src/screens/doctor-portal/doctor-profile-screen';
import { AdminSettingsScreen } from '../../../src/screens/admin/admin-settings-screen';

export default function ProfileRoute() {
  const role = useAuthStore((s) => s.user?.role);
  if (role === 'DOCTOR') return <DoctorProfileScreen />;
  if (role === 'ADMIN') return <AdminSettingsScreen />;
  return <ProfileScreen />;
}
