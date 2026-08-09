import { GOOGLE_MAPS_API_KEY } from '@/constants/map';
import type { Location, PlacePrediction, RouteInfo } from '@/types';

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';
const DIRECTIONS_BASE = 'https://maps.googleapis.com/maps/api/directions/json';

/**
 * Fetch place autocomplete predictions via Google Places REST API.
 * Works on native (iOS/Android) — no CORS restriction.
 */
export async function fetchPlacePredictions(
  input: string,
  location?: Location
): Promise<PlacePrediction[]> {
  if (!input || input.length < 2) return [];

  let url = `${PLACES_BASE}/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}`;

  if (location) {
    url += `&location=${location.latitude},${location.longitude}&radius=50000`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.predictions ?? [];
  } catch (error) {
    console.error('Places autocomplete error:', error);
    return [];
  }
}

/**
 * Get place details (lat/lng) from a place_id via REST.
 */
export async function fetchPlaceDetails(
  placeId: string
): Promise<Location | null> {
  const url = `${PLACES_BASE}/details/json?place_id=${placeId}&fields=geometry&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const loc = data.result?.geometry?.location;
    if (loc) {
      return { latitude: loc.lat, longitude: loc.lng };
    }
  } catch (error) {
    console.error('Place details error:', error);
  }

  return null;
}

/**
 * Fetch directions between two points via REST.
 * Returns decoded polyline coordinates, distance, and duration.
 */
export async function fetchDirections(
  origin: Location,
  destination: Location
): Promise<RouteInfo | null> {
  const url = `${DIRECTIONS_BASE}?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const leg = route.legs[0];
      const points = decodePolyline(route.overview_polyline.points);

      return {
        coordinates: points,
        distance: leg.distance.text,
        duration: leg.duration.text,
      };
    }
  } catch (error) {
    console.error('Directions error:', error);
  }

  return null;
}

/**
 * Decode a Google Maps encoded polyline string into an array of coordinates.
 */
function decodePolyline(encoded: string): Location[] {
  const points: Location[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
}
