import { Router } from 'express';
import { nearbyClinics, geocode, reverseGeocodeHandler } from './maps.controller';

export const mapsRouter = Router();

mapsRouter.get('/clinics/nearby', nearbyClinics);
mapsRouter.get('/geocode', geocode);
mapsRouter.get('/reverse-geocode', reverseGeocodeHandler);
