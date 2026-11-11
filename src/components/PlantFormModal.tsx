import { useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2, Search, Sprout } from 'lucide-react';
import { CareKindIcon } from '@/components/CareKindBadge';
import { Modal } from '@/components/Modal';
import { CARE_KIND_META, LIGHT_META } from '@/lib/careKinds';
import { createPlant, updatePlant, type PlantInput, type TaskInput } from '@/lib/gardenApi';
import { searchPlantNames, suggestPlantCare, type PlantMatch } from '@/lib/plantLookup';
import type { LocalWeather } from '@/lib/localWeather';
import { CARE_KINDS, LIGHT_LEVELS, type CareKind, type CareTask, type LightLevel, type Plant } from '@/lib/types';

const MAX_INTERVAL_DAYS = 365;
const COMMON_LOCATIONS = ['Living room', 'Kitchen', 'Bedroom', 'Bathroom', 'Office', 'Balcony', 'Hallway'];

interface KindDraft {
  enabled: boolean;
  interval: string;
}

type ScheduleDraft = Record<CareKind, KindDraft>;

interface PlantFormModalProps {
  plant: Plant | null;
  existingTasks: CareTask[];
  weather: LocalWeather | null;
  hasLocalWeather: boolean;
  onClose: () => void;
  onSaved: (plant: Plant, mode: 'created' | 'updated') => void;
}

function buildInitialSchedule(plant: Plant | null, existingTasks: CareTask[]): ScheduleDraft {
  const draft = {} as ScheduleDraft;
  for (const kind of CARE_KINDS) {
    const existing = existingTasks.find((task) => task.kind === kind);
    draft[kind] = existing
      ? { enabled: true, interval: String(existing.interval_days) }
      : { enabled: !plant && kind === 'water', interval: String(CARE_KIND_META[kind].defaultInterval) };
  }
  return draft;
}

function parseInterval(raw: string): number | null {
  if (!/^\d+$/.test(raw.trim())) return null;
  const value = Number(raw);
  return value >= 1 && value <= MAX_INTERVAL_DAYS ? value : null;
}

