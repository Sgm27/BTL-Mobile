/**
 * appointments.service.ts
 * Thuộc phần của Ngô Đức Sơn — module Booking & Appointment.
 *
 * Service layer cho toàn bộ luồng đặt lịch và quản lý lịch hẹn phía bệnh nhân.
 * Mỗi hàm tương ứng với một endpoint REST trên backend Express (base: /api/v1).
 * Hàm trả về dữ liệu đã được unwrap qua helper extractData / extractPaginatedData.
 */
import { api, extractData, extractPaginatedData } from './api';
import type { Appointment } from '../types';

interface PaginatedResponse<T> {
  data: T;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AvailableSlot {
  date: string;
  startTime: string;
  endTime: string;
  availableCount: number;
  avgFee: number;
  clinics: { id: string; name: string; address: string }[];
}

/**
 * Lấy danh sách khung giờ còn trống cho một ngày khám cụ thể.
 *
 * Endpoint: GET /api/v1/appointments/available-slots
 *
 * Backend trả về các slot được tổng hợp theo chuyên khoa; nếu truyền clinicId
 * thì chỉ lọc slot thuộc phòng khám đó.
 *
 * @param params.specialtyId - UUID chuyên khoa bắt buộc
 * @param params.clinicId    - UUID phòng khám (tuỳ chọn, bỏ trống = bất kỳ)
 * @param params.date        - Ngày dạng YYYY-MM-DD
 * @returns Danh sách AvailableSlot (giờ bắt đầu, giờ kết thúc, số chỗ còn, phí trung bình)
 */
export async function getAvailableSlots(params: {
  specialtyId: string;
  clinicId?: string;
  date: string;
}): Promise<AvailableSlot[]> {
  const response = await api.get('/appointments/available-slots', { params });
  return extractData<AvailableSlot[]>(response);
}

/**
 * Lấy danh sách lịch hẹn của bệnh nhân đang đăng nhập (có phân trang).
 *
 * Endpoint: GET /api/v1/appointments/me
 *
 * @param params.page   - Trang hiện tại (mặc định 1)
 * @param params.limit  - Số bản ghi mỗi trang (mặc định 20)
 * @param params.status - Lọc theo trạng thái (PENDING | CONFIRMED | COMPLETED | ...)
 * @returns Đối tượng có field `data` (mảng Appointment) và `meta` (phân trang)
 */
export async function getMyAppointments(params?: {
  page?: number;
  limit?: number;
  status?: Appointment['status'];
}): Promise<PaginatedResponse<Appointment[]>> {
  const response = await api.get('/appointments/me', { params });
  return extractPaginatedData<Appointment[]>(response);
}

/**
 * Tạo lịch hẹn mới. Backend sẽ tự động phân công bác sĩ theo thuật toán
 * load-balancing (ưu tiên bác sĩ có ít lịch nhất trong slot đó).
 *
 * Endpoint: POST /api/v1/appointments
 *
 * @param input.specialtyId - UUID chuyên khoa bắt buộc
 * @param input.clinicId    - UUID phòng khám (tuỳ chọn)
 * @param input.date        - Ngày khám YYYY-MM-DD
 * @param input.startTime   - Giờ bắt đầu dạng HH:mm
 * @param input.serviceIds  - Mảng UUID dịch vụ bổ sung (có thể rỗng)
 * @param input.notes       - Ghi chú / triệu chứng từ bệnh nhân (tuỳ chọn)
 * @returns Appointment vừa được tạo (status = PENDING)
 */
export async function createAppointment(input: {
  specialtyId: string;
  clinicId?: string;
  date: string;
  startTime: string;
  serviceIds?: string[];
  notes?: string;
}): Promise<Appointment> {
  const response = await api.post('/appointments', input);
  return extractData<Appointment>(response);
}

/**
 * Huỷ lịch hẹn theo ID. Chỉ cho phép khi status là PENDING hoặc CONFIRMED.
 *
 * Endpoint: PUT /api/v1/appointments/:id/cancel
 *
 * @param id - UUID lịch hẹn cần huỷ
 * @returns Appointment đã được cập nhật status = CANCELED
 */
export async function cancelAppointment(id: string): Promise<Appointment> {
  const response = await api.put(`/appointments/${id}/cancel`);
  return extractData<Appointment>(response);
}

/**
 * Đổi lịch hẹn sang ngày/giờ mới. Chỉ cho phép khi status là PENDING.
 * Backend kiểm tra slot mới còn trống trước khi ghi nhận thay đổi.
 *
 * Endpoint: PUT /api/v1/appointments/:id/reschedule
 *
 * @param id              - UUID lịch hẹn cần đổi
 * @param input.date      - Ngày mới YYYY-MM-DD
 * @param input.startTime - Giờ bắt đầu mới HH:mm
 * @returns Appointment đã được cập nhật timeSlot mới
 */
export async function rescheduleAppointment(
  id: string,
  input: { date: string; startTime: string }
): Promise<Appointment> {
  const response = await api.put(`/appointments/${id}/reschedule`, input);
  return extractData<Appointment>(response);
}
