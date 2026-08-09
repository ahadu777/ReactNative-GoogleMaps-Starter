import type { Driver, Location } from '@/types';

/**
 * Calculate the Haversine distance between two coordinates in kilometers.
 */
export function haversineDistance(a: Location, b: Location): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinDLng * sinDLng;

  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

const DRIVER_NAMES = [
  'Abebe', 'Kebede', 'Tadesse', 'Frehiwot', 'Meron',
  'Solomon', 'Dawit', 'Yonas', 'Tigist', 'Sara',
  'Bekele', 'Mulugeta', 'Haimanot', 'Fitsum', 'Liya',
  'Tsegaye', 'Dereje', 'Alem', 'Biruk', 'Nahom',
];

/**
 * Generate N random drivers around a center location.
 * Spread within ~3km radius.
 */
export function generateDrivers(center: Location, count: number = 10): Driver[] {
  const drivers: Driver[] = [];
  const spread = 0.025; // ~2.5km spread

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * spread;

    drivers.push({
      id: `driver-${i + 1}`,
      name: DRIVER_NAMES[i % DRIVER_NAMES.length],
      location: {
        latitude: center.latitude + distance * Math.sin(angle),
        longitude: center.longitude + distance * Math.cos(angle),
      },
      status: 'idle',
    });
  }

  return drivers;
}

/**
 * Find the nearest idle driver to a user location.
 */
export function findNearestDriver(
  userLocation: Location,
  drivers: Driver[]
): Driver | null {
  let nearest: Driver | null = null;
  let minDistance = Infinity;

  for (const driver of drivers) {
    if (driver.status !== 'idle') continue;

    const dist = haversineDistance(userLocation, driver.location);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = driver;
    }
  }

  return nearest;
}

/**
 * Interpolate position between two points for animation.
 */
export function interpolatePosition(
  from: Location,
  to: Location,
  progress: number
): Location {
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * progress,
    longitude: from.longitude + (to.longitude - from.longitude) * progress,
  };
}

/**
 * Format distance in a human-readable way.
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}
