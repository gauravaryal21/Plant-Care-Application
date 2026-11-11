import { useState } from 'react';
import { CalendarDays, CloudSun, Loader2, MapPin, Pencil, Sun, Trash2, X } from 'lucide-react';
import { CareKindChip, CareKindIcon } from '@/components/CareKindBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DueBadge } from '@/components/DueBadge';
import { PlantAvatar } from '@/components/PlantAvatar';
import { CARE_KIND_META, LIGHT_META } from '@/lib/careKinds';
import type { CareItem } from '@/lib/careQueue';
import { deletePlant } from '@/lib/gardenApi';
import type { CareLog, Plant } from '@/lib/types';

const RECENT_LOG_COUNT = 6;

interface PlantDrawerProps {
  plant: Plant;
  items: CareItem[];
  logs: CareLog[];
  onClose: () => void;
  onEdit: () => void;
  onDeleted: (plant: Plant) => void;
  onCompleteTask: (taskId: string, note: string | null) => Promise<boolean>;
}

function formatLogDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function PlantDrawer({ plant, items, logs, onClose, onEdit, onDeleted, onCompleteTask }: PlantDrawerProps) {
  const [note, setNote] = useState('');
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const recentLogs = logs.filter((log) => log.plant_id === plant.id).slice(0, RECENT_LOG_COUNT);

  const handleComplete = async (taskId: string) => {
    setPendingTaskId(taskId);
    const trimmed = note.trim();
    const succeeded = await onCompleteTask(taskId, trimmed || null);
    setPendingTaskId(null);
    if (succeeded) setNote('');
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close plant details"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-stone-900/30 backdrop-blur-[2px]"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${plant.name} details`}
        className="relative flex h-full w-full max-w-lg animate-slide-in-right flex-col bg-white shadow-lift"
      >
        <div className="relative h-56 shrink-0 overflow-hidden bg-brand-100">
          <PlantAvatar name={plant.name} photoUrl={plant.photo_url} />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950/80 via-brand-950/10 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-stone-700 shadow-sm transition hover:bg-white"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-5 left-6 right-6 text-white">
            <h2 className="text-2xl font-semibold leading-tight">{plant.name}</h2>
            <p className="text-sm italic text-brand-100">{plant.species || plant.common_name || 'Species not set'}</p>
            {plant.photo_attribution && (
              <a href={plant.photo_source_url ?? '#'} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[11px] text-white/75 underline underline-offset-2">
                Photo credit: {plant.photo_attribution}{plant.photo_license ? ` · ${plant.photo_license}` : ''}
              </a>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          <div className="flex flex-wrap gap-2 text-sm text-stone-600">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {plant.location}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5">
              <Sun className="h-3.5 w-3.5" />
              {LIGHT_META[plant.light].label}
            </span>
            {plant.acquired_on && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Since {new Date(`${plant.acquired_on}T00:00:00`).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>

          {plant.notes && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Notes</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone-700">{plant.notes}</p>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Care schedule</h3>
              <span className="text-xs text-stone-400">{items.length} task{items.length === 1 ? '' : 's'}</span>
            </div>

            {items.length === 0 ? (
              <p className="mt-3 rounded-xl bg-stone-50 p-4 text-sm text-stone-500">
                No care tasks yet. Edit this plant to add watering or feeding reminders.
              </p>
            ) : (
              <>
                <label className="mt-3 block">
                  <span className="sr-only">Optional note for the next completed task</span>
                  <input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={500}
                    placeholder="Optional note, e.g. new growth on the left"
                    className="input-base"
                  />
                </label>
                <ul className="mt-3 space-y-3">
                  {items.map((item) => {
                    const pending = pendingTaskId === item.task.id;
                    return (
                      <li key={item.task.id} className="flex items-center gap-4 rounded-xl border border-stone-200 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                          <CareKindIcon kind={item.task.kind} className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-stone-900">{CARE_KIND_META[item.task.kind].label}</p>
                          <p className="mt-0.5 text-xs text-stone-500">Every {item.intervalDays} day{item.intervalDays === 1 ? '' : 's'}</p>
                          {item.weatherAdjusted && (
                            <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-sky-700">
                              <CloudSun className="h-3 w-3" aria-hidden="true" />
                              Weather adjusted · saved baseline {item.task.interval_days} days
                            </p>
                          )}
                          <div className="mt-2">
                            <DueBadge status={item.status} label={item.label} />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleComplete(item.task.id)}
                          disabled={pending}
                          className="btn-secondary !px-3 !py-2"
                        >
                          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                          Mark done
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Recent care</h3>
            {recentLogs.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">Nothing logged yet for this plant.</p>
            ) : (
              <ol className="mt-3 divide-y divide-stone-100">
                {recentLogs.map((log) => (
                  <li key={log.id} className="flex items-start justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <CareKindChip kind={log.kind} />
                      {log.note && <p className="mt-1.5 text-sm text-stone-600">{log.note}</p>}
                    </div>
                    <time dateTime={log.done_at} className="shrink-0 text-xs text-stone-400">
                      {formatLogDate(log.done_at)}
                    </time>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="flex gap-3 border-t border-stone-100 px-6 py-4">
          <button type="button" onClick={onEdit} className="btn-secondary flex-1">
            <Pencil className="h-4 w-4" />
            Edit plant
          </button>
          <button type="button" onClick={() => setConfirmingDelete(true)} className="btn-secondary !text-red-700 hover:!bg-red-50">
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </aside>

      {confirmingDelete && (
        <ConfirmDialog
          title={`Delete ${plant.name}?`}
          description="This removes the plant, its care schedule and its full care history. This cannot be undone."
          confirmLabel="Delete plant"
          onConfirm={async () => {
            await deletePlant(plant.id);
            onDeleted(plant);
          }}
          onClose={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
