import { createClient } from '@supabase/supabase-js';
import type { Horario, Aviso, FotoGaleria, MensajeContacto } from '../types/database';

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

// Mock Seeds para desarrollo local del CMS
export const MOCK_HORARIOS: Horario[] = [
  { id: '1', dia_semana: 1, categoria: 'misa', hora_inicio: '08:00', hora_fin: '08:45', titulo: 'Misa Matutina', descripcion: 'Lunes a viernes', lugar: 'Iglesia Principal', es_destacado: false, activo: true, orden: 1 },
  { id: '2', dia_semana: 1, categoria: 'misa', hora_inicio: '19:00', hora_fin: '19:45', titulo: 'Misa Vespertina', descripcion: 'Lunes a viernes', lugar: 'Iglesia Principal', es_destacado: false, activo: true, orden: 2 },
  { id: '3', dia_semana: 6, categoria: 'confesion', hora_inicio: '17:00', hora_fin: '18:30', titulo: 'Confesiones', descripcion: 'Sin pedir hora', lugar: 'Confesionarios', es_destacado: true, activo: true, orden: 1 },
  { id: '4', dia_semana: 6, categoria: 'misa', hora_inicio: '19:00', hora_fin: '20:00', titulo: 'Misa de Vigilia', descripcion: 'Misa de vigilia del domingo', lugar: 'Iglesia Principal', es_destacado: true, activo: true, orden: 2 },
  { id: '5', dia_semana: 0, categoria: 'misa', hora_inicio: '09:00', hora_fin: '10:00', titulo: 'Misa de la Mañana', descripcion: 'Eucaristía dominical', lugar: 'Iglesia Principal', es_destacado: false, activo: true, orden: 1 },
  { id: '6', dia_semana: 0, categoria: 'misa', hora_inicio: '11:00', hora_fin: '12:00', titulo: 'Misa con Familias y Coro', descripcion: 'Misa con las familias y el coro', lugar: 'Iglesia Principal', es_destacado: true, activo: true, orden: 2 },
  { id: '7', dia_semana: 0, categoria: 'misa', hora_inicio: '19:30', hora_fin: '20:30', titulo: 'Misa de la Tarde', descripcion: 'Eucaristía dominical vespertina', lugar: 'Iglesia Principal', es_destacado: false, activo: true, orden: 3 }
];

export const MOCK_AVISOS: Aviso[] = [
  { id: '1', fecha: '2026-09-08', titulo: 'Fiesta patronal', descripcion: 'Misa solemne a las 19:00 y procesión.', activo: true, orden: 1 },
  { id: '2', fecha: '2026-09-20', titulo: 'Retiro para adultos', descripcion: 'De 9:00 a 16:00 en la casa de retiros.', activo: true, orden: 2 },
  { id: '3', fecha: '2026-10-04', titulo: 'Bendición de animales', descripcion: 'En el atrio, a las 11:00, en memoria de san Francisco.', activo: true, orden: 3 }
];

export const MOCK_MENSAJES: MensajeContacto[] = [
  { id: 'm1', nombre: 'María González', correo: 'maria@ejemplo.com', telefono: '099 111 222', motivo: 'Bautismo', mensaje: 'Hola, quisiera saber las fechas disponibles para bautizar a mi hijo en octubre.', canal_preferido: 'correo', leido: false, respondido: false, created_at: '2026-08-22 18:30' },
  { id: 'm2', nombre: 'Carlos Silva', correo: 'carlos@ejemplo.com', telefono: '098 333 444', motivo: 'Sumarme a un grupo', mensaje: 'Buenas tardes, me gustaría participar del coro parroquial o de Cáritas.', canal_preferido: 'telefono', leido: true, respondido: false, created_at: '2026-08-21 14:15' },
  { id: 'm3', nombre: 'Lucía Fernández', correo: 'lucia@ejemplo.com', telefono: '091 555 666', motivo: 'Certificados y partidas', mensaje: 'Necesito solicitar una partida de bautismo de 1995 para un casamiento.', canal_preferido: 'correo', leido: true, respondido: true, created_at: '2026-08-20 10:00' }
];

export const MOCK_GALERIA: FotoGaleria[] = [
  { id: 'f1', titulo: 'Campanario', descripcion: 'Vista exterior', categoria: 'templo', imagen_url: '/assets/img/fachada.jpg', es_destacado: true, activo: true, orden: 1 },
  { id: 'f2', titulo: 'Nave central', descripcion: 'Bancos alineados hacia el altar', categoria: 'templo', imagen_url: '/assets/img/nave.jpg', es_destacado: false, activo: true, orden: 2 },
  { id: 'f3', titulo: 'La patrona', descripcion: 'Altar lateral con velas', categoria: 'celebraciones', imagen_url: '/assets/img/patrona.jpg', es_destacado: false, activo: true, orden: 3 }
];

// Operaciones para el CMS
export async function getAdminHorarios(): Promise<Horario[]> {
  if (!supabase) return MOCK_HORARIOS;
  try {
    const { data } = await supabase.from('horarios').select('*').order('orden');
    return data && data.length > 0 ? (data as Horario[]) : MOCK_HORARIOS;
  } catch {
    return MOCK_HORARIOS;
  }
}

export async function getAdminAvisos(): Promise<Aviso[]> {
  if (!supabase) return MOCK_AVISOS;
  try {
    const { data } = await supabase.from('avisos').select('*').order('fecha', { ascending: false });
    return data && data.length > 0 ? (data as Aviso[]) : MOCK_AVISOS;
  } catch {
    return MOCK_AVISOS;
  }
}

export async function getAdminMensajes(): Promise<MensajeContacto[]> {
  if (!supabase) return MOCK_MENSAJES;
  try {
    const { data } = await supabase.from('mensajes_contacto').select('*').order('created_at', { ascending: false });
    return data && data.length > 0 ? (data as MensajeContacto[]) : MOCK_MENSAJES;
  } catch {
    return MOCK_MENSAJES;
  }
}

export async function getAdminGaleria(): Promise<FotoGaleria[]> {
  if (!supabase) return MOCK_GALERIA;
  try {
    const { data } = await supabase.from('galeria').select('*').order('orden');
    return data && data.length > 0 ? (data as FotoGaleria[]) : MOCK_GALERIA;
  } catch {
    return MOCK_GALERIA;
  }
}
