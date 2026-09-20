import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import { normalizePayerEmail, guardarRegistroDonacion } from './src/lib/mercadopago-utils';

// Cargar variables de entorno si no están cargadas
try {
  // @ts-ignore
  if (process.loadEnvFile) {
    if (fs.existsSync('.env')) {
      // @ts-ignore
      process.loadEnvFile('.env');
    } else if (fs.existsSync('../.env')) {
      // @ts-ignore
      process.loadEnvFile('../.env');
    }
  }
} catch (e) {}

async function getResolvedAccessToken() {
  let token = (process.env.MERCADO_PAGO_ACCESS_TOKEN || '').trim();
  if (token) return token;

  try {
    const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || 'https://eucgxnnnmheqhptcxldp.supabase.co';
    const SUPABASE_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1Y2d4bm5ubWhlcWhwdGN4bGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2Mjc1MjAsImV4cCI6MjEwMzIwMzUyMH0.Mf-7XI5ZMlnPYj3LGE2_HqiNcKFGHSunPnCDgnWTFqw';
    const res = await fetch(`${SUPABASE_URL}/rest/v1/configuracion?clave=eq.donaciones&select=valor`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      const dbToken = data?.[0]?.valor?.mercadopago?.access_token;
      if (dbToken && typeof dbToken === 'string' && dbToken.trim()) {
        return dbToken.trim();
      }
    }
  } catch (e) {}

  return '';
}

/** @returns {import('vite').Plugin} */
function devMercadoPagoApiPlugin() {
  return {
    name: 'dev-mercadopago-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // 1. Procesar Pago Puntual
        if (req.url && req.url.startsWith('/api/donaciones/procesar-pago') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', async () => {
            try {
              const data = JSON.parse(body);
              const accessToken = await getResolvedAccessToken();
              if (!accessToken) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'MERCADO_PAGO_ACCESS_TOKEN no configurado' }));
                return;
              }

              const payerEmail = normalizePayerEmail(data.payer?.email, 'donaciones@parroquiasma.uy');

              const payload = {
                payment_method_id: data.payment_method_id,
                transaction_amount: Number(data.transaction_amount),
                installments: Number(data.installments) || 1,
                description: data.description || 'Donación - Parroquia Santa María de la Ayuda',
                payer: {
                  email: payerEmail,
                  ...(data.payer?.first_name ? { first_name: data.payer.first_name } : {}),
                  ...(data.payer?.last_name ? { last_name: data.payer.last_name } : {}),
                  ...(data.payer?.identification ? { identification: data.payer.identification } : {}),
                },
              };
              if (data.token) payload.token = data.token;
              if (data.issuer_id) payload.issuer_id = data.issuer_id;

              const idempotencyKey = `mp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
              const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                  'X-Idempotency-Key': idempotencyKey,
                },
                body: JSON.stringify(payload),
              });

              const mpData = await mpRes.json();

              if (mpRes.ok && mpData.id) {
                try {
                  await guardarRegistroDonacion({
                    monto: Number(mpData.transaction_amount || data.transaction_amount),
                    moneda: 'UYU',
                    tipo: 'unica_vez',
                    estado: mpData.status || 'approved',
                    mp_payment_id: mpData.id,
                    mp_status_detail: mpData.status_detail || 'accredited',
                    nombre_donante: data.payer?.first_name ? `${data.payer.first_name} ${data.payer.last_name || ''}`.trim() : 'Donante',
                    email_donante: payerEmail,
                    metodo_pago: mpData.payment_method_id || 'Mercado Pago',
                    datos_adicionales: mpData.transaction_details || {},
                  });
                } catch (e) {
                  console.warn('[Donaciones] Error al registrar pago puntual:', e);
                }
              }

              res.statusCode = mpRes.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(mpData));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: String(err) }));
            }
          });
          return;
        }

        // 2. Suscribir Aporte Mensual
        if (req.url && req.url.startsWith('/api/donaciones/suscribir') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', async () => {
            try {
              const data = JSON.parse(body);
              const accessToken = await getResolvedAccessToken();
              if (!accessToken) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'MERCADO_PAGO_ACCESS_TOKEN no configurado' }));
                return;
              }

              const payerEmail = normalizePayerEmail(data.payer_email, 'donante@parroquiasma.uy');

              const payload = {
                reason: data.reason || 'Sostenimiento mensual - Parroquia Santa María de la Ayuda',
                auto_recurring: {
                  frequency: 1,
                  frequency_type: 'months',
                  transaction_amount: Number(data.transaction_amount),
                  currency_id: 'UYU',
                },
                payer_email: payerEmail,
                card_token_id: data.card_token_id,
                status: 'authorized',
                back_url: data.back_url || 'https://parroquiasma.uy/contacto',
              };

              const mpRes = await fetch('https://api.mercadopago.com/preapproval', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
              });

              const mpData = await mpRes.json();

              if (mpRes.ok && mpData.id) {
                try {
                  await guardarRegistroDonacion({
                    monto: Number(data.transaction_amount),
                    moneda: 'UYU',
                    tipo: 'mensual',
                    estado: mpData.status || 'approved',
                    mp_payment_id: mpData.id,
                    mp_status_detail: 'subscription_authorized',
                    nombre_donante: data.payer_name || 'Donante',
                    email_donante: payerEmail,
                    metodo_pago: mpData.payment_method_id || 'Tarjeta de Crédito',
                    datos_adicionales: { preapproval_id: mpData.id, frequency: 1 },
                  });
                } catch (e) {
                  console.warn('[Donaciones] Error al registrar suscripcion:', e);
                }
              }

              res.statusCode = mpRes.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(mpData));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: String(err) }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  vite: {
    plugins: [tailwindcss(), devMercadoPagoApiPlugin()],
  },
});
