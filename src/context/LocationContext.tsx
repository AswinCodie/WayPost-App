import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { LocationCoordinates } from '../types';
import { UNLOCK_RADIUS_METERS } from '../lib/location';
import { LocalStorageManager, STORAGE_KEYS } from '../lib/storage';

type Permission = 'prompt' | 'granted' | 'denied' | 'unsupported';
const isValid = (value: unknown): value is LocationCoordinates => {
  if (!value || typeof value !== 'object') return false;
  const point = value as LocationCoordinates;
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude) && Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180;
};
const readCachedLocation = () => {
  const cached = LocalStorageManager.getItem<unknown>(STORAGE_KEYS.LAST_GPS_LOCATION, null);
  return isValid(cached) ? cached : null;
};

interface LocationContextType {
  coordinates: LocationCoordinates | null; isLocating: boolean; permissionStatus: Permission; errorMessage?: string; locationIsStale: boolean;
  unlockRadiusMeters: number; requestRealLocation: () => void;
  // Compatibility fields retained for components; simulation is permanently disabled.
  isSimulated: boolean; activePresetName: string; presets: never[]; setPreset: (id: string) => void; setCustomCoordinates: (coords: LocationCoordinates, label?: string) => void; toggleSimulationMode: () => void;
}
const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [coordinates, setCoordinates] = useState<LocationCoordinates | null>(readCachedLocation);
  const [isLocating, setIsLocating] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Permission>('prompt');
  const [errorMessage, setErrorMessage] = useState<string>();
  const [locationIsStale, setLocationIsStale] = useState(() => !!readCachedLocation());
  const watchRef = useRef<number | null>(null);
  const requestInFlight = useRef(false);
  const requestedOnMount = useRef(false);

  const stopWatching = useCallback(() => {
    if (watchRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
  }, []);
  const savePosition = useCallback((position: GeolocationPosition) => {
    const next = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    if (!isValid(next)) return;
    LocalStorageManager.setItem(STORAGE_KEYS.LAST_GPS_LOCATION, next);
    setCoordinates(next); setLocationIsStale(false); setPermissionStatus('granted'); setErrorMessage(undefined); setIsLocating(false); requestInFlight.current = false;
  }, []);
  const handleError = useCallback((error: GeolocationPositionError) => {
    setIsLocating(false); requestInFlight.current = false;
    if (error.code === error.PERMISSION_DENIED) setPermissionStatus('denied');
    setErrorMessage(error.code === error.PERMISSION_DENIED ? 'Location permission was denied.' : error.code === error.TIMEOUT ? 'GPS timed out; using your last known location.' : 'GPS is unavailable; using your last known location.');
    // Intentionally retain a validated cached position when GPS fails.
  }, []);
  const requestRealLocation = useCallback(() => {
    if (!navigator.geolocation) { setPermissionStatus('unsupported'); setErrorMessage('Geolocation is not supported by this browser.'); return; }
    if (requestInFlight.current) return;
    requestInFlight.current = true; setIsLocating(true); setErrorMessage(undefined); stopWatching();
    navigator.geolocation.getCurrentPosition((position) => {
      savePosition(position);
      watchRef.current = navigator.geolocation.watchPosition(savePosition, handleError, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
    }, handleError, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
  }, [handleError, savePosition, stopWatching]);
  useEffect(() => {
    if (!requestedOnMount.current) { requestedOnMount.current = true; requestRealLocation(); }
    return () => stopWatching();
  }, [requestRealLocation, stopWatching]);

  return <LocationContext.Provider value={{ coordinates, isLocating, permissionStatus, errorMessage, locationIsStale, unlockRadiusMeters: UNLOCK_RADIUS_METERS, requestRealLocation, isSimulated: false, activePresetName: '', presets: [], setPreset: () => {}, setCustomCoordinates: () => {}, toggleSimulationMode: () => {} }}>{children}</LocationContext.Provider>;
};
export const useLocation = () => { const context = useContext(LocationContext); if (!context) throw new Error('useLocation must be used within LocationProvider'); return context; };