export function PlantFormModal({ plant, existingTasks, weather, hasLocalWeather, onClose, onSaved }: PlantFormModalProps) {
  const [name, setName] = useState(plant?.name ?? '');
  const [commonName, setCommonName] = useState(plant?.common_name ?? '');
  const [species, setSpecies] = useState(plant?.species ?? '');
  const [location, setLocation] = useState(plant?.location ?? 'Living room');
  const [light, setLight] = useState<LightLevel>(plant?.light ?? 'bright_indirect');
  const [acquiredOn, setAcquiredOn] = useState(plant?.acquired_on ?? '');
  const [photoUrl, setPhotoUrl] = useState(plant?.photo_url ?? '');
  const [photoAttribution, setPhotoAttribution] = useState(plant?.photo_attribution ?? '');
  const [photoLicense, setPhotoLicense] = useState(plant?.photo_license ?? '');
  const [photoSourceUrl, setPhotoSourceUrl] = useState(plant?.photo_source_url ?? '');
  const [notes, setNotes] = useState(plant?.notes ?? '');
  const [schedule, setSchedule] = useState<ScheduleDraft>(() => buildInitialSchedule(plant, existingTasks));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<PlantMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<PlantMatch | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const updateKind = (kind: CareKind, patch: Partial<KindDraft>) => {
    setSchedule((current) => ({ ...current, [kind]: { ...current[kind], ...patch } }));
  };

  const searchPlant = async () => {
    if (commonName.trim().length < 2) {
      setSearchError('Enter at least two letters to search plant names.');
      return;
    }
    setSearching(true);
    setSearchError(null);
    setMatches([]);
    setSelectedMatch(null);
    try {
      const results = await searchPlantNames(commonName);
      setMatches(results);
      if (results.length === 0) setSearchError('No plant matches found. You can still enter the details yourself.');
    } catch (cause) {
      setSearchError(cause instanceof Error ? cause.message : 'Plant search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const selectMatch = (match: PlantMatch) => {
    const recommendation = suggestPlantCare(match.scientificName, weather);
    const plantTypeProfile = suggestPlantCare(match.scientificName, null);
    setSelectedMatch(match);
    setCommonName(match.commonName);
    setSpecies(match.scientificName);
    setName((current) => current.trim() ? current : match.commonName);
    setLight(recommendation.light);
    setSchedule((current) => ({
      ...current,
      water: { enabled: true, interval: String(plantTypeProfile.wateringDays) },
    }));
    if (match.photoUrl) {
      setPhotoUrl(match.photoUrl);
      setPhotoAttribution(match.photoAttribution ?? 'iNaturalist contributor');
      setPhotoLicense(match.photoLicense ?? '');
      setPhotoSourceUrl(match.taxonUrl);
    } else {
      setPhotoUrl('');
      setPhotoAttribution('');
      setPhotoLicense('');
      setPhotoSourceUrl('');
    }
  };

  const validate = (): { input: PlantInput; tasks: TaskInput[] } | string => {
    const trimmedName = name.trim();
    if (!trimmedName) return 'Give your plant a name.';
    if (trimmedName.length > 120) return 'The name must be 120 characters or fewer.';

    const trimmedPhoto = photoUrl.trim();
    if (trimmedPhoto && !/^https?:\/\//i.test(trimmedPhoto)) {
      return 'The photo link must start with http:// or https://.';
    }

    const tasks: TaskInput[] = [];
    for (const kind of CARE_KINDS) {
      const draft = schedule[kind];
      if (!draft.enabled) continue;
      const interval = parseInterval(draft.interval);
      if (interval === null) {
        return `${CARE_KIND_META[kind].label} needs a whole number of days between 1 and ${MAX_INTERVAL_DAYS}.`;
      }
      tasks.push({ kind, interval_days: interval });
    }

    return {
      input: {
        name: trimmedName,
        common_name: commonName.trim() || null,
        species: species.trim() || null,
        location: location.trim() || 'Living room',
        light,
        notes: notes.trim() || null,
        photo_url: trimmedPhoto || null,
        photo_attribution: trimmedPhoto ? photoAttribution.trim() || null : null,
        photo_license: trimmedPhoto ? photoLicense.trim() || null : null,
        photo_source_url: trimmedPhoto ? photoSourceUrl.trim() || null : null,
        acquired_on: acquiredOn || null,
      },
      tasks,
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validate();
    if (typeof result === 'string') {
      setError(result);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (plant) {
        await updatePlant(plant.id, result.input, result.tasks, existingTasks);
        onSaved({ ...plant, ...result.input, updated_at: new Date().toISOString() }, 'updated');
      } else {
        const created = await createPlant(result.input, result.tasks);
        onSaved(created, 'created');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this plant. Please try again.');
      setSubmitting(false);
    }
  };

  const title = plant ? `Edit ${plant.name}` : 'Add a plant';
  const description = plant
    ? 'Update details and fine-tune how often each task repeats.'
    : 'Describe the plant and choose the care tasks you want reminders for.';

  return (
    <Modal
      title={title}
      description={description}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" form="plant-form" className="btn-primary" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {plant ? 'Save changes' : 'Add plant'}
          </button>
        </>
      }
    >
      <form id="plant-form" onSubmit={handleSubmit} className="space-y-7" noValidate>
        <section className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 ring-1 ring-brand-100">
              <Search className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900">Plant finder</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
                Search by common name to find the scientific species, a credited photo, and a starter care profile. Search terms are sent to iNaturalist.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={commonName}
              onChange={(event) => {
                setCommonName(event.target.value);
                setSelectedMatch(null);
                setMatches([]);
                setSearchError(null);
              }}
              maxLength={120}
              placeholder="e.g. Monstera or snake plant"
              aria-label="Common name of the plant"
              className="input-base bg-white"
            />
            <button type="button" onClick={() => void searchPlant()} disabled={searching} className="btn-secondary shrink-0">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Find plant
            </button>
          </div>
          <p aria-live="polite" className="mt-2 text-xs text-stone-500">
            {searchError || (hasLocalWeather ? 'Weather-aware suggestions are available.' : 'Set your location on the dashboard for weather-aware suggestions.')}
          </p>

          {matches.length > 0 && (
            <ul className="mt-3 space-y-2" aria-label="Plant matches">
              {matches.map((match) => (
                <li key={match.id}>
                  <button
                    type="button"
                    onClick={() => selectMatch(match)}
                    aria-pressed={selectedMatch?.id === match.id}
                    className={`flex w-full items-center gap-3 rounded-xl border bg-white p-2.5 text-left transition hover:border-brand-400 ${selectedMatch?.id === match.id ? 'border-brand-500 ring-2 ring-brand-100' : 'border-stone-200'}`}
                  >
                    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                      {match.photoUrl ? (
                        <img src={match.photoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center"><Sprout className="h-5 w-5 text-brand-500" aria-hidden="true" /></span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-stone-900">{match.commonName}</span>
                      <span className="block truncate text-xs italic text-stone-500">{match.scientificName} · {match.rank}</span>
                    </span>
                    <span className="text-xs font-medium text-brand-700">Use</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selectedMatch && (() => {
            const suggestion = suggestPlantCare(selectedMatch.scientificName, weather);
            return (
              <div className="mt-3 rounded-xl bg-white p-3 ring-1 ring-brand-100">
                <p className="text-xs font-semibold text-brand-800">Starter care profile applied</p>
                {selectedMatch.rank !== 'species' && (
                  <p className="mt-1 rounded-lg bg-amber-50 px-2.5 py-2 text-xs leading-relaxed text-amber-800">
                    This is a {selectedMatch.rank}-level match, not an exact species identification. Confirm or refine the scientific name below if you know the exact plant.
                  </p>
                )}
                <p className="mt-1 text-xs leading-relaxed text-stone-600">{suggestion.guidance}</p>
                <p className="mt-2 text-xs text-stone-500">
                  {LIGHT_META[suggestion.light].label} · Watering reminder every {suggestion.wateringDays} days. Adjust these fields below to suit the plant’s actual spot and soil.
                </p>
                {selectedMatch.photoUrl && (
                  <p className="mt-2 text-[11px] text-stone-400">
                    Photo: {selectedMatch.photoAttribution || 'iNaturalist contributor'} · {selectedMatch.photoLicense} ·{' '}
                    <a href={selectedMatch.taxonUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">iNaturalist</a>
                  </p>
                )}
              </div>
            );
          })()}
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <label className="block md:col-span-1">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              placeholder="Monty the Monstera"
              className="input-base"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">Species</span>
            <input
              value={species}
              onChange={(event) => setSpecies(event.target.value)}
              maxLength={160}
              placeholder="Monstera deliciosa"
              className="input-base"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">Location</span>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              maxLength={80}
              list="plant-locations"
              className="input-base"
            />
            <datalist id="plant-locations">
              {COMMON_LOCATIONS.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">Acquired on</span>
            <input
              type="date"
              value={acquiredOn}
              onChange={(event) => setAcquiredOn(event.target.value)}
              className="input-base"
            />
          </label>

          <fieldset className="md:col-span-2">
            <legend className="mb-2 text-sm font-medium text-stone-700">Light</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {LIGHT_LEVELS.map((option) => {
                const active = light === option;
                return (
                  <label
                    key={option}
                    className={`cursor-pointer rounded-xl border p-3.5 transition ${
                      active ? 'border-brand-600 bg-brand-50 ring-4 ring-brand-100' : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="light"
                      value={option}
                      checked={active}
                      onChange={() => setLight(option)}
                      className="sr-only"
                    />
                    <span className="block text-sm font-semibold text-stone-900">{LIGHT_META[option].label}</span>
                    <span className="mt-0.5 block text-xs text-stone-500">{LIGHT_META[option].hint}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">Photo link (optional)</span>
            <input
              value={photoUrl}
              onChange={(event) => {
                const value = event.target.value;
                setPhotoUrl(value);
                if (value !== selectedMatch?.photoUrl) {
                  setPhotoAttribution('');
                  setPhotoLicense('');
                  setPhotoSourceUrl('');
                }
              }}
              placeholder="https://..."
              inputMode="url"
              className="input-base"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-stone-700">Notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Pot size, soil mix, anything you want to remember"
              className="input-base resize-none"
            />
          </label>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Sprout className="h-4 w-4 text-brand-700" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-stone-900">Care schedule</h3>
          </div>
          {hasLocalWeather && (
            <p className="mb-3 text-xs leading-relaxed text-stone-500">
              Watering due dates adjust to your local weather. The interval below stays as your editable baseline.
            </p>
          )}
          <div className="space-y-2.5">
            {CARE_KINDS.map((kind) => {
              const draft = schedule[kind];
              return (
                <div
                  key={kind}
                  className={`flex flex-wrap items-center gap-3 rounded-xl border p-3.5 transition sm:flex-nowrap ${
                    draft.enabled ? 'border-brand-200 bg-brand-50/40' : 'border-stone-200'
                  }`}
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={draft.enabled}
                      onChange={(event) => updateKind(kind, { enabled: event.target.checked })}
                      className="h-4 w-4 rounded border-stone-300 text-brand-700 focus:ring-brand-500"
                    />
                    <CareKindIcon kind={kind} className="h-4 w-4 text-brand-700" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-stone-900">{CARE_KIND_META[kind].label}</span>
                      <span className="block truncate text-xs text-stone-500">{CARE_KIND_META[kind].description}</span>
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500">Every</span>
                    <input
                      type="number"
                      min={1}
                      max={MAX_INTERVAL_DAYS}
                      step={1}
                      value={draft.interval}
                      disabled={!draft.enabled}
                      onChange={(event) => updateKind(kind, { interval: event.target.value })}
                      aria-label={`${CARE_KIND_META[kind].label} interval in days`}
                      className="input-base w-20 !py-2 text-center disabled:bg-stone-50 disabled:text-stone-400"
                    />
                    <span className="text-xs text-stone-500">days</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
