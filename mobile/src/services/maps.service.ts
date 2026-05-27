import { api, extractData } from './api';

export interface NearbyClinic {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  imageUrl: string | null;
  openingHours: string | null;
  distance: number;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export async function getNearbyClinics(params: {
  lat: number;
  lng: number;
  radius?: number;
  specialtyId?: string;
}): Promise<NearbyClinic[]> {
  const response = await api.get('/maps/clinics/nearby', { params });
  return extractData<NearbyClinic[]>(response);
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const response = await api.get('/maps/geocode', { params: { address } });
  return extractData<GeocodeResult>(response);
}
