/**
 * Enrichment seed — ADD more realistic Vietnamese data so screenshots look richer.
 * Safe to re-run (uses unique keys or skip-if-exists checks).
 */
import { PrismaClient, NotificationType, HealthMetricType, ChatMessageRole } from '@prisma/client';

const p = new PrismaClient();

// Realistic Vietnamese review comments
const REVIEW_COMMENTS = [
  'Bác sĩ tận tình, giải thích rõ ràng từng vấn đề. Phòng khám sạch sẽ, không phải chờ lâu. Rất hài lòng!',
  'Khám rất kỹ, tư vấn chế độ ăn uống và sinh hoạt cụ thể. Sẽ tái khám lần sau.',
  'Bác sĩ chuyên nghiệp, thái độ niềm nở. Giải đáp mọi thắc mắc rất chi tiết.',
  'Đặt lịch dễ dàng qua app, đến đúng giờ là được khám liền. Trải nghiệm tuyệt vời.',
  'Sẽ giới thiệu cho bạn bè người thân. Cảm ơn bác sĩ rất nhiều.',
  'Bác sĩ trẻ nhưng có kinh nghiệm, lắng nghe rất kỹ triệu chứng của bệnh nhân.',
  'Phòng khám hiện đại, máy móc đầy đủ. Bác sĩ khám nhẹ nhàng, không gây khó chịu.',
  'Quá trình khám diễn ra nhanh chóng, hiệu quả. Đơn thuốc được kê hợp lý.',
  'Bác sĩ giải thích kết quả xét nghiệm dễ hiểu. Rất chuyên nghiệp.',
  'Đặt lịch buổi sáng, đến nơi không phải chờ. Bác sĩ thân thiện, dễ trò chuyện.',
  'Tư vấn online qua chat AI cũng rất chi tiết. Trải nghiệm tốt.',
  'Bác sĩ kiên nhẫn lắng nghe và hỏi rất kỹ về tiền sử bệnh.',
  'Khám xong thấy yên tâm hơn nhiều. Cảm ơn đội ngũ phòng khám.',
  'Phí khám hợp lý so với chất lượng. Sẽ quay lại lần sau.',
  'Đơn thuốc rõ ràng, có hướng dẫn liều dùng cụ thể. Rất chu đáo.',
];

