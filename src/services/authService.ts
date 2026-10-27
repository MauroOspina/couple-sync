import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

WebBrowser.maybeCompleteAuthSession();

export interface Household {
  id: string;
  name: string;
  invite_code: string;
  created_by?: string;
}

export interface HouseholdMember {
  id?: string;
  household_id: string;
  user_id: string;
  role: string;
  user_email?: string;
  user_name?: string;
  joined_at?: string;
}

export const signInWithGoogle = async (): Promise<User | null> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no está configurado. Por favor añade tus claves en el archivo .env');
  }

  const redirectUrl = makeRedirectUri({
    scheme: 'couplesync',
  });
  console.log('🔗 Redirect URL de la app:', redirectUrl);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error('No se pudo generar la URL de autenticación con Google');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

  if (result.type === 'success' && result.url) {
    const url = result.url;
    if (url.includes('#')) {
      const fragment = url.split('#')[1];
      const params = new URLSearchParams(fragment);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (access_token && refresh_token) {
        const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (sessionErr) throw sessionErr;
        return sessionData.user;
      }
    } else if (url.includes('?')) {
      const query = url.split('?')[1];
      const params = new URLSearchParams(query);
      const code = params.get('code');
      if (code) {
        const { data: sessionData, error: sessionErr } = await supabase.auth.exchangeCodeForSession(code);
        if (sessionErr) throw sessionErr;
        return sessionData.user;
      }
    }
  }

  const currentUser = await getCurrentUser();
  return currentUser;
};

export const getCurrentUser = async (): Promise<User | null> => {
  if (!isSupabaseConfigured) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
};

export const signOut = async (): Promise<void> => {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
};

export const getUserHousehold = async (userId: string): Promise<Household | null> => {
  if (!isSupabaseConfigured) return null;
  try {
    const { data: member, error: memberError } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (memberError || !member) return null;

    const { data: household, error: houseError } = await supabase
      .from('households')
      .select('*')
      .eq('id', member.household_id)
      .single();

    if (houseError || !household) return null;
    return household as Household;
  } catch (e) {
    console.warn('⚠️ Error al consultar hogar del usuario:', e);
    return null;
  }
};

const generateHouseholdCode = (): string => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = Crypto.getRandomBytes(8);
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return 'HOGAR-' + result;
};

export const createHousehold = async (name: string, user: User): Promise<Household> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no está configurado');
  }

  const code = generateHouseholdCode();
  const { data: household, error: houseError } = await supabase
    .from('households')
    .insert({
      name: name.trim(),
      invite_code: code,
      created_by: user.id,
    })
    .select()
    .single();

  if (houseError) throw houseError;

  const { error: memberError } = await supabase
    .from('household_members')
    .insert({
      household_id: household.id,
      user_id: user.id,
      user_email: user.email,
      user_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
      role: 'owner',
    });

  if (memberError) throw memberError;

  return household as Household;
};

export const joinHouseholdByCode = async (code: string, user: User): Promise<Household> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no está configurado');
  }

  const rawCode = code.trim().toUpperCase();

  const { data, error } = await supabase.rpc('join_household', { code: rawCode });

  if (error || !data) {
    throw new Error(`No encontramos ningún hogar con el código "${rawCode}". Verifica con tu pareja e inténtalo de nuevo.`);
  }

  return data as Household;
};

export const getHouseholdMembers = async (householdId: string): Promise<HouseholdMember[]> => {
  if (!isSupabaseConfigured) return [];
  try {
    const { data } = await supabase
      .from('household_members')
      .select('*')
      .eq('household_id', householdId);
    return (data as HouseholdMember[]) || [];
  } catch {
    return [];
  }
};
