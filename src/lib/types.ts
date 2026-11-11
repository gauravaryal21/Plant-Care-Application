export const CARE_KINDS = ['water', 'fertilize', 'repot', 'prune', 'mist', 'rotate'] as const;
export type CareKind = (typeof CARE_KINDS)[number];

export const LIGHT_LEVELS = ['low', 'bright_indirect', 'direct'] as const;
export type LightLevel = (typeof LIGHT_LEVELS)[number];

export interface Plant {
  id: string;
  user_id: string;
  name: string;
  common_name: string | null;
  species: string | null;
  location: string;
  light: LightLevel;
  notes: string | null;
  photo_url: string | null;
  photo_attribution: string | null;
  photo_license: string | null;
  photo_source_url: string | null;
  acquired_on: string | null;
  created_at: string;
  updated_at: string;
}

export interface CareTask {
  id: string;
  user_id: string;
  plant_id: string;
  kind: CareKind;
  interval_days: number;
  last_done_on: string | null;
  created_at: string;
}

export interface CareLog {
  id: string;
  user_id: string;
  plant_id: string;
  task_id: string | null;
  kind: CareKind;
  done_at: string;
  note: string | null;
  created_at: string;
}
