import { createClient } from '@supabase/supabase-js';
import type { Horario, Aviso, FotoGaleria, MensajeContacto } from '../types/database';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://eucgxnnnmheqhptcxldp.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1Y2d4bm5ubWhlcWhwdGN4bGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2Mjc1MjAsImV4cCI6MjEwMzIwMzUyMH0.Mf-7XI5ZMlnPYj3LGE2_HqiNcKFGHSunPnCDgnWTFqw';

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
