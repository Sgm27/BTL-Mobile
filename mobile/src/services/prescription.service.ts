import { api, extractData } from './api';

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

export interface Prescription {
  id: string;
  userId: string;
  doctorId: string | null;
  imageUrl: string;
  ocrData: {
    medicines: OcrMedicine[];
    rawText?: string;
  } | null;
  createdAt: string;
  reminders?: Array<{
    id: string;
    medicineName: string;
    dosage: string;
    isActive: boolean;
  }>;
}

export async function ocrPrescription(imageUri: string): Promise<OcrResult> {
  const formData = new FormData();
  const filename = imageUri.split('/').pop() ?? 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('image', {
    uri: imageUri,
    name: filename,
    type,
  } as unknown as Blob);

  const response = await api.post('/prescriptions/ocr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // OCR can take longer
  });
  return extractData<OcrResult>(response);
}

export async function savePrescription(
  imageUrl: string,
  ocrData: { medicines: OcrMedicine[]; rawText?: string }
): Promise<Prescription> {
  const response = await api.post('/prescriptions', { imageUrl, ocrData });
  return extractData<Prescription>(response);
}

export async function getMyPrescriptions(params?: {
  page?: number;
  limit?: number;
}): Promise<Prescription[]> {
  const response = await api.get('/prescriptions/me', { params });
  return extractData<Prescription[]>(response);
}
