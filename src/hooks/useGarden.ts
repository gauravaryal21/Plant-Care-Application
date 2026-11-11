import { useCallback, useEffect, useState } from 'react';
import { fetchGarden, type GardenSnapshot } from '@/lib/gardenApi';

const EMPTY_GARDEN: GardenSnapshot = { plants: [], tasks: [], logs: [] };

export interface GardenState extends GardenSnapshot {
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  reload: () => Promise<void>;
}

export function useGarden(): GardenState {
  const [data, setData] = useState<GardenSnapshot>(EMPTY_GARDEN);
  const [status, setStatus] = useState<GardenState['status']>('loading');
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const snapshot = await fetchGarden();
      setData(snapshot);
      setStatus('ready');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while loading your garden.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ...data, status, error, reload };
}
