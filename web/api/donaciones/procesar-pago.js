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
    return res.status(mpRes.status).json(mpData);
  } catch (err) {
    return res.status(500).json({ success: false, error: String(err) });
  }
}
