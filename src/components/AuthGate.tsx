import { Leaf, Loader2 } from 'lucide-react';
import App from '@/App';
import { AuthScreen } from '@/components/AuthScreen';
import { useSession } from '@/hooks/useSession';
import { isSupabaseConfigured } from '@/lib/supabase';

function SetupScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-950 px-6 text-center text-white">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/30 ring-1 ring-brand-300/30">
        <Leaf className="h-8 w-8 text-brand-200" aria-hidden="true" />
      </div>
      <h1 className="mt-6 font-display text-4xl font-semibold">Verdant</h1>
      <p className="mt-3 max-w-md text-base leading-relaxed text-brand-100">
        Verdant needs a Supabase connection before you can sign in or load your plants.
      </p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-brand-300">
        Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your local environment, then restart the app.
      </p>
    </div>
  );
}

export function AuthGate() {
  const { session, loading } = useSession();

  if (!isSupabaseConfigured) return <SetupScreen />;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-stone-500">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" aria-label="Loading" />
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  return <App user={session.user} />;
}
