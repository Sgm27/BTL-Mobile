import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { Role } from '@prisma/client';
import {
  getDashboard,
  listDoctors,
  approveDoctor,
  rejectDoctor,
  listClinics,
  createClinic,
  updateClinic,
  deleteClinic,
  createSpecialty,
  updateSpecialty,
  listServices,
  createService,
  updateService,
  deleteService,
  generateWorkSchedules,
} from './admin.controller';

export const adminRouter = Router();

// All admin routes require authentication + ADMIN role
adminRouter.use(authenticate, authorize(Role.ADMIN));

// Dashboard
adminRouter.get('/dashboard', getDashboard);

// Doctor management
adminRouter.get('/doctors', listDoctors);
adminRouter.put('/doctors/:id/approve', approveDoctor);
adminRouter.put('/doctors/:id/reject', rejectDoctor);

// Clinic management
adminRouter.get('/clinics', listClinics);
adminRouter.post('/clinics', createClinic);
adminRouter.put('/clinics/:id', updateClinic);
adminRouter.delete('/clinics/:id', deleteClinic);

// Specialty management
adminRouter.post('/specialties', createSpecialty);
adminRouter.put('/specialties/:id', updateSpecialty);

// Service management
adminRouter.get('/services', listServices);
adminRouter.post('/services', createService);
adminRouter.put('/services/:id', updateService);
adminRouter.delete('/services/:id', deleteService);

// Work schedule generation
adminRouter.post('/work-schedules', generateWorkSchedules);
