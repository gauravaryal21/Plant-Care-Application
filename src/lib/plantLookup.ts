import type { LightLevel } from '@/lib/types';
import type { LocalWeather } from '@/lib/localWeather';

interface INaturalistPhoto {
  medium_url?: string;
  url?: string;
  attribution?: string;
  license_code?: string | null;
}

interface INaturalistTaxon {
  id: number;
  name: string;
  preferred_common_name?: string;
  rank?: string;
  url?: string;
  observations_count?: number;
  default_photo?: INaturalistPhoto | null;
}

export interface PlantMatch {
  id: number;
  scientificName: string;
  commonName: string;
  rank: string;
  taxonUrl: string;
  photoUrl: string | null;
  photoAttribution: string | null;
  photoLicense: string | null;
}

export interface PlantCareSuggestion {
  light: LightLevel;
  wateringDays: number;
  guidance: string;
}

export async function searchPlantNames(query: string, signal?: AbortSignal): Promise<PlantMatch[]> {
  const queryString = query.trim();
  const requests = ['taxa/autocomplete', 'taxa'].map(async (endpoint) => {
    const url = new URL(`https://api.inaturalist.org/v1/${endpoint}`);
    url.search = new URLSearchParams({
      q: queryString,
      taxon_id: '47126', // Plantae
      per_page: '30',
    }).toString();

    const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(response.status === 429 ? 'rate limited' : 'search failed');
    const payload: unknown = await response.json();
    const results = Array.isArray(payload)
      ? payload
      : payload && typeof payload === 'object' && 'results' in payload && Array.isArray(payload.results)
        ? payload.results
        : null;
    if (!results) throw new Error('unexpected response');
    return results.filter(isINaturalistTaxon);
  });

  const responses = await Promise.allSettled(requests);
  const taxa = responses.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
  if (taxa.length === 0 && responses.every((result) => result.status === 'rejected')) {
    const wasRateLimited = responses.some((result) => result.status === 'rejected' && result.reason instanceof Error && result.reason.message === 'rate limited');
    throw new Error(wasRateLimited ? 'Plant search is busy right now. Wait a moment and try again.' : 'Plant search is temporarily unavailable. Please try again.');
  }

  const byId = new Map<number, INaturalistTaxon>();
  for (const taxon of taxa) {
    const existing = byId.get(taxon.id);
    if (!existing?.default_photo && taxon.default_photo) byId.set(taxon.id, taxon);
    else if (!existing) byId.set(taxon.id, taxon);
  }

  const term = normalizePlantName(queryString);
  const rankOrder: Record<string, number> = { species: 5, subspecies: 4, variety: 3, form: 2, genus: 1 };
  return [...byId.values()]
    .filter((taxon) => !taxon.rank || taxon.rank in rankOrder)
    .sort((a, b) => scoreTaxon(b, term, rankOrder) - scoreTaxon(a, term, rankOrder))
    .slice(0, 15)
    .map((taxon) => {
      const photo = taxon.default_photo;
      const licensedPhoto = Boolean(photo?.license_code && (photo.medium_url || photo.url));
      return {
        id: taxon.id,
        scientificName: taxon.name,
        commonName: taxon.preferred_common_name || taxon.name,
        rank: taxon.rank || 'unknown',
        taxonUrl: taxon.url || `https://www.inaturalist.org/taxa/${taxon.id}`,
        photoUrl: licensedPhoto ? (photo?.medium_url || photo?.url || null) : null,
        photoAttribution: licensedPhoto ? (photo?.attribution || null) : null,
        photoLicense: licensedPhoto ? (photo?.license_code || null) : null,
      };
    });
}

function isINaturalistTaxon(value: unknown): value is INaturalistTaxon {
  return Boolean(
    value && typeof value === 'object' &&
    'id' in value && typeof value.id === 'number' &&
    'name' in value && typeof value.name === 'string',
  );
}

