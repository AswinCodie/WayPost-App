import { LocalStorageManager } from './storage';

export type MapProviderType =
  | 'google_maps'
  | 'osm'
  | 'mapbox'
  | 'maptiler'
  | 'stadia'
  | 'carto_voyager';

export interface MapConfig {
  provider: MapProviderType;
  apiKey?: string;
  customTileUrl?: string;
}

export interface TileLayerDetails {
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[] | string;
}

const MAP_CONFIG_KEY = 'waypost_map_config_v1';

export class MapConfigService {
  static getConfig(): MapConfig {
    const envProvider = import.meta.env.VITE_MAP_PROVIDER as MapProviderType | undefined;
    const stored = LocalStorageManager.getItem<MapConfig | null>(MAP_CONFIG_KEY, null);

    // Use stored user preference if not carto_voyager (migrate old)
    if (stored && stored.provider !== 'carto_voyager' && stored.provider !== 'google_maps') {
      return stored;
    }

    // Use .env provider if set (but treat google_maps as carto_voyager since
    // Google Maps tile URLs via Leaflet require Maps Tiles API, not standard Maps Platform key)
    if (envProvider && envProvider !== 'google_maps') {
      return {
        provider: envProvider,
        apiKey: import.meta.env.VITE_MAP_API_KEY || import.meta.env.VITE_MAPBOX_TOKEN || '',
      };
    }

    // Default: CartoDB Voyager - beautiful, free, no API key required
    return {
      provider: 'osm',
      apiKey: '',
    };
  }

  static saveConfig(config: MapConfig): void {
    LocalStorageManager.setItem(MAP_CONFIG_KEY, config);
  }

  static getTileLayerDetails(config: MapConfig): TileLayerDetails {
    const key =
      config.apiKey ||
      import.meta.env.VITE_MAP_API_KEY ||
      import.meta.env.VITE_MAPBOX_TOKEN ||
      '';

    switch (config.provider) {
      case 'mapbox':
        if (key) {
          return {
            url: `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/{z}/{x}/{y}?access_token=${key}`,
            attribution:
              '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 22,
            subdomains: 'abcd',
          };
        }
        break;

      case 'maptiler':
        if (key) {
          return {
            url: `https://api.maptiler.com/maps/outdoor-v2/{z}/{x}/{y}.png?key=${key}`,
            attribution:
              '© <a href="https://www.maptiler.com/copyright/">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 20,
            subdomains: 'abcd',
          };
        }
        break;

      case 'stadia':
        if (key) {
          return {
            url: `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=${key}`,
            attribution:
              '© <a href="https://stadiamaps.com/">Stadia Maps</a> © <a href="https://openmaptiles.org/">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 20,
            subdomains: 'abcd',
          };
        }
        break;

      case 'osm':
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          subdomains: 'abc',
        };

      case 'carto_voyager':
      case 'google_maps':
      default:
        break;
    }

    // Default: CartoDB Voyager — beautiful, modern, completely free, no API key needed
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
      subdomains: 'abc',
    };
  }
}

