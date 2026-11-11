import { CalendarClock, Download, Leaf, LayoutDashboard, History, LogOut, Plus, Search, Sprout } from 'lucide-react';

export type View = 'dashboard' | 'plants' | 'history';

const NAV_ITEMS: { id: View; label: string; icon: typeof Leaf }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'plants', label: 'My Plants', icon: Sprout },
  { id: 'history', label: 'Care History', icon: History },
];

interface SidebarProps {
  view: View;
  dueCount: number;
  displayName: string;
  email: string;
  onNavigate: (view: View) => void;
  onAddPlant: () => void;
  onOpenPalette: () => void;
  onExport: () => void;
  onSignOut: () => void;
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function Sidebar({
  view,
  dueCount,
  displayName,
  email,
  onNavigate,
  onAddPlant,
  onOpenPalette,
  onExport,
  onSignOut,
}: SidebarProps) {
  return (
    <aside className="sticky top-0 z-30 flex flex-col gap-2 border-b border-brand-800 bg-brand-900 px-4 py-3 text-brand-50 lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-b-0 lg:border-r lg:px-5 lg:py-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/30 ring-1 ring-brand-300/30">
            <Leaf className="h-5 w-5 text-brand-200" aria-hidden="true" />
          </div>
          <div>
            <p className="font-display text-xl font-semibold leading-none">Verdant</p>
            <p className="mt-1 text-xs text-brand-300">Plant care studio</p>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={onOpenPalette}
            aria-label="Open search"
            className="rounded-lg p-2 text-brand-200 transition hover:bg-white/10"
          >
            <Search className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign out"
            className="rounded-lg p-2 text-brand-200 transition hover:bg-white/10"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            onClick={onAddPlant}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-200 px-3 py-2 text-sm font-semibold text-brand-950 transition hover:bg-white active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      <nav aria-label="Main" className="mt-2 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              aria-current={active ? 'page' : undefined}
              className={`group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? 'bg-white/12 text-white shadow-sm' : 'text-brand-200 hover:bg-white/8 hover:text-white'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 transition ${active ? 'text-brand-200' : 'text-brand-400 group-hover:text-brand-200'}`} />
              <span className="flex-1 text-left">{label}</span>
              {id === 'dashboard' && dueCount > 0 && (
                <span className="rounded-full bg-amber-300 px-2 py-0.5 text-xs font-semibold text-brand-950">{dueCount}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto hidden rounded-2xl bg-white/6 p-4 ring-1 ring-white/10 lg:block">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-200 text-sm font-semibold text-brand-950">
            {initialsOf(displayName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            <p className="truncate text-xs text-brand-300">{email}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={onOpenPalette}
            className="flex w-full items-center justify-between rounded-xl bg-white/8 px-3 py-2.5 text-sm text-brand-100 transition hover:bg-white/14"
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Quick search
            </span>
            <kbd className="rounded-md bg-white/10 px-1.5 py-0.5 text-xs text-brand-200">Ctrl K</kbd>
          </button>
          <button
            type="button"
            onClick={onExport}
            className="flex w-full items-center gap-2 rounded-xl bg-white/8 px-3 py-2.5 text-sm text-brand-100 transition hover:bg-white/14"
          >
            <Download className="h-4 w-4" />
            Export my data
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-brand-200 transition hover:bg-white/8 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>

        <div className="mt-4 flex items-start gap-2 border-t border-white/10 pt-4 text-xs leading-relaxed text-brand-300">
          <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Check the soil with a finger first. Most overwatering comes from watering on a calendar.
        </div>
      </div>
    </aside>
  );
}
