export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const accessToken = (process.env.MERCADO_PAGO_ACCESS_TOKEN || '').trim();
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
