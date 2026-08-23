import { createClient } from '@supabase/supabase-js';
import type { Horario, Aviso, FotoGaleria, Sacramento, Grupo, MensajeContacto } from '../types/database';

import seedHorarios from '../data/seeds/horarios.json';
import seedAvisos from '../data/seeds/avisos.json';
import seedGaleria from '../data/seeds/galeria.json';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

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

// ==========================================
// HELPERS FORMATTERS
// ==========================================

export const DIAS_SEMANA = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
];

export const CATEGORIAS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  misa: { label: 'Santa Misa', color: 'text-gold-400', bg: 'bg-gold-500/10', border: 'border-gold-500/30' },
  confesion: { label: 'Confesiones', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  adoracion: { label: 'Adoración', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  secretaria: { label: 'Secretaría', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  otro: { label: 'Comunidad', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' }
};

export const formatHora = (hora: string): string => {
  if (!hora) return '';
  const parts = hora.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return hora;
};

// ==========================================
// HELPERS DE LECTURA ASINCRÓNICA DESDE DB
// ==========================================

export async function getHorarios(): Promise<Horario[]> {
  if (!supabase) return seedHorarios as unknown as Horario[];
  try {
    const { data, error } = await supabase.from('horarios').select('*').eq('activo', true).order('orden');
    if (error || !data || data.length === 0) return seedHorarios as unknown as Horario[];
    return data as Horario[];
  } catch {
    return seedHorarios as unknown as Horario[];
  }
}

export async function getAvisos(): Promise<Aviso[]> {
  if (!supabase) return seedAvisos as unknown as Aviso[];
  try {
    const { data, error } = await supabase.from('avisos').select('*').eq('activo', true).order('fecha', { ascending: true });
    if (error || !data || data.length === 0) return seedAvisos as unknown as Aviso[];
    return data as Aviso[];
  } catch {
    return seedAvisos as unknown as Aviso[];
  }
}

export async function getGaleria(): Promise<FotoGaleria[]> {
  if (!supabase) return seedGaleria as unknown as FotoGaleria[];
  try {
    const { data, error } = await supabase.from('galeria').select('*').eq('activo', true).order('orden');
    if (error || !data || data.length === 0) return seedGaleria as unknown as FotoGaleria[];
    return data as FotoGaleria[];
  } catch {
    return seedGaleria as unknown as FotoGaleria[];
  }
}

export async function getSacramentos(): Promise<Sacramento[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('sacramentos').select('*').order('orden');
    if (error || !data || data.length === 0) return [];
    return data as Sacramento[];
  } catch {
    return [];
  }
}

export async function getGrupos(): Promise<Grupo[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('grupos').select('*').order('orden');
    if (error || !data || data.length === 0) return [];
    return data as Grupo[];
  } catch {
    return [];
  }
}

export async function enviarMensaje(mensaje: MensajeContacto): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    console.log('[DB] Mensaje de contacto recibido (modo local):', mensaje);
    return { success: true };
  }
  try {
    const { error } = await supabase.from('mensajes_contacto').insert([mensaje]);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al enviar mensaje' };
  }
}
