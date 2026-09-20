import crypto from 'crypto';

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || 'https://eucgxnnnmheqhptcxldp.supabase.co';
const SUPABASE_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1Y2d4bm5ubWhlcWhwdGN4bGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2Mjc1MjAsImV4cCI6MjEwMzIwMzUyMH0.Mf-7XI5ZMlnPYj3LGE2_HqiNcKFGHSunPnCDgnWTFqw';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getConfig() {
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
    console.warn('Webhook: error al obtener config de Supabase:', err);
  }
  return {};
}

function getAccessToken(config) {
  const envToken = (process.env.MERCADO_PAGO_ACCESS_TOKEN || '').trim();
  if (envToken) return envToken;
  const dbToken = config?.mercadopago?.access_token;
  if (dbToken && typeof dbToken === 'string' && dbToken.trim()) return dbToken.trim();
  return '';
}

function getWebhookSecret(config) {
  const envSecret = (process.env.MP_WEBHOOK_SECRET || '').trim();
  if (envSecret) return envSecret;
  const dbSecret = config?.mercadopago?.webhook_secret;
  if (dbSecret && typeof dbSecret === 'string' && dbSecret.trim()) return dbSecret.trim();
  return '';
}

/**
 * Valida la firma HMAC del webhook de Mercado Pago.
 * MP envía: x-signature: ts=...,v1=...
 * Se valida con: HMAC-SHA256(secret, "id:{data.id};request-id:{x-request-id};ts:{ts};")
 */
function validateSignature(req, secret) {
  if (!secret) return true; // Si no hay secret configurado, permitir (para desarrollo)

  const xSignature = req.headers['x-signature'] || '';
  const xRequestId = req.headers['x-request-id'] || '';

  if (!xSignature) return false;

  // Parsear ts y v1 de x-signature
  const parts = {};
  xSignature.split(',').forEach((part) => {
    const [key, val] = part.split('=');
    if (key && val) parts[key.trim()] = val.trim();
  });

  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  // Obtener el data.id del body
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const dataId = body?.data?.id || '';

  // Construir el manifest según documentación de MP
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  return hmac === v1;
}

async function supabaseUpdate(table, filters, data) {
  let url = `${SUPABASE_URL}/rest/v1/${table}?`;
  const filterParts = Object.entries(filters).map(([k, v]) => `${k}=eq.${v}`);
  url += filterParts.join('&');

  return fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(data),
  });
}

async function supabaseInsert(table, data) {
  return fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(data),
  });
}

