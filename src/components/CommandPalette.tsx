import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { CalendarPlus, LayoutDashboard, History, Search, Sprout, type LucideIcon } from 'lucide-react';
import type { View } from '@/components/Sidebar';
import type { Plant } from '@/lib/types';

interface PaletteItem {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  run: () => void;
}

interface CommandPaletteProps {
  plants: Plant[];
  onClose: () => void;
  onNavigate: (view: View) => void;
  onOpenPlant: (plantId: string) => void;
  onAddPlant: () => void;
}

export function CommandPalette({ plants, onClose, onNavigate, onOpenPlant, onAddPlant }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const items = useMemo<PaletteItem[]>(() => {
    const actions: PaletteItem[] = [
      { id: 'nav-dashboard', label: 'Go to Dashboard', hint: 'Care queue and stats', icon: LayoutDashboard, run: () => onNavigate('dashboard') },
      { id: 'nav-plants', label: 'Go to My Plants', hint: 'Browse your collection', icon: Sprout, run: () => onNavigate('plants') },
      { id: 'nav-history', label: 'Go to Care History', hint: 'Every completed task', icon: History, run: () => onNavigate('history') },
      { id: 'add-plant', label: 'Add a new plant', hint: 'Create a plant and its schedule', icon: CalendarPlus, run: onAddPlant },
    ];
    const plantItems: PaletteItem[] = plants.map((plant) => ({
      id: `plant-${plant.id}`,
      label: plant.name,
      hint: plant.species || plant.location,
      icon: Sprout,
      run: () => onOpenPlant(plant.id),
    }));
    const term = query.trim().toLowerCase();
    return [...actions, ...plantItems].filter(
      (item) => !term || item.label.toLowerCase().includes(term) || item.hint.toLowerCase().includes(term),
    );
  }, [plants, query, onNavigate, onAddPlant, onOpenPlant]);

  const runItem = (item: PaletteItem | undefined) => {
    if (!item) return;
    item.run();
    onClose();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, items.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      runItem(items[active]);
    } else if (event.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <button type="button" aria-label="Close search" onClick={onClose} className="absolute inset-0 animate-fade-in bg-stone-900/40 backdrop-blur-sm" />
      <div role="dialog" aria-modal="true" aria-label="Quick search" className="relative w-full max-w-xl animate-scale-in overflow-hidden rounded-2xl bg-white shadow-lift">
        <div className="flex items-center gap-3 border-b border-stone-100 px-4">
          <Search className="h-4.5 w-4.5 text-stone-400" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search plants or jump to a page"
            aria-label="Search"
            className="h-14 flex-1 bg-transparent text-base text-stone-900 placeholder:text-stone-400 focus:outline-none"
          />
          <kbd className="rounded-md bg-stone-100 px-1.5 py-0.5 text-xs text-stone-500">Esc</kbd>
        </div>
        <ul role="listbox" className="max-h-80 overflow-y-auto p-2">
          {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-stone-500">No matches. Try another word.</li>}
          {items.map((item, index) => {
            const Icon = item.icon;
            const selected = index === active;
            return (
              <li key={item.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => runItem(item)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${selected ? 'bg-brand-50' : ''}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700 ring-1 ring-stone-200">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-stone-900">{item.label}</span>
                    <span className="block truncate text-xs text-stone-500">{item.hint}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
