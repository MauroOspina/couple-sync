import type { User } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

/** Abre el login de Google y guarda la sesión. Devuelve `null` si la persona cancela. */
export async function signInWithGoogle(): Promise<User | null> {
  if (!isSupabaseConfigured) {
    throw new Error('La conexión con la nube no está configurada en esta versión de la app.');
  }

  const redirectUrl = makeRedirectUri({ scheme: 'couplesync' });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('No se pudo abrir el inicio de sesión con Google.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
  if (result.type !== 'success' || !result.url) return null;

  const { url } = result;
  if (url.includes('#')) {
    const params = new URLSearchParams(url.split('#')[1]);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (accessToken && refreshToken) {
      const { data: session, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) throw sessionError;
      return session.user;
    }
  } else if (url.includes('?')) {
    const code = new URLSearchParams(url.split('?')[1]).get('code');
    if (code) {
      const { data: session, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
      if (sessionError) throw sessionError;
      return session.user;
    }
  }

  const { data: current } = await supabase.auth.getUser();
  return current.user;
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured) return;
  // `local` cierra la sesión en este teléfono aunque no haya internet.
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) console.warn('[auth] Error al cerrar sesión', error);
}

/** Borra la cuenta y sus datos en el servidor (función `delete_my_account` en supabase/schema.sql). */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw new Error(`No se pudo eliminar la cuenta: ${error.message}`);
}

export function getDisplayName(user: User | null): string {
  if (!user) return 'Tú';
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
  if (typeof fullName === 'string' && fullName.trim()) return fullName.trim().split(/\s+/)[0];
  return user.email?.split('@')[0] ?? 'Tú';
}
