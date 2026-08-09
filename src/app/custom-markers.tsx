import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { InfoPanel } from '@/components/info-panel';
import { MapView, Marker, PROVIDER_GOOGLE } from '@/components/map-view';
import { ThemedText } from '@/components/themed-text';
import { DEFAULT_REGION } from '@/constants/map';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type MarkerType = 'user' | 'driver' | 'destination';

type CustomMarkerData = {
  id: string;
  type: MarkerType;
  coordinate: { latitude: number; longitude: number };
  title: string;
  color: string;
  emoji: string;
};

const SAMPLE_MARKERS: CustomMarkerData[] = [
  {
    id: '1',
    type: 'user',
    coordinate: { latitude: 9.0192, longitude: 38.7525 },
    title: 'You',
    color: '#3b82f6',
    emoji: '🧑',
  },
  {
    id: '2',
    type: 'driver',
    coordinate: { latitude: 9.0225, longitude: 38.7480 },
    title: 'Driver Abebe',
    color: '#22c55e',
    emoji: '🚗',
  },
  {
    id: '3',
    type: 'driver',
    coordinate: { latitude: 9.0160, longitude: 38.7560 },
    title: 'Driver Kebede',
    color: '#22c55e',
    emoji: '🚗',
  },
  {
    id: '4',
    type: 'driver',
    coordinate: { latitude: 9.0210, longitude: 38.7590 },
    title: 'Driver Meron',
    color: '#22c55e',
    emoji: '🚗',
  },
  {
    id: '5',
    type: 'destination',
    coordinate: { latitude: 9.0250, longitude: 38.7450 },
    title: 'Bole Airport',
    color: '#ef4444',
    emoji: '📍',
  },
  {
    id: '6',
    type: 'destination',
    coordinate: { latitude: 9.0120, longitude: 38.7610 },
    title: 'Meskel Square',
    color: '#ef4444',
    emoji: '🏛️',
  },
];

const MARKER_TYPES: { type: MarkerType; label: string; emoji: string; count: number }[] = [
  { type: 'user', label: 'User', emoji: '🧑', count: SAMPLE_MARKERS.filter(m => m.type === 'user').length },
  { type: 'driver', label: 'Drivers', emoji: '🚗', count: SAMPLE_MARKERS.filter(m => m.type === 'driver').length },
  { type: 'destination', label: 'Destinations', emoji: '📍', count: SAMPLE_MARKERS.filter(m => m.type === 'destination').length },
];

export default function CustomMarkersScreen() {
  const theme = useTheme();
  const [selectedMarker, setSelectedMarker] = useState<CustomMarkerData | null>(null);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={DEFAULT_REGION}
      >
        {SAMPLE_MARKERS.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            onPress={() => setSelectedMarker(marker)}
          >
            <View style={[styles.customMarker, { backgroundColor: marker.color }]}>
              <ThemedText style={styles.markerEmoji}>{marker.emoji}</ThemedText>
            </View>
            <View style={[styles.markerTail, { borderTopColor: marker.color }]} />
          </Marker>
        ))}
      </MapView>

      <View style={styles.legendContainer}>
        <InfoPanel
          items={MARKER_TYPES.map((mt) => ({
            label: `${mt.emoji} ${mt.label}`,
            value: `${mt.count}`,
          }))}
        />
      </View>

      {selectedMarker && (
        <View
          style={[
            styles.selectedInfo,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.backgroundSelected,
            },
          ]}
        >
          <ThemedText style={styles.selectedEmoji}>{selectedMarker.emoji}</ThemedText>
          <View style={styles.selectedText}>
            <ThemedText type="default" style={{ fontWeight: '600' }}>
              {selectedMarker.title}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Type: {selectedMarker.type} • {selectedMarker.coordinate.latitude.toFixed(4)}, {selectedMarker.coordinate.longitude.toFixed(4)}
            </ThemedText>
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
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerEmoji: {
    fontSize: 20,
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
    marginTop: -2,
  },
  legendContainer: {
    position: 'absolute',
    top: Spacing.three,
    left: Spacing.three,
    right: Spacing.three,
  },
  selectedInfo: {
    position: 'absolute',
    bottom: 30,
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.three,
  },
  selectedEmoji: {
    fontSize: 32,
  },
  selectedText: {
    flex: 1,
    gap: 2,
  },
});
