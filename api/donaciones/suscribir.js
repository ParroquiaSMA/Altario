import { SUPABASE_URL, SUPABASE_KEY, getAccessToken } from '../lib/config.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return res.status(400).json({ success: false, error: 'MERCADO_PAGO_ACCESS_TOKEN no configurado' });
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const payload = {
      reason: data.reason || 'Sostenimiento mensual - Parroquia Santa María de la Ayuda',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: Number(data.transaction_amount),
        currency_id: 'UYU',
      },
      payer_email: data.payer_email,
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

    // Guardar registro de la suscripción en la tabla donaciones de Supabase para el panel
    if (mpData && mpData.id) {
      try {
        const donacionPayload = {
          monto: Number(mpData.auto_recurring?.transaction_amount || data.transaction_amount),
          moneda: mpData.auto_recurring?.currency_id || 'UYU',
          tipo: 'mensual',
          estado: mpData.status || 'authorized',
          mp_payment_id: String(mpData.id),
          mp_status_detail: mpData.status || 'authorized',
          email_donante: mpData.payer_email || data.payer_email || '',
          nombre_donante: data.payer_name || 'Donante mensual',
          metodo_pago: 'Suscripción Mercado Pago',
          datos_adicionales: {
            preapproval_id: mpData.id,
            collector_id: mpData.collector_id,
          },
        };

        await fetch(`${SUPABASE_URL}/rest/v1/donaciones`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(donacionPayload),
        });
      } catch (dbErr) {
        console.warn('Error al guardar suscripción en Supabase:', dbErr);
      }
    }

    return res.status(mpRes.status).json(mpData);
  } catch (err) {
    return res.status(500).json({ success: false, error: String(err) });
  }
}
