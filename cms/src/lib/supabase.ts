import { createClient } from '@supabase/supabase-js';
import type { Horario, Aviso, FotoGaleria, MensajeContacto } from '../types/database';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './constants';

const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('tu-proyecto') &&
    !supabaseAnonKey.includes('tu-anon')
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function getAdminHorarios(): Promise<Horario[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('horarios').select('*').order('orden');
    if (error) {
      console.error('[DB] Error getAdminHorarios:', error);
      return [];
    }
    return (data || []) as Horario[];
  } catch {
    return [];
  }
}

export async function getAdminAvisos(): Promise<Aviso[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('avisos').select('*').order('fecha', { ascending: false });
    if (error) {
      console.error('[DB] Error getAdminAvisos:', error);
      return [];
    }
    return (data || []) as Aviso[];
  } catch {
    return [];
  }
}

export async function getAdminMensajes(): Promise<MensajeContacto[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('mensajes_contacto').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('[DB] Error getAdminMensajes:', error);
      return [];
    }
    return (data || []) as MensajeContacto[];
  } catch {
    return [];
  }
}

export async function getAdminGaleria(): Promise<FotoGaleria[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('galeria').select('*').order('orden');
    if (error) {
      console.error('[DB] Error getAdminGaleria:', error);
      return [];
    }
    return (data || []) as FotoGaleria[];
  } catch {
    return [];
  }
}
