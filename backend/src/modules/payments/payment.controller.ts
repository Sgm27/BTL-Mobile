import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/app-error';
import { sendSuccess } from '../../utils/api-response';
import {
  createPaymentSchema,
  paymentIdParamSchema,
  vnpayQuerySchema,
} from './payment.schemas';
import {
  createPayment,
  getPaymentHistory,
  getPaymentById,
  handleVnpayIPN,
  handleVnpayReturn,
} from './payment.service';

export async function createPaymentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = req.user;
    if (!user) throw AppError.unauthorized();

    const { appointmentId, method } = createPaymentSchema.parse(req.body);
    const payment = await createPayment(user.userId, appointmentId, method);
    sendSuccess(res, payment, 201);
  } catch (error) {
    next(error);
  }
}

export async function getPaymentHistoryController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = req.user;
    if (!user) throw AppError.unauthorized();

    const payments = await getPaymentHistory(user.userId);
    sendSuccess(res, payments);
  } catch (error) {
    next(error);
  }
}

export async function getPaymentByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = req.user;
    if (!user) throw AppError.unauthorized();

    const { id } = paymentIdParamSchema.parse(req.params);
    const payment = await getPaymentById(user.userId, id);
    sendSuccess(res, payment);
  } catch (error) {
    next(error);
  }
}

export async function vnpayIPNController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = vnpayQuerySchema.parse(req.query);
    const result = await handleVnpayIPN(query as Record<string, string>);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function vnpayReturnController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = vnpayQuerySchema.parse(req.query);
    const result = await handleVnpayReturn(query as Record<string, string>);

    // Return an HTML page for WebView to detect success
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: ${result.success ? 'linear-gradient(135deg, #34C759, #248A3D)' : 'linear-gradient(135deg, #FF3B30, #D70015)'};
              color: white;
              text-align: center;
            }
            .container { padding: 32px; }
            .icon { font-size: 64px; margin-bottom: 16px; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            p { font-size: 16px; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">${result.success ? '✅' : '❌'}</div>
            <h1>${result.success ? 'Payment Successful!' : 'Payment Failed'}</h1>
            <p>${result.message}</p>
            <p id="status" data-success="${result.success}" data-payment-id="${result.success ? result.paymentId : ''}"></p>
          </div>
          <script>
            // Signal to React Native WebView
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PAYMENT_RESULT',
                success: ${result.success},
                paymentId: '${result.success ? result.paymentId : ''}',
              }));
            }
          </script>
        </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    next(error);
  }
}
