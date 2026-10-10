import { LocationCoordinates } from '../types';

/**
 * Standard Haversine formula to compute great-circle distance between two points in meters.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export const UNLOCK_RADIUS_METERS = 150;

export function isWithinUnlockRadius(
  userPos: LocationCoordinates,
  targetPos: LocationCoordinates,
  radiusMeters: number = UNLOCK_RADIUS_METERS
): boolean {
  const distance = calculateDistanceMeters(
    userPos.latitude,
    userPos.longitude,
    targetPos.latitude,
    targetPos.longitude
  );
  return distance <= radiusMeters;
}

export function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 10) return 'Right here';
  if (distanceMeters < 1000) return `${distanceMeters} m away`;
  const km = (distanceMeters / 1000).toFixed(1);
  return `${km} km away`;
}

export interface DemoLocationPreset {
  id: string;
  name: string;
  description: string;
  coordinates: LocationCoordinates;
}

// Centered on Kerala (Malappuram / Kozhikode)
export const DEFAULT_DEMO_COORDINATES: LocationCoordinates = {
  latitude: 11.0722,
  longitude: 76.0740,
};

export const DEMO_LOCATION_PRESETS: DemoLocationPreset[] = [
  {
    id: 'kottakunnu-malappuram',
    name: 'Kottakunnu Hilltop, Malappuram',
    description: 'Scenic garden & park walkway (Center)',
    coordinates: { latitude: 11.0695, longitude: 76.0785 },
  },
  {
    id: 'malappuram-downhill',
    name: 'Malappuram Downhill (Unlocked Proximity)',
    description: '70m from Sulaimani stall & library',
    coordinates: { latitude: 11.0718, longitude: 76.0748 },
  },
  {
    id: 'kozhikode-beach',
    name: 'Kozhikode Beach & Promenade',
    description: 'Sea breeze & pickled fruit stalls (Calicut)',
    coordinates: { latitude: 11.2588, longitude: 75.7704 },
  },
  {
    id: 'mananchira-square',
    name: 'Mananchira Square, Kozhikode',
    description: 'Palace pond, heritage trees & walkway',
    coordinates: { latitude: 11.2514, longitude: 75.7804 },
  },
  {
    id: 'kadalundi-bird-sanctuary',
    name: 'Kadalundi Sanctuary (Farther Out - Locked)',
    description: 'Mangrove estuary (Tests locked 150m radius)',
    coordinates: { latitude: 11.1278, longitude: 75.8315 },
  },
  {
    id: 'nilambur-teak',
    name: 'Teak Museum Trail, Nilambur',
    description: 'Forest reserve & canopy path',
    coordinates: { latitude: 11.2825, longitude: 76.2482 },
  },
];