const NOTIFICATIONS: Array<{ title: string; body: string; type: NotificationType; minsAgo: number; isRead: boolean }> = [
  { title: 'Nhắc lịch khám sắp tới', body: 'Bạn có lịch khám với BS. Đặng Văn Giang lúc 08:00 ngày mai. Vui lòng có mặt sớm 15 phút.', type: 'APPOINTMENT_REMINDER', minsAgo: 30, isRead: false },
  { title: 'Bác sĩ đã xác nhận lịch khám', body: 'BS. Lê Văn Cường đã xác nhận lịch khám của bạn vào Thứ 4, 27/05/2026 lúc 09:30.', type: 'APPOINTMENT_CONFIRMED', minsAgo: 90, isRead: false },
  { title: 'Đặt lịch thành công', body: 'Lịch khám chuyên khoa Tim mạch đã được tạo. Bác sĩ sẽ xác nhận trong 24 giờ.', type: 'APPOINTMENT_CONFIRMED', minsAgo: 180, isRead: true },
  { title: 'Nhắc uống thuốc Paracetamol 500mg', body: 'Đã đến giờ uống thuốc 8:00 sáng — Paracetamol 500mg, 1 viên sau ăn.', type: 'MEDICINE_REMINDER', minsAgo: 240, isRead: false },
  { title: 'Cảnh báo huyết áp cao', body: 'Chỉ số huyết áp gần đây của bạn (145/95) cao hơn bình thường. Khuyến nghị đặt lịch tư vấn.', type: 'HEALTH_ALERT', minsAgo: 360, isRead: false },
  { title: 'Mời đánh giá bác sĩ', body: 'Bạn vừa hoàn thành buổi khám với BS. Nguyễn Văn An. Hãy chia sẻ trải nghiệm của bạn.', type: 'SYSTEM', minsAgo: 720, isRead: true },
  { title: 'Khám sức khỏe định kỳ — ưu đãi 30%', body: 'Combo khám tổng quát + xét nghiệm máu chỉ còn 450.000đ trong tháng 5. Đặt ngay!', type: 'SYSTEM', minsAgo: 1440, isRead: false },
  { title: 'Đơn thuốc mới đã sẵn sàng', body: 'BS. Lê Văn Cường đã kê đơn thuốc cho buổi khám 20/05/2026. Xem chi tiết.', type: 'SYSTEM', minsAgo: 2880, isRead: true },
  { title: 'Nhắc uống thuốc Vitamin D3', body: 'Đã đến giờ uống thuốc 20:00 tối — Vitamin D3 1000 IU, 1 viên cùng bữa ăn.', type: 'MEDICINE_REMINDER', minsAgo: 4320, isRead: true },
  { title: 'Kết quả xét nghiệm máu đã có', body: 'Kết quả xét nghiệm máu ngày 18/05/2026 đã hoàn tất. Vui lòng kiểm tra trong hồ sơ.', type: 'SYSTEM', minsAgo: 7200, isRead: true },
  { title: 'BS. Trần Thị Bình vừa nhắn tin', body: 'Bác sĩ trả lời câu hỏi của bạn về liều lượng thuốc. Mở chat để xem.', type: 'SYSTEM', minsAgo: 10080, isRead: true },
  { title: 'Cập nhật quyền lợi BHYT 2026', body: 'Một số dịch vụ khám chuyên khoa đã được bổ sung vào danh mục BHYT. Xem chi tiết.', type: 'SYSTEM', minsAgo: 14400, isRead: true },
  { title: 'Bài viết mới: 5 thói quen tốt cho tim mạch', body: 'Tham khảo bài chia sẻ của BS. Đặng Văn Giang về phòng ngừa bệnh tim mạch.', type: 'SYSTEM', minsAgo: 20160, isRead: true },
  { title: 'Lịch khám đã được dời', body: 'Lịch khám 22/05/2026 đã được dời sang 24/05/2026 cùng khung giờ theo yêu cầu của bạn.', type: 'APPOINTMENT_CONFIRMED', minsAgo: 28800, isRead: true },
  { title: 'Đã hủy lịch ngày 15/05/2026', body: 'Lịch khám ngày 15/05/2026 đã được hủy thành công. Phí khám sẽ được hoàn lại trong 3-5 ngày.', type: 'APPOINTMENT_CANCELED', minsAgo: 43200, isRead: true },
  { title: 'Cảnh báo nhịp tim bất thường', body: 'Nhịp tim trung bình 7 ngày qua (98 BPM) cao hơn ngưỡng bình thường. Khuyến nghị nghỉ ngơi.', type: 'HEALTH_ALERT', minsAgo: 50400, isRead: true },
  { title: 'Nhắc lịch khám định kỳ', body: 'Đã 6 tháng kể từ lần khám tổng quát gần nhất. Đặt lịch khám để theo dõi sức khỏe.', type: 'APPOINTMENT_REMINDER', minsAgo: 60480, isRead: true },
];

