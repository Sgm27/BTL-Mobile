import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import { prisma } from './config/database';
import { authRoutes } from './modules/auth/auth.routes';
import { appointmentsRouter } from './modules/appointments/appointment.routes';
import { clinicRouter } from './modules/clinics/clinic.routes';
import { doctorRouter } from './modules/doctors/doctor.routes';
import { reviewsRouter } from './modules/reviews/review.routes';
import { schedulesRouter } from './modules/schedules/schedule.routes';
import { specialtyRouter } from './modules/specialties/specialty.routes';
import { usersRoutes } from './modules/users/users.routes';
import { aiRoutes } from './modules/ai/ai.routes';
import { setupVoiceChatWs } from './modules/ai/voice-chat.gateway';
import { healthMetricsRouter } from './modules/health/health.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { paymentRoutes } from './modules/payments/payment.routes';
import { prescriptionRoutes } from './modules/prescriptions/prescription.routes';
import { notificationRoutes } from './modules/notifications/notification.routes';
import { NotificationScheduler } from './modules/notifications/notification.scheduler';
import { mapsRouter } from './modules/maps/maps.routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/doctors', doctorRouter);
app.use('/api/v1/clinics', clinicRouter);
app.use('/api/v1/specialties', specialtyRouter);
app.use('/api/v1/appointments', appointmentsRouter);
app.use('/api/v1/schedules', schedulesRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/health-metrics', healthMetricsRouter);

// Public services list (authenticated users can view)
app.get('/api/v1/services', async (_req, res, next) => {
  try {
    const services = await prisma.service.findMany({
      where: { deletedAt: null },
      orderBy: { category: 'asc' },
    });
    res.json({ success: true, data: services });
  } catch (err) {
    next(err);
  }
});

app.use('/api/v1/admin', adminRouter);

app.use('/api/v1/payments', paymentRoutes);

app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/maps', mapsRouter);

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function main() {
  try {
    await prisma.$connect();
    console.log('Database connected');

    NotificationScheduler.start();

    const httpServer = createServer(app);
    setupVoiceChatWs(httpServer);

    httpServer.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

export default app;
