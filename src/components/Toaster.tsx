import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import type { Toast } from '@/hooks/useToasts';

const TONE_STYLES: Record<Toast['tone'], { classes: string; Icon: typeof Info }> = {
  success: { classes: 'bg-brand-900 text-white', Icon: CheckCircle2 },
  error: { classes: 'bg-red-700 text-white', Icon: AlertCircle },
  info: { classes: 'bg-stone-800 text-white', Icon: Info },
};

interface ToasterProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

export function Toaster({ toasts, onDismiss }: ToasterProps) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex w-full max-w-sm flex-col gap-3" aria-live="polite">
      {toasts.map((toast) => {
        const { classes, Icon } = TONE_STYLES[toast.tone];
        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex animate-fade-up items-start gap-3 rounded-xl px-4 py-3 text-sm shadow-lift ${classes}`}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="flex-1 leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="rounded p-0.5 opacity-80 transition hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
