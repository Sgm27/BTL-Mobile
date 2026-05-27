import { useAuthStore } from '../../../src/store/auth.store';
import { ChatScreen } from '../../../src/screens/chat/chat-screen';
import { DoctorReviewsScreen } from '../../../src/screens/doctor-portal/doctor-reviews-screen';
import { DoctorPendingScreen } from '../../../src/screens/doctor-portal/doctor-pending-screen';
import { ManageServicesScreen } from '../../../src/screens/admin/manage-services-screen';

export default function ChatRoute() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'DOCTOR') {
    if (user.doctorStatus !== 'ACTIVE') return <DoctorPendingScreen />;
    return <DoctorReviewsScreen />;
  }
  if (user?.role === 'ADMIN') return <ManageServicesScreen />;
  return <ChatScreen />;
}