// ── Handler principal ────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // MP envía POST para notificaciones
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true }); // GET = health check
  }

  const config = await getConfig();
  const webhookSecret = getWebhookSecret(config);

  // Validar firma HMAC
  if (webhookSecret && !validateSignature(req, webhookSecret)) {
    console.warn('Webhook: firma inválida, rechazando notificación');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { type, action, data } = body;

  // Responder rápido a MP (acepta 200/201 dentro de 500ms idealmente)
  // Pero primero procesamos porque Vercel serverless no continúa después del response

  try {
    const accessToken = getAccessToken(config);
    if (!accessToken) {
      console.warn('Webhook: access_token no configurado');
      return res.status(200).json({ received: true, warning: 'no access_token' });
    }

    // ── PAGOS (pago puntual, Abitab, débito) ─────────────────────────────
    if (type === 'payment') {
      const paymentId = data?.id;
      if (!paymentId) return res.status(200).json({ received: true });

      // Obtener detalle completo del pago desde MP
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!mpRes.ok) {
        console.warn(`Webhook: error al consultar pago ${paymentId}:`, mpRes.status);
        return res.status(200).json({ received: true });
      }

      const payment = await mpRes.json();

      // Actualizar el registro existente en donaciones
      const updateData = {
        estado: payment.status,
        mp_status_detail: payment.status_detail || '',
        datos_adicionales: {
          payment_type_id: payment.payment_type_id || '',
          card_last_four_digits: payment.card?.last_four_digits || '',
          statement_descriptor: payment.statement_descriptor || '',
          net_received_amount: payment.transaction_details?.net_received_amount !== undefined
            ? Number(payment.transaction_details.net_received_amount)
            : null,
          fee_amount: payment.fee_details?.[0]?.amount !== undefined
            ? Number(payment.fee_details[0].amount)
            : null,
          total_paid_amount: payment.transaction_details?.total_paid_amount !== undefined
            ? Number(payment.transaction_details.total_paid_amount)
            : Number(payment.transaction_amount),
          webhook_updated: true,
          webhook_updated_at: new Date().toISOString(),
        },
      };

      // Calcular monto_neto si tenemos los datos
      if (payment.transaction_details?.net_received_amount !== undefined) {
        updateData.monto_neto = Number(payment.transaction_details.net_received_amount);
        updateData.comision = payment.fee_details?.[0]?.amount !== undefined
          ? Number(payment.fee_details[0].amount)
          : null;
      }

      await supabaseUpdate('donaciones', { mp_payment_id: String(paymentId) }, updateData);

      console.log(`Webhook: pago ${paymentId} actualizado a estado=${payment.status}`);
      return res.status(200).json({ received: true, payment_id: paymentId, status: payment.status });
    }

    // ── SUSCRIPCIONES (pagos recurrentes) ────────────────────────────────
    if (type === 'subscription_preapproval' || type === 'subscription_authorized_payment') {
      const resourceId = data?.id;
      if (!resourceId) return res.status(200).json({ received: true });

      if (type === 'subscription_preapproval') {
        // Actualización del estado de la suscripción (cancelada, pausada, etc.)
        const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (mpRes.ok) {
          const sub = await mpRes.json();
          await supabaseUpdate(
            'donaciones',
            { mp_payment_id: String(resourceId) },
            {
              estado: sub.status,
              mp_status_detail: sub.status,
            }
          );
          console.log(`Webhook: suscripción ${resourceId} actualizada a estado=${sub.status}`);
        }
      }

      if (type === 'subscription_authorized_payment') {
        // Un cobro individual de la suscripción → registrar como nueva donación
        const mpRes = await fetch(`https://api.mercadopago.com/authorized_payments/${resourceId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (mpRes.ok) {
          const authorizedPayment = await mpRes.json();

          // Registrar el cobro individual
          const donacionPayload = {
            monto: Number(authorizedPayment.transaction_amount || 0),
            moneda: authorizedPayment.currency_id || 'UYU',
            tipo: 'mensual',
            estado: authorizedPayment.status || 'approved',
            mp_payment_id: String(authorizedPayment.payment?.id || resourceId),
            mp_status_detail: authorizedPayment.status || '',
            email_donante: authorizedPayment.payer?.email || '',
            nombre_donante: 'Donante mensual (cobro automático)',
            metodo_pago: 'Suscripción Mercado Pago',
            datos_adicionales: {
              authorized_payment_id: resourceId,
              preapproval_id: authorizedPayment.preapproval_id,
              payment_id: authorizedPayment.payment?.id,
              net_received_amount: authorizedPayment.transaction_details?.net_received_amount !== undefined
                ? Number(authorizedPayment.transaction_details.net_received_amount)
                : null,
              fee_amount: authorizedPayment.fee_details?.[0]?.amount !== undefined
                ? Number(authorizedPayment.fee_details[0].amount)
                : null,
              total_paid_amount: authorizedPayment.transaction_details?.total_paid_amount !== undefined
                ? Number(authorizedPayment.transaction_details.total_paid_amount)
                : Number(authorizedPayment.transaction_amount || 0),
              webhook_source: true,
            },
          };

          if (authorizedPayment.transaction_details?.net_received_amount !== undefined) {
            donacionPayload.monto_neto = Number(authorizedPayment.transaction_details.net_received_amount);
            donacionPayload.comision = authorizedPayment.fee_details?.[0]?.amount !== undefined
              ? Number(authorizedPayment.fee_details[0].amount)
              : null;
          }

          await supabaseInsert('donaciones', donacionPayload);

          console.log(`Webhook: cobro de suscripción registrado (authorized_payment=${resourceId})`);
        }
      }

      return res.status(200).json({ received: true, type });
    }

    // Tipo no manejado — aceptar igual para que MP no reintente
    console.log(`Webhook: tipo no manejado: ${type} / ${action}`);
    return res.status(200).json({ received: true, type });

  } catch (err) {
    console.error('Webhook: error procesando notificación:', err);
    // Devolver 200 igual para evitar reintentos infinitos de MP
    return res.status(200).json({ received: true, error: String(err) });
  }
}
