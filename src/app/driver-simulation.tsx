import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, StyleSheet, View } from 'react-native';

import { InfoPanel } from '@/components/info-panel';
import { MapButton } from '@/components/map-button';
import { MapView, MapViewRef, Marker, Polyline, PROVIDER_GOOGLE } from '@/components/map-view';
import { ThemedText } from '@/components/themed-text';
import { DEFAULT_LOCATION, DEFAULT_REGION } from '@/constants/map';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchDirections } from '@/services/google-maps';
import {
  formatDistance,
  generateDrivers,
  haversineDistance,
  interpolatePosition,
} from '@/services/simulation';
import type { Driver, Location as LocationType } from '@/types';

const DRIVER_COUNT = 10;
const ANIMATION_STEPS = 100;
const ANIMATION_INTERVAL = 40;

type DispatchState =
  | { type: 'idle' }
  | { type: 'dispatching'; candidateDriver: Driver; attemptIndex: number; totalCandidates: number }
  | { type: 'accepted'; driver: Driver }
  | { type: 'failed' };

export default function DriverSimulationScreen() {
  const theme = useTheme();
  const mapRef = useRef<MapViewRef>(null);

  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lineDrawIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dispatchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pulsing animation value for ringing driver
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [userLocation, setUserLocation] = useState<LocationType>(DEFAULT_LOCATION);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [declinedDriverIds, setDeclinedDriverIds] = useState<Set<string>>(new Set());
  const [assignedDriver, setAssignedDriver] = useState<Driver | null>(null);

  const [dispatchState, setDispatchState] = useState<DispatchState>({ type: 'idle' });
  const [animatingDriverPos, setAnimatingDriverPos] = useState<LocationType | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Complete polyline route & progressively drawn animated polyline
  const [fullRoute, setFullRoute] = useState<LocationType[]>([]);
  const [animatedRoute, setAnimatedRoute] = useState<LocationType[]>([]);
  const [routeDistance, setRouteDistance] = useState<string>('—');

  // Pulsing animation loop for ringing driver
  useEffect(() => {
    if (dispatchState.type === 'dispatching') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.2,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [dispatchState.type, pulseAnim]);

  // Initialize and center user location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let loc = DEFAULT_LOCATION;
      if (status === 'granted') {
        try {
          const position = await Location.getCurrentPositionAsync({});
          loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(loc);
        } catch {
          // Use default
        }
      }
      setDrivers(generateDrivers(loc, DRIVER_COUNT));

      // Center map on user location
      mapRef.current?.animateToRegion({
        ...loc,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    })();

    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
      if (lineDrawIntervalRef.current) clearInterval(lineDrawIntervalRef.current);
      if (dispatchTimeoutRef.current) clearTimeout(dispatchTimeoutRef.current);
    };
  }, []);

  const resetSimulation = useCallback(() => {
    if (animationRef.current) clearInterval(animationRef.current);
    if (lineDrawIntervalRef.current) clearInterval(lineDrawIntervalRef.current);
    if (dispatchTimeoutRef.current) clearTimeout(dispatchTimeoutRef.current);

    setAssignedDriver(null);
    setAnimatingDriverPos(null);
    setIsAnimating(false);
    setFullRoute([]);
    setAnimatedRoute([]);
    setRouteDistance('—');
    setDeclinedDriverIds(new Set());
    setDispatchState({ type: 'idle' });
    setDrivers(generateDrivers(userLocation, DRIVER_COUNT));

    mapRef.current?.animateToRegion({
      ...userLocation,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
  }, [userLocation]);

  // Start sequential dispatch cascade (Driver A declines -> Driver B declines -> Driver C accepts!)
  const startDispatchCascade = useCallback(() => {
    const available = drivers
      .filter((d) => d.status === 'idle' && !declinedDriverIds.has(d.id))
      .map((d) => ({
        driver: d,
        dist: haversineDistance(userLocation, d.location),
      }))
      .sort((a, b) => a.dist - b.dist)
      .map((x) => x.driver);

    if (available.length === 0) {
      Alert.alert('No Available Drivers', 'All drivers nearby have been dispatched.');
      return;
    }

    const candidates = available.slice(0, 3);
    let candidateIndex = 0;

    const dispatchNextCandidate = async () => {
      // Clear previous candidate route immediately when starting next dispatch
      setFullRoute([]);
      setAnimatedRoute([]);
      if (lineDrawIntervalRef.current) clearInterval(lineDrawIntervalRef.current);

      if (candidateIndex >= candidates.length) {
        setDispatchState({ type: 'failed' });
        Alert.alert('Dispatch Failed', 'All candidate drivers declined the trip request.');
        return;
      }

      const currentCandidate = candidates[candidateIndex];

      setDispatchState({
        type: 'dispatching',
        candidateDriver: currentCandidate,
        attemptIndex: candidateIndex + 1,
        totalCandidates: candidates.length,
      });

      // Fetch REAL Google Maps directions route from Customer (Person) -> Candidate Driver (Car)
      const routeInfo = await fetchDirections(userLocation, currentCandidate.location);

      const rawCoords = routeInfo?.coordinates.length
        ? routeInfo.coordinates
        : [userLocation, currentCandidate.location];

      // Route sequence: Start at Person (userLocation), end at Candidate Car (currentCandidate.location)
      const polylinePoints = [
        userLocation,
        ...rawCoords.slice(1, -1),
        currentCandidate.location,
      ];

      // Snap candidate driver's location to the end tip of the polyline route!
      currentCandidate.location = polylinePoints[polylinePoints.length - 1];

      setFullRoute(polylinePoints);
      if (routeInfo) {
        setRouteDistance(routeInfo.distance);
      }

      // Zoom camera to center and show BOTH Person icon and Ringing Car inside viewport
      mapRef.current?.fitToCoordinates([userLocation, polylinePoints[polylinePoints.length - 1]], {
        edgePadding: { top: 220, right: 80, bottom: 180, left: 80 },
        animated: true,
      });

      // ANIMATE ROUTE DRAWING FROM PERSON TO CAR!
      let drawStep = 0;
      const totalDrawSteps = 40;
      const totalPoints = polylinePoints.length;

      setAnimatedRoute([userLocation]);

      lineDrawIntervalRef.current = setInterval(() => {
        drawStep++;
        const pct = drawStep / totalDrawSteps;
        const visibleCount = Math.max(2, Math.floor(pct * totalPoints));

        if (drawStep >= totalDrawSteps) {
          if (lineDrawIntervalRef.current) clearInterval(lineDrawIntervalRef.current);
          setAnimatedRoute(polylinePoints);
        } else {
          setAnimatedRoute(polylinePoints.slice(0, visibleCount));
        }
      }, 35); // 35ms * 40 steps = ~1.4s smooth line drawing effect

      const isLastCandidate = candidateIndex === candidates.length - 1 || candidateIndex === 2;

      dispatchTimeoutRef.current = setTimeout(() => {
        if (!isLastCandidate) {
          // Candidate declines! Mark red & clear route for next candidate
          setDeclinedDriverIds((prev) => new Set(prev).add(currentCandidate.id));
          setFullRoute([]);
          setAnimatedRoute([]);
          candidateIndex++;
          dispatchNextCandidate();
        } else {
          // Candidate accepts!
          setDeclinedDriverIds((prev) => {
            const next = new Set(prev);
            next.delete(currentCandidate.id);
            return next;
          });
          setDrivers((prev) =>
            prev.map((d) => (d.id === currentCandidate.id ? { ...d, status: 'assigned' as const } : d))
          );
          setAssignedDriver(currentCandidate);
          setDispatchState({ type: 'accepted', driver: currentCandidate });
          setAnimatedRoute(polylinePoints);

          // Drive along real route polyline (from Car to Person)
          setIsAnimating(true);
          let step = 0;
          const reversePolyline = [...polylinePoints].reverse();

          animationRef.current = setInterval(() => {
            step++;
            const progress = step / ANIMATION_STEPS;

            if (progress >= 1) {
              if (animationRef.current) clearInterval(animationRef.current);
              setAnimatingDriverPos(userLocation);
              setIsAnimating(false);
              return;
            }

            // Interpolate position along real route polyline toward customer
            const floatIdx = progress * (totalPoints - 1);
            const idx1 = Math.floor(floatIdx);
            const idx2 = Math.min(idx1 + 1, totalPoints - 1);
            const subProgress = floatIdx - idx1;

            const pos = interpolatePosition(reversePolyline[idx1], reversePolyline[idx2], subProgress);
            setAnimatingDriverPos(pos);
          }, ANIMATION_INTERVAL);
        }
      }, 5000);
    };

    dispatchNextCandidate();
  }, [drivers, userLocation, declinedDriverIds]);

  const idleCount = drivers.filter((d) => d.status === 'idle' && !declinedDriverIds.has(d.id)).length;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          ...userLocation,
          latitudeDelta: DEFAULT_REGION.latitudeDelta,
          longitudeDelta: DEFAULT_REGION.longitudeDelta,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Customer (User) Location Marker */}
        <Marker coordinate={userLocation} title="Customer Pickup">
          <View style={styles.userMarker}>
            <Ionicons name="person" size={20} color="#ffffff" />
          </View>
        </Marker>

        {/* Drivers Markers */}
        {drivers.map((driver) => {
          const isAssigned = assignedDriver?.id === driver.id && animatingDriverPos;
          if (isAssigned) return null; // Rendered separately while animating drive

          const isDeclined = declinedDriverIds.has(driver.id);
          const isCurrentlyRinging =
            dispatchState.type === 'dispatching' && dispatchState.candidateDriver.id === driver.id;

          const displayCoordinate =
            isCurrentlyRinging && fullRoute.length > 0
              ? fullRoute[fullRoute.length - 1]
              : driver.location;

          const badgeBg = isCurrentlyRinging
            ? '#f59e0b' // Amber during dispatch ringing
            : isDeclined
            ? '#ef4444' // Red if declined
            : driver.status === 'assigned'
            ? '#10b981' // Green if accepted
            : '#3b82f6'; // Blue if available

          return (
            <Marker
              key={driver.id}
              coordinate={displayCoordinate}
              title={driver.name}
              description={
                isCurrentlyRinging
                  ? '🔔 Ringing driver...'
                  : isDeclined
                  ? '❌ Declined Trip'
                  : driver.status === 'assigned'
                  ? '✅ Trip Accepted'
                  : '🟢 Available'
              }
            >
              {isCurrentlyRinging ? (
                <Animated.View
                  style={[
                    styles.driverMarker,
                    {
                      backgroundColor: badgeBg,
                      opacity: pulseAnim,
                      transform: [{ scale: pulseAnim.interpolate({ inputRange: [0.2, 1], outputRange: [0.85, 1.25] }) }],
                    },
                  ]}
                >
                  <Ionicons name="car-sport" size={20} color="#ffffff" />
                </Animated.View>
              ) : (
                <View style={[styles.driverMarker, { backgroundColor: badgeBg }]}>
                  <Ionicons name="car-sport" size={18} color="#ffffff" />
                </View>
              )}
            </Marker>
          );
        })}

        {/* Moving Driver Marker */}
        {assignedDriver && animatingDriverPos && (
          <Marker
            coordinate={animatingDriverPos}
            title={assignedDriver.name}
            description="En route to pickup!"
          >
            <View style={[styles.driverMarker, styles.assignedDriverMarker]}>
              <Ionicons name="car-sport" size={24} color="#ffffff" />
            </View>
          </Marker>
        )}

        {/* ANIMATED Polyline Route: Progressively drawn starting from Person to Car */}
        {animatedRoute.length > 1 && (
          <Polyline
            coordinates={animatedRoute}
            strokeColor={dispatchState.type === 'accepted' ? '#10b981' : '#f59e0b'}
            strokeWidth={5}
            lineDashPattern={dispatchState.type === 'dispatching' ? [8, 4] : undefined}
          />
        )}
      </MapView>

      {/* Top Banner Status for Ringing & Dispatch */}
      {dispatchState.type !== 'idle' && (
        <View style={[styles.dispatchBanner, { backgroundColor: '#0f172aEE' }]}>
          {dispatchState.type === 'dispatching' && (
            <>
              <ActivityIndicator size="small" color="#f59e0b" />
              <View style={{ flex: 1 }}>
                <ThemedText style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>
                  Ringing {dispatchState.candidateDriver.name}... ({dispatchState.attemptIndex}/{dispatchState.totalCandidates})
                </ThemedText>
                <ThemedText style={{ color: '#cbd5e1', fontSize: 12 }}>
                  Waiting 5s for driver acceptance...
                </ThemedText>
              </View>
            </>
          )}

          {dispatchState.type === 'accepted' && (
            <>
              <Ionicons name="checkmark-circle" size={26} color="#10b981" />
              <View style={{ flex: 1 }}>
                <ThemedText style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>
                  {dispatchState.driver.name} Accepted! 🎉
                </ThemedText>
                <ThemedText style={{ color: '#34d399', fontSize: 12 }}>
                  Driver is moving toward pickup location
                </ThemedText>
              </View>
            </>
          )}
        </View>
      )}

      {/* Info panel */}
      <View style={styles.infoContainer}>
        <InfoPanel
          items={[
            { label: '🟢 Available', value: `${idleCount}` },
            { label: '❌ Declined', value: `${declinedDriverIds.size}` },
            { label: '📏 Route Dist', value: routeDistance },
          ]}
        />
      </View>

      {/* Control buttons */}
      <View style={styles.controls}>
        <MapButton
          title={isAnimating ? 'Driving...' : 'Dispatch Demo'}
          variant="primary"
          onPress={startDispatchCascade}
          disabled={isAnimating || dispatchState.type === 'dispatching' || idleCount === 0}
        />
        <MapButton
          title="Reset"
          variant="secondary"
          onPress={resetSimulation}
        />
      </View>
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
  userMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
  },
  driverMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  assignedDriverMarker: {
    backgroundColor: '#10b981',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#a7f3d0',
  },
  dispatchBanner: {
    position: 'absolute',
    top: Spacing.four + 60,
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
    top: Spacing.three,
    left: Spacing.three,
    right: Spacing.three,
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'center',
  },
});
