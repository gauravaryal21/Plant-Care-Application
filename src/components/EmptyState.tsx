import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center animate-fade-up">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-stone-500">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
