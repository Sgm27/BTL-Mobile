import {
  PrismaClient,
  Role,
  DoctorStatus,
  Shift,
  AppointmentStatus,
  PaymentMethod,
  PaymentStatus,
  HealthMetricType,
  AlertSeverity,
  ChatMessageRole,
  NotificationType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.$executeRaw`TRUNCATE TABLE "users" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "specialties" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "clinics" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "services" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "work_schedules" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "time_slots" CASCADE`;

  const passwordHash = await bcrypt.hash('password123', 10);

  // ====== ADMIN ======
  await prisma.user.create({
    data: {
      email: 'admin@healthcare.com',
      password: passwordHash,
      role: Role.ADMIN,
      name: 'System Admin',
      phone: '0900000000',
    },
  });

  // ====== SPECIALTIES ======
  const specialties = await Promise.all([
    prisma.specialty.create({
      data: { name: 'Tim mạch', description: 'Chuyên khoa Tim mạch', symptoms: ['đau ngực', 'khó thở', 'nhịp tim nhanh'] },
    }),
    prisma.specialty.create({
      data: { name: 'Thần kinh', description: 'Chuyên khoa Thần kinh', symptoms: ['đau đầu', 'chóng mặt', 'mất ngủ'] },
    }),
    prisma.specialty.create({
      data: { name: 'Tiêu hóa', description: 'Chuyên khoa Tiêu hóa', symptoms: ['đau bụng', 'buồn nôn', 'tiêu chảy'] },
    }),
    prisma.specialty.create({
      data: { name: 'Da liễu', description: 'Chuyên khoa Da liễu', symptoms: ['ngứa', 'phát ban', 'mụn'] },
    }),
    prisma.specialty.create({
      data: { name: 'Nhi khoa', description: 'Chuyên khoa Nhi', symptoms: ['sốt', 'ho', 'sổ mũi'] },
    }),
    prisma.specialty.create({
      data: { name: 'Mắt', description: 'Chuyên khoa Mắt', symptoms: ['mờ mắt', 'đau mắt', 'nhìn không rõ'] },
    }),
    prisma.specialty.create({
      data: { name: 'Đa khoa', description: 'Khám tổng quát, tầm soát sức khỏe', symptoms: ['mệt mỏi', 'sốt', 'đau nhức cơ thể', 'khám định kỳ'] },
    }),
  ]);

  const specTimMach = specialties[0];
  const specThanKinh = specialties[1];
  const specTieuHoa = specialties[2];
  const specDaLieu = specialties[3];
  const specNhiKhoa = specialties[4];
  const specMat = specialties[5];
  const specDaKhoa = specialties[6];

  // ====== CLINICS ======
  const clinics = await Promise.all([
    prisma.clinic.create({
      data: {
        name: 'Phòng khám Đa khoa Sài Gòn',
        address: '123 Nguyễn Trãi, Thanh Xuân, Hà Nội',
        lat: 21.0028,
        lng: 105.82,
        phone: '024-1234-5678',
        openingHours: '08:00 - 17:00',
      },
    }),
    prisma.clinic.create({
      data: {
        name: 'Phòng khám Quốc tế Hà Nội',
        address: '456 Lê Văn Lương, Cầu Giấy, Hà Nội',
        lat: 21.0122,
        lng: 105.7918,
        phone: '024-8765-4321',
        openingHours: '07:30 - 18:00',
      },
    }),
    prisma.clinic.create({
      data: {
        name: 'Phòng khám Hồng Ngọc',
        address: '55 Yên Ninh, Hai Bà Trưng, Hà Nội',
        lat: 21.0285,
        lng: 105.8542,
        phone: '024-3927-5568',
        openingHours: '07:00 - 19:00',
      },
    }),
    prisma.clinic.create({
      data: {
        name: 'Bệnh viện Bạch Mai',
        address: '78 Giải Phóng, Đống Đa, Hà Nội',
        lat: 20.9999,
        lng: 105.8412,
        phone: '024-3869-3731',
        openingHours: '06:30 - 20:00',
      },
    }),
    prisma.clinic.create({
      data: {
        name: 'Phòng khám Vinmec',
        address: '458 Minh Khai, Long Biên, Hà Nội',
        lat: 21.0451,
        lng: 105.8997,
        phone: '024-3974-3556',
        openingHours: '07:00 - 21:00',
      },
    }),
  ]);

  // ====== SERVICES ======
  const services = await Promise.all([
    prisma.service.create({ data: { name: 'Khám tổng quát', price: 200000, category: 'Khám' } }),
    prisma.service.create({ data: { name: 'Xét nghiệm máu', price: 150000, category: 'Xét nghiệm' } }),
    prisma.service.create({ data: { name: 'Chụp X-quang', price: 300000, category: 'Chẩn đoán hình ảnh' } }),
    prisma.service.create({ data: { name: 'Siêu âm', price: 250000, category: 'Chẩn đoán hình ảnh' } }),
    prisma.service.create({ data: { name: 'Điện tâm đồ', price: 180000, category: 'Xét nghiệm' } }),
    prisma.service.create({ data: { name: 'Khám chuyên khoa', price: 250000, category: 'Khám' } }),
    prisma.service.create({ data: { name: 'Tư vấn dinh dưỡng', price: 150000, category: 'Tư vấn' } }),
    prisma.service.create({ data: { name: 'Nội soi dạ dày', price: 500000, category: 'Chẩn đoán' } }),
    prisma.service.create({ data: { name: 'Chụp cộng hưởng từ', price: 1500000, category: 'Chẩn đoán hình ảnh' } }),
    prisma.service.create({ data: { name: 'Test dị ứng', price: 300000, category: 'Xét nghiệm' } }),
    prisma.service.create({ data: { name: 'Khám nha khoa', price: 200000, category: 'Nha khoa' } }),
    prisma.service.create({ data: { name: 'Làm sạch răng', price: 350000, category: 'Nha khoa' } }),
  ]);

  // ====== DOCTOR USERS ======
  const doctorUsers = await Promise.all([
    prisma.user.create({
      data: { email: 'doctor1@healthcare.com', password: passwordHash, role: Role.DOCTOR, name: 'BS. Nguyễn Văn An', phone: '0901111111' },
    }),
    prisma.user.create({
      data: { email: 'doctor2@healthcare.com', password: passwordHash, role: Role.DOCTOR, name: 'BS. Trần Thị Bình', phone: '0902222222' },
    }),
    prisma.user.create({
      data: { email: 'doctor3@healthcare.com', password: passwordHash, role: Role.DOCTOR, name: 'BS. Lê Văn Cường', phone: '0903333333' },
    }),
    prisma.user.create({
      data: { email: 'doctor4@healthcare.com', password: passwordHash, role: Role.DOCTOR, name: 'BS. Phạm Thị Dung', phone: '0904444444' },
    }),
    prisma.user.create({
      data: { email: 'doctor5@healthcare.com', password: passwordHash, role: Role.DOCTOR, name: 'BS. Hoàng Văn Em', phone: '0905555555' },
    }),
    prisma.user.create({
      data: { email: 'doctor6@healthcare.com', password: passwordHash, role: Role.DOCTOR, name: 'BS. Vũ Thị Phương', phone: '0906666666' },
    }),
    prisma.user.create({
      data: { email: 'doctor7@healthcare.com', password: passwordHash, role: Role.DOCTOR, name: 'BS. Đặng Văn Giang', phone: '0907777777' },
    }),
    prisma.user.create({
      data: { email: 'doctor8@healthcare.com', password: passwordHash, role: Role.DOCTOR, name: 'BS. Bùi Thị Hạnh', phone: '0908888888' },
    }),
    // Pending doctors
    prisma.user.create({
      data: { email: 'doctor9@healthcare.com', password: passwordHash, role: Role.DOCTOR, name: 'BS. Lý Văn Ích', phone: '0909999991' },
    }),
    prisma.user.create({
      data: { email: 'doctor10@healthcare.com', password: passwordHash, role: Role.DOCTOR, name: 'BS. Trương Thị Kim', phone: '0909999992' },
    }),
  ]);

  const doctors = await Promise.all([
    prisma.doctor.create({
      data: {
        userId: doctorUsers[0].id,
        specialtyId: specTimMach.id,
        clinicId: clinics[0].id,
        experienceYears: 12,
        bio: 'Bác sĩ chuyên khoa Tim mạch với hơn 12 năm kinh nghiệm điều trị bệnh lý tim mạch.',
        consultationFee: 350000,
        status: DoctorStatus.ACTIVE,
        licenseNumber: 'BS-001',
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[1].id,
        specialtyId: specThanKinh.id,
        clinicId: clinics[0].id,
        experienceYears: 8,
        bio: 'Chuyên gia Thần kinh, tốt nghiệp Đại học Y Hà Nội với nhiều thành tựu nghiên cứu.',
        consultationFee: 350000,
        status: DoctorStatus.ACTIVE,
        licenseNumber: 'BS-002',
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[2].id,
        specialtyId: specTieuHoa.id,
        clinicId: clinics[1].id,
        experienceYears: 6,
        bio: 'Bác sĩ Tiêu hóa, chuyên điều trị các bệnh lý đường ruột và dạ dày.',
        consultationFee: 250000,
        status: DoctorStatus.ACTIVE,
        licenseNumber: 'BS-003',
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[3].id,
        specialtyId: specDaLieu.id,
        clinicId: clinics[2].id,
        experienceYears: 9,
        bio: 'Bác sĩ Da liễu giàu kinh nghiệm, chuyên điều trị mụn, vẩy nến và các bệnh ngoài da.',
        consultationFee: 300000,
        status: DoctorStatus.ACTIVE,
        licenseNumber: 'BS-004',
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[4].id,
        specialtyId: specNhiKhoa.id,
        clinicId: clinics[3].id,
        experienceYears: 11,
        bio: 'Bác sĩ Nhi khoa tận tâm, hơn 10 năm khám và điều trị cho trẻ em mọi lứa tuổi.',
        consultationFee: 280000,
        status: DoctorStatus.ACTIVE,
        licenseNumber: 'BS-005',
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[5].id,
        specialtyId: specMat.id,
        clinicId: clinics[4].id,
        experienceYears: 7,
        bio: 'Bác sĩ Mắt chuyên khoa II, kinh nghiệm trong phẫu thuật khúc xạ và điều trị cận thị.',
        consultationFee: 320000,
        status: DoctorStatus.ACTIVE,
        licenseNumber: 'BS-006',
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[6].id,
        specialtyId: specTimMach.id,
        clinicId: clinics[3].id,
        experienceYears: 15,
        bio: 'Trưởng khoa Tim mạch Bệnh viện Bạch Mai, 15 năm kinh nghiệm can thiệp tim mạch.',
        consultationFee: 500000,
        status: DoctorStatus.ACTIVE,
        licenseNumber: 'BS-007',
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[7].id,
        specialtyId: specTieuHoa.id,
        clinicId: clinics[4].id,
        experienceYears: 10,
        bio: 'Bác sĩ Tiêu hóa nội soi, chuyên điều trị viêm loét dạ dày và trào ngược.',
        consultationFee: 380000,
        status: DoctorStatus.ACTIVE,
        licenseNumber: 'BS-008',
      },
    }),
    // Pending
    prisma.doctor.create({
      data: {
        userId: doctorUsers[8].id,
        specialtyId: specDaLieu.id,
        clinicId: clinics[2].id,
        experienceYears: 4,
        bio: 'Bác sĩ trẻ, vừa hoàn thành chuyên khoa I tại Đại học Y Dược TP HCM.',
        consultationFee: 220000,
        status: DoctorStatus.PENDING,
        licenseNumber: 'BS-009',
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[9].id,
        specialtyId: specNhiKhoa.id,
        clinicId: clinics[1].id,
        experienceYears: 5,
        bio: 'Chuyên Nhi khoa, mong muốn đem lại dịch vụ khám chữa bệnh tốt nhất cho trẻ em.',
        consultationFee: 240000,
        status: DoctorStatus.PENDING,
        licenseNumber: 'BS-010',
      },
    }),
  ]);

  // Active doctors only (for slots/appointments)
  const activeDoctors = doctors.slice(0, 8);

  // ====== PATIENTS ======
  const patients = await Promise.all([
    prisma.user.create({
      data: { email: 'patient1@gmail.com', password: passwordHash, role: Role.PATIENT, name: 'Nguyễn Văn Minh', phone: '0911111111', address: 'Hà Nội' },
    }),
    prisma.user.create({
      data: { email: 'patient2@gmail.com', password: passwordHash, role: Role.PATIENT, name: 'Trần Thị Lan', phone: '0922222222', address: 'Hà Nội' },
    }),
    prisma.user.create({
      data: { email: 'patient3@gmail.com', password: passwordHash, role: Role.PATIENT, name: 'Le Thi M', phone: '0933333333', address: 'Ha Noi' },
    }),
    prisma.user.create({
      data: { email: 'patient4@gmail.com', password: passwordHash, role: Role.PATIENT, name: 'Pham Van N', phone: '0944444444', address: 'Ha Noi' },
    }),
    prisma.user.create({
      data: { email: 'patient5@gmail.com', password: passwordHash, role: Role.PATIENT, name: 'Hoang Thi O', phone: '0955555555', address: 'Ha Noi' },
    }),
    prisma.user.create({
      data: { email: 'patient6@gmail.com', password: passwordHash, role: Role.PATIENT, name: 'Vu Van P', phone: '0966666666', address: 'Ha Noi' },
    }),
  ]);

  const [patient1, patient2, patient3, patient4, patient5, patient6] = patients;

  // ====== WORK SCHEDULES (current month) ======
  const today = new Date();
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();
  const todayDay = today.getUTCDate();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, month, day));
    if (date.getUTCDay() === 0) continue;

    await prisma.workSchedule.createMany({
      data: [
        { date, shift: Shift.MORNING, startTime: '08:00', endTime: '12:00' },
        { date, shift: Shift.AFTERNOON, startTime: '13:00', endTime: '17:00' },
      ],
      skipDuplicates: true,
    });
  }

  // ====== DOCTOR SERVICES ======
  // Each doctor links to 2-4 services
  const doctorServiceMap: { doctorIdx: number; serviceIdxs: number[] }[] = [
    { doctorIdx: 0, serviceIdxs: [0, 4, 5] }, // Tim mach: kham, dien tam do, chuyen khoa
    { doctorIdx: 1, serviceIdxs: [0, 5, 8] }, // Than kinh: kham, chuyen khoa, MRI
    { doctorIdx: 2, serviceIdxs: [0, 1, 7] }, // Tieu hoa: kham, mau, noi soi
    { doctorIdx: 3, serviceIdxs: [0, 5, 9] }, // Da lieu: kham, chuyen khoa, di ung
    { doctorIdx: 4, serviceIdxs: [0, 5, 6] }, // Nhi: kham, chuyen khoa, dinh duong
    { doctorIdx: 5, serviceIdxs: [0, 5] }, // Mat: kham, chuyen khoa
    { doctorIdx: 6, serviceIdxs: [0, 4, 5, 8] }, // Tim mach 2
    { doctorIdx: 7, serviceIdxs: [0, 1, 7, 5] }, // Tieu hoa 2
  ];

  await prisma.doctorService.createMany({
    data: doctorServiceMap.flatMap(({ doctorIdx, serviceIdxs }) =>
      serviceIdxs.map((sIdx) => ({
        doctorId: activeDoctors[doctorIdx].id,
        serviceId: services[sIdx].id,
        price: Number(services[sIdx].price),
      }))
    ),
    skipDuplicates: true,
  });

  // ====== TIME SLOTS (next 14 days for current + booked past slots) ======
  const timeSlotTemplates = [
    { startTime: '08:00', endTime: '08:30' },
    { startTime: '08:30', endTime: '09:00' },
    { startTime: '09:00', endTime: '09:30' },
    { startTime: '09:30', endTime: '10:00' },
    { startTime: '13:00', endTime: '13:30' },
    { startTime: '13:30', endTime: '14:00' },
    { startTime: '14:00', endTime: '14:30' },
    { startTime: '14:30', endTime: '15:00' },
  ];

  // Future slots: next 14 days
  for (let offset = 0; offset < 14; offset += 1) {
    const date = new Date(Date.UTC(year, month, todayDay + offset));
    if (date.getUTCDay() === 0) continue;

    for (const doctor of activeDoctors) {
      await prisma.timeSlot.createMany({
        data: timeSlotTemplates.map((slot) => ({
          doctorId: doctor.id,
          date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
        skipDuplicates: true,
      });
    }
  }

  // Past slots: last 30 days (for completed appointments)
  for (let offset = 1; offset <= 30; offset += 1) {
    const date = new Date(Date.UTC(year, month, todayDay - offset));
    if (date.getUTCDay() === 0) continue;

    for (const doctor of activeDoctors) {
      await prisma.timeSlot.createMany({
        data: timeSlotTemplates.map((slot) => ({
          doctorId: doctor.id,
          date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
        skipDuplicates: true,
      });
    }
  }

  // Helper: get slot for doctor on specific day offset and pick first available
  const usedSlotIds = new Set<string>();
  async function pickSlot(doctorId: string, dayOffset: number): Promise<string> {
    // If the requested day lands on Sunday (no slots), shift by 1 day in the same direction.
    let actualOffset = dayOffset;
    for (let attempts = 0; attempts < 7; attempts++) {
      const date = new Date(Date.UTC(year, month, todayDay + actualOffset));
      if (date.getUTCDay() !== 0) {
        const slots = await prisma.timeSlot.findMany({
          where: { doctorId, date, isBooked: false },
          orderBy: { startTime: 'asc' },
        });
        for (const s of slots) {
          if (!usedSlotIds.has(s.id)) {
            usedSlotIds.add(s.id);
            await prisma.timeSlot.update({ where: { id: s.id }, data: { isBooked: true } });
            return s.id;
          }
        }
      }
      actualOffset += dayOffset >= 0 ? 1 : -1;
    }
    throw new Error(`No slot available for doctor ${doctorId} near day offset ${dayOffset}`);
  }

  // ====== APPOINTMENTS ======
  type ApptDef = {
    patientId: string;
    doctorIdx: number;
    dayOffset: number;
    status: AppointmentStatus;
    notes?: string;
    diagnosis?: string;
    serviceIdxs: number[];
  };

  const apptDefs: ApptDef[] = [
    // patient1 - 8 appointments
    { patientId: patient1.id, doctorIdx: 0, dayOffset: 2, status: AppointmentStatus.PENDING, notes: 'Tôi bị đau ngực và khó thở khi gắng sức', serviceIdxs: [0, 4] },
    { patientId: patient1.id, doctorIdx: 1, dayOffset: 5, status: AppointmentStatus.PENDING, notes: 'Đau đầu kéo dài 1 tuần, mất ngủ', serviceIdxs: [0] },
    { patientId: patient1.id, doctorIdx: 2, dayOffset: 1, status: AppointmentStatus.CONFIRMED, notes: 'Đau bụng âm ỉ vùng trên rốn', serviceIdxs: [0, 1] },
    { patientId: patient1.id, doctorIdx: 3, dayOffset: 3, status: AppointmentStatus.CONFIRMED, notes: 'Phát ban ngứa ở tay', serviceIdxs: [0, 9] },
    { patientId: patient1.id, doctorIdx: 0, dayOffset: -7, status: AppointmentStatus.COMPLETED, diagnosis: 'Tăng huyết áp độ 1, cần theo dõi và điều chỉnh chế độ ăn', serviceIdxs: [0, 4] },
    { patientId: patient1.id, doctorIdx: 2, dayOffset: -14, status: AppointmentStatus.COMPLETED, diagnosis: 'Viêm dạ dày nhẹ, cần dùng thuốc giảm tiết acid', serviceIdxs: [0, 1] },
    { patientId: patient1.id, doctorIdx: 1, dayOffset: -21, status: AppointmentStatus.COMPLETED, diagnosis: 'Rối loạn giấc ngủ, stress nghề nghiệp', serviceIdxs: [0] },
    { patientId: patient1.id, doctorIdx: 5, dayOffset: -10, status: AppointmentStatus.CANCELED, notes: 'Không thể đến theo lịch', serviceIdxs: [0] },

    // patient2 - 4 appointments
    { patientId: patient2.id, doctorIdx: 4, dayOffset: 4, status: AppointmentStatus.PENDING, notes: 'Con bị sốt và ho', serviceIdxs: [0] },
    { patientId: patient2.id, doctorIdx: 3, dayOffset: 2, status: AppointmentStatus.CONFIRMED, notes: 'Mụn trứng cá nặng', serviceIdxs: [0, 5] },
    { patientId: patient2.id, doctorIdx: 0, dayOffset: -5, status: AppointmentStatus.COMPLETED, diagnosis: 'Tim mạch bình thường, cần luyện tập điều độ', serviceIdxs: [0, 4] },
    { patientId: patient2.id, doctorIdx: 6, dayOffset: -12, status: AppointmentStatus.CANCELED, notes: 'Có việc đột xuất', serviceIdxs: [0] },

    // TODAY appointments for doctor1 (Tim mạch) — visible on doctor portal
    { patientId: patient3.id, doctorIdx: 0, dayOffset: 0, status: AppointmentStatus.CONFIRMED, notes: 'Tái khám huyết áp định kỳ', serviceIdxs: [0, 4] },
    { patientId: patient4.id, doctorIdx: 0, dayOffset: 0, status: AppointmentStatus.CONFIRMED, notes: 'Đau ngực khi leo cầu thang', serviceIdxs: [0] },
    { patientId: patient5.id, doctorIdx: 0, dayOffset: 0, status: AppointmentStatus.PENDING, notes: 'Khám lần đầu, có tiền sử gia đình bệnh tim', serviceIdxs: [0, 4] },

    // TODAY for doctor2 (Thần kinh)
    { patientId: patient6.id, doctorIdx: 1, dayOffset: 0, status: AppointmentStatus.CONFIRMED, notes: 'Đau đầu migraine tái phát', serviceIdxs: [0] },

    // Tomorrow for doctor1
    { patientId: patient6.id, doctorIdx: 0, dayOffset: 1, status: AppointmentStatus.PENDING, notes: 'Kiểm tra điện tâm đồ', serviceIdxs: [0, 4] },

    // Other patients - mostly completed for review data
    { patientId: patient3.id, doctorIdx: 0, dayOffset: -3, status: AppointmentStatus.COMPLETED, diagnosis: 'Rối loạn nhịp tim nhẹ', serviceIdxs: [0, 4] },
    { patientId: patient3.id, doctorIdx: 1, dayOffset: -8, status: AppointmentStatus.COMPLETED, diagnosis: 'Chóng mặt tư thế lành tính', serviceIdxs: [0] },
    { patientId: patient4.id, doctorIdx: 0, dayOffset: -4, status: AppointmentStatus.COMPLETED, diagnosis: 'Tăng huyết áp độ 1', serviceIdxs: [0, 4] },
    { patientId: patient4.id, doctorIdx: 2, dayOffset: -9, status: AppointmentStatus.COMPLETED, diagnosis: 'Hội chứng ruột kích thích', serviceIdxs: [0, 1] },
    { patientId: patient5.id, doctorIdx: 0, dayOffset: -6, status: AppointmentStatus.COMPLETED, diagnosis: 'Suy tim độ 1', serviceIdxs: [0, 4] },
    { patientId: patient5.id, doctorIdx: 3, dayOffset: -11, status: AppointmentStatus.COMPLETED, diagnosis: 'Viêm da cơ địa', serviceIdxs: [0] },
    { patientId: patient6.id, doctorIdx: 0, dayOffset: -2, status: AppointmentStatus.COMPLETED, diagnosis: 'Khám sức khỏe định kỳ bình thường', serviceIdxs: [0] },
    { patientId: patient6.id, doctorIdx: 6, dayOffset: -15, status: AppointmentStatus.COMPLETED, diagnosis: 'Theo dõi tăng huyết áp', serviceIdxs: [0, 4] },
  ];

  const createdAppts: { id: string; def: ApptDef }[] = [];

  for (const def of apptDefs) {
    const doctor = activeDoctors[def.doctorIdx];
    const slotId = await pickSlot(doctor.id, def.dayOffset);

    const serviceTotal = def.serviceIdxs.reduce((sum, sIdx) => sum + Number(services[sIdx].price), 0);
    const totalAmount = Number(doctor.consultationFee) + serviceTotal;

    const appt = await prisma.appointment.create({
      data: {
        patientId: def.patientId,
        doctorId: doctor.id,
        timeSlotId: slotId,
        status: def.status,
        notes: def.notes,
        diagnosis: def.diagnosis,
        totalAmount,
        canceledAt: def.status === AppointmentStatus.CANCELED ? new Date() : null,
        services: {
          create: def.serviceIdxs.map((sIdx) => ({
            serviceId: services[sIdx].id,
            price: Number(services[sIdx].price),
          })),
        },
      },
    });
    createdAppts.push({ id: appt.id, def });
  }

  // ====== REVIEWS ======
  // Pick completed appointments and create reviews
  const completedAppts = createdAppts.filter((a) => a.def.status === AppointmentStatus.COMPLETED);

  const reviewComments: { rating: number; comment: string }[] = [
    { rating: 5, comment: 'Bác sĩ rất tận tâm và nhiệt tình, giải thích rất rõ ràng về bệnh.' },
    { rating: 5, comment: 'Khám rất kỹ, đưa ra phác đồ điều trị hiệu quả. Tôi sẽ quay lại.' },
    { rating: 4, comment: 'Bác sĩ giỏi, phòng khám sạch sẽ. Chờ đợi hơi lâu một chút.' },
    { rating: 5, comment: 'Bác sĩ chuyên môn cao, thái độ ân cần với bệnh nhân.' },
    { rating: 4, comment: 'Trải nghiệm tốt, nhân viên hỗ trợ nhiệt tình.' },
    { rating: 3, comment: 'Bác sĩ tốt nhưng phòng khám hơi đông, cần cải thiện.' },
    { rating: 5, comment: 'Rất hài lòng với dịch vụ, tôi sẽ giới thiệu cho bạn bè.' },
    { rating: 5, comment: 'Bác sĩ tư vấn rất chi tiết, giúp tôi hiểu rõ tình trạng sức khỏe.' },
    { rating: 4, comment: 'Khám nhanh chóng, kết quả chính xác.' },
    { rating: 5, comment: 'Tuyệt vời! Bác sĩ rất có tâm.' },
    { rating: 4, comment: 'Bác sĩ thân thiện, điều trị hiệu quả.' },
    { rating: 3, comment: 'Tạm ổn, giải thích thêm được thì tốt hơn.' },
    { rating: 5, comment: 'Cảm ơn bác sĩ đã giúp tôi rất nhiều, sức khỏe đã ổn định.' },
  ];

  for (let i = 0; i < completedAppts.length && i < reviewComments.length; i++) {
    const appt = completedAppts[i];
    const r = reviewComments[i];
    const doctor = activeDoctors[appt.def.doctorIdx];
    await prisma.review.create({
      data: {
        appointmentId: appt.id,
        patientId: appt.def.patientId,
        doctorId: doctor.id,
        rating: r.rating,
        comment: r.comment,
      },
    });
  }

  // ====== NOTIFICATIONS for patient1 ======
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const notifs: { title: string; body: string; type: NotificationType; isRead: boolean; daysAgo: number }[] = [
    { title: 'Nhắc lịch khám', body: 'Bạn có lịch khám với BS. Lê Văn Cường vào ngày mai lúc 08:00.', type: NotificationType.APPOINTMENT_REMINDER, isRead: false, daysAgo: 0 },
    { title: 'Lịch khám đã xác nhận', body: 'Lịch khám với BS. Phạm Thị Dung đã được xác nhận.', type: NotificationType.APPOINTMENT_CONFIRMED, isRead: false, daysAgo: 0 },
    { title: 'Cảnh báo huyết áp', body: 'Huyết áp của bạn đang ở mức cao. Vui lòng kiểm tra.', type: NotificationType.HEALTH_ALERT, isRead: false, daysAgo: 1 },
    { title: 'Nhắc uống thuốc', body: 'Đến giờ uống thuốc Amlodipine 5mg.', type: NotificationType.MEDICINE_REMINDER, isRead: false, daysAgo: 1 },
    { title: 'Cập nhật hệ thống', body: 'Ứng dụng vừa được cập nhật phiên bản mới với nhiều tính năng.', type: NotificationType.SYSTEM, isRead: true, daysAgo: 2 },
    { title: 'Lịch khám đã xác nhận', body: 'Lịch khám với BS. Nguyễn Văn An đã được xác nhận.', type: NotificationType.APPOINTMENT_CONFIRMED, isRead: true, daysAgo: 3 },
    { title: 'Nhắc uống thuốc', body: 'Đến giờ uống thuốc buổi sáng.', type: NotificationType.MEDICINE_REMINDER, isRead: true, daysAgo: 3 },
    { title: 'Lịch khám bị hủy', body: 'Lịch khám ngày 28/03 đã bị hủy.', type: NotificationType.APPOINTMENT_CANCELED, isRead: true, daysAgo: 4 },
    { title: 'Kết quả xét nghiệm', body: 'Kết quả xét nghiệm máu của bạn đã có.', type: NotificationType.SYSTEM, isRead: true, daysAgo: 5 },
    { title: 'Nhắc khám định kỳ', body: 'Đã đến thời gian khám sức khỏe định kỳ hàng quý.', type: NotificationType.APPOINTMENT_REMINDER, isRead: true, daysAgo: 6 },
    { title: 'Cảnh báo nhịp tim', body: 'Nhịp tim của bạn hơi cao trong 24h qua.', type: NotificationType.HEALTH_ALERT, isRead: true, daysAgo: 7 },
  ];

  for (const n of notifs) {
    await prisma.notification.create({
      data: {
        userId: patient1.id,
        title: n.title,
        body: n.body,
        type: n.type,
        isRead: n.isRead,
        createdAt: new Date(now - n.daysAgo * day),
      },
    });
  }

  // ====== HEALTH METRICS for patient1 ======
  // 30 days of data
  const metricsData: { type: HealthMetricType; value: number; daysAgo: number }[] = [];

  // Height once
  metricsData.push({ type: HealthMetricType.HEIGHT, value: 170, daysAgo: 30 });

  for (let d = 0; d < 30; d++) {
    // Daily BP
    const bpSys = 120 + Math.floor(Math.random() * 25); // 120-144, occasional 145+
    const bpDia = 80 + Math.floor(Math.random() * 12);
    metricsData.push({ type: HealthMetricType.BLOOD_PRESSURE_SYSTOLIC, value: bpSys, daysAgo: d });
    metricsData.push({ type: HealthMetricType.BLOOD_PRESSURE_DIASTOLIC, value: bpDia, daysAgo: d });

    // Weight every other day
    if (d % 2 === 0) {
      metricsData.push({ type: HealthMetricType.WEIGHT, value: 69 + Math.random() * 2, daysAgo: d });
    }
    // Heart rate daily
    metricsData.push({ type: HealthMetricType.HEART_RATE, value: 70 + Math.floor(Math.random() * 16), daysAgo: d });

    // Blood sugar every 3 days
    if (d % 3 === 0) {
      metricsData.push({ type: HealthMetricType.BLOOD_SUGAR, value: 95 + Math.floor(Math.random() * 16), daysAgo: d });
    }
  }

  await prisma.healthMetric.createMany({
    data: metricsData.map((m) => ({
      userId: patient1.id,
      type: m.type,
      value: m.value,
      recordedAt: new Date(now - m.daysAgo * day),
    })),
  });

  // ====== HEALTH ALERTS for patient1 ======
  await prisma.healthAlert.createMany({
    data: [
      {
        userId: patient1.id,
        metricType: HealthMetricType.BLOOD_PRESSURE_SYSTOLIC,
        message: 'Huyết áp tâm thu của bạn đạt 145 mmHg, vượt ngưỡng an toàn.',
        severity: AlertSeverity.HIGH,
        isRead: false,
        createdAt: new Date(now - 1 * day),
      },
      {
        userId: patient1.id,
        metricType: HealthMetricType.BLOOD_PRESSURE_SYSTOLIC,
        message: 'Huyết áp tâm thu liên tục cao trong 3 ngày, cần theo dõi.',
        severity: AlertSeverity.MEDIUM,
        isRead: false,
        createdAt: new Date(now - 3 * day),
      },
      {
        userId: patient1.id,
        metricType: HealthMetricType.HEART_RATE,
        message: 'Nhịp tim lúc nghỉ cao hơn bình thường.',
        severity: AlertSeverity.LOW,
        isRead: true,
        createdAt: new Date(now - 5 * day),
      },
    ],
  });

  // ====== PRESCRIPTIONS for patient1 ======
  const patient1CompletedAppts = createdAppts.filter(
    (a) => a.def.patientId === patient1.id && a.def.status === AppointmentStatus.COMPLETED
  );

  if (patient1CompletedAppts.length > 0) {
    const cardioDoctor = activeDoctors[0];
    await prisma.prescription.create({
      data: {
        userId: patient1.id,
        doctorId: cardioDoctor.id,
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/prescriptions/sample1.jpg',
        ocrData: {
          medicines: [
            { name: 'Amlodipine', dosage: '5mg', frequency: '1 lần/ngày', duration: '30 ngày' },
            { name: 'Aspirin', dosage: '81mg', frequency: '1 lần/ngày', duration: '30 ngày' },
          ],
          diagnosis: 'Tăng huyết áp độ 1',
          notes: 'Uống thuốc đều, tái khám sau 1 tháng',
        },
      },
    });

    await prisma.prescription.create({
      data: {
        userId: patient1.id,
        doctorId: activeDoctors[2].id,
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/prescriptions/sample2.jpg',
        ocrData: {
          medicines: [
            { name: 'Omeprazole', dosage: '20mg', frequency: '2 lần/ngày', duration: '14 ngày' },
            { name: 'Domperidone', dosage: '10mg', frequency: '3 lần/ngày', duration: '7 ngày' },
          ],
          diagnosis: 'Viêm dạ dày',
          notes: 'Tránh đồ ăn cay nóng, ăn đúng giờ',
        },
      },
    });
  }

  // ====== CHAT SESSIONS for patient1 ======
  const chatTopics = [
    {
      title: 'Tôi bị đau đầu và sốt',
      messages: [
        { role: ChatMessageRole.USER, content: 'Tôi bị đau đầu và sốt 38.5 độ từ sáng nay, có nên đi khám không?' },
        { role: ChatMessageRole.ASSISTANT, content: 'Với các triệu chứng đau đầu và sốt 38.5, bạn nên nghỉ ngơi và theo dõi thêm. Nếu sốt kéo dài trên 2 ngày hoặc kèm các triệu chứng khác, bạn nên đi khám bác sĩ.' },
        { role: ChatMessageRole.USER, content: 'Tôi có nên uống thuốc hạ sốt không?' },
        { role: ChatMessageRole.ASSISTANT, content: 'Bạn có thể dùng Paracetamol 500mg để hạ sốt, uống cách nhau tối thiểu 4-6 tiếng. Không quá 4g/ngày. Nhớ uống nhiều nước và nghỉ ngơi.' },
        { role: ChatMessageRole.USER, content: 'Cảm ơn bác sĩ!' },
        { role: ChatMessageRole.ASSISTANT, content: 'Không có gì. Nếu triệu chứng nặng hơn, hãy đến cơ sở y tế ngay. Chúc bạn sớm khỏe!' },
      ],
    },
    {
      title: 'Đau bụng vùng dưới',
      messages: [
        { role: ChatMessageRole.USER, content: 'Tôi bị đau bụng vùng dưới bên phải từ hôm qua' },
        { role: ChatMessageRole.ASSISTANT, content: 'Đau bụng vùng hố chậu phải có thể là dấu hiệu của viêm ruột thừa, đây là tình trạng nguy hiểm. Bạn cần đi khám ngay nếu đau tăng dần, kèm sốt, buồn nôn.' },
        { role: ChatMessageRole.USER, content: 'Hiện tại tôi có buồn nôn nhẹ' },
        { role: ChatMessageRole.ASSISTANT, content: 'Với triệu chứng đau bụng phải kèm buồn nôn, bạn nên đến bệnh viện gần nhất ngay để được khám và làm xét nghiệm. Không nên tự ý dùng thuốc giảm đau.' },
      ],
    },
    {
      title: 'Cao huyết áp',
      messages: [
        { role: ChatMessageRole.USER, content: 'Huyết áp của tôi gần đây cao 145/90, có nguy hiểm không?' },
        { role: ChatMessageRole.ASSISTANT, content: 'Huyết áp 145/90 nằm ở mức tăng huyết áp độ 1. Đây là mức cần theo dõi và điều chỉnh lối sống.' },
        { role: ChatMessageRole.USER, content: 'Tôi nên làm gì để giảm huyết áp?' },
        { role: ChatMessageRole.ASSISTANT, content: 'Một số cách: 1) Giảm muối trong khẩu phần, 2) Tập thể dục đều đặn 30 phút/ngày, 3) Hạn chế rượu bia, 4) Tránh stress, 5) Theo dõi huyết áp hàng ngày. Nếu không cải thiện, cần gặp bác sĩ tim mạch.' },
        { role: ChatMessageRole.USER, content: 'Có cần uống thuốc ngay không?' },
        { role: ChatMessageRole.ASSISTANT, content: 'Với tăng huyết áp độ 1, bác sĩ thường khuyên thay đổi lối sống trước. Nếu sau 3-6 tháng không cải thiện mới cần dùng thuốc. Bạn nên đến khám bác sĩ tim mạch để được tư vấn cụ thể.' },
      ],
    },
  ];

  for (const topic of chatTopics) {
    await prisma.chatSession.create({
      data: {
        userId: patient1.id,
        title: topic.title,
        messages: {
          create: topic.messages.map((m) => ({ role: m.role, content: m.content })),
        },
      },
    });
  }

  // ====== PAYMENTS ======
  // Payments for COMPLETED appointments
  const paymentMethods = [PaymentMethod.CASH, PaymentMethod.VNPAY, PaymentMethod.MOMO];
  for (let i = 0; i < completedAppts.length; i++) {
    const appt = completedAppts[i];
    const fullAppt = await prisma.appointment.findUnique({ where: { id: appt.id } });
    if (!fullAppt) continue;
    await prisma.payment.create({
      data: {
        appointmentId: appt.id,
        userId: appt.def.patientId,
        amount: Number(fullAppt.totalAmount),
        method: paymentMethods[i % paymentMethods.length],
        status: PaymentStatus.PAID,
        transactionId: `TXN-${Date.now()}-${i}`,
        paidAt: new Date(now - (i + 1) * day),
      },
    });
  }

  // 1 PENDING payment for a confirmed appointment
  const confirmedAppt = createdAppts.find((a) => a.def.status === AppointmentStatus.CONFIRMED);
  if (confirmedAppt) {
    const fullAppt = await prisma.appointment.findUnique({ where: { id: confirmedAppt.id } });
    if (fullAppt) {
      await prisma.payment.create({
        data: {
          appointmentId: confirmedAppt.id,
          userId: confirmedAppt.def.patientId,
          amount: Number(fullAppt.totalAmount),
          method: PaymentMethod.VNPAY,
          status: PaymentStatus.PENDING,
        },
      });
    }
  }

  console.log('Seed completed!');
  console.log('Admin:   admin@healthcare.com / password123');
  console.log('Doctor:  doctor1@healthcare.com / password123');
  console.log('Patient: patient1@gmail.com / password123');
  console.log(`Created: ${doctors.length} doctors (${activeDoctors.length} active), ${patients.length} patients`);
  console.log(`Created: ${createdAppts.length} appointments, ${completedAppts.length} reviews`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
