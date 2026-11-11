/*
# Add user accounts and per-user data ownership

Plain-English summary: the plant tracker now belongs to individual accounts. Each person signs in with email and password and only sees and changes their own plants, care schedules and history. Visitors who are not signed in can no longer read or write any data.

## 1. Modified tables
- `plants`, `care_tasks`, `care_logs`: new `user_id` column that records the owner. It defaults to the signed-in user, so the app does not need to send it. Existing tables were empty, so no data is changed.
- Indexes added on `user_id` for fast per-user lookups.

## 2. Security changes
- Removed the open access policies that let anyone read and write.
- Access is now granted only to signed-in users (`authenticated`). The `anon` role has no access to these tables.
- Each table has four policies (select, insert, update, delete), each limited to rows where `user_id` equals the signed-in user.
- Care tasks and care history can only be attached to a plant the user owns.
- `complete_care_task` is limited to signed-in users and still runs with the caller's permissions, so the same ownership rules apply.

## 3. Important notes
1. Deleting an account removes all of its plants, tasks and history (cascade).
2. Migration is safe to re-run: it uses IF NOT EXISTS and drops policies before re-creating them.
*/

ALTER TABLE plants ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE care_tasks ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE care_logs ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS plants_user_id_idx ON plants (user_id);
CREATE INDEX IF NOT EXISTS care_tasks_user_id_idx ON care_tasks (user_id);
CREATE INDEX IF NOT EXISTS care_logs_user_id_idx ON care_logs (user_id);

REVOKE ALL ON plants, care_tasks, care_logs FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON plants, care_tasks, care_logs TO authenticated;

DROP POLICY IF EXISTS "anon_select_plants" ON plants;
DROP POLICY IF EXISTS "anon_insert_plants" ON plants;
DROP POLICY IF EXISTS "anon_update_plants" ON plants;
DROP POLICY IF EXISTS "anon_delete_plants" ON plants;
DROP POLICY IF EXISTS "anon_select_care_tasks" ON care_tasks;
DROP POLICY IF EXISTS "anon_insert_care_tasks" ON care_tasks;
DROP POLICY IF EXISTS "anon_update_care_tasks" ON care_tasks;
DROP POLICY IF EXISTS "anon_delete_care_tasks" ON care_tasks;
DROP POLICY IF EXISTS "anon_select_care_logs" ON care_logs;
DROP POLICY IF EXISTS "anon_insert_care_logs" ON care_logs;
DROP POLICY IF EXISTS "anon_update_care_logs" ON care_logs;
DROP POLICY IF EXISTS "anon_delete_care_logs" ON care_logs;

DROP POLICY IF EXISTS "select_own_plants" ON plants;
CREATE POLICY "select_own_plants" ON plants FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_plants" ON plants;
CREATE POLICY "insert_own_plants" ON plants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_plants" ON plants;
CREATE POLICY "update_own_plants" ON plants FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_plants" ON plants;
CREATE POLICY "delete_own_plants" ON plants FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_care_tasks" ON care_tasks;
CREATE POLICY "select_own_care_tasks" ON care_tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_care_tasks" ON care_tasks;
CREATE POLICY "insert_own_care_tasks" ON care_tasks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM plants p WHERE p.id = care_tasks.plant_id AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_care_tasks" ON care_tasks;
CREATE POLICY "update_own_care_tasks" ON care_tasks FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM plants p WHERE p.id = care_tasks.plant_id AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_care_tasks" ON care_tasks;
CREATE POLICY "delete_own_care_tasks" ON care_tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_care_logs" ON care_logs;
CREATE POLICY "select_own_care_logs" ON care_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_care_logs" ON care_logs;
CREATE POLICY "insert_own_care_logs" ON care_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM plants p WHERE p.id = care_logs.plant_id AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_care_logs" ON care_logs;
CREATE POLICY "update_own_care_logs" ON care_logs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM plants p WHERE p.id = care_logs.plant_id AND p.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_care_logs" ON care_logs;
CREATE POLICY "delete_own_care_logs" ON care_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

REVOKE EXECUTE ON FUNCTION complete_care_task(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION complete_care_task(uuid, text) TO authenticated;
