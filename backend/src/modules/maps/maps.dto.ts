import { z } from 'zod';

// --- Query Schemas ---

export const nearbyClinicsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(100).default(20),
  specialtyId: z.string().uuid().optional(),
});

export type NearbyClinicsQuery = z.infer<typeof nearbyClinicsQuerySchema>;

export const geocodeQuerySchema = z.object({
  address: z.string().trim().min(1),
});

export type GeocodeQuery = z.infer<typeof geocodeQuerySchema>;

export const reverseGeocodeQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export type ReverseGeocodeQuery = z.infer<typeof reverseGeocodeQuerySchema>;

// --- Response Types ---

export interface NearbyClinicDto {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  imageUrl: string | null;
  openingHours: string | null;
  distance: number; // km
}

export interface GeocodeResultDto {
  lat: number;
  lng: number;
  displayName: string;
}

export interface ReverseGeocodeResultDto {
  address: string;
  displayName: string;
}
