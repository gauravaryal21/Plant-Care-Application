import { CareKindIcon } from '@/components/CareKindBadge';
import { DueBadge } from '@/components/DueBadge';
import { PlantAvatar } from '@/components/PlantAvatar';
import { CARE_KIND_META, LIGHT_META } from '@/lib/careKinds';
import type { CareItem } from '@/lib/careQueue';
import type { Plant } from '@/lib/types';

interface PlantCardProps {
  plant: Plant;
  items: CareItem[];
  onOpen: () => void;
}

export function PlantCard({ plant, items, onOpen }: PlantCardProps) {
  const urgent = items.find((item) => item.status === 'overdue') ?? items.find((item) => item.status === 'today') ?? items[0];
  const overdueCount = items.filter((item) => item.status === 'overdue').length;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="card group flex w-full animate-fade-up flex-col overflow-hidden text-left transition duration-300 hover:-translate-y-0.5 hover:shadow-lift focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
    >
      <div className="relative h-40 overflow-hidden bg-brand-50">
        <div className="h-full w-full transition duration-500 group-hover:scale-105">
          <PlantAvatar name={plant.name} photoUrl={plant.photo_url} />
        </div>
        {overdueCount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
            {overdueCount} overdue
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="truncate text-lg font-semibold text-stone-900">{plant.name}</h3>
          <p className="truncate text-sm italic text-stone-500">{plant.species || plant.common_name || 'Species not set'}</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-stone-600">
          <span className="rounded-full bg-stone-100 px-2.5 py-1">{plant.location}</span>
          <span className="rounded-full bg-stone-100 px-2.5 py-1">{LIGHT_META[plant.light].label}</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-stone-100 pt-3">
          {urgent ? (
            <>
              <span className="flex min-w-0 items-center gap-2 text-sm text-stone-600">
                <CareKindIcon kind={urgent.task.kind} className="h-4 w-4 shrink-0 text-stone-400" />
                <span className="truncate">{CARE_KIND_META[urgent.task.kind].label}</span>
              </span>
              <DueBadge status={urgent.status} label={urgent.label} />
            </>
          ) : (
            <span className="text-sm text-stone-400">No care tasks yet</span>
          )}
        </div>
      </div>
    </button>
  );
}