const CHAT_TEMPLATES = [
  {
    title: 'Tư vấn triệu chứng đau đầu',
    msgs: [
      { role: 'USER' as const, content: 'Chào bác sĩ, tôi bị đau đầu liên tục mấy ngày nay, có nguy hiểm không?' },
      { role: 'ASSISTANT' as const, content: 'Chào bạn! Đau đầu kéo dài có thể do nhiều nguyên nhân: căng thẳng, thiếu ngủ, viêm xoang, hoặc đôi khi là dấu hiệu vấn đề về thần kinh. Bạn có thể cho tôi biết thêm:\n\n• Mức độ đau (nhẹ/vừa/dữ dội)?\n• Vị trí đau (trán, thái dương, đỉnh đầu)?\n• Có kèm sốt, chóng mặt, buồn nôn không?' },
      { role: 'USER' as const, content: 'Đau vừa, thái dương 2 bên, không sốt nhưng hơi chóng mặt.' },
      { role: 'ASSISTANT' as const, content: 'Triệu chứng bạn mô tả gợi ý đến **đau đầu căng thẳng (tension headache)**. Khuyến nghị:\n\n1. **Nghỉ ngơi 8 tiếng/đêm**, tránh dùng điện thoại trước khi ngủ\n2. **Uống đủ 2 lít nước/ngày**\n3. **Mát-xa cơ vai cổ** 5-10 phút\n4. Có thể uống Paracetamol 500mg khi cần\n\nNếu sau 3 ngày không cải thiện hoặc cơn đau dữ dội hơn, nên đặt lịch khám chuyên khoa Thần kinh để loại trừ nguyên nhân khác.' },
    ],
  },
  {
    title: 'Hỏi về cảm cúm và sốt nhẹ',
    msgs: [
      { role: 'USER' as const, content: 'Tôi bị sốt 38°C, đau họng, sổ mũi 2 ngày rồi. Uống thuốc gì được?' },
      { role: 'ASSISTANT' as const, content: 'Triệu chứng của bạn phù hợp với **cảm cúm thông thường**. Phác đồ tự điều trị tại nhà:\n\n• **Paracetamol 500mg** khi sốt >38.5°C (cách 4-6h, không quá 4 lần/ngày)\n• **Súc miệng nước muối ấm** 3 lần/ngày\n• **Uống nhiều nước ấm**, nước chanh mật ong\n• **Nghỉ ngơi**, tránh ra ngoài trời lạnh\n\nĐi khám nếu: sốt >39°C, ho ra đờm xanh/vàng đặc, khó thở, sốt kéo dài >3 ngày.' },
    ],
  },
  {
    title: 'Tư vấn dinh dưỡng cho người tiểu đường',
    msgs: [
      { role: 'USER' as const, content: 'Bố tôi mới được chẩn đoán tiểu đường type 2, ăn uống thế nào?' },
      { role: 'ASSISTANT' as const, content: 'Chế độ dinh dưỡng cho người tiểu đường type 2:\n\n**Nên ăn:**\n• Rau xanh (cải, súp lơ, mướp đắng) — 50% bữa ăn\n• Protein nạc: cá, ức gà, đậu phụ\n• Tinh bột chậm: gạo lứt, yến mạch, khoai lang\n• Trái cây ít ngọt: bơ, ổi, táo (≤200g/ngày)\n\n**Hạn chế:**\n• Đường, bánh kẹo, nước ngọt\n• Cơm trắng, bún, phở (giảm ½ khẩu phần)\n• Trái cây ngọt: sầu riêng, mít, nhãn\n\n**Lời khuyên:**\n• Chia 5 bữa nhỏ thay vì 3 bữa lớn\n• Đo đường huyết 2 lần/ngày (sáng đói + sau ăn 2h)\n• Đi bộ 30 phút/ngày' },
    ],
  },
  {
    title: 'Đau bụng kéo dài 3 ngày',
    msgs: [
      { role: 'USER' as const, content: 'Tôi bị đau bụng âm ỉ vùng quanh rốn 3 ngày rồi, không tiêu chảy.' },
      { role: 'ASSISTANT' as const, content: 'Đau bụng quanh rốn kéo dài 3 ngày cần lưu ý. Có thể là: viêm dạ dày, hội chứng ruột kích thích, hoặc đôi khi viêm ruột thừa giai đoạn sớm.\n\nBạn vui lòng kiểm tra:\n• Có sốt nhẹ không?\n• Đau có lan xuống hố chậu phải không?\n• Có chán ăn, buồn nôn?\n\nKhuyến nghị: **đặt lịch khám chuyên khoa Tiêu hóa** trong 1-2 ngày tới. Trong lúc chờ, ăn nhẹ (cháo, súp), tránh đồ cay/dầu mỡ.' },
    ],
  },
  {
    title: 'Hỏi về tiêm vaccine cúm',
    msgs: [
      { role: 'USER' as const, content: 'Có nên tiêm vaccine cúm hàng năm không?' },
      { role: 'ASSISTANT' as const, content: '**Có**, đặc biệt với các nhóm:\n\n• Trẻ em 6 tháng – 5 tuổi\n• Người >65 tuổi\n• Phụ nữ có thai\n• Người mắc bệnh mạn tính (tiểu đường, tim mạch)\n• Nhân viên y tế\n\n**Thời điểm tiêm:** Tháng 9-11 hàng năm (trước mùa cúm).\n\n**Giá tham khảo:** 250.000đ – 350.000đ/mũi (tùy loại vaccine).\n\nVaccine cúm an toàn, hiệu quả 60-80%, không gây cúm (chỉ chứa virus đã chết hoặc bất hoạt).' },
    ],
  },
  {
    title: 'Tư vấn giảm cân an toàn',
    msgs: [
      { role: 'USER' as const, content: 'Tôi cao 1m65, nặng 75kg, muốn giảm xuống 60kg trong 3 tháng. Có khả thi không?' },
      { role: 'ASSISTANT' as const, content: 'Mục tiêu giảm 15kg trong 3 tháng = **5kg/tháng** là khá nhanh. Khuyến nghị giảm an toàn 2-4kg/tháng để tránh hại sức khỏe.\n\n**BMI hiện tại:** 27.5 (thừa cân)\n**BMI mục tiêu:** 22 (bình thường) — đúng hướng!\n\n**Kế hoạch 4-6 tháng:**\n\n🍽️ **Dinh dưỡng:**\n• Giảm 500 kcal/ngày so với nhu cầu\n• Protein cao: 1.5g/kg cân nặng\n• Hạn chế tinh bột tinh chế\n\n🏃 **Vận động:**\n• Cardio 30-45 phút × 5 lần/tuần\n• Tập kháng lực 2-3 lần/tuần\n\nNên đặt lịch tư vấn với chuyên gia dinh dưỡng để có phác đồ cá nhân hóa.' },
    ],
  },
];

