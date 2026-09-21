const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || 'https://eucgxnnnmheqhptcxldp.supabase.co';
const SUPABASE_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1Y2d4bm5ubWhlcWhwdGN4bGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2Mjc1MjAsImV4cCI6MjEwMzIwMzUyMH0.Mf-7XI5ZMlnPYj3LGE2_HqiNcKFGHSunPnCDgnWTFqw';
const DEFAULT_RESEND_API_KEY = process.env.RESEND_API_KEY || '';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {}
    }

    let apiKey = (payload?.apiKey || '').trim();

    if (!apiKey) {
      try {
        const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/configuracion?clave=eq.email&select=valor`, {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        });
        if (dbRes.ok) {
          const data = await dbRes.json();
          apiKey = data?.[0]?.valor?.resend_api_key?.trim() || '';
        }
      } catch {}
    }

    if (!apiKey) {
      apiKey = process.env.RESEND_API_KEY || DEFAULT_RESEND_API_KEY;
    }

    const to = Array.isArray(payload?.to) ? payload.to : [payload?.to];
    const from = payload?.from || 'Altario CMS <onboarding@resend.dev>';

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject: payload?.subject,
        html: payload?.html,
        ...(payload?.text ? { text: payload.text } : {}),
      }),
    });

    const data = await resendRes.json().catch(() => ({}));

    if (resendRes.ok) {
      return res.status(200).json({ ok: true, id: data?.id });
    } else {
      return res.status(resendRes.status || 400).json({
        ok: false,
        error: data?.message || data?.error?.message || `Error ${resendRes.status}`,
      });
    }
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
