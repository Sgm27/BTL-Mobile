import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  AI_PROVIDER: z.enum(['openrouter', 'gemini', 'openai']).default('openrouter'),
  AI_API_KEY: z.string().default(''),
  AI_BASE_URL: z.string().default('https://openrouter.ai/api/v1'),
  AI_MODEL: z.string().default('google/gemini-2.0-flash-001'),
  AI_OCR_MODEL: z.string().default('gemini/gemini-3-flash-preview'),

  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),

  VNPAY_TMN_CODE: z.string().default(''),
  VNPAY_HASH_SECRET: z.string().default(''),
  VNPAY_URL: z.string().default('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
  VNPAY_RETURN_URL: z.string().default('http://localhost:3000/api/v1/payments/vnpay/return'),

  MOMO_PARTNER_CODE: z.string().default(''),
  MOMO_ACCESS_KEY: z.string().default(''),
  MOMO_SECRET_KEY: z.string().default(''),
  MOMO_ENDPOINT: z.string().default('https://test-payment.momo.vn/v2/gateway/api'),

  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),

  GOOGLE_MAPS_API_KEY: z.string().default(''),
  GOOGLE_API_KEY: z.string().default(''),

  APP_URL: z.string().default('http://localhost:3000'),
  MOBILE_SCHEME: z.string().default('btlhealthcare'),
});

export const env = envSchema.parse(process.env);
