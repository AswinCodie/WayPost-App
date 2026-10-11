import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { WaypostNote, LocationCoordinates } from '../../types';
import { getCategoryInfo } from '../../lib/categoryMeta';
import { isWithinUnlockRadius, UNLOCK_RADIUS_METERS } from '../../lib/location';
import { MapConfigService } from '../../lib/mapConfig';
import { LocalStorageManager, STORAGE_KEYS } from '../../lib/storage';

type StoredViewport = { latitude: number; longitude: number; zoom: number };
const readViewport = (): StoredViewport | null => {
  const view = LocalStorageManager.getItem<StoredViewport | null>(STORAGE_KEYS.MAP_VIEWPORT, null);
  return view && Number.isFinite(view.latitude) && Number.isFinite(view.longitude) && Number.isFinite(view.zoom) ? view : null;
};

interface WaypostMapProps {
  userLocation: LocationCoordinates | null;
  isSimulated: boolean;
  notes: WaypostNote[];
  selectedNote: WaypostNote | null;
  onSelectNote: (note: WaypostNote) => void;
  // Optional pin mode for Add Note
  isPickingLocation?: boolean;
  pickedLocation?: LocationCoordinates;
  onPickLocation?: (coords: LocationCoordinates) => void;
  recenterToken?: number;
}