function normalizePlantName(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function scoreTaxon(taxon: INaturalistTaxon, term: string, rankOrder: Record<string, number>): number {
  const common = normalizePlantName(taxon.preferred_common_name ?? '');
  const scientific = normalizePlantName(taxon.name);
  let score = rankOrder[taxon.rank ?? ''] ?? 0;
  if (common === term || common.replace(/s$/, '') === term.replace(/s$/, '')) score += 1000;
  else if (common.startsWith(`${term} `) || term.startsWith(`${common} `)) score += 500;
  else if (common.includes(term)) score += 250;
  if (scientific === term || scientific.replace(/s$/, '') === term.replace(/s$/, '')) score += 200;
  else if (scientific.startsWith(term)) score += 100;
  if (taxon.default_photo?.license_code) score += 5;
  score += Math.min(20, Math.log10((taxon.observations_count ?? 0) + 1));
  return score;
}

const CARE_PROFILES: { genera: string[]; light: LightLevel; wateringDays: number; note: string }[] = [
  {
    genera: ['monstera', 'philodendron', 'epipremnum', 'pothos', 'ficus', 'schefflera', 'anthurium'],
    light: 'bright_indirect',
    wateringDays: 7,
    note: 'A tropical foliage starter profile: bright indirect light and a moderate watering rhythm.',
  },
  {
    genera: ['sansevieria', 'dracaena', 'zamioculcas', 'aloe', 'crassula', 'echeveria', 'haworthia', 'opuntia', 'mammillaria'],
    light: 'direct',
    wateringDays: 14,
    note: 'A drought-tolerant starter profile: strong light and time for the potting mix to dry between waterings.',
  },
  {
    genera: ['calathea', 'goeppertia', 'maranta', 'nephrolepis', 'adiantum', 'asplenium', 'fittonia'],
    light: 'bright_indirect',
    wateringDays: 4,
    note: 'A humidity-loving starter profile: gentle indirect light and evenly moist, well-drained soil.',
  },
  {
    genera: ['spathiphyllum', 'peace lily'],
    light: 'bright_indirect',
    wateringDays: 6,
    note: 'A tropical flowering starter profile: indirect light and soil that stays lightly moist, not waterlogged.',
  },
  {
    genera: ['phalaenopsis', 'dendrobium', 'cattleya'],
    light: 'bright_indirect',
    wateringDays: 7,
    note: 'An orchid starter profile: bright indirect light; let the roots and potting medium guide watering.',
  },
  {
    genera: ['rosa'],
    light: 'direct',
    wateringDays: 5,
    note: 'A rose starter profile: provide several hours of direct sun and check pots regularly for dry soil.',
  },
];

export function suggestPlantCare(scientificName: string, weather: LocalWeather | null): PlantCareSuggestion {
  const genus = scientificName.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
  const profile = CARE_PROFILES.find((entry) => entry.genera.includes(genus));
  const light = profile?.light ?? 'bright_indirect';
  const baseDays = profile?.wateringDays ?? 7;
  if (!weather) {
    return {
      light,
      wateringDays: baseDays,
      guidance: `${profile?.note ?? 'A general houseplant starter profile: bright indirect light and weekly soil checks.'} Add local weather to tune the watering reminder.`,
    };
  }

  const { temperature_2m: temp, relative_humidity_2m: humidity } = weather.current;
  const hotAndDry = temp >= 30 && humidity < 45;
  const coolOrHumid = temp <= 15 || humidity >= 80;
  const adjustment = hotAndDry ? -1 : coolOrHumid ? 1 : 0;
  const wateringDays = Math.min(21, Math.max(2, baseDays + adjustment));
  const weatherNote = hotAndDry
    ? 'Warm, dry outdoor air may dry pots faster; check the soil more often.'
    : coolOrHumid
      ? 'Cool or humid outdoor conditions can slow drying; check that the soil has dried before watering.'
      : 'Current outdoor conditions are mild; check the soil before each watering.';

  return {
    light,
    wateringDays,
    guidance: `${profile?.note ?? 'A general houseplant starter profile based on this plant name.'} ${weatherNote} Indoor conditions can differ from outdoor weather.`,
  };
}
