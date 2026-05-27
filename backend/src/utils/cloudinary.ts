import { env } from '../config/env';

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

/**
 * Upload a buffer to Cloudinary. If Cloudinary env vars are empty,
 * returns a mock URL for demo/development purposes.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder = 'prescriptions'
): Promise<CloudinaryUploadResult> {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = env;

  // If Cloudinary is not configured, return a mock URL
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    const mockId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    console.warn('Cloudinary not configured — returning mock URL');
    return {
      secure_url: `https://res.cloudinary.com/demo/image/upload/${folder}/${mockId}.jpg`,
      public_id: `${folder}/${mockId}`,
    };
  }

  // Build multipart form data for Cloudinary upload API
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Generate signature
  const crypto = await import('crypto');
  const signatureString = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

  const formData = new FormData();
  formData.append('file', new Blob([buffer]), 'prescription.jpg');
  formData.append('folder', folder);
  formData.append('timestamp', timestamp);
  formData.append('api_key', CLOUDINARY_API_KEY);
  formData.append('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload failed (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as CloudinaryUploadResult;
  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
  };
}
