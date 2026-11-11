import { useState, type FormEvent } from 'react';
import { ArrowRight, Leaf, Loader2, Mail, Lock, User } from 'lucide-react';
import { signIn, signUp } from '@/lib/authApi';

const AUTH_IMAGE = 'https://images.pexels.com/photos/1573242/pexels-photo-1573242.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const MIN_PASSWORD_LENGTH = 6;

type Mode = 'signin' | 'signup';

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isSignUp = mode === 'signup';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use a password with at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (isSignUp && !displayName.trim()) {
      setError('Add a name so your garden feels like yours.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      if (isSignUp) {
        const { session } = await signUp({ email: trimmedEmail, password }, displayName.trim());
        if (!session) setNotice('Account created. Sign in with your new password to continue.');
      } else {
        await signIn({ email: trimmedEmail, password });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(isSignUp ? 'signin' : 'signup');
    setError(null);
    setNotice(null);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-brand-950 text-white lg:block">
        <img src={AUTH_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/60 to-brand-950/10" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/30 ring-1 ring-brand-300/30">
              <Leaf className="h-5 w-5 text-brand-200" aria-hidden="true" />
            </div>
            <span className="font-display text-xl font-semibold">Verdant</span>
          </div>
          <div className="max-w-md animate-fade-up">
            <h2 className="text-4xl font-semibold leading-tight">Every plant, on schedule.</h2>
            <p className="mt-4 text-base leading-relaxed text-brand-100">
              Track watering, feeding and repotting for your whole collection. Your garden is private to your account.
            </p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700">
              <Leaf className="h-5 w-5 text-brand-100" aria-hidden="true" />
            </div>
            <span className="font-display text-xl font-semibold text-stone-900">Verdant</span>
          </div>

          <h1 className="text-3xl font-semibold text-stone-900">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
          <p className="mt-2 text-sm text-stone-500">
            {isSignUp ? 'Start your plant care schedule in under a minute.' : 'Sign in to see today\u2019s care queue.'}
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
            {isSignUp && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-stone-700">Name</span>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    maxLength={60}
                    autoComplete="name"
                    placeholder="Ada Green"
                    className="input-base pl-10"
                  />
                </div>
              </label>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-stone-700">Email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="input-base pl-10"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-stone-700">Password</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
                  className="input-base pl-10"
                />
              </div>
            </label>

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
                {notice}
              </p>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full !py-3">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            {isSignUp ? 'Already have an account?' : 'New to Verdant?'}{' '}
            <button type="button" onClick={switchMode} className="font-semibold text-brand-700 underline-offset-4 hover:underline">
              {isSignUp ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}
