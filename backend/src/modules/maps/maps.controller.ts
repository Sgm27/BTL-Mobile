import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@utils/api-response';
import {
  nearbyClinicsQuerySchema,
  geocodeQuerySchema,
  reverseGeocodeQuerySchema,
} from './maps.dto';
import {
  getNearbyClinics,
  geocodeAddress,
  reverseGeocode,
} from './maps.service';

export async function nearbyClinics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = nearbyClinicsQuerySchema.parse(req.query);
    const results = await getNearbyClinics(query);
    sendSuccess(res, results);
  } catch (error) {
    next(error);
  }
}

export async function geocode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = geocodeQuerySchema.parse(req.query);
    const result = await geocodeAddress(query);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function reverseGeocodeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = reverseGeocodeQuerySchema.parse(req.query);
    const result = await reverseGeocode(query);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
