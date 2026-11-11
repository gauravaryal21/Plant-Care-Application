const LOCATION_STORAGE_KEY = 'verdant.local-weather-location.v1';

export interface GardenLocation {
  latitude: number;
  longitude: number;
  savedAt: string;
}

export interface LocalWeather {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
  };
  daily: {
    precipitation_sum: number[];
  };
  timezone: string;
}

export type WeatherStatus = 'idle' | 'requesting' | 'loading' | 'ready' | 'error';

export function readGardenLocation(): GardenLocation | null {
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<GardenLocation>;
    if (
      typeof value.latitude !== 'number' ||
      typeof value.longitude !== 'number' ||
      !Number.isFinite(value.latitude) ||
      !Number.isFinite(value.longitude)
    ) return null;
    return { latitude: value.latitude, longitude: value.longitude, savedAt: value.savedAt ?? '' };
  } catch {
    return null;
  }
}

export function saveGardenLocation(location: GardenLocation): void {
  localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
}

export function clearGardenLocation(): void {
  localStorage.removeItem(LOCATION_STORAGE_KEY);
}

export function requestGardenLocation(): Promise<GardenLocation> {
  if (!('geolocation' in navigator)) {
    return Promise.reject(new Error('Location is not available in this browser.'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({
        latitude: coords.latitude,
        longitude: coords.longitude,
        savedAt: new Date().toISOString(),
      }),
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Location permission was declined. Allow it in your browser settings to use local weather.'
          : error.code === error.POSITION_UNAVAILABLE
            ? 'Your device could not determine a location. Try again or check your device settings.'
            : 'Location took too long to respond. Please try again.';
        reject(new Error(message));
      },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 15 * 60_000 },
    );
  });
}

export async function fetchLocalWeather(location: GardenLocation, signal?: AbortSignal): Promise<LocalWeather> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code',
    daily: 'precipitation_sum',
    forecast_days: '3',
    timezone: 'auto',
  }).toString();

  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('Local weather is temporarily unavailable. Please try again.');
  return response.json() as Promise<LocalWeather>;
}
