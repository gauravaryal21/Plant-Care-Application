import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, Loader2, Plus, RefreshCw } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { CommandPalette } from '@/components/CommandPalette';
import { DashboardView } from '@/components/DashboardView';
import { HistoryView } from '@/components/HistoryView';
import { PlantDrawer } from '@/components/PlantDrawer';
import { PlantFormModal } from '@/components/PlantFormModal';
import { PlantsView } from '@/components/PlantsView';
import { Sidebar, type View } from '@/components/Sidebar';
import { Toaster } from '@/components/Toaster';
import { useGarden } from '@/hooks/useGarden';
import { useGardenLocation } from '@/hooks/useGardenLocation';
import { useToasts } from '@/hooks/useToasts';
import { signOut } from '@/lib/authApi';
import { CARE_KIND_META } from '@/lib/careKinds';
import { buildCareQueue } from '@/lib/careQueue';
import { startOfDay } from '@/lib/careSchedule';
import { completeCareTask } from '@/lib/gardenApi';
import { exportGardenJson } from '@/lib/exportGarden';
import type { Plant } from '@/lib/types';

type Editor = { mode: 'create' } | { mode: 'edit'; plantId: string } | null;

const PAGE_TITLES: Record<Exclude<View, 'dashboard'>, { title: string; subtitle: string }> = {
  plants: { title: 'My Plants', subtitle: 'Everything you are growing, and what each one needs next.' },
  history: { title: 'Care History', subtitle: 'A running log of every task you have completed.' },
};

interface AppProps {
  user: User;
}