async function main() {
  console.log('🔄 Enrichment seed starting...');

  // ---------- 1. Doctor avatars (UPDATE) ----------
  const doctors = await p.doctor.findMany({ include: { user: true } });
  let avatarsUpdated = 0;
  for (let i = 0; i < doctors.length; i++) {
    const d = doctors[i];
    if (d.user.avatarUrl) continue;
    const gender = i % 2 === 0 ? 'men' : 'women';
    const idx = ((i * 7 + 23) % 99) + 1;
    const url = `https://randomuser.me/api/portraits/${gender}/${idx}.jpg`;
    await p.user.update({ where: { id: d.userId }, data: { avatarUrl: url } });
    avatarsUpdated++;
  }
  console.log(`✓ Updated ${avatarsUpdated} doctor avatars`);

  // ---------- 2. Patient avatar ----------
  const patient1 = await p.user.findUnique({ where: { email: 'patient1@gmail.com' } });
  if (!patient1) throw new Error('patient1 not found');
  if (!patient1.avatarUrl) {
    await p.user.update({
      where: { id: patient1.id },
      data: { avatarUrl: 'https://randomuser.me/api/portraits/men/42.jpg', dateOfBirth: new Date('1995-04-12') },
    });
    console.log('✓ Set patient1 avatar + DOB');
  }

  // ---------- 3. Notifications for patient1 ----------
  const existingNotifs = await p.notification.count({ where: { userId: patient1.id } });
  if (existingNotifs < 12) {
    const now = Date.now();
    await p.notification.createMany({
      data: NOTIFICATIONS.map((n) => ({
        userId: patient1.id,
        title: n.title,
        body: n.body,
        type: n.type,
        isRead: n.isRead,
        createdAt: new Date(now - n.minsAgo * 60_000),
      })),
    });
    console.log(`✓ Added ${NOTIFICATIONS.length} notifications for patient1`);
  } else {
    console.log(`⊘ patient1 already has ${existingNotifs} notifications, skipping`);
  }

  // ---------- 4. Chat sessions for patient1 ----------
  const existingChats = await p.chatSession.count({ where: { userId: patient1.id } });
  if (existingChats < 5) {
    for (const tmpl of CHAT_TEMPLATES) {
      const session = await p.chatSession.create({
        data: {
          userId: patient1.id,
          title: tmpl.title,
          createdAt: new Date(Date.now() - Math.random() * 14 * 86400_000),
          updatedAt: new Date(Date.now() - Math.random() * 7 * 86400_000),
        },
      });
      for (let i = 0; i < tmpl.msgs.length; i++) {
        await p.chatMessage.create({
          data: {
            sessionId: session.id,
            role: tmpl.msgs[i].role,
            content: tmpl.msgs[i].content,
            createdAt: new Date(session.createdAt.getTime() + i * 30_000),
          },
        });
      }
    }
    console.log(`✓ Created ${CHAT_TEMPLATES.length} chat sessions for patient1`);
  } else {
    console.log(`⊘ patient1 already has ${existingChats} chat sessions, skipping`);
  }

  // ---------- 5. More completed appointments + reviews for top doctors ----------
  // Get top 6 doctors, create 4 new past-completed appts each with random patients + reviews
  const topDoctors = await p.doctor.findMany({
    where: { status: 'ACTIVE' },
    include: { user: true, specialty: true, clinic: true },
    take: 6,
  });
  const patients = await p.user.findMany({ where: { role: 'PATIENT' } });

  let newApptCount = 0;
  let newReviewCount = 0;
  for (const d of topDoctors) {
    const existingReviews = await p.review.count({ where: { doctorId: d.id } });
    if (existingReviews >= 6) continue;  // already rich enough
    const needed = 6 - existingReviews;

    for (let i = 0; i < needed; i++) {
      const daysAgo = 7 + i * 5 + Math.floor(Math.random() * 4);
      const date = new Date(Date.now() - daysAgo * 86400_000);
      date.setHours(0, 0, 0, 0);
      const hours = [8, 9, 10, 14, 15, 16][Math.floor(Math.random() * 6)];
      const startTime = `${String(hours).padStart(2, '0')}:00`;
      const endTime = `${String(hours).padStart(2, '0')}:30`;

      // Time slot may already exist for same doctor+date+startTime — catch unique violation
      let slot;
      try {
        slot = await p.timeSlot.create({
          data: {
            doctorId: d.id,
            date,
            startTime,
            endTime,
            isBooked: true,
          },
        });
      } catch {
        continue;  // slot already taken — skip
      }

      const patient = patients[Math.floor(Math.random() * patients.length)];
      const appt = await p.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: d.id,
          timeSlotId: slot.id,
          status: 'COMPLETED',
          totalAmount: Number(d.consultationFee),
          createdAt: new Date(date.getTime() - 2 * 86400_000),
          updatedAt: date,
        },
      });
      newApptCount++;

      const rating = Math.random() > 0.15 ? 5 : 4;  // 85% chance 5-star
      const comment = REVIEW_COMMENTS[(newReviewCount * 3) % REVIEW_COMMENTS.length];
      await p.review.create({
        data: {
          appointmentId: appt.id,
          patientId: patient.id,
          doctorId: d.id,
          rating,
          comment,
          createdAt: new Date(date.getTime() + 86400_000),
        },
      });
      newReviewCount++;
    }
  }
  console.log(`✓ Added ${newApptCount} completed appointments + ${newReviewCount} reviews across ${topDoctors.length} top doctors`);

  // (Doctor.averageRating / totalReviews are computed via aggregate on backend, not stored fields)

  // ---------- 7. Prescriptions for patient1 ----------
  const existingPx = await p.prescription.count({ where: { userId: patient1.id } });
  if (existingPx < 3) {
    const doctor1 = topDoctors[0];
    await p.prescription.createMany({
      data: [
        {
          userId: patient1.id,
          doctorId: doctor1.id,
          imageUrl: 'https://images.unsplash.com/photo-1583912086096-8c60d75a53f9?w=600&q=80',
          ocrData: {
            medications: [
              { name: 'Paracetamol 500mg', dose: '1 viên', frequency: '3 lần/ngày sau ăn', duration: '5 ngày' },
              { name: 'Vitamin C 1000mg', dose: '1 viên', frequency: '1 lần/ngày sáng', duration: '10 ngày' },
            ],
            issuedDate: '2026-05-15',
          },
          createdAt: new Date(Date.now() - 9 * 86400_000),
        },
        {
          userId: patient1.id,
          doctorId: doctor1.id,
          imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&q=80',
          ocrData: {
            medications: [
              { name: 'Amoxicillin 500mg', dose: '1 viên', frequency: '3 lần/ngày', duration: '7 ngày' },
              { name: 'Loratadine 10mg', dose: '1 viên', frequency: '1 lần/ngày tối', duration: '7 ngày' },
            ],
            issuedDate: '2026-04-28',
          },
          createdAt: new Date(Date.now() - 26 * 86400_000),
        },
        {
          userId: patient1.id,
          doctorId: doctor1.id,
          imageUrl: 'https://images.unsplash.com/photo-1626516026045-9d23929f5e1e?w=600&q=80',
          ocrData: {
            medications: [
              { name: 'Omeprazole 20mg', dose: '1 viên', frequency: '1 lần/ngày trước ăn 30 phút', duration: '14 ngày' },
            ],
            issuedDate: '2026-04-10',
          },
          createdAt: new Date(Date.now() - 44 * 86400_000),
        },
      ],
    });
    console.log('✓ Added 3 prescriptions for patient1');
  } else {
    console.log(`⊘ patient1 already has ${existingPx} prescriptions, skipping`);
  }

  // ---------- 8. Additional health metrics for patient1 (varied series last 30 days) ----------
  const metricsCount = await p.healthMetric.count({ where: { userId: patient1.id } });
  if (metricsCount < 50) {
    const series: Array<{ type: HealthMetricType; base: number; jitter: number; days: number }> = [
      { type: 'BLOOD_PRESSURE_SYSTOLIC', base: 125, jitter: 12, days: 30 },
      { type: 'BLOOD_PRESSURE_DIASTOLIC', base: 80, jitter: 8, days: 30 },
      { type: 'HEART_RATE', base: 75, jitter: 10, days: 30 },
      { type: 'WEIGHT', base: 68.5, jitter: 1.2, days: 30 },
      { type: 'BLOOD_SUGAR', base: 5.8, jitter: 0.6, days: 30 },
    ];
    const rows: Array<{ userId: string; type: HealthMetricType; value: number; recordedAt: Date }> = [];
    for (const s of series) {
      for (let d = 0; d < s.days; d++) {
        rows.push({
          userId: patient1.id,
          type: s.type,
          value: Number((s.base + (Math.random() - 0.5) * 2 * s.jitter).toFixed(2)),
          recordedAt: new Date(Date.now() - d * 86400_000),
        });
      }
    }
    await p.healthMetric.createMany({ data: rows });
    console.log(`✓ Added ${rows.length} health metrics (5 series × 30 days) for patient1`);
  } else {
    console.log(`⊘ patient1 already has ${metricsCount} health metrics, skipping`);
  }

  await p.$disconnect();
  console.log('\n✅ Enrichment complete!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
