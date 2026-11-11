import { useMemo, useState } from 'react';
import { CalendarCheck, CheckCircle2, Flame, Leaf, Loader2, Plus, Sprout, TriangleAlert } from 'lucide-react';
import { ActivityChart } from '@/components/ActivityChart';
import { CareKindIcon } from '@/components/CareKindBadge';
import { DueBadge } from '@/components/DueBadge';
import { EmptyState } from '@/components/EmptyState';
import { PlantAvatar } from '@/components/PlantAvatar';
import { LocalWeatherCard } from '@/components/LocalWeatherCard';
import type { GardenLocationState } from '@/hooks/useGardenLocation';
import type { LocalWeather } from '@/lib/localWeather';
import { CARE_KIND_META } from '@/lib/careKinds';
import { buildCareQueue, type CareItem } from '@/lib/careQueue';
import { computeStreak, countLogsByDay, startOfDay } from '@/lib/careSchedule';
import type { CareLog, CareTask, Plant } from '@/lib/types';

const HERO_IMAGE = 'https://images.pexels.com/photos/1573242/pexels-photo-1573242.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const UPCOMING_WINDOW_DAYS = 7;

interface DashboardViewProps {
  plants: Plant[];
  tasks: CareTask[];
  logs: CareLog[];
  userName: string;
  onOpenPlant: (plantId: string) => void;
  onAddPlant: () => void;
  onCompleteTask: (taskId: string, note: string | null) => Promise<boolean>;
  locationState: GardenLocationState;
  weather: LocalWeather | null;
}

function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({ label, value, hint, icon: Icon, tone }: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Leaf;
  tone: string;
}) {
  return (
    <div className="card animate-fade-up p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-stone-500">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold text-stone-900">{value}</p>
      <p className="mt-1 text-xs text-stone-500">{hint}</p>
    </div>
  );
}

function QueueRow({ item, pending, onComplete, onOpen }: {
  item: CareItem;
  pending: boolean;
  onComplete: () => void;
  onOpen: () => void;
}) {
  const meta = CARE_KIND_META[item.task.kind];
  return (
    <li className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-stone-50/70 sm:flex-nowrap">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-4 text-left">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-stone-200">
          <PlantAvatar name={item.plant.name} photoUrl={item.plant.photo_url} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-stone-900">{item.plant.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm text-stone-600">
              <CareKindIcon kind={item.task.kind} className="h-3.5 w-3.5 text-stone-400" />
              {meta.label}
            </span>
            <DueBadge status={item.status} label={item.label} />
          </div>
        </div>
      </button>
      <button type="button" onClick={onComplete} disabled={pending} className="btn-secondary w-full !py-2 sm:w-auto">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 text-brand-600" />}
        {meta.doneLabel}
      </button>
    </li>
  );
}

function QueueGroup({ title, items, pendingId, onComplete, onOpen, tone }: {
  title: string;
  items: CareItem[];
  pendingId: string | null;
  onComplete: (item: CareItem) => void;
  onOpen: (plantId: string) => void;
  tone: string;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className={`px-5 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider ${tone}`}>
        {title} ({items.length})
      </h3>
      <ul className="divide-y divide-stone-100">
        {items.map((item) => (
          <QueueRow
            key={item.task.id}
            item={item}
            pending={pendingId === item.task.id}
            onComplete={() => onComplete(item)}
            onOpen={() => onOpen(item.plant.id)}
          />
        ))}
      </ul>
    </section>
  );
}

