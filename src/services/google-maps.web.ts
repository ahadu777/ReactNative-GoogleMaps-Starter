import { GOOGLE_MAPS_API_KEY } from '@/constants/map';
import type { Location, PlacePrediction, RouteInfo } from '@/types';

declare global {
  interface Window {
    _gmapsLoaded?: boolean;
    _gmapsLoading?: Promise<void>;
  }
}

// Fallback dataset for web preview if Google APIs are unactivated/restricted
const FALLBACK_PLACES: { description: string; main: string; secondary: string; location: Location }[] = [
  { description: 'Bole International Airport, Addis Ababa', main: 'Bole International Airport', secondary: 'Bole, Addis Ababa', location: { latitude: 9.0054, longitude: 38.7997 } },
  { description: 'Bole Medhanialem Church, Addis Ababa', main: 'Bole Medhanialem', secondary: 'Bole, Addis Ababa', location: { latitude: 9.0003, longitude: 38.7845 } },
  { description: 'Bole Atlas, Addis Ababa', main: 'Bole Atlas', secondary: 'Bole, Addis Ababa', location: { latitude: 9.0065, longitude: 38.7792 } },
  { description: 'Bole Rwanda, Addis Ababa', main: 'Bole Rwanda', secondary: 'Bole, Addis Ababa', location: { latitude: 8.9912, longitude: 38.7750 } },
  { description: 'Bole Michael, Addis Ababa', main: 'Bole Michael', secondary: 'Bole, Addis Ababa', location: { latitude: 8.9810, longitude: 38.7711 } },
  { description: 'Meskel Square, Addis Ababa', main: 'Meskel Square', secondary: 'Kirkos, Addis Ababa', location: { latitude: 9.0104, longitude: 38.7612 } },
  { description: 'Kazanchis, Addis Ababa', main: 'Kazanchis', secondary: 'Kirkos, Addis Ababa', location: { latitude: 9.0192, longitude: 38.7668 } },
  { description: 'Piassa, Addis Ababa', main: 'Piassa', secondary: 'Arada, Addis Ababa', location: { latitude: 9.0354, longitude: 38.7523 } },
  { description: 'Sarbet, Addis Ababa', main: 'Sarbet', secondary: 'Nifas Silk-Lafto, Addis Ababa', location: { latitude: 8.9950, longitude: 38.7360 } },
  { description: 'Mexico Square, Addis Ababa', main: 'Mexico Square', secondary: 'Addis Ababa', location: { latitude: 9.0108, longitude: 38.7447 } },
  { description: 'Addis Ababa University, Sidist Kilo', main: 'Addis Ababa University', secondary: 'Sidist Kilo, Addis Ababa', location: { latitude: 9.0468, longitude: 38.7592 } },
  { description: 'Entoto Park, Addis Ababa', main: 'Entoto Park', secondary: 'Gullele, Addis Ababa', location: { latitude: 9.0811, longitude: 38.7620 } },
];

/**
 * Dynamically load the Google Maps JS API.
 */
function loadGoogleMapsScript(): Promise<void> {
  if (window._gmapsLoaded) return Promise.resolve();
  if (window._gmapsLoading) return window._gmapsLoading;

  window._gmapsLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?loading=async&key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window._gmapsLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return window._gmapsLoading;
}

/**
 * Fetch place predictions.
 * 1. Tries AutocompleteService (JS API Places library)
 * 2. Tries AutocompleteSuggestion (New Places API v1)
 * 3. Falls back to local Addis Ababa places on 403 / error
 */
