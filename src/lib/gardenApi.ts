import { supabase } from '@/lib/supabase';
import type { CareKind, CareLog, CareTask, LightLevel, Plant } from '@/lib/types';

export interface PlantInput {
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
}

export interface TaskInput {
  kind: CareKind;
  interval_days: number;
}

export interface GardenSnapshot {
  plants: Plant[];
  tasks: CareTask[];
  logs: CareLog[];
}

interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

function unwrap<T>(result: QueryResult<T>, action: string): T {
  if (result.error) {
    throw new Error(`${action}: ${result.error.message}`);
  }
  if (result.data === null) {
    throw new Error(`${action}: no data was returned`);
  }
  return result.data;
}

function ensureOk(result: { error: { message: string } | null }, action: string): void {
  if (result.error) {
    throw new Error(`${action}: ${result.error.message}`);
  }
}

const LOG_HISTORY_LIMIT = 1000;

export async function fetchGarden(): Promise<GardenSnapshot> {
  const [plants, tasks, logs] = await Promise.all([
    supabase.from('plants').select('*').order('name', { ascending: true }),
    supabase.from('care_tasks').select('*'),
    supabase.from('care_logs').select('*').order('done_at', { ascending: false }).limit(LOG_HISTORY_LIMIT),
  ]);

  return {
    plants: unwrap<Plant[]>(plants, 'Loading plants'),
    tasks: unwrap<CareTask[]>(tasks, 'Loading care tasks'),
    logs: unwrap<CareLog[]>(logs, 'Loading care history'),
  };
}

export async function createPlant(input: PlantInput, tasks: TaskInput[]): Promise<Plant> {
  const plant = unwrap<Plant>(
    await supabase.from('plants').insert(input).select().single(),
    'Saving plant',
  );

  if (tasks.length > 0) {
    try {
      ensureOk(
        await supabase
          .from('care_tasks')
          .insert(tasks.map((task) => ({ ...task, plant_id: plant.id }))),
        'Saving care schedule',
      );
    } catch (error) {
      await supabase.from('plants').delete().eq('id', plant.id);
      throw error;
    }
  }

  return plant;
}

export async function updatePlant(
  plantId: string,
  input: PlantInput,
  tasks: TaskInput[],
  existingTasks: CareTask[],
): Promise<void> {
  ensureOk(
    await supabase
      .from('plants')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', plantId),
    'Saving plant',
  );

  const keptKinds = new Set(tasks.map((task) => task.kind));
  const removed = existingTasks.filter((task) => task.plant_id === plantId && !keptKinds.has(task.kind));
  if (removed.length > 0) {
    ensureOk(
      await supabase.from('care_tasks').delete().in(
        'id',
        removed.map((task) => task.id),
      ),
      'Removing care tasks',
    );
  }

  if (tasks.length > 0) {
    ensureOk(
      await supabase
        .from('care_tasks')
        .upsert(
          tasks.map((task) => ({ ...task, plant_id: plantId })),
          { onConflict: 'plant_id,kind' },
        ),
      'Saving care schedule',
    );
  }
}

export async function deletePlant(plantId: string): Promise<void> {
  ensureOk(await supabase.from('plants').delete().eq('id', plantId), 'Deleting plant');
}

export async function completeCareTask(taskId: string, note: string | null): Promise<void> {
  ensureOk(
    await supabase.rpc('complete_care_task', { p_task_id: taskId, p_note: note }),
    'Recording care',
  );
}
