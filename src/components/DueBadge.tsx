import type { DueStatus } from '@/lib/careSchedule';

const STATUS_CLASSES: Record<DueStatus, string> = {
  overdue: 'bg-red-50 text-red-700 ring-red-200',
  today: 'bg-amber-100 text-amber-900 ring-amber-300',
  soon: 'bg-sky-50 text-sky-700 ring-sky-200',
  scheduled: 'bg-stone-100 text-stone-600 ring-stone-200',
};

export function DueBadge({ status, label }: { status: DueStatus; label: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_CLASSES[status]}`}>
      {label}
    </span>
  );
}
