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
    return res.status(mpRes.status).json(mpData);
  } catch (err) {
    return res.status(500).json({ success: false, error: String(err) });
  }
}