export async function fetchPlacePredictions(
  input: string,
  location?: Location
): Promise<PlacePrediction[]> {
  if (!input || input.length < 2) return [];

  try {
    await loadGoogleMapsScript();

    if (typeof google !== 'undefined' && google.maps?.places) {
      // Primary: AutocompleteService (uses Maps JavaScript API key)
      const results = await new Promise<PlacePrediction[]>((resolve) => {
        try {
          const service = new google.maps.places.AutocompleteService();
          const request: google.maps.places.AutocompletionRequest = {
            input,
            ...(location && {
              location: new google.maps.LatLng(location.latitude, location.longitude),
              radius: 50000,
            }),
          };

          service.getPlacePredictions(request, (predictions, status) => {
            if (status !== 'OK' || !predictions || predictions.length === 0) {
              resolve([]);
              return;
            }

            resolve(
              predictions.map((p: google.maps.places.AutocompletePrediction) => ({
                place_id: p.place_id,
                description: p.description,
                structured_formatting: {
                  main_text: p.structured_formatting.main_text,
                  secondary_text: p.structured_formatting.secondary_text ?? '',
                },
              }))
            );
          });
        } catch (_e) {
          resolve([]);
        }
      });

      if (results.length > 0) return results;

      // Secondary: Try AutocompleteSuggestion (Places API New) if available
      const placesLib = (google.maps as any).places;
      if (placesLib?.AutocompleteSuggestion) {
        try {
          const request: Record<string, unknown> = { input };
          if (location) {
            request.locationBias = new google.maps.LatLng(location.latitude, location.longitude);
          }
          const { suggestions } = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
          if (suggestions && suggestions.length > 0) {
            return suggestions.map((s: any) => ({
              place_id: s.placePrediction?.placeId ?? '',
              description: s.placePrediction?.text?.text ?? '',
              structured_formatting: {
                main_text: s.placePrediction?.mainText?.text ?? s.placePrediction?.text?.text ?? '',
                secondary_text: s.placePrediction?.secondaryText?.text ?? '',
              },
            }));
          }
        } catch (_e) {
          // Ignore 403 if Places API (New) is disabled
        }
      }
    }
  } catch (_e) {
    // API not activated or script blocked
  }

  // Graceful local search fallback
  const query = input.toLowerCase();
  return FALLBACK_PLACES.filter(
    (p) =>
      p.main.toLowerCase().includes(query) ||
      p.secondary.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
  ).map((p, idx) => ({
    place_id: `fb-${idx}`,
    description: p.description,
    structured_formatting: { main_text: p.main, secondary_text: p.secondary },
  }));
}

/**
 * Fetch place coordinates from a place_id.
 */
export async function fetchPlaceDetails(
  placeId: string
): Promise<Location | null> {
  if (placeId.startsWith('fb-')) {
    const idx = parseInt(placeId.replace('fb-', ''), 10);
    return FALLBACK_PLACES[idx]?.location ?? null;
  }

  try {
    await loadGoogleMapsScript();

    const placesLib = (google.maps as any).places;

    if (placesLib?.PlacesService) {
      const div = document.createElement('div');
      const service = new google.maps.places.PlacesService(div);
      const result = await new Promise<Location | null>((resolve) => {
        service.getDetails(
          { placeId, fields: ['geometry'] },
          (res: google.maps.places.PlaceResult | null, status) => {
            if (status !== 'OK' || !res?.geometry?.location) {
              resolve(null);
              return;
            }
            resolve({
              latitude: res.geometry.location.lat(),
              longitude: res.geometry.location.lng(),
            });
          }
        );
      });
      if (result) return result;
    }

    if (placesLib?.Place) {
      const place = new placesLib.Place({ id: placeId });
      await place.fetchFields({ fields: ['location'] });
      if (place.location) {
        return {
          latitude: place.location.lat(),
          longitude: place.location.lng(),
        };
      }
    }
  } catch (_e) {
    // Ignore
  }

  return null;
}

/**
 * Fetch directions via Google Maps JS DirectionsService.
 */
export async function fetchDirections(
  origin: Location,
  destination: Location
): Promise<RouteInfo | null> {
  try {
    await loadGoogleMapsScript();

    if (typeof google !== 'undefined' && google.maps?.DirectionsService) {
      const service = new google.maps.DirectionsService();
      const result = await new Promise<RouteInfo | null>((resolve) => {
        service.route(
          {
            origin: new google.maps.LatLng(origin.latitude, origin.longitude),
            destination: new google.maps.LatLng(destination.latitude, destination.longitude),
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (res: google.maps.DirectionsResult | null, status) => {
            if (status !== 'OK' || !res?.routes?.length) {
              resolve(null);
              return;
            }
            const route = res.routes[0];
            const leg = route.legs[0];
            const coordinates: Location[] = route.overview_path.map(
              (p: google.maps.LatLng) => ({ latitude: p.lat(), longitude: p.lng() })
            );
            resolve({
              coordinates,
              distance: leg.distance?.text ?? '—',
              duration: leg.duration?.text ?? '—',
            });
          }
        );
      });
      if (result) return result;
    }
  } catch (_e) {
    // Ignore
  }

  const distanceKm = haversine(origin, destination);
  return {
    coordinates: [
      origin,
      { latitude: (origin.latitude + destination.latitude) / 2 + 0.002, longitude: (origin.longitude + destination.longitude) / 2 - 0.002 },
      destination,
    ],
    distance: `${distanceKm.toFixed(1)} km`,
    duration: `${Math.round(distanceKm * 3)} mins`,
  };
}

function haversine(a: Location, b: Location): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
