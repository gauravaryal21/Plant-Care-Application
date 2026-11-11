/*
# Create plant care schema

Plain-English summary: this creates the core data for a plant care tracker. Each plant can have several recurring care tasks (watering, fertilizing, and so on), each with a repeat interval. Every time a task is completed, a history entry is written so the app can show a full care log and statistics.

## 1. New tables
- `plants`: one row per plant. Holds name, species, location in the home, light level, notes, optional photo URL, and the date it was acquired.
- `care_tasks`: recurring care jobs for a plant. Each plant can have at most one task per kind (watering, fertilizing, repotting, pruning, misting, rotating). Stores the repeat interval in days and the date it was last done.
- `care_logs`: an append-only history of completed care. Keeps a snapshot of the task kind so history stays readable even if a task is later removed.

## 2. Functions
- `complete_care_task(task_id, note)`: in one transaction, marks a task as done today and writes the matching history entry. Runs with the caller's permissions, so row level security still applies.

## 3. Security
- Row level security is enabled on all three tables.
- The app has no sign-in screen, so the anon and authenticated roles are granted the same CRUD access on the tables, and each table has one policy per operation. The data is intentionally shared.
- The completion function is granted only to anon and authenticated, not to the public role.

## 4. Important notes
1. Deleting a plant removes its tasks and its history (cascade).
2. Deleting a single task keeps its history entries, with the task link cleared.
3. Interval values are restricted to 1 to 365 days.
4. Migration is idempotent: safe to re-run.
*/

CREATE TABLE IF NOT EXISTS plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 120),
  species text CHECK (species IS NULL OR char_length(species) <= 160),
  location text NOT NULL DEFAULT 'Living room' CHECK (char_length(location) <= 80),
  light text NOT NULL DEFAULT 'bright_indirect' CHECK (light IN ('low', 'bright_indirect', 'direct')),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 2000),
  photo_url text CHECK (photo_url IS NULL OR char_length(photo_url) <= 2000),
  acquired_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS care_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id uuid NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('water', 'fertilize', 'repot', 'prune', 'mist', 'rotate')),
  interval_days integer NOT NULL CHECK (interval_days BETWEEN 1 AND 365),
  last_done_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plant_id, kind)
);

CREATE INDEX IF NOT EXISTS care_tasks_plant_id_idx ON care_tasks (plant_id);

CREATE TABLE IF NOT EXISTS care_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id uuid NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  task_id uuid REFERENCES care_tasks(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('water', 'fertilize', 'repot', 'prune', 'mist', 'rotate')),
  done_at timestamptz NOT NULL DEFAULT now(),
  note text CHECK (note IS NULL OR char_length(note) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS care_logs_plant_done_idx ON care_logs (plant_id, done_at DESC);
CREATE INDEX IF NOT EXISTS care_logs_done_idx ON care_logs (done_at DESC);

ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON plants TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON care_tasks TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON care_logs TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_plants" ON plants;
CREATE POLICY "anon_select_plants" ON plants FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_plants" ON plants;
CREATE POLICY "anon_insert_plants" ON plants FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_plants" ON plants;
CREATE POLICY "anon_update_plants" ON plants FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_plants" ON plants;
CREATE POLICY "anon_delete_plants" ON plants FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_care_tasks" ON care_tasks;
CREATE POLICY "anon_select_care_tasks" ON care_tasks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_care_tasks" ON care_tasks;
CREATE POLICY "anon_insert_care_tasks" ON care_tasks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_care_tasks" ON care_tasks;
CREATE POLICY "anon_update_care_tasks" ON care_tasks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_care_tasks" ON care_tasks;
CREATE POLICY "anon_delete_care_tasks" ON care_tasks FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_care_logs" ON care_logs;
CREATE POLICY "anon_select_care_logs" ON care_logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_care_logs" ON care_logs;
CREATE POLICY "anon_insert_care_logs" ON care_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_care_logs" ON care_logs;
CREATE POLICY "anon_update_care_logs" ON care_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_care_logs" ON care_logs;
CREATE POLICY "anon_delete_care_logs" ON care_logs FOR DELETE TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION complete_care_task(p_task_id uuid, p_note text DEFAULT NULL)
RETURNS care_logs
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_task care_tasks;
  v_log care_logs;
BEGIN
  SELECT * INTO v_task FROM care_tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Care task not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE care_tasks SET last_done_on = current_date WHERE id = v_task.id;

  INSERT INTO care_logs (plant_id, task_id, kind, note)
  VALUES (v_task.plant_id, v_task.id, v_task.kind, NULLIF(trim(p_note), ''))
  RETURNING * INTO v_log;

  RETURN v_log;
END;
$$;

REVOKE EXECUTE ON FUNCTION complete_care_task(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION complete_care_task(uuid, text) TO anon, authenticated;
