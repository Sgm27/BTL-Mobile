import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@utils/api-response';
import * as adminService from './admin.service';
import {
  idParamSchema,
  rejectDoctorSchema,
  createClinicSchema,
  updateClinicSchema,
  createSpecialtySchema,
  updateSpecialtySchema,
  createServiceSchema,
  updateServiceSchema,
  generateSchedulesSchema,
  listDoctorsQuerySchema,
} from './admin.schemas';

// ── Dashboard ──────────────────────────────────────────────

export async function getDashboard(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await adminService.getDashboard();
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

// ── Doctors ────────────────────────────────────────────────

export async function listDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = listDoctorsQuerySchema.parse(req.query);
    const data = await adminService.listDoctors(status);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function approveDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = idParamSchema.parse(req.params);
    const data = await adminService.approveDoctor(id);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function rejectDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = idParamSchema.parse(req.params);
    const { reason } = rejectDoctorSchema.parse(req.body);
    const data = await adminService.rejectDoctor(id, reason);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

// ── Clinics ────────────────────────────────────────────────

export async function listClinics(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await adminService.listClinics();
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function createClinic(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createClinicSchema.parse(req.body);
    const data = await adminService.createClinic(body);
    sendSuccess(res, data, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateClinic(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = idParamSchema.parse(req.params);
    const body = updateClinicSchema.parse(req.body);
    const data = await adminService.updateClinic(id, body);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function deleteClinic(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = idParamSchema.parse(req.params);
    await adminService.deleteClinic(id);
    sendSuccess(res, { deleted: true });
  } catch (error) {
    next(error);
  }
}

// ── Specialties ────────────────────────────────────────────

export async function createSpecialty(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createSpecialtySchema.parse(req.body);
    const data = await adminService.createSpecialty(body);
    sendSuccess(res, data, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateSpecialty(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = idParamSchema.parse(req.params);
    const body = updateSpecialtySchema.parse(req.body);
    const data = await adminService.updateSpecialty(id, body);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

// ── Services ───────────────────────────────────────────────

export async function listServices(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await adminService.listServices();
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function createService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createServiceSchema.parse(req.body);
    const data = await adminService.createService(body);
    sendSuccess(res, data, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = idParamSchema.parse(req.params);
    const body = updateServiceSchema.parse(req.body);
    const data = await adminService.updateService(id, body);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function deleteService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = idParamSchema.parse(req.params);
    await adminService.deleteService(id);
    sendSuccess(res, { deleted: true });
  } catch (error) {
    next(error);
  }
}

// ── Work Schedules ─────────────────────────────────────────

export async function generateWorkSchedules(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { year, month } = generateSchedulesSchema.parse(req.body);
    const data = await adminService.generateWorkSchedules(year, month);
    sendSuccess(res, data, 201);
  } catch (error) {
    next(error);
  }
}
