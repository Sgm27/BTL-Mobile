import { Router, RequestHandler } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/auth.middleware';
import { PrescriptionController } from './prescription.controller';

const asyncHandler = (handler: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export const prescriptionRoutes = Router();

// POST /prescriptions/ocr — upload image and OCR extract
prescriptionRoutes.post(
  '/ocr',
  authenticate,
  upload.single('image'),
  asyncHandler(PrescriptionController.ocrPrescription)
);

// POST /prescriptions — save prescription with OCR data
prescriptionRoutes.post(
  '/',
  authenticate,
  asyncHandler(PrescriptionController.savePrescription)
);

// GET /prescriptions/me — list my prescriptions
prescriptionRoutes.get(
  '/me',
  authenticate,
  asyncHandler(PrescriptionController.getMyPrescriptions)
);
