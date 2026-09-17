import { createClient } from '@supabase/supabase-js';
import type { Horario, Aviso, FotoGaleria, Sacramento, Grupo, MensajeContacto } from '../types/database';
import seedConfig from '../data/seeds/configuracion.json';
import seedHorarios from '../data/seeds/horarios.json';
import seedAvisos from '../data/seeds/avisos.json';
import seedFotos from '../data/seeds/galeria.json';

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
// CONFIGURACIÓN DE SITIO WEB
// ==========================================

export interface SiteConfig {
  parroquia: {
    nombre: string;
    diocesis: string;
    lema: string;
    descripcion: string;
    logo_tipo: 'monograma' | 'imagen';
    logo_iniciales: string;
    logo_url: string;
  };
  parroco: {
    nombre: string;
    titulo: string;
    email: string;
    telefono: string;
    biografia: string;
    foto_url: string;
  };
  contacto: {
    direccion: string;
    telefono: string;
    whatsapp: string;
    email: string;
    horario_secretaria: string;
    como_llegar: string;
  };
  redes: {
    facebook: string;
    instagram: string;
    youtube: string;
    whatsapp: string;
    twitter: string;
    spotify: string;
  };
  apariencia: {
    color_primario: string;
    color_acento: string;
    color_fondo_hero: string;
    mostrar_banner_anuncio: boolean;
  };
  donaciones?: {
    titulo_seccion?: string;
    mensaje?: string;
    mercadopago?: {
      activo: boolean;
      modo: 'sandbox' | 'produccion';
      public_key: string;
      access_token: string;
    };
    cuentas_bancarias?: Array<{
      id: string;
      banco: string;
      titular: string;
      numero_cuenta: string;
      tipo_cuenta: string;
      identificacion_fiscal?: string;
      referencia?: string;
      activo?: boolean;
    }>;
    medios_donacion?: Array<{
      id: string;
      titulo: string;
      descripcion: string;
      enlace?: string;
      etiqueta_boton?: string;
      activo?: boolean;
    }>;
  };
  historia?: {
    titulo: string;
    bajada?: string;
    contenido_markdown: string;
  };
  seo?: {
    titulo_sitio?: string;
    descripcion?: string;
    og_image_url?: string;
    favicon_url?: string;
    palabras_clave?: string;
  };
  dominio?: {
    dominio_web: string;
    subdominio_cms: string;
    forzar_https: boolean;
    proveedor_hosting: string;
    google_analytics_id: string;
    google_search_console_id: string;
  };
}

export async function getSiteConfig(): Promise<SiteConfig> {
  const fallback = seedConfig as unknown as SiteConfig;
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase.from('configuracion').select('clave, valor');
    if (error || !data || data.length === 0) return fallback;
    const configMap: Record<string, any> = {};
    data.forEach((row: any) => { configMap[row.clave] = row.valor; });
    return {
      parroquia: { ...fallback.parroquia, ...(configMap['parroquia'] || {}) },
      parroco: { ...fallback.parroco, ...(configMap['parroco'] || {}) },
      contacto: { ...fallback.contacto, ...(configMap['contacto'] || {}) },
      donaciones: { ...(fallback.donaciones || {}), ...(configMap['donaciones'] || {}) },
      redes: { ...fallback.redes, ...(configMap['redes'] || {}) },
      historia: { ...(fallback.historia || {}), ...(configMap['historia'] || {}) },
      seo: { ...(fallback.seo || {}), ...(configMap['seo'] || {}) },
      apariencia: { ...fallback.apariencia, ...(configMap['apariencia'] || {}) },
      dominio: { ...(fallback.dominio || {}), ...(configMap['dominio'] || {}) },
    };
  } catch {
    return fallback;
  }
}

// ==========================================
// SEEDS LOCALES (FALLBACK RESILIENTE)
// ==========================================

import seedGrupos from '../data/seeds/grupos.json';
import seedSacramentos from '../data/seeds/sacramentos.json';

export const HORARIOS_SEED: Horario[] = seedHorarios as unknown as Horario[];
export const AVISOS_SEED: Aviso[] = seedAvisos as unknown as Aviso[];
export const GALERIA_SEED: FotoGaleria[] = seedFotos as unknown as FotoGaleria[];
export const SACRAMENTOS_SEED: Sacramento[] = seedSacramentos as unknown as Sacramento[];
export const GRUPOS_SEED: Grupo[] = seedGrupos as unknown as Grupo[];

// ==========================================
// HELPERS DE LECTURA ASINCRÓNICA
// ==========================================

export async function getHorarios(): Promise<Horario[]> {
  if (!supabase) return HORARIOS_SEED;
  try {
    const { data, error } = await supabase.from('horarios').select('*').eq('activo', true).order('orden');
    if (error || !data) return HORARIOS_SEED;
    return data as Horario[];
  } catch {
    return HORARIOS_SEED;
  }
}

export async function getAvisos(): Promise<Aviso[]> {
  if (!supabase) return AVISOS_SEED;
  try {
    const { data, error } = await supabase.from('avisos').select('*').eq('activo', true).order('fecha', { ascending: true });
    if (error || !data) return AVISOS_SEED;
    return data as Aviso[];
  } catch {
    return AVISOS_SEED;
  }
}

export async function getGaleria(): Promise<FotoGaleria[]> {
  if (!supabase) return GALERIA_SEED;
  try {
    const { data, error } = await supabase.from('galeria').select('*').eq('activo', true).order('orden');
    if (error || !data) return GALERIA_SEED;
    return data as FotoGaleria[];
  } catch {
    return GALERIA_SEED;
  }
}

export async function getSacramentos(): Promise<Sacramento[]> {
  if (!supabase) return SACRAMENTOS_SEED;
  try {
    const { data, error } = await supabase.from('sacramentos').select('*').order('orden');
    if (error || !data) return SACRAMENTOS_SEED;
    return data as Sacramento[];
  } catch {
    return SACRAMENTOS_SEED;
  }
}

export async function getGrupos(): Promise<Grupo[]> {
  if (!supabase) return GRUPOS_SEED;
  try {
    const { data, error } = await supabase.from('grupos').select('*').order('orden');
    if (error || !data) return GRUPOS_SEED;
    return data as Grupo[];
  } catch {
    return GRUPOS_SEED;
  }
}

export async function enviarMensaje(mensaje: MensajeContacto): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    console.log('Mensaje de contacto simulado (sin Supabase):', mensaje);
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

export interface DonacionRegistro {
  monto: number;
  moneda: string;
  tipo: 'unica_vez' | 'mensual';
  estado: string;
  mp_payment_id?: string | number;
  mp_status_detail?: string;
  email_donante?: string;
  nombre_donante?: string;
  metodo_pago?: string;
  datos_adicionales?: any;
}

export async function registrarDonacion(donacion: DonacionRegistro): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!supabase) {
    console.log('Donación registrada en modo local:', donacion);
    return { success: true, id: 'local-' + Date.now() };
  }
  try {
    const { data, error } = await supabase.from('donaciones').insert([donacion]).select('id').single();
    if (error) {
      console.warn('Advertencia al guardar en tabla donaciones:', error.message);
      return { success: true, id: 'fallback-' + Date.now() };
    }
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.warn('Error al registrar donación en Supabase:', err);
    return { success: true, id: 'fallback-' + Date.now() };
  }
}
