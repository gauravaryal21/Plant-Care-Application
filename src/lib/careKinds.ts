import type { CareKind, LightLevel } from '@/lib/types';

export interface CareKindMeta {
  label: string;
  doneLabel: string;
  description: string;
  defaultInterval: number;
  tone: 'sky' | 'amber' | 'clay' | 'emerald' | 'teal' | 'lime';
}

export const CARE_KIND_META: Record<CareKind, CareKindMeta> = {
  water: {
    label: 'Watering',
    doneLabel: 'Watered',
    description: 'Give the soil a thorough drink',
    defaultInterval: 7,
    tone: 'sky',
  },
  fertilize: {
    label: 'Fertilizing',
    doneLabel: 'Fertilized',
    description: 'Feed during the growing season',
    defaultInterval: 30,
    tone: 'amber',
  },
  repot: {
    label: 'Repotting',
    doneLabel: 'Repotted',
    description: 'Refresh soil and give roots room',
    defaultInterval: 365,
    tone: 'clay',
  },
  prune: {
    label: 'Pruning',
    doneLabel: 'Pruned',
    description: 'Trim dead or leggy growth',
    defaultInterval: 90,
    tone: 'emerald',
  },
  mist: {
    label: 'Misting',
    doneLabel: 'Misted',
    description: 'Raise humidity for tropical leaves',
    defaultInterval: 2,
    tone: 'lime',
  },
  rotate: {
    label: 'Rotating',
    doneLabel: 'Rotated',
    description: 'Turn the pot for even growth',
    defaultInterval: 14,
    tone: 'teal',
  },
};

export const LIGHT_META: Record<LightLevel, { label: string; hint: string }> = {
  low: { label: 'Low light', hint: 'Away from windows' },
  bright_indirect: { label: 'Bright indirect', hint: 'Near a bright window' },
  direct: { label: 'Direct sun', hint: 'Sunny spot, several hours a day' },
};