export const WaypostMap: React.FC<WaypostMapProps> = ({
  userLocation,
  isSimulated,
  notes,
  selectedNote,
  onSelectNote,
  isPickingLocation = false,
  pickedLocation,
  onPickLocation,
  recenterToken = 0,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const pickMarkerRef = useRef<L.Marker | null>(null);
  const restoredViewportRef = useRef<StoredViewport | null>(readViewport());
  const lastRecenterTokenRef = useRef(0);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const restored = restoredViewportRef.current;
      const map = L.map(mapContainerRef.current, {
        center: restored ? [restored.latitude, restored.longitude] : userLocation ? [userLocation.latitude, userLocation.longitude] : [20, 0],
        zoom: restored ? restored.zoom : userLocation ? 16 : 2,
        zoomControl: false,
        attributionControl: true,
      });

      // Configurable tile provider (CartoDB, Mapbox, MapTiler, Stadia, OSM)
      const config = MapConfigService.getConfig();
      const tileDetails = MapConfigService.getTileLayerDetails(config);
      L.tileLayer(tileDetails.url, {
        maxZoom: tileDetails.maxZoom,
        subdomains: tileDetails.subdomains || 'abcd',
        attribution: tileDetails.attribution,
      }).addTo(map);

      // Add zoom control at bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // GPS visuals intentionally sit beneath every Waypost marker.
      const gpsCirclePane = map.createPane('waypostGpsCirclePane');
      gpsCirclePane.style.zIndex = '300';
      const gpsMarkerPane = map.createPane('waypostGpsMarkerPane');
      gpsMarkerPane.style.zIndex = '350';

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
      map.on('moveend', () => {
        const center = map.getCenter();
        LocalStorageManager.setItem(STORAGE_KEYS.MAP_VIEWPORT, { latitude: center.lat, longitude: center.lng, zoom: map.getZoom() });
      });

      // Handle map click for location picking
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (isPickingLocation && onPickLocation) {
          onPickLocation({ latitude: e.latlng.lat, longitude: e.latlng.lng });
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        radiusCircleRef.current = null;
        userMarkerRef.current = null;
        pickMarkerRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // Update map click listener when isPickingLocation changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const clickHandler = (e: L.LeafletMouseEvent) => {
      if (isPickingLocation && onPickLocation) {
        onPickLocation({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      }
    };

    map.off('click');
    map.on('click', clickHandler);
  }, [isPickingLocation, onPickLocation]);

  // Auto-center map when userLocation coordinates change
  const lastLocationKeyRef = useRef<string>('');
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (!userLocation) return;
    const key = `${userLocation.latitude.toFixed(4)},${userLocation.longitude.toFixed(4)}`;
    if (lastLocationKeyRef.current !== key) {
      lastLocationKeyRef.current = key;
      // A user-selected viewport survives refresh; only center automatically
      // when there was no saved map view.
      if (!restoredViewportRef.current) map.flyTo([userLocation.latitude, userLocation.longitude], 16.5, { duration: 1.2 });
    }
  }, [userLocation]);

  // Deliberate "Locate me" requests override a restored/user-panned view.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation || recenterToken === lastRecenterTokenRef.current) return;
    lastRecenterTokenRef.current = recenterToken;
    map.flyTo([userLocation.latitude, userLocation.longitude], 18, { duration: 0.7 });
  }, [recenterToken, userLocation]);

  // Update User Location Marker & 150m Blue Radius Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;

    const userLatLng: L.LatLngExpression = [userLocation.latitude, userLocation.longitude];

    // Remove existing circle if present and create fresh active circle
    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
    }
    const circle = L.circle(userLatLng, {
      radius: UNLOCK_RADIUS_METERS,
      pane: 'waypostGpsCirclePane',
      color: '#2563eb',       // strong blue border
      weight: 1.5,
      dashArray: '6, 4',
      fillColor: '#60a5fa',   // light blue fill
      fillOpacity: 0.06,
    }).addTo(map);
    radiusCircleRef.current = circle;

    // Create glowing blue user icon
    const userIconHtml = `
      <div class="waypost-user-location" style="position: relative; width: 32px; height: 32px;">
        <div style="position: absolute; top: -12px; left: -12px; width: 56px; height: 56px; border-radius: 50%; background: rgba(37, 99, 235, 0.12); animation: waypost-pulse 2s infinite ease-out; pointer-events: none;"></div>
        <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border: 3px solid #FFFFFF; box-shadow: 0 0 0 1px rgba(59,130,246,0.35), 0 3px 10px rgba(37, 99, 235, 0.45); display: flex; align-items: center; justify-content: center;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #FFFFFF;"></div>
        </div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userIconHtml,
      className: 'waypost-user-div-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }
    const marker = L.marker(userLatLng, {
      icon: userIcon,
      pane: 'waypostGpsMarkerPane',
      zIndexOffset: 0,
    }).addTo(map);
    userMarkerRef.current = marker;
  }, [userLocation, isSimulated]);

  // Update Picked Location Pin for Note Creation
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isPickingLocation && pickedLocation) {
      const pinLatLng: L.LatLngExpression = [pickedLocation.latitude, pickedLocation.longitude];
      const pinHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="background: #18392D; color: #FAF8F3; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; box-shadow: 0 4px 10px rgba(0,0,0,0.25); white-space: nowrap; margin-bottom: 2px;">
            📍 Note Location
          </div>
          <div style="width: 14px; height: 14px; background: #18392D; border: 2.5px solid #FAF8F3; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
        </div>
      `;

      const pinIcon = L.divIcon({
        html: pinHtml,
        className: 'waypost-pick-icon',
        iconSize: [120, 40],
        iconAnchor: [60, 36],
      });

      if (!pickMarkerRef.current) {
        pickMarkerRef.current = L.marker(pinLatLng, { icon: pinIcon, zIndexOffset: 900 }).addTo(map);
      } else {
        pickMarkerRef.current.setLatLng(pinLatLng);
      }
    } else if (pickMarkerRef.current) {
      pickMarkerRef.current.remove();
      pickMarkerRef.current = null;
    }
  }, [isPickingLocation, pickedLocation]);

  // Render Note Markers with Clear Unlocked vs Locked Badges
  useEffect(() => {
    const group = markersLayerRef.current;
    if (!group) return;

    group.clearLayers();

    notes.forEach((note) => {
      const isUnlocked = userLocation ? isWithinUnlockRadius(userLocation, {
        latitude: note.latitude,
        longitude: note.longitude,
      }) : false;

      const catInfo = getCategoryInfo(note.category);
      const isSelected = selectedNote?.id === note.id;

      const markerHtml = `
        <div class="waypost-marker-pin" style="transform: ${isSelected ? 'scale(1.25)' : 'scale(1)'}; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); display: flex; flex-direction: column; align-items: center;">
          <div style="
            position: relative;
            background-color: ${isUnlocked ? '#18392D' : '#374151'};
            color: #FAF8F3;
            width: ${isSelected ? '44px' : '38px'};
            height: ${isSelected ? '44px' : '38px'};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, ${isSelected ? '0.35' : '0.2'});
            border: 2.5px solid ${isUnlocked ? '#10B981' : '#9CA3AF'};
          ">
            <div style="
              transform: rotate(45deg);
              font-size: ${isSelected ? '18px' : '15px'};
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              ${isUnlocked ? catInfo.icon : '🔒'}
            </div>
            ${
              note.imageIds && note.imageIds.length > 0 && isUnlocked
                ? `<div style="position: absolute; top: -2px; right: -2px; width: 10px; height: 10px; border-radius: 50%; background: #38bdf8; border: 1.5px solid #18392D;"></div>`
                : ''
            }
          </div>
          <div style="
            margin-top: -3px;
            font-size: 10px;
            font-weight: 700;
            padding: 1px 6px;
            border-radius: 10px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            background: ${isUnlocked ? '#059669' : '#4B5563'};
            color: #FFFFFF;
            white-space: nowrap;
          ">
            ${isUnlocked ? '🔓 Open' : '🔒 Locked'}
          </div>
        </div>
      `;

      const markerIcon = L.divIcon({
        html: markerHtml,
        className: `waypost-note-icon-${note.id}`,
        iconSize: [isSelected ? 54 : 46, isSelected ? 58 : 50],
        iconAnchor: [isSelected ? 27 : 23, isSelected ? 54 : 46],
        popupAnchor: [0, -46],
      });

      const marker = L.marker([note.latitude, note.longitude], {
        icon: markerIcon,
        zIndexOffset: isSelected ? 800 : isUnlocked ? 500 : 200,
      });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectNote(note);
      });

      group.addLayer(marker);
    });
  }, [notes, userLocation, selectedNote, onSelectNote]);

  // Center map when selected note changes
  useEffect(() => {
    if (selectedNote && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [selectedNote.latitude, selectedNote.longitude],
        16.5,
        { duration: 0.8 }
      );
    }
  }, [selectedNote]);

  return (
    <div className="relative w-full h-full min-h-[350px]">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
