import React, { forwardRef } from 'react';
import type { Provider } from 'react-native-maps';

import type { MapViewProps, MapViewRef, MarkerProps, PolylineProps } from './types';

export const PROVIDER_GOOGLE: Provider = 'google';

export const MapView = forwardRef<MapViewRef, MapViewProps>(() => null);
MapView.displayName = 'MapView';

export const Marker: React.FC<MarkerProps> = () => null;
export const Polyline: React.FC<PolylineProps> = () => null;
