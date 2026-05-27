import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { useAuthStore } from '../../../src/store/auth.store';

/**
 * Role-based bottom tab navigation.
 * Only contains the 5 visible tab triggers — no hidden routes.
 * Detail/modal screens live one level up in (app)/ as Stack screens
 * so router.navigate() pushes them above the tabs.
 */
export default function TabsLayout() {
  const role = useAuthStore((s) => s.user?.role) ?? 'PATIENT';

  if (role === 'DOCTOR') {
    return (
      <NativeTabs minimizeBehavior="onScrollDown">
        <NativeTabs.Trigger name="home">
          <Icon sf={{ default: 'stethoscope', selected: 'stethoscope' }} />
          <Label>Trang chủ</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="booking">
          <Icon sf={{ default: 'calendar', selected: 'calendar' }} />
          <Label>Lịch khám</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="appointments">
          <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
          <Label>Bệnh nhân</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="chat">
          <Icon sf={{ default: 'star', selected: 'star.fill' }} />
          <Label>Đánh giá</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} />
          <Label>Cá nhân</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  if (role === 'ADMIN') {
    return (
      <NativeTabs minimizeBehavior="onScrollDown">
        <NativeTabs.Trigger name="home">
          <Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} />
          <Label>Dashboard</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="booking">
          <Icon sf={{ default: 'building.2', selected: 'building.2.fill' }} />
          <Label>Phòng khám</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="appointments">
          <Icon sf={{ default: 'person.2.badge.gearshape', selected: 'person.2.badge.gearshape.fill' }} />
          <Label>Bác sĩ</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="chat">
          <Icon sf={{ default: 'briefcase', selected: 'briefcase.fill' }} />
          <Label>Dịch vụ</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
          <Label>Cài đặt</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <NativeTabs minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="home">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Trang chủ</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="booking">
        <Icon sf={{ default: 'calendar.badge.plus', selected: 'calendar.badge.plus' }} />
        <Label>Đặt lịch</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="appointments">
        <Icon sf={{ default: 'list.clipboard', selected: 'list.clipboard.fill' }} />
        <Label>Lịch hẹn</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chat">
        <Icon sf={{ default: 'bubble.left', selected: 'bubble.left.fill' }} />
        <Label>Chat AI</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>Cá nhân</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
