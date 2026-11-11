import type { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface AccountCredentials {
  email: string;
  password: string;
}

function friendlyAuthMessage(error: AuthError): string {
  const message = error.message.toLowerCase();
  if (message.includes('invalid login credentials')) return 'That email and password do not match an account.';
  if (message.includes('already registered') || message.includes('already been registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (message.includes('password should be at least')) return 'Use a password with at least 6 characters.';
  if (message.includes('rate limit')) return 'Too many attempts. Wait a moment and try again.';
  if (message.includes('fetch') || message.includes('network')) return 'Network error. Check your connection and try again.';
  return error.message;
}

export async function signUp(
  { email, password }: AccountCredentials,
  displayName: string,
): Promise<{ session: Session | null; user: User | null }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw new Error(friendlyAuthMessage(error));
  return data;
}

export async function signIn({ email, password }: AccountCredentials): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(friendlyAuthMessage(error));
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(friendlyAuthMessage(error));
}
