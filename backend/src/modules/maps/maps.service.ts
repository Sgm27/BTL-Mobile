import axios from 'axios';
import { prisma } from '@config/database';
import { AppError } from '@utils/app-error';
import { haversineDistance } from './maps.utils';
import type {
  NearbyClinicsQuery,
  NearbyClinicDto,
  GeocodeQuery,
  GeocodeResultDto,
  ReverseGeocodeQuery,
  ReverseGeocodeResultDto,
} from './maps.dto';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'healthcare-booking-app/1.0';

export async function getNearbyClinics(query: NearbyClinicsQuery): Promise<NearbyClinicDto[]> {
  const { lat, lng, radius, specialtyId } = query;

  const clinics = await prisma.clinic.findMany({
    where: {
      deletedAt: null,
      lat: { not: null },
      lng: { not: null },
      ...(specialtyId
        ? {
            doctors: {
              some: {
                specialtyId,
                deletedAt: null,
                status: 'ACTIVE',
              },
            },
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      address: true,
      lat: true,
      lng: true,
      phone: true,
      imageUrl: true,
      openingHours: true,
    },
  });

  const results: NearbyClinicDto[] = [];

  for (const clinic of clinics) {
    const clinicLat = Number(clinic.lat);
    const clinicLng = Number(clinic.lng);
    const distance = haversineDistance(lat, lng, clinicLat, clinicLng);

    if (distance <= radius) {
      results.push({
        id: clinic.id,
        name: clinic.name,
        address: clinic.address,
        lat: clinicLat,
        lng: clinicLng,
        phone: clinic.phone,
        imageUrl: clinic.imageUrl,
        openingHours: clinic.openingHours,
        distance,
      });
    }
  }

  results.sort((a, b) => a.distance - b.distance);
  return results;
}

export async function geocodeAddress(query: GeocodeQuery): Promise<GeocodeResultDto> {
  try {
    const response = await axios.get(`${NOMINATIM_BASE}/search`, {
      params: {
        q: query.address,
        format: 'json',
        limit: 1,
      },
      headers: { 'User-Agent': USER_AGENT },
      timeout: 5000,
    });

    const results = response.data;
    if (!Array.isArray(results) || results.length === 0) {
      throw AppError.notFound('Address not found');
    }

    const first = results[0];
    return {
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
      displayName: first.display_name,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(503, 'GEOCODING_UNAVAILABLE', 'Geocoding service unavailable');
  }
}

export async function reverseGeocode(query: ReverseGeocodeQuery): Promise<ReverseGeocodeResultDto> {
  try {
    const response = await axios.get(`${NOMINATIM_BASE}/reverse`, {
      params: {
        lat: query.lat,
        lon: query.lng,
        format: 'json',
      },
      headers: { 'User-Agent': USER_AGENT },
      timeout: 5000,
    });

    const data = response.data;
    if (data.error) {
      throw AppError.notFound('Location not found');
    }

    return {
      address: data.address
        ? [data.address.road, data.address.suburb, data.address.city, data.address.country]
            .filter(Boolean)
            .join(', ')
        : data.display_name,
      displayName: data.display_name,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(503, 'GEOCODING_UNAVAILABLE', 'Geocoding service unavailable');
  }
}
