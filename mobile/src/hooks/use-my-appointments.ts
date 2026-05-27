/**
 * use-my-appointments.ts
 * Thuộc phần của Ngô Đức Sơn — module Booking & Appointment.
 *
 * Custom hook quản lý danh sách lịch hẹn của bệnh nhân đang đăng nhập.
 * Cung cấp: danh sách appointments, trạng thái loading/error,
 * hàm reload và hàm huỷ lịch với cập nhật tại chỗ trên local state.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  cancelAppointment,
  getMyAppointments,
} from '../services/appointments.service';
import type { Appointment } from '../types';

/**
 * Trích xuất thông báo lỗi từ response của axios.
 * Nếu backend trả về `{ error: { message } }` thì dùng message đó,
 * ngược lại trả về chuỗi mặc định.
 */
function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { error?: { message?: string } } } }).response;
    return response?.data?.error?.message ?? 'Không thể tải danh sách lịch hẹn.';
  }

  return 'Không thể tải danh sách lịch hẹn.';
}

/**
 * Hook chính cho màn hình danh sách lịch hẹn.
 *
 * Tự động gọi API GET /api/v1/appointments/me khi mount.
 * Trả về:
 *   - appointments: mảng Appointment (tối đa 20 bản ghi mới nhất)
 *   - isLoading:    true trong lần fetch đầu tiên
 *   - error:        chuỗi lỗi nếu fetch thất bại
 *   - reload:       hàm refresh thủ công (dùng cho pull-to-refresh)
 *   - cancelById:   hàm huỷ lịch theo ID + cập nhật local state ngay lập tức
 */
export function useMyAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  /**
   * Gọi API lấy danh sách lịch hẹn, cập nhật state.
   * Dùng useCallback để tránh tạo lại hàm khi component re-render.
   */
  const loadAppointments = useCallback(async () => {
    setIsLoading(true);

    try {
      // Lấy tối đa 20 lịch hẹn mới nhất (GET /api/v1/appointments/me?limit=20)
      const result = await getMyAppointments({ limit: 20 });
      setAppointments(result.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch dữ liệu lần đầu khi hook được mount
  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  /**
   * Huỷ lịch hẹn theo ID, sau đó cập nhật tại chỗ vào local state
   * (thay phần tử cũ bằng Appointment mới có status = CANCELED)
   * mà không cần fetch lại toàn bộ danh sách.
   *
   * Gọi API: PUT /api/v1/appointments/:id/cancel
   *
   * @param id - UUID lịch hẹn cần huỷ
   * @returns Appointment đã được cập nhật từ server
   */
  const cancelById = useCallback(async (id: string) => {
    const updated = await cancelAppointment(id);
    setAppointments((current) =>
      current.map((appointment) => (appointment.id === id ? updated : appointment))
    );
    return updated;
  }, []);

  return {
    appointments,
    isLoading,
    error,
    reload: loadAppointments,
    cancelById,
  };
}
