import { useMemo, useState } from 'react';
import { Plus, Search, SearchX, Sprout } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { PlantCard } from '@/components/PlantCard';
import { LIGHT_LEVELS, type LightLevel, type CareTask, type Plant } from '@/lib/types';
import { LIGHT_META } from '@/lib/careKinds';
import { buildCareQueue } from '@/lib/careQueue';
import { startOfDay } from '@/lib/careSchedule';
import type { LocalWeather } from '@/lib/localWeather';

interface PlantsViewProps {
  plants: Plant[];
  tasks: CareTask[];
  weather: LocalWeather | null;
  onOpenPlant: (plantId: string) => void;
  onAddPlant: () => void;
}

export function PlantsView({ plants, tasks, weather, onOpenPlant, onAddPlant }: PlantsViewProps) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState<string>('all');
  const [light, setLight] = useState<LightLevel | 'all'>('all');

  const locations = useMemo(() => Array.from(new Set(plants.map((plant) => plant.location))).sort(), [plants]);

  const queueByPlant = useMemo(() => {
    const queue = buildCareQueue(plants, tasks, startOfDay(new Date()), weather);
    const map = new Map<string, typeof queue>();
    for (const item of queue) {
      const list = map.get(item.plant.id) ?? [];
      list.push(item);
      map.set(item.plant.id, list);
    }
    return map;
  }, [plants, tasks, weather]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return plants.filter((plant) => {
      if (location !== 'all' && plant.location !== location) return false;
      if (light !== 'all' && plant.light !== light) return false;
      if (!term) return true;
      return [plant.name, plant.species ?? '', plant.location].some((value) => value.toLowerCase().includes(term));
    });
  }, [plants, query, location, light]);

  if (plants.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={Sprout}
          title="Your collection starts here"
          description="Add each plant with its light level and a care schedule. Verdant handles the reminders."
          action={
            <button type="button" onClick={onAddPlant} className="btn-primary">
              <Plus className="h-4 w-4" />
              Add your first plant
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, species or room"
            aria-label="Search plants"
            className="input-base pl-10"
          />
        </div>
        <select
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          aria-label="Filter by location"
          className="input-base lg:w-52"
        >
          <option value="all">All locations</option>
          {locations.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Filter by light">
          {(['all', ...LIGHT_LEVELS] as const).map((option) => {
            const active = light === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => setLight(option)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  active ? 'bg-brand-700 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {option === 'all' ? 'Any light' : LIGHT_META[option].label}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={SearchX} title="No plants match" description="Try a different search term or clear the filters." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              items={queueByPlant.get(plant.id) ?? []}
              onOpen={() => onOpenPlant(plant.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
