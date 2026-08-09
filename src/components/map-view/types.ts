import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { MapStyleElement, MapType, Provider, Region } from 'react-native-maps';
import type { Location } from '@/types';

export type MapViewRef = {
  animateToRegion: (region: Region, duration?: number) => void;
  fitToCoordinates: (
    coordinates: Location[],
    options?: {
      edgePadding?: { top: number; right: number; bottom: number; left: number };
      animated?: boolean;
    }
  ) => void;
};

export type MapViewProps = {
  style?: StyleProp<ViewStyle>;
  provider?: Provider;
  mapType?: MapType;
  customMapStyle?: MapStyleElement[];
  initialRegion?: Region;
  region?: Region;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  showsCompass?: boolean;
  onPress?: (e: any) => void;
  children?: ReactNode;
};

export type MarkerProps = {
  coordinate: Location;
  title?: string;
  description?: string;
  pinColor?: string;
  onPress?: () => void;
  anchor?: { x: number; y: number };
  children?: ReactNode;
};

export type PolylineProps = {
  coordinates: Location[];
  strokeColor?: string;
  strokeWidth?: number;
  lineDashPattern?: number[];
};
