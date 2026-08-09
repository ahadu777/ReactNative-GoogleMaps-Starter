import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import type { MapType } from 'react-native-maps';

import { MapButton } from '@/components/map-button';
import { MapView, MapViewRef, Marker, PROVIDER_GOOGLE } from '@/components/map-view';
import { DEFAULT_LOCATION, DEFAULT_REGION } from '@/constants/map';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MAP_TYPES: { type: MapType; label: string; icon: string }[] = [
  { type: 'standard', label: 'Standard', icon: '🗺️' },
  { type: 'satellite', label: 'Satellite', icon: '🛰️' },
  { type: 'hybrid', label: 'Hybrid', icon: '🌐' },
];

export default function BasicMapScreen() {
  const theme = useTheme();
  const mapRef = useRef<MapViewRef>(null);
  const [showUserLocation, setShowUserLocation] = useState(false);
  const [userLocation, setUserLocation] = useState(DEFAULT_LOCATION);
  const [mapType, setMapType] = useState<MapType>('satellite');

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setShowUserLocation(true);
        try {
          const loc = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        } catch {
          // Use default location
        }
      }
    })();
  }, []);

  const centerOnUser = () => {
    mapRef.current?.animateToRegion(
      {
        ...userLocation,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      800
    );
  };

  const cycleMapType = () => {
    setMapType((current) => {
      if (current === 'standard') return 'satellite';
      if (current === 'satellite') return 'hybrid';
      return 'standard';
    });
  };

  const toggleUserLocation = () => {
    if (!showUserLocation) {
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Location permission is required.');
          return;
        }
        setShowUserLocation(true);
      })();
    } else {
      setShowUserLocation(false);
    }
  };

  const currentTypeConfig = MAP_TYPES.find((t) => t.type === mapType) ?? MAP_TYPES[0];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        mapType={mapType}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        showsCompass={true}
      >
        <Marker
          coordinate={DEFAULT_LOCATION}
          title="Addis Ababa"
          description="Default location"
        />
      </MapView>

      <View style={[styles.controls, { bottom: Platform.OS === 'ios' ? 40 : 20 }]}>
        <MapButton
          title={currentTypeConfig.label}
          icon={currentTypeConfig.icon}
          variant="secondary"
          onPress={cycleMapType}
        />
        <MapButton
          title={showUserLocation ? 'Hide' : 'Show Location'}
          icon="📍"
          variant={showUserLocation ? 'secondary' : 'primary'}
          onPress={toggleUserLocation}
        />
        <MapButton
          title="Center"
          icon="🎯"
          variant="primary"
          onPress={centerOnUser}
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
  controls: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    gap: Spacing.one + 2,
    justifyContent: 'center',
  },
});
