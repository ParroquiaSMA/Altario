/**
 * Configuración y credenciales centralizadas para funciones serverless de la API
 */

export const DEFAULT_SUPABASE_URL = 'https://eucgxnnnmheqhptcxldp.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1Y2d4bm5ubWhlcWhwdGN4bGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2Mjc1MjAsImV4cCI6MjEwMzIwMzUyMH0.Mf-7XI5ZMlnPYj3LGE2_HqiNcKFGHSunPnCDgnWTFqw';

export const SUPABASE_URL =
  process.env.PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;

export const SUPABASE_KEY =
  process.env.PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const SUPABASE_ANON_KEY = SUPABASE_KEY;

export const DEFAULT_RESEND_API_KEY = process.env.RESEND_API_KEY || '';

export const RESEND_API_KEY =
  process.env.RESEND_API_KEY ||
  process.env.PUBLIC_RESEND_API_KEY ||
  DEFAULT_RESEND_API_KEY;

/**
 * Consulta la configuración de donaciones guardada en Supabase
 */
export async function getDonacionesConfig() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/configuracion?clave=eq.donaciones&select=valor`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      return data?.[0]?.valor || {};
    }
  } catch (err) {
    console.warn('[API Config] Error al consultar configuración en Supabase:', err);
  }
  return {};
}

/**
 * Resuelve el token de acceso de Mercado Pago (prioriza env var, luego Supabase)
 */
export async function getAccessToken(cachedConfig = null) {
  const envToken = (process.env.MERCADO_PAGO_ACCESS_TOKEN || '').trim();
  if (envToken) return envToken;

  const config = cachedConfig || (await getDonacionesConfig());
  const dbToken = config?.mercadopago?.access_token;
  if (dbToken && typeof dbToken === 'string' && dbToken.trim()) {
    return dbToken.trim();
  }
  return '';
}

/**
 * Resuelve la clave secreta del webhook de Mercado Pago
 */
export function getWebhookSecret(config) {
  const envSecret = (process.env.MP_WEBHOOK_SECRET || '').trim();
  if (envSecret) return envSecret;

  const dbSecret = config?.mercadopago?.webhook_secret;
  if (dbSecret && typeof dbSecret === 'string' && dbSecret.trim()) {
    return dbSecret.trim();
  }
  return '';
}
