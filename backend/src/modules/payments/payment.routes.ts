import { Router, RequestHandler } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import {
  createPaymentController,
  getPaymentHistoryController,
  getPaymentByIdController,
  vnpayIPNController,
  vnpayReturnController,
} from './payment.controller';

const asyncHandler = (handler: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

export const paymentRoutes = Router();

// Authenticated routes
paymentRoutes.post('/create', authenticate, asyncHandler(createPaymentController));
paymentRoutes.get('/me', authenticate, asyncHandler(getPaymentHistoryController));
paymentRoutes.get('/vnpay/return', asyncHandler(vnpayReturnController));
paymentRoutes.post('/vnpay/ipn', asyncHandler(vnpayIPNController));
paymentRoutes.get('/:id', authenticate, asyncHandler(getPaymentByIdController));
