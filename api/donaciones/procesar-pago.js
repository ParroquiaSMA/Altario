const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || 'https://eucgxnnnmheqhptcxldp.supabase.co';
const SUPABASE_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1Y2d4bm5ubWhlcWhwdGN4bGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2Mjc1MjAsImV4cCI6MjEwMzIwMzUyMH0.Mf-7XI5ZMlnPYj3LGE2_HqiNcKFGHSunPnCDgnWTFqw';

async function getAccessToken() {
  const envToken = (process.env.MERCADO_PAGO_ACCESS_TOKEN || '').trim();
  if (envToken) return envToken;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/configuracion?clave=eq.donaciones&select=valor`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      const token = data?.[0]?.valor?.mercadopago?.access_token;
      if (token && typeof token === 'string' && token.trim()) {
        return token.trim();
      }
    }
  } catch (err) {
    console.warn('Error al obtener access_token de Supabase:', err);
  }

  return '';
}

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
      payment_method_id: data.payment_method_id,
      transaction_amount: Number(data.transaction_amount),
      installments: Number(data.installments) || 1,
      description: data.description || 'Donación - Parroquia Santa María de la Ayuda',
      payer: {
        email: data.payer?.email || 'donaciones@parroquiasma.uy',
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

    if (mpData && mpData.id) {
      try {
        const nombreDonante = (
          mpData.card?.cardholder?.name ||
          [data.payer?.first_name, data.payer?.last_name].filter(Boolean).join(' ') ||
          'Donante'
        ).trim();

        const emailDonante =
          mpData.payer?.email ||
          data.payer?.email ||
          '';

        const donacionPayload = {
          monto: Number(mpData.transaction_amount || data.transaction_amount),
          moneda: mpData.currency_id || 'UYU',
          tipo: 'unica_vez',
          estado: mpData.status || 'pending',
          mp_payment_id: String(mpData.id),
          mp_status_detail: mpData.status_detail || '',
          email_donante: emailDonante,
          nombre_donante: nombreDonante,
          metodo_pago: mpData.payment_method_id || data.payment_method_id || 'Mercado Pago',
          datos_adicionales: {
            payment_type_id: mpData.payment_type_id || '',
            card_last_four_digits: mpData.card?.last_four_digits || '',
            statement_descriptor: mpData.statement_descriptor || '',
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
        console.warn('Error al guardar donación en Supabase:', dbErr);
      }
    }

    return res.status(mpRes.status).json(mpData);
  } catch (err) {
    return res.status(500).json({ success: false, error: String(err) });
  }
}
