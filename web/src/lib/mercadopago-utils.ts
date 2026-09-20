import fs from 'node:fs';

/**
 * Utilidades para procesamiento y normalización de Mercado Pago
 */

/**
 * Normaliza el correo del pagador/donante para la API de Mercado Pago.
 * - Detecta y convierte usuarios de prueba de Sandbox (ej. TESTUSER1134... -> test_user_1134...@testuser.com)
 * - Provee un fallback válido si el campo está vacío.
 */
export function normalizePayerEmail(
  email?: string | null,
  fallback = "donaciones@parroquiasma.uy"
): string {
  const clean = (email || "").trim();
  if (!clean) return fallback;
  if (/^TESTUSER/i.test(clean)) {
    return clean.replace(/^TESTUSER(\d+)(@.*)?$/i, "test_user_$1@testuser.com");
  }
  return clean;
}

export interface DonacionRegistroServer {
  id?: string;
  monto: number;
  moneda?: string;
  tipo: 'unica_vez' | 'mensual' | string;
  estado: string;
  mp_payment_id: string | number;
  mp_status_detail?: string;
  nombre_donante?: string;
  email_donante?: string;
  metodo_pago?: string;
  datos_adicionales?: Record<string, any>;
  created_at?: string;
}

/**
 * Guarda el registro de una donación exitosa tanto en los archivos locales
 * del CMS como en la base de datos de Supabase si está disponible.
 */
export async function guardarRegistroDonacion(registro: DonacionRegistroServer) {
  const item = {
    id: registro.id || `don-${String(registro.mp_payment_id).substring(0, 14)}`,
    created_at: registro.created_at || new Date().toISOString(),
    monto: Number(registro.monto),
    moneda: registro.moneda || 'UYU',
    tipo: registro.tipo || 'unica_vez',
    estado: registro.estado || 'approved',
    mp_payment_id: String(registro.mp_payment_id),
    mp_status_detail: registro.mp_status_detail || 'accredited',
    nombre_donante: registro.nombre_donante || 'Donante Anónimo',
    email_donante: registro.email_donante || '',
    metodo_pago: registro.metodo_pago || 'Mercado Pago',
    datos_adicionales: registro.datos_adicionales || {},
  };

  // 1. Guardar en los archivos JSON de donaciones del CMS y Web
  const seedPaths = [
    'cms/src/data/seeds/donaciones.json',
    'web/src/data/seeds/donaciones.json',
    '../cms/src/data/seeds/donaciones.json',
    '../web/src/data/seeds/donaciones.json',
    'src/data/seeds/donaciones.json',
  ];

  for (const p of seedPaths) {
    try {
      if (fs.existsSync(p)) {
        const list = JSON.parse(fs.readFileSync(p, 'utf-8'));
        const filtered = list.filter((x: any) => x.mp_payment_id !== item.mp_payment_id && x.id !== item.id);
        fs.writeFileSync(p, JSON.stringify([item, ...filtered], null, 2), 'utf-8');
      }
    } catch (err) {
      console.warn(`[Donaciones] Error al guardar en ${p}:`, err);
    }
  }

  // 2. Intentar guardar en Supabase si está disponible
  try {
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || 'https://eucgxnnnmheqhptcxldp.supabase.co';
    const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1Y2d4bm5ubWhlcWhwdGN4bGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2Mjc1MjAsImV4cCI6MjEwMzIwMzUyMH0.Mf-7XI5ZMlnPYj3LGE2_HqiNcKFGHSunPnCDgnWTFqw';
    if (supabaseUrl && supabaseKey) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('donaciones').insert([
        {
          monto: item.monto,
          moneda: item.moneda,
          tipo: item.tipo,
          estado: item.estado,
          mp_payment_id: item.mp_payment_id,
          mp_status_detail: item.mp_status_detail,
          email_donante: item.email_donante,
          nombre_donante: item.nombre_donante,
          metodo_pago: item.metodo_pago,
          datos_adicionales: item.datos_adicionales,
        }
      ]);
    }
  } catch (err) {
    // Si la tabla no existe en Supabase todavía, el dato ya quedó persistido en JSON
  }

  return item;
}
