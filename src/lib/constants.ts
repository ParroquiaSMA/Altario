/**
 * Constantes globales de configuración para Altario Web
 */

export const DEFAULT_SUPABASE_URL = 'https://eucgxnnnmheqhptcxldp.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1Y2d4bm5ubWhlcWhwdGN4bGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2Mjc1MjAsImV4cCI6MjEwMzIwMzUyMH0.Mf-7XI5ZMlnPYj3LGE2_HqiNcKFGHSunPnCDgnWTFqw';

export const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.PUBLIC_SUPABASE_URL) ||
  DEFAULT_SUPABASE_URL;

export const SUPABASE_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.PUBLIC_SUPABASE_ANON_KEY) ||
  DEFAULT_SUPABASE_ANON_KEY;

export const SUPABASE_ANON_KEY = SUPABASE_KEY;

export const DEFAULT_RESEND_API_KEY = '';

export const RESEND_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_RESEND_API_KEY) ||
  (typeof process !== 'undefined' && (process.env?.RESEND_API_KEY || process.env?.PUBLIC_RESEND_API_KEY)) ||
  DEFAULT_RESEND_API_KEY;