export default function App({ user }: AppProps) {
  const garden = useGarden();
  const gardenLocation = useGardenLocation();
  const { toasts, notify, dismiss } = useToasts();
  const [view, setView] = useState<View>('dashboard');
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const displayName = (user.user_metadata?.display_name as string | undefined)?.trim() || user.email || 'Gardener';
  const email = user.email ?? '';

  const { plants, tasks, logs, reload } = garden;
  const queue = useMemo(
    () => buildCareQueue(plants, tasks, startOfDay(new Date()), gardenLocation.weather),
    [plants, tasks, gardenLocation.weather],
  );
  const dueCount = queue.filter((item) => item.status === 'overdue' || item.status === 'today').length;

  const selectedPlant = plants.find((plant) => plant.id === selectedPlantId) ?? null;
  const selectedItems = useMemo(
    () => (selectedPlant ? queue.filter((item) => item.plant.id === selectedPlant.id) : []),
    [selectedPlant, queue],
  );
  const editingPlant = editor?.mode === 'edit' ? plants.find((plant) => plant.id === editor.plantId) ?? null : null;
  const editingTasks = editingPlant ? tasks.filter((task) => task.plant_id === editingPlant.id) : [];

  const openPlant = useCallback((plantId: string) => setSelectedPlantId(plantId), []);

  const completeTask = useCallback(
    async (taskId: string, note: string | null): Promise<boolean> => {
      const task = tasks.find((candidate) => candidate.id === taskId);
      const plant = task ? plants.find((candidate) => candidate.id === task.plant_id) : undefined;
      try {
        await completeCareTask(taskId, note);
        await reload();
        if (task && plant) {
          notify(`${CARE_KIND_META[task.kind].doneLabel} ${plant.name}. Next reminder updated.`);
        } else {
          notify('Care logged.');
        }
        return true;
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Could not log that care. Please try again.', 'error');
        return false;
      }
    },
    [tasks, plants, reload, notify],
  );

  const handleSaved = useCallback(
    (plant: Plant, mode: 'created' | 'updated') => {
      setEditor(null);
      void reload();
      if (mode === 'created') {
        setSelectedPlantId(plant.id);
        notify(`${plant.name} joined your collection.`);
      } else {
        notify('Changes saved.');
      }
    },
    [reload, notify],
  );

  const handleDeleted = useCallback(
    (plant: Plant) => {
      setSelectedPlantId(null);
      void reload();
      notify(`${plant.name} was removed.`, 'info');
    },
    [reload, notify],
  );

  const openCreate = useCallback(() => setEditor({ mode: 'create' }), []);
  const closeEditor = useCallback(() => setEditor(null), []);
  const closeDrawer = useCallback(() => setSelectedPlantId(null), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const navigateTo = useCallback((next: View) => setView(next), []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const handleExport = useCallback(() => {
    exportGardenJson(plants, tasks, logs);
    notify('Your garden export is downloading.');
  }, [plants, tasks, logs, notify]);

  const handleSignOut = useCallback(() => {
    signOut().catch((err: unknown) => {
      notify(err instanceof Error ? err.message : 'Could not sign out. Please try again.', 'error');
    });
  }, [notify]);

  const isInitialLoading = garden.status === 'loading' && plants.length === 0;
  const hasFatalError = garden.status === 'error' && plants.length === 0 && logs.length === 0;

  let content: ReactNode;
  if (isInitialLoading) {
    content = (
      <div className="flex h-96 flex-col items-center justify-center gap-3 text-stone-500">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-sm">Loading your garden...</p>
      </div>
    );
  } else if (hasFatalError) {
    content = (
      <div className="card mx-auto flex max-w-lg flex-col items-center gap-4 p-10 text-center animate-fade-up">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-semibold text-stone-900">We could not load your plants</h2>
        <p className="text-sm leading-relaxed text-stone-500">{garden.error}</p>
        <button type="button" onClick={() => void garden.reload()} className="btn-primary">
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    );
  } else if (view === 'dashboard') {
    content = (
      <DashboardView
        plants={plants}
        tasks={tasks}
        logs={logs}
        weather={gardenLocation.weather}
        userName={displayName}
        onOpenPlant={openPlant}
        onAddPlant={openCreate}
        onCompleteTask={completeTask}
        locationState={gardenLocation}
      />
    );
  } else if (view === 'plants') {
    content = <PlantsView plants={plants} tasks={tasks} weather={gardenLocation.weather} onOpenPlant={openPlant} onAddPlant={openCreate} />;
  } else {
    content = <HistoryView plants={plants} logs={logs} onOpenPlant={openPlant} />;
  }

  return (
    <div className="min-h-screen lg:pl-64">
      <Sidebar
        view={view}
        dueCount={dueCount}
        displayName={displayName}
        email={email}
        onNavigate={setView}
        onAddPlant={openCreate}
        onOpenPalette={() => setPaletteOpen(true)}
        onExport={handleExport}
        onSignOut={handleSignOut}
      />

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-10">
        {view !== 'dashboard' && (
          <header className="mb-8 flex flex-col gap-4 animate-fade-up sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-stone-900">{PAGE_TITLES[view].title}</h1>
              <p className="mt-1.5 text-sm text-stone-500">{PAGE_TITLES[view].subtitle}</p>
            </div>
            {view === 'plants' && plants.length > 0 && (
              <button type="button" onClick={openCreate} className="btn-primary self-start sm:self-auto">
                <Plus className="h-4 w-4" />
                Add plant
              </button>
            )}
          </header>
        )}

        {garden.status === 'error' && !hasFatalError && (
          <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span>Some information may be out of date. {garden.error}</span>
            <button type="button" onClick={() => void garden.reload()} className="font-semibold underline underline-offset-4">
              Retry
            </button>
          </div>
        )}

        {content}
      </main>

      {selectedPlant && (
        <PlantDrawer
          plant={selectedPlant}
          items={selectedItems}
          logs={logs}
          onClose={closeDrawer}
          onEdit={() => setEditor({ mode: 'edit', plantId: selectedPlant.id })}
          onDeleted={handleDeleted}
          onCompleteTask={completeTask}
        />
      )}

      {editor && (
        <PlantFormModal
          plant={editingPlant}
          existingTasks={editingTasks}
          weather={gardenLocation.weather}
          hasLocalWeather={gardenLocation.status === 'ready'}
          onClose={closeEditor}
          onSaved={handleSaved}
        />
      )}

      {paletteOpen && (
        <CommandPalette
          plants={plants}
          onClose={closePalette}
          onNavigate={navigateTo}
          onOpenPlant={openPlant}
          onAddPlant={openCreate}
        />
      )}

      <Toaster toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
