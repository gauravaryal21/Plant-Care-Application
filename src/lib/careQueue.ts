import { formatDueLabel, getDueDate, getDueStatus, type DueStatus } from '@/lib/careSchedule';
import { suggestPlantCare } from '@/lib/plantLookup';
import type { LocalWeather } from '@/lib/localWeather';
import type { CareTask, Plant } from '@/lib/types';

export interface CareItem {
  task: CareTask;
  plant: Plant;
  dueDate: Date;
  status: DueStatus;
  label: string;
  intervalDays: number;
  weatherAdjusted: boolean;
}

export function buildCareQueue(plants: Plant[], tasks: CareTask[], today: Date, weather: LocalWeather | null = null): CareItem[] {
  const plantById = new Map(plants.map((plant) => [plant.id, plant]));
  const items: CareItem[] = [];

  for (const task of tasks) {
    const plant = plantById.get(task.plant_id);
    if (!plant) continue;
    const schedule = task.kind === 'water' && weather
      ? getWateringInterval(task, plant, weather)
      : { intervalDays: task.interval_days, weatherAdjusted: false };
    const dueDate = getDueDate(task, schedule.intervalDays);
    items.push({
      task,
      plant,
      dueDate,
      status: getDueStatus(dueDate, today),
      label: formatDueLabel(dueDate, today),
      intervalDays: schedule.intervalDays,
      weatherAdjusted: schedule.weatherAdjusted,
    });
  }

  return items.sort(
    (a, b) => a.dueDate.getTime() - b.dueDate.getTime() || a.plant.name.localeCompare(b.plant.name),
  );
}

function getWateringInterval(task: CareTask, plant: Plant, weather: LocalWeather): { intervalDays: number; weatherAdjusted: boolean } {
  const standardDays = suggestPlantCare(plant.species ?? '', null).wateringDays;
  const weatherDays = suggestPlantCare(plant.species ?? '', weather).wateringDays;
  let adjustment = weatherDays - standardDays;

  const isOutdoors = /balcony|outdoor|garden|patio|terrace|yard/i.test(plant.location);
  const forecastRain = weather.daily.precipitation_sum.reduce((sum, amount) => sum + amount, 0);
  if (isOutdoors && forecastRain >= 8) adjustment = Math.max(adjustment, 2);

  const intervalDays = Math.min(365, Math.max(1, task.interval_days + adjustment));
  return { intervalDays, weatherAdjusted: intervalDays !== task.interval_days };
}
