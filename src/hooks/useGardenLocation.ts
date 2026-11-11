import { useCallback, useEffect, useState } from 'react';
import {
  clearGardenLocation,
  fetchLocalWeather,
  readGardenLocation,
  requestGardenLocation,
  saveGardenLocation,
  type GardenLocation,
  type LocalWeather,
  type WeatherStatus,
} from '@/lib/localWeather';

export interface GardenLocationState {
  location: GardenLocation | null;
  weather: LocalWeather | null;
  status: WeatherStatus;
  error: string | null;
  enableLocation: () => Promise<void>;
  refreshWeather: () => void;
  forgetLocation: () => void;
}

export function useGardenLocation(): GardenLocationState {
  const [location, setLocation] = useState<GardenLocation | null>(() => readGardenLocation());
  const [weather, setWeather] = useState<LocalWeather | null>(null);
  const [status, setStatus] = useState<WeatherStatus>(() => readGardenLocation() ? 'loading' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!location) {
      setWeather(null);
      setStatus('idle');
      return;
    }

    const controller = new AbortController();
    setStatus('loading');
    setError(null);
    setWeather(null);
    fetchLocalWeather(location, controller.signal)
      .then((data) => {
        setWeather(data);
        setStatus('ready');
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : 'Could not load local weather.');
        setStatus('error');
      });
    return () => controller.abort();
  }, [location, refreshKey]);

  useEffect(() => {
    if (!location) return;
    const timer = window.setInterval(() => setRefreshKey((key) => key + 1), 60 * 60_000);
    return () => window.clearInterval(timer);
  }, [location]);

  const enableLocation = useCallback(async () => {
    setStatus('requesting');
    setError(null);
    try {
      const next = await requestGardenLocation();
      saveGardenLocation(next);
      setLocation(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not access your location.');
      setStatus('error');
    }
  }, []);

  const refreshWeather = useCallback(() => setRefreshKey((key) => key + 1), []);

  const forgetLocation = useCallback(() => {
    clearGardenLocation();
    setLocation(null);
    setWeather(null);
    setError(null);
    setStatus('idle');
  }, []);

  return { location, weather, status, error, enableLocation, refreshWeather, forgetLocation };
}
