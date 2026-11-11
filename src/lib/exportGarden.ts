import type { CareLog, CareTask, Plant } from '@/lib/types';

export function exportGardenJson(plants: Plant[], tasks: CareTask[], logs: CareLog[]): void {
  const payload = {
    exported_at: new Date().toISOString(),
    plants,
    care_tasks: tasks,
    care_logs: logs,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `verdant-export-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