export function DashboardView({ plants, tasks, logs, userName, onOpenPlant, onAddPlant, onCompleteTask, locationState, weather }: DashboardViewProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const snapshot = useMemo(() => {
    const today = startOfDay(new Date());
    const queue = buildCareQueue(plants, tasks, today, weather);
    const overdue = queue.filter((item) => item.status === 'overdue');
    const dueToday = queue.filter((item) => item.status === 'today');
    const upcoming = queue.filter(
      (item) => item.status === 'soon' || (item.status === 'scheduled' && item.dueDate.getTime() - today.getTime() <= UPCOMING_WINDOW_DAYS * 86_400_000),
    );
    const onTrack = queue.length === 0 ? 100 : Math.round(((queue.length - overdue.length) / queue.length) * 100);
    return {
      today,
      overdue,
      dueToday,
      upcoming,
      onTrack,
      streak: computeStreak(logs, today),
      activity: countLogsByDay(logs, 14, today),
    };
  }, [plants, tasks, logs, weather]);

  const handleComplete = async (item: CareItem) => {
    setPendingId(item.task.id);
    await onCompleteTask(item.task.id, null);
    setPendingId(null);
  };

  const attentionCount = snapshot.overdue.length + snapshot.dueToday.length;
  const summary =
    plants.length === 0
      ? 'Add your first plant to start a care schedule.'
      : attentionCount === 0
        ? 'Everything is on schedule. Nicely done.'
        : `${snapshot.dueToday.length} due today and ${snapshot.overdue.length} overdue.`;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-brand-950 text-white shadow-lift animate-fade-up">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/80 to-brand-950/20" />
        <div className="relative flex flex-col gap-6 p-8 md:flex-row md:items-end md:justify-between md:p-10">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-brand-200">
              {greetingFor(new Date().getHours())}, {userName.split(' ')[0]}
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight md:text-4xl">Your plants are in good hands.</h1>
            <p className="mt-3 text-base leading-relaxed text-brand-100">{summary}</p>
          </div>
          <button type="button" onClick={onAddPlant} className="btn-primary self-start bg-brand-200 text-brand-950 hover:bg-white md:self-auto">
            <Plus className="h-4 w-4" />
            Add plant
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Plants" value={String(plants.length)} hint="In your collection" icon={Leaf} tone="bg-brand-50 text-brand-700" />
        <StatCard label="Due today" value={String(snapshot.dueToday.length)} hint="Tasks to finish today" icon={CalendarCheck} tone="bg-amber-50 text-amber-700" />
        <StatCard label="Overdue" value={String(snapshot.overdue.length)} hint={snapshot.overdue.length ? 'Needs attention' : 'Nothing overdue'} icon={TriangleAlert} tone="bg-red-50 text-red-600" />
        <StatCard label="Care streak" value={`${snapshot.streak}d`} hint={`${snapshot.onTrack}% of tasks on track`} icon={Flame} tone="bg-clay-100 text-clay-700" />
      </div>

      <LocalWeatherCard state={locationState} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Care queue</h2>
              <p className="text-sm text-stone-500">Mark a task done to reset its schedule.</p>
            </div>
          </div>

          {plants.length === 0 ? (
            <EmptyState
              icon={Sprout}
              title="No plants yet"
              description="Add a plant and choose its care tasks. Verdant will remind you what needs doing each day."
              action={
                <button type="button" onClick={onAddPlant} className="btn-primary">
                  <Plus className="h-4 w-4" />
                  Add your first plant
                </button>
              }
            />
          ) : snapshot.overdue.length + snapshot.dueToday.length + snapshot.upcoming.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="All caught up" description="No tasks are due in the next week." />
          ) : (
            <div className="pb-2">
              <QueueGroup title="Overdue" tone="text-red-600" items={snapshot.overdue} pendingId={pendingId} onComplete={handleComplete} onOpen={onOpenPlant} />
              <QueueGroup title="Due today" tone="text-amber-700" items={snapshot.dueToday} pendingId={pendingId} onComplete={handleComplete} onOpen={onOpenPlant} />
              <QueueGroup title="Coming up" tone="text-stone-500" items={snapshot.upcoming} pendingId={pendingId} onComplete={handleComplete} onOpen={onOpenPlant} />
            </div>
          )}
        </div>

        <div className="card space-y-5 p-5">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Last 14 days</h2>
            <p className="text-sm text-stone-500">Care actions you have logged each day.</p>
          </div>
          <ActivityChart days={snapshot.activity} />
          <div className="rounded-xl bg-brand-50 p-4">
            <p className="text-sm font-medium text-brand-900">Recent tip</p>
            <p className="mt-1 text-sm leading-relaxed text-brand-800">
              {logs.length > 0
                ? 'Consistency beats intensity. A small task every day keeps plants healthier than a big rescue every month.'
                : 'Your history builds up as you complete tasks. Each completed task shows up here.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
