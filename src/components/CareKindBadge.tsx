import { CloudDrizzle, Droplets, FlaskConical, RotateCw, Scissors, Sprout, type LucideIcon } from 'lucide-react';
import { CARE_KIND_META } from '@/lib/careKinds';
import type { CareKind } from '@/lib/types';

const KIND_ICON: Record<CareKind, LucideIcon> = {
  water: Droplets,
  fertilize: FlaskConical,
  repot: Sprout,
  prune: Scissors,
  mist: CloudDrizzle,
  rotate: RotateCw,
};

const TONE_CLASSES: Record<(typeof CARE_KIND_META)[CareKind]['tone'], string> = {
  sky: 'bg-sky-50 text-sky-700 ring-sky-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  clay: 'bg-clay-100 text-clay-700 ring-clay-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
  lime: 'bg-lime-50 text-lime-800 ring-lime-200',
};

export function CareKindIcon({ kind, className = 'h-4 w-4' }: { kind: CareKind; className?: string }) {
  const Icon = KIND_ICON[kind];
  return <Icon className={className} aria-hidden="true" />;
}

export function CareKindChip({ kind }: { kind: CareKind }) {
  const meta = CARE_KIND_META[kind];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${TONE_CLASSES[meta.tone]}`}
    >
      <CareKindIcon kind={kind} className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}
