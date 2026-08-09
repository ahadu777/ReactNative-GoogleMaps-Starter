import React, { createContext, forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { StyleSheet, View } from 'react-native';
import type { Provider } from 'react-native-maps';

import { DEFAULT_REGION, GOOGLE_MAPS_API_KEY } from '@/constants/map';
import type { Location } from '@/types';
import type { MapViewProps, MapViewRef, MarkerProps, PolylineProps } from './types';

export const PROVIDER_GOOGLE: Provider = 'google';

// Web Map Context to share the active google.maps.Map instance with Marker and Polyline children
const GoogleMapContext = createContext<google.maps.Map | null>(null);

function loadGoogleMapsScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window._gmapsLoaded) return Promise.resolve();
  if (window._gmapsLoading) return window._gmapsLoading;

  window._gmapsLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
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

export const MapView = forwardRef<MapViewRef, MapViewProps>(
  ({ style, initialRegion, children, showsUserLocation, mapType = 'standard' }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    const region = initialRegion ?? DEFAULT_REGION;

    // Initialize official Google Maps JS API Map instance
    useEffect(() => {
      let isMounted = true;

      loadGoogleMapsScript().then(() => {
        if (!isMounted || !containerRef.current || mapRef.current) return;

        const mapTypeId =
          mapType === 'satellite'
            ? google.maps.MapTypeId.SATELLITE
            : mapType === 'hybrid'
            ? google.maps.MapTypeId.HYBRID
            : google.maps.MapTypeId.ROADMAP;

        const map = new google.maps.Map(containerRef.current, {
          center: { lat: region.latitude, lng: region.longitude },
          zoom: 14,
          mapTypeId,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          styles: mapType === 'standard' ? darkMapStyle : undefined,
        });

        mapRef.current = map;
        setMapInstance(map);
        setIsLoaded(true);
      }).catch((_e) => {
        // Fallback handled gracefully
      });

      return () => {
        isMounted = false;
      };
    }, []);

    // Update map type dynamically
    useEffect(() => {
      if (!mapRef.current || typeof google === 'undefined') return;

      const mapTypeId =
        mapType === 'satellite'
          ? google.maps.MapTypeId.SATELLITE
          : mapType === 'hybrid'
          ? google.maps.MapTypeId.HYBRID
          : google.maps.MapTypeId.ROADMAP;

      mapRef.current.setMapTypeId(mapTypeId);
      mapRef.current.setOptions({
        styles: mapType === 'standard' ? darkMapStyle : undefined,
      });
    }, [mapType]);

    // Imperative methods
    useImperativeHandle(ref, () => ({
      animateToRegion: (newRegion) => {
        if (mapRef.current && typeof google !== 'undefined') {
          mapRef.current.panTo({ lat: newRegion.latitude, lng: newRegion.longitude });
          const zoom = Math.max(1, Math.min(20, Math.round(Math.log2(360 / (newRegion.latitudeDelta || 0.005)))));
          mapRef.current.setZoom(zoom);
        }
      },
      fitToCoordinates: (coordinates: Location[]) => {
        if (mapRef.current && coordinates.length > 0 && typeof google !== 'undefined') {
          const bounds = new google.maps.LatLngBounds();
          coordinates.forEach((c) => bounds.extend({ lat: c.latitude, lng: c.longitude }));
          mapRef.current.fitBounds(bounds, {
            top: 220,
            right: 80,
            bottom: 180,
            left: 80,
          });
        }
      },
    }));

    return (
      <View style={[styles.mapContainer, style]}>
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />

        {isLoaded && mapInstance && (
          <GoogleMapContext.Provider value={mapInstance}>
            {children}
          </GoogleMapContext.Provider>
        )}
      </View>
    );
  }
);

MapView.displayName = 'MapView';

/**
 * Custom Overlay Marker for Google Maps JS API (renders React children / custom icons directly on map canvas)
 */
export const Marker = ({ coordinate, title, pinColor, children }: MarkerProps) => {
  const map = useContext(GoogleMapContext);
  const containerRef = useRef<HTMLDivElement>(document.createElement('div'));
  const overlayRef = useRef<google.maps.OverlayView | null>(null);

  const coordRef = useRef(coordinate);
  coordRef.current = coordinate;

  useEffect(() => {
    if (!map || typeof google === 'undefined') return;

    const el = containerRef.current;
    el.style.position = 'absolute';
    el.style.cursor = 'pointer';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.zIndex = '10';

    class CustomMarkerOverlay extends google.maps.OverlayView {
      onAdd() {
        const panes = this.getPanes();
        if (panes) {
          panes.overlayMouseTarget.appendChild(el);
        }
      }

      draw() {
        const projection = this.getProjection();
        if (!projection) return;
        const currentCoord = coordRef.current;
        const point = projection.fromLatLngToDivPixel(
          new google.maps.LatLng(currentCoord.latitude, currentCoord.longitude)
        );
        if (point) {
          el.style.left = `${point.x}px`;
          el.style.top = `${point.y}px`;
        }
      }

      onRemove() {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }
    }

    const overlay = new CustomMarkerOverlay();
    overlay.setMap(map);
    overlayRef.current = overlay;

    return () => {
      overlay.setMap(null);
      overlayRef.current = null;
    };
  }, [map]);

  // Update overlay position on coordinate change
  useEffect(() => {
    if (overlayRef.current && typeof google !== 'undefined') {
      overlayRef.current.draw();
    }
  }, [coordinate.latitude, coordinate.longitude]);

  // Render React children inside the map overlay portal
  const content = children ? (
    children
  ) : (
    <View style={[styles.defaultPin, { backgroundColor: pinColor || '#ef4444' }]}>
      <View style={styles.pinDot} />
    </View>
  );

  return ReactDOM.createPortal(content, containerRef.current);
};

/**
 * Polyline Component for Google Maps JS API
 */
export const Polyline = ({ coordinates, strokeColor = '#3b82f6', strokeWidth = 5 }: PolylineProps) => {
  const map = useContext(GoogleMapContext);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !coordinates || coordinates.length < 2 || typeof google === 'undefined') return;

    const path = coordinates.map((c) => ({ lat: c.latitude, lng: c.longitude }));

    if (!polylineRef.current) {
      polylineRef.current = new google.maps.Polyline({
        path,
        map,
        strokeColor,
        strokeOpacity: 0.9,
        strokeWeight: strokeWidth,
      });
    } else {
      polylineRef.current.setPath(path);
      polylineRef.current.setOptions({ strokeColor, strokeWeight: strokeWidth });
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, coordinates, strokeColor, strokeWidth]);

  return null;
};

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
];

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  defaultPin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
});
