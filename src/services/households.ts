import type { User } from '@supabase/supabase-js';
import * as Crypto from 'expo-crypto';

import { supabase } from '@/lib/supabase';
import { asNullableString, asString } from '@/services/rows';

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string | null;
}

export interface HouseholdMember {
  userId: string;
  name: string;
  email: string | null;
  role: 'owner' | 'member';
}

function toHousehold(row: Record<string, unknown>): Household {
  return {
    id: asString(row.id),
    name: asString(row.name),
    inviteCode: asString(row.invite_code),
    createdBy: asNullableString(row.created_by),
  };
}

function toMember(row: Record<string, unknown>): HouseholdMember {
  const email = asNullableString(row.user_email);
  return {
    userId: asString(row.user_id),
    name: asNullableString(row.user_name) ?? email?.split('@')[0] ?? 'Pareja',
    email,
    role: row.role === 'owner' ? 'owner' : 'member',
  };
}

function memberName(user: User, fallback: string): string {
  const name = user.user_metadata?.full_name || user.user_metadata?.name;
  return typeof name === 'string' && name.trim() ? name.trim() : (user.email?.split('@')[0] ?? fallback);
}

/** 32 caracteres sin ambiguos (0/O, 1/I): 256 es múltiplo de 32, así que no hay sesgo. */
function generateInviteCode(): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = Crypto.getRandomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) code += alphabet[bytes[i] % alphabet.length];
  return `HOGAR-${code}`;
}

/** Hogar del usuario, `null` si no pertenece a ninguno. Lanza error si no hay conexión. */
export async function fetchUserHousehold(userId: string): Promise<Household | null> {
  const { data: membership, error: memberError } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (memberError) throw memberError;
  if (!membership) return null;

  const { data, error } = await supabase.from('households').select('*').eq('id', membership.household_id).maybeSingle();
  if (error) throw error;
  return data ? toHousehold(data) : null;
}

export async function createHousehold(name: string, user: User): Promise<Household> {
  const { data, error } = await supabase
    .from('households')
    .insert({ name: name.trim(), invite_code: generateInviteCode(), created_by: user.id })
    .select()
    .single();
  if (error) throw error;
  const household = toHousehold(data);

  const { error: memberError } = await supabase.from('household_members').insert({
    household_id: household.id,
    user_id: user.id,
    user_email: user.email,
    user_name: memberName(user, 'Usuario'),
    role: 'owner',
  });
  if (memberError) throw memberError;
  return household;
}

/** Se une con el código (función `join_household`: no expone la lista de hogares). */
export async function joinHousehold(code: string): Promise<Household> {
  const clean = code.trim().toUpperCase();
  const { data, error } = await supabase.rpc('join_household', { code: clean });
  if (error || !data) {
    throw new Error(`No encontramos ningún hogar con el código "${clean}". Verifica con tu pareja e inténtalo de nuevo.`);
  }
  return toHousehold(data as Record<string, unknown>);
}

export async function fetchMembers(householdId: string): Promise<HouseholdMember[]> {
  const { data, error } = await supabase
    .from('household_members')
    .select('*')
    .eq('household_id', householdId)
    .order('joined_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(row => toMember(row));
}

export async function leaveHousehold(householdId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('household_id', householdId)
    .eq('user_id', userId);
  if (error) throw error;
}

/** Avisa cuando alguien entra o sale del hogar. */
export function subscribeToMembers(householdId: string, onChange: () => void): () => void {
  const channel = supabase
    .channel(`household_members:${householdId}:${Math.random().toString(36).slice(2, 8)}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'household_members', filter: `household_id=eq.${householdId}` },
      onChange,
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
