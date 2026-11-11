import { useMemo, useState } from 'react';
import { ChevronDown, History } from 'lucide-react';
import { CareKindChip } from '@/components/CareKindBadge';
import { EmptyState } from '@/components/EmptyState';
import { CARE_KIND_META } from '@/lib/careKinds';
import { startOfDay, toISODate } from '@/lib/careSchedule';
import { CARE_KINDS, type CareKind, type CareLog, type Plant } from '@/lib/types';

const PAGE_SIZE = 40;

interface HistoryViewProps {
  plants: Plant[];
  logs: CareLog[];
  onOpenPlant: (plantId: string) => void;
}

function dayLabel(key: string, today: Date): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const diff = Math.round((startOfDay(today).getTime() - date.getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export function HistoryView({ plants, logs, onOpenPlant }: HistoryViewProps) {
  const [kind, setKind] = useState<CareKind | 'all'>('all');
  const [plantId, setPlantId] = useState<string>('all');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const plantById = useMemo(() => new Map(plants.map((plant) => [plant.id, plant])), [plants]);

  const filtered = useMemo(
    () =>
      logs.filter(
        (log) => (kind === 'all' || log.kind === kind) && (plantId === 'all' || log.plant_id === plantId),
      ),
    [logs, kind, plantId],
  );

  const visibleLogs = filtered.slice(0, visible);
  const today = startOfDay(new Date());

  const groups = useMemo(() => {
    const map = new Map<string, CareLog[]>();
    for (const log of visibleLogs) {
      const key = toISODate(new Date(log.done_at));
      const list = map.get(key) ?? [];
      list.push(log);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [visibleLogs]);

  if (logs.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={History}
          title="No care logged yet"
          description="Every task you mark done is recorded here, so you can see your care rhythm over time."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
        <div className="flex flex-1 gap-2 overflow-x-auto" role="group" aria-label="Filter by task">
          {(['all', ...CARE_KINDS] as const).map((option) => {
            const active = kind === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setKind(option);
                  setVisible(PAGE_SIZE);
                }}
                className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  active ? 'bg-brand-700 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {option === 'all' ? 'All tasks' : CARE_KIND_META[option].label}
              </button>
            );
          })}
        </div>
        <select
          value={plantId}
          onChange={(event) => {
            setPlantId(event.target.value);
            setVisible(PAGE_SIZE);
          }}
          aria-label="Filter by plant"
          className="input-base lg:w-56"
        >
          <option value="all">All plants</option>
          {plants.map((plant) => (
            <option key={plant.id} value={plant.id}>
              {plant.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={History} title="Nothing matches these filters" description="Try another task type or plant." />
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([key, dayLogs]) => (
            <section key={key} className="card overflow-hidden animate-fade-up">
              <header className="flex items-center justify-between border-b border-stone-100 bg-stone-50/70 px-5 py-3">
                <h2 className="text-sm font-semibold text-stone-900">{dayLabel(key, today)}</h2>
                <span className="text-xs text-stone-500">
                  {dayLogs.length} action{dayLogs.length === 1 ? '' : 's'}
                </span>
              </header>
              <ul className="divide-y divide-stone-100">
                {dayLogs.map((log) => {
                  const plant = plantById.get(log.plant_id);
                  return (
                    <li key={log.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                      <time dateTime={log.done_at} className="w-16 shrink-0 text-sm tabular-nums text-stone-500">
                        {new Date(log.done_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      </time>
                      <CareKindChip kind={log.kind} />
                      {plant ? (
                        <button
                          type="button"
                          onClick={() => onOpenPlant(plant.id)}
                          className="text-sm font-medium text-stone-900 underline-offset-4 transition hover:text-brand-700 hover:underline"
                        >
                          {plant.name}
                        </button>
                      ) : (
                        <span className="text-sm text-stone-400">Removed plant</span>
                      )}
                      {log.note && <p className="w-full pl-20 text-sm text-stone-600 sm:w-auto sm:pl-0">{log.note}</p>}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          {visible < filtered.length && (
            <div className="flex justify-center">
              <button type="button" onClick={() => setVisible((count) => count + PAGE_SIZE)} className="btn-secondary">
                <ChevronDown className="h-4 w-4" />
                Show more ({filtered.length - visible} left)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
