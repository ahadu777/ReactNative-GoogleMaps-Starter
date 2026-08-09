import { Ionicons } from '@expo/vector-icons';
import * as ExpoLocation from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { InfoPanel } from '@/components/info-panel';
import { MapButton } from '@/components/map-button';
import { MapView, MapViewRef, Marker, Polyline, PROVIDER_GOOGLE } from '@/components/map-view';
import { PlacesInput } from '@/components/places-input';
import { ThemedText } from '@/components/themed-text';
import { DEFAULT_LOCATION, DEFAULT_REGION } from '@/constants/map';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchDirections } from '@/services/google-maps';
import { haversineDistance } from '@/services/simulation';
import type { Location, RouteInfo } from '@/types';

type NavMode = 'simulation' | 'live';

export default function DirectionsScreen() {
  const theme = useTheme();
  const mapRef = useRef<MapViewRef>(null);

  const [origin, setOrigin] = useState<Location | null>(null);
  const [originText, setOriginText] = useState<string>('');
  const [destination, setDestination] = useState<Location | null>(null);
  const [route, setRoute] = useState<RouteInfo | null>(null);

  const [loading, setLoading] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Real-time navigation mode state
  const [isNavigating, setIsNavigating] = useState(false);
  const [navMode, setNavMode] = useState<NavMode>('simulation');
  const [userNavLocation, setUserNavLocation] = useState<Location | null>(null);
  const [navStepIndex, setNavStepIndex] = useState(0);

  // Location watcher subscription ref
  const watcherRef = useRef<ExpoLocation.LocationSubscription | null>(null);

  // Handle current location button tap
  const handleUseCurrentLocation = async () => {
    setLocatingUser(true);
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      let coords = DEFAULT_LOCATION;
      if (status === 'granted') {
        const userLoc = await ExpoLocation.getCurrentPositionAsync({});
        coords = {
          latitude: userLoc.coords.latitude,
          longitude: userLoc.coords.longitude,
        };
      }
      setOrigin(coords);
      setOriginText('My Location');

      mapRef.current?.animateToRegion({
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      if (destination) {
        await loadRoute(coords, destination);
      }
    } catch (_e) {
      setOrigin(DEFAULT_LOCATION);
      setOriginText('My Location (Addis Ababa)');
    } finally {
      setLocatingUser(false);
    }
  };

  const handleOriginSelected = async (location: Location, desc: string) => {
    setOrigin(location);
    setOriginText(desc);
    if (destination) {
      await loadRoute(location, destination);
    } else {
      mapRef.current?.animateToRegion({
        ...location,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      });
    }
  };

  const handleDestinationSelected = async (location: Location, _desc: string) => {
    setDestination(location);
    if (origin) {
      await loadRoute(origin, location);
    } else {
      mapRef.current?.animateToRegion({
        ...location,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      });
    }
  };

  const loadRoute = async (from: Location, to: Location) => {
    setLoading(true);
    const result = await fetchDirections(from, to);
    setRoute(result);
    setLoading(false);

    if (result && result.coordinates.length > 0) {
      mapRef.current?.fitToCoordinates(result.coordinates, {
        edgePadding: { top: 180, right: 60, bottom: 160, left: 60 },
        animated: true,
      });
    }
  };

  // Helper: check if current location is off-route (> 50m from all polyline points)
  const isOffRoute = (currentLoc: Location, polyline: Location[]): boolean => {
    if (!polyline || polyline.length === 0) return false;
    let minDistanceKm = Infinity;
    for (const point of polyline) {
      const dist = haversineDistance(currentLoc, point);
      if (dist < minDistanceKm) minDistanceKm = dist;
    }
    // 0.05 km = 50 meters
    return minDistanceKm > 0.05;
  };

  // 1. Simulation Mode (Interpolates through polyline steps)
  useEffect(() => {
    if (!isNavigating || navMode !== 'simulation' || !route || route.coordinates.length === 0) return;

    setNavStepIndex(0);
    setUserNavLocation(route.coordinates[0]);

    const interval = setInterval(() => {
      setNavStepIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= route.coordinates.length) {
          setIsNavigating(false);
          return prev;
        }

        const nextLoc = route.coordinates[nextIndex];
        setUserNavLocation(nextLoc);

        mapRef.current?.animateToRegion({
          ...nextLoc,
          latitudeDelta: 0.001,
          longitudeDelta: 0.001,
        });

        return nextIndex;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isNavigating, navMode, route]);

  // 2. Real Hardware GPS Watching & Auto-Rerouting Mode
  useEffect(() => {
    if (!isNavigating || navMode !== 'live' || !destination) return;

    let active = true;

    const startWatching = async () => {
      try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        watcherRef.current = await ExpoLocation.watchPositionAsync(
          {
            accuracy: ExpoLocation.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 3,
          },
          async (loc) => {
            if (!active) return;

            const currentGPS: Location = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            };

            setUserNavLocation(currentGPS);

            mapRef.current?.animateToRegion({
              ...currentGPS,
              latitudeDelta: 0.001,
              longitudeDelta: 0.001,
            });

            // Check if user turned off-route -> trigger automatic rerouting
            if (route && isOffRoute(currentGPS, route.coordinates) && !isRecalculating) {
              setIsRecalculating(true);
              const newRoute = await fetchDirections(currentGPS, destination);
              if (newRoute && active) {
                setRoute(newRoute);
              }
              setIsRecalculating(false);
            }
          }
        );
      } catch (_e) {
        // Fallback if hardware GPS unavailable
      }
    };

    startWatching();

    return () => {
      active = false;
      if (watcherRef.current) {
        watcherRef.current.remove();
        watcherRef.current = null;
      }
    };
  }, [isNavigating, navMode, destination, route, isRecalculating]);

  const handleStartNavigation = (selectedMode: NavMode = 'simulation') => {
    if (!route || route.coordinates.length === 0) return;
    setNavMode(selectedMode);
    setIsNavigating(true);
    const startLoc = route.coordinates[0];
    mapRef.current?.animateToRegion({
      ...startLoc,
      latitudeDelta: 0.001,
      longitudeDelta: 0.001,
    });
  };

  const handleStopNavigation = () => {
    setIsNavigating(false);
    if (watcherRef.current) {
      watcherRef.current.remove();
      watcherRef.current = null;
    }
    if (route && route.coordinates.length > 0) {
      mapRef.current?.fitToCoordinates(route.coordinates, {
        edgePadding: { top: 180, right: 60, bottom: 160, left: 60 },
        animated: true,
      });
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
      >
        {origin && (
          <Marker
            coordinate={origin}
            title="Origin"
            pinColor="#22c55e"
          />
        )}
        {destination && (
          <Marker
            coordinate={destination}
            title="Destination"
            pinColor="#ef4444"
          />
        )}
        {/* Real-time active user navigation position marker */}
        {isNavigating && userNavLocation && (
          <Marker
            coordinate={userNavLocation}
            title={navMode === 'live' ? 'My Live GPS' : 'Navigating...'}
          />
        )}
        {route && (
          <Polyline
            coordinates={route.coordinates}
            strokeColor="#3b82f6"
            strokeWidth={5}
          />
        )}
      </MapView>

      {/* Top Search Controls (Hidden during active turn-by-turn navigation) */}
      {!isNavigating && (
        <View style={styles.inputsContainer}>
          <PlacesInput
            placeholder="Origin (Search or tap 🎯)"
            value={originText}
            onPlaceSelected={handleOriginSelected}
            biasLocation={DEFAULT_LOCATION}
            rightElement={
              <Pressable
                onPress={handleUseCurrentLocation}
                style={({ pressed }) => [
                  styles.currentLocBtn,
                  { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                {locatingUser ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <Ionicons name="location-sharp" size={18} color="#3b82f6" />
                )}
              </Pressable>
            }
          />
          <View style={{ height: Spacing.two }} />
          <PlacesInput
            placeholder="Destination..."
            onPlaceSelected={handleDestinationSelected}
            biasLocation={origin ?? DEFAULT_LOCATION}
          />
        </View>
      )}

      {/* Loading Overlay */}
      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: theme.background + 'CC' }]}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <ThemedText type="small">Calculating route via Google Maps...</ThemedText>
        </View>
      )}

      {/* Navigation Banner Overlay when navigating */}
      {isNavigating && (
        <View style={[styles.navHeaderBanner, { backgroundColor: '#0f172aEE' }]}>
          <Ionicons name="compass" size={28} color={isRecalculating ? '#f59e0b' : '#38bdf8'} />
          <View style={{ flex: 1 }}>
            <ThemedText style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>
              {isRecalculating ? 'Off Route — Recalculating... 🔄' : navMode === 'live' ? 'Live GPS Tracking 🛰️' : 'Navigating Route'}
            </ThemedText>
            <ThemedText style={{ color: '#94a3b8', fontSize: 12 }}>
              {navMode === 'live' ? 'Auto-rerouting enabled if you take a turn' : `Step ${navStepIndex + 1} of ${route?.coordinates.length ?? 1}`}
            </ThemedText>
          </View>
          <MapButton title="Exit" variant="danger" onPress={handleStopNavigation} />
        </View>
      )}

      {/* Bottom Route Info & Navigation Buttons */}
      {route && !isNavigating && (
        <View style={styles.infoContainer}>
          <InfoPanel
            items={[
              { label: 'Distance', value: route.distance },
              { label: 'Duration', value: route.duration },
            ]}
          />
          <View style={styles.navActionsRow}>
            <View style={{ flex: 1 }}>
              <MapButton title="Demo Simulation 🚘" variant="secondary" onPress={() => handleStartNavigation('simulation')} />
            </View>
            <View style={{ flex: 1 }}>
              <MapButton title="Live GPS Nav 🛰️" variant="primary" onPress={() => handleStartNavigation('live')} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  inputsContainer: {
    position: 'absolute',
    top: Spacing.three,
    left: Spacing.three,
    right: Spacing.three,
    zIndex: 10,
  },
  currentLocBtn: {
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    zIndex: 20,
  },
  navHeaderBanner: {
    position: 'absolute',
    top: Spacing.four,
    left: Spacing.three,
    right: Spacing.three,
    padding: Spacing.three,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    zIndex: 30,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 30,
    left: Spacing.three,
    right: Spacing.three,
    zIndex: 15,
  },
  navActionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
