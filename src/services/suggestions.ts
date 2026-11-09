import { supabase } from '@/lib/supabase';

/**
 * Guarda una sugerencia. `user_id` lo pone la base de datos (vacío en modo sin cuenta).
 * La app no puede leer la tabla: se revisa en el panel de Supabase (ver supabase/schema.sql).
 */
export async function sendSuggestion(message: string, appVersion: string | null): Promise<void> {
  const { error } = await supabase.from('suggestions').insert({ message, app_version: appVersion });
  if (error) throw new Error(`No se pudo enviar la sugerencia: ${error.message}`);
}
