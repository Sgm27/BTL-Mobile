import sharp from 'sharp';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { visionAnalysis } from '../../utils/ai-client';
import type { SavePrescriptionInput, GetPrescriptionsQuery } from './prescription.schemas';

export interface OcrMedicine {
  name: string;
  dosage: string;
  quantity: string;
  frequency: string;
}

export interface OcrResult {
  imageUrl: string;
  medicines: OcrMedicine[];
  rawText: string;
}

const OCR_PROMPT = `Analyze this medical prescription image. Extract all medicines with:
- name: medicine name
- dosage: strength (e.g., 500mg)
- quantity: number of pills/units
- frequency: how often to take (e.g., 2 times/day after meals)
Return as JSON: { "medicines": [{ "name": "...", "dosage": "...", "quantity": "...", "frequency": "..." }], "rawText": "full text" }
Respond ONLY with valid JSON, no markdown.`;

export class PrescriptionService {
  static async ocrPrescription(imageBuffer: Buffer): Promise<OcrResult> {
    console.log('[ocr] received image, raw size=', imageBuffer.length, 'bytes');

    // Resize + recompress before encoding to base64. Phone photos are 1-3 MB
    // raw, which becomes a 4 MB+ JSON payload after base64 — exceeding most
    // AI provider request limits. 1024px @ q70 brings it down to ~100-200 KB.
    let processed: Buffer;
    try {
      processed = await sharp(imageBuffer)
        .rotate()
        .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer();
      console.log('[ocr] resized to', processed.length, 'bytes');
    } catch (resizeErr) {
      console.warn('[ocr] sharp resize failed, sending original:', resizeErr);
      processed = imageBuffer;
    }

    const dataUri = `data:image/jpeg;base64,${processed.toString('base64')}`;
    console.log('[ocr] data URI length=', dataUri.length, 'chars');

    let aiResponse: string;
    try {
      aiResponse = await visionAnalysis(dataUri, OCR_PROMPT, { model: env.AI_OCR_MODEL });
      console.log('[ocr] AI raw response (first 500):', aiResponse.slice(0, 500));
    } catch (err) {
      console.error('[ocr] AI vision call failed:', err);
      throw err;
    }

    // Parse JSON from response (handle possible markdown wrapping)
    const jsonStr = aiResponse.replace(/```json?\n?/g, '').replace(/```/g, '').trim();

    let parsed: { medicines: OcrMedicine[]; rawText?: string };
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.warn('[ocr] JSON parse failed, returning raw text. err=', parseErr);
      parsed = {
        medicines: [],
        rawText: aiResponse,
      };
    }

    return {
      imageUrl: 'local://prescription-scan',
      medicines: parsed.medicines ?? [],
      rawText: parsed.rawText ?? aiResponse,
    };
  }

  static async savePrescription(userId: string, input: SavePrescriptionInput) {
    const prescription = await prisma.prescription.create({
      data: {
        userId,
        imageUrl: input.imageUrl,
        ocrData: input.ocrData as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
    });

    return prescription;
  }

  static async getMyPrescriptions(userId: string, query: GetPrescriptionsQuery) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          reminders: {
            where: { isActive: true },
            select: {
              id: true,
              medicineName: true,
              dosage: true,
              isActive: true,
            },
          },
        },
      }),
      prisma.prescription.count({ where: { userId } }),
    ]);

    return {
      prescriptions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
