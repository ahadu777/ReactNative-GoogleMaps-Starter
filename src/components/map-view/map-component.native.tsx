import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import RNMapView, {
  Marker as RNMarker,
  Polyline as RNPolyline,
  PROVIDER_GOOGLE as RN_PROVIDER_GOOGLE,
} from 'react-native-maps';
import type { MapViewProps, MapViewRef, MarkerProps, PolylineProps } from './types';

export const PROVIDER_GOOGLE = RN_PROVIDER_GOOGLE;

export const MapView = forwardRef<MapViewRef, MapViewProps>((props, ref) => {
  const mapRef = useRef<RNMapView>(null);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region, duration) => {
      mapRef.current?.animateToRegion(region, duration);
    },
    fitToCoordinates: (coordinates, options) => {
      mapRef.current?.fitToCoordinates(coordinates, options);
    },
  }));

  return <RNMapView ref={mapRef} {...props} />;
});

MapView.displayName = 'MapView';

export const Marker = (props: MarkerProps) => <RNMarker {...props} />;
export const Polyline = (props: PolylineProps) => <RNPolyline {...props} />;
