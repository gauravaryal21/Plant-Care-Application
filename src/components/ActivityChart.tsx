interface ActivityChartProps {
  days: { date: string; count: number }[];
}

export function ActivityChart({ days }: ActivityChartProps) {
  const max = Math.max(1, ...days.map((day) => day.count));
  const total = days.reduce((sum, day) => sum + day.count, 0);

  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height: 120 }} role="img" aria-label={`${total} care actions in the last ${days.length} days`}>
        {days.map((day) => {
          const height = day.count === 0 ? 6 : Math.max(14, (day.count / max) * 100);
          return (
            <div key={day.date} className="group relative flex h-full flex-1 items-end">
              <div
                title={`${day.date}: ${day.count} care action${day.count === 1 ? '' : 's'}`}
                className={`w-full rounded-md transition-all duration-500 group-hover:bg-brand-600 ${
                  day.count === 0 ? 'bg-stone-200' : 'bg-brand-400'
                }`}
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-stone-400">
        <span>{days.length} days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}
