import { CloudSun, Droplets, Loader2, MapPin, RefreshCw, ThermometerSun, Wind } from 'lucide-react';
import type { GardenLocationState } from '@/hooks/useGardenLocation';

function weatherLabel(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 67) return 'Rain nearby';
  if (code <= 77) return 'Snow nearby';
  if (code <= 82) return 'Showers nearby';
  if (code <= 86) return 'Snow showers';
  return 'Thunderstorms nearby';
}

export function LocalWeatherCard({ state }: { state: GardenLocationState }) {
  const { location, weather, status, error, enableLocation, refreshWeather, forgetLocation } = state;
  return (
    <section className="card overflow-hidden">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <CloudSun className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-stone-900">Local growing conditions</h2>
            <p className="mt-1 text-sm text-stone-500">
              {location ? 'Outdoor weather helps tune plant suggestions.' : 'Use nearby weather to personalize plant suggestions.'}
            </p>
            {status === 'idle' && (
              <p className="mt-3 max-w-2xl text-xs leading-relaxed text-stone-400">
                Your browser will ask before sharing your location. Coordinates stay in this browser and are sent to Open-Meteo only to retrieve local weather.
              </p>
            )}
            {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
          </div>
        </div>

        {!location ? (
          <button type="button" onClick={() => void enableLocation()} disabled={status === 'requesting'} className="btn-primary shrink-0 self-start">
            {status === 'requesting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
            {status === 'requesting' ? 'Finding location' : 'Use my location'}
          </button>
        ) : (
          <div className="flex shrink-0 items-center gap-2 self-start">
            <button type="button" onClick={() => void enableLocation()} disabled={status === 'requesting'} className="btn-secondary !px-3">
              {status === 'requesting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              <span className="hidden sm:inline">Update location</span>
            </button>
            <button type="button" onClick={refreshWeather} disabled={status === 'loading'} className="btn-secondary !px-3" aria-label="Refresh local weather">
              {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={forgetLocation}
              aria-label="Forget saved location"
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
            >
              Forget location
            </button>
          </div>
        )}
      </div>

      {location && weather && status === 'ready' && (
        <div className="grid grid-cols-2 gap-3 border-t border-stone-100 bg-stone-50/60 px-5 py-4 sm:grid-cols-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <ThermometerSun className="h-4 w-4 text-clay-600" aria-hidden="true" />
            <div>
              <p className="text-xs text-stone-400">Temperature</p>
              <p className="text-sm font-semibold text-stone-800">{Math.round(weather.current.temperature_2m)}°C</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Droplets className="h-4 w-4 text-sky-600" aria-hidden="true" />
            <div>
              <p className="text-xs text-stone-400">Humidity</p>
              <p className="text-sm font-semibold text-stone-800">{Math.round(weather.current.relative_humidity_2m)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Wind className="h-4 w-4 text-brand-600" aria-hidden="true" />
            <div>
              <p className="text-xs text-stone-400">Conditions</p>
              <p className="text-sm font-semibold text-stone-800">{weatherLabel(weather.current.weather_code)}</p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-xs text-stone-400">Forecast rain · 3 days</p>
            <p className="text-sm font-semibold text-stone-800">
              {weather.daily.precipitation_sum.reduce((sum, amount) => sum + amount, 0).toFixed(1)} mm
            </p>
          </div>
          <p className="col-span-2 text-[11px] text-stone-400 sm:col-span-4">
            Weather by <a className="underline underline-offset-2 hover:text-stone-600" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> under <a className="underline underline-offset-2 hover:text-stone-600" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a> · Outdoor weather is only a guide for indoor plants.
          </p>
        </div>
      )}

      {location && status === 'loading' && (
        <div className="flex items-center gap-2 border-t border-stone-100 px-6 py-4 text-sm text-stone-500">
          <Loader2 className="h-4 w-4 animate-spin text-brand-600" aria-hidden="true" />
          Loading local weather…
        </div>
      )}
    </section>
  );
}
