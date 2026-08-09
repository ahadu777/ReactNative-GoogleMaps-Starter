import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MapView, MapViewRef, Marker, PROVIDER_GOOGLE } from '@/components/map-view';
import { PlacesInput } from '@/components/places-input';
import { DEFAULT_LOCATION, DEFAULT_REGION } from '@/constants/map';
import { Spacing } from '@/constants/theme';
import type { Location } from '@/types';

export default function PlacesSearchScreen() {
  const mapRef = useRef<MapViewRef>(null);
  const [selectedPlace, setSelectedPlace] = useState<{
    location: Location;
    title: string;
  } | null>(null);

  const handlePlaceSelected = (location: Location, description: string) => {
    setSelectedPlace({ location, title: description });
    mapRef.current?.animateToRegion(
      {
        ...location,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      800
    );
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
        {selectedPlace && (
          <Marker
            coordinate={selectedPlace.location}
            title={selectedPlace.title}
            pinColor="#3b82f6"
          />
        )}
      </MapView>

      <View style={styles.searchContainer}>
        <PlacesInput
          placeholder="Search for a place..."
          onPlaceSelected={handlePlaceSelected}
          biasLocation={DEFAULT_LOCATION}
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
  searchContainer: {
    position: 'absolute',
    top: Spacing.three,
    left: Spacing.three,
    right: Spacing.three,
  },
});
