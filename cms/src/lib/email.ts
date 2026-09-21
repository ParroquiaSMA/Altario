/**
 * Servicio de envío de correos electrónicos mediante Resend
 * Incluye plantilla base corporativa reutilizable para todos los correos del sistema.
 */

import { RESEND_API_KEY, DEFAULT_RESEND_API_KEY } from './constants';
import { getLocalConfig } from './config';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  apiKey?: string;
  from?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export interface EmailDetailRow {
  label: string;
  value: string;
}

/**
 * Parámetros para generar un correo a partir de la plantilla base institucional
 */
export interface BaseEmailOptions {
  /** Nombre del destinatario para el saludo inicial (ej: "Padre Martín") */
  recipientName?: string;
  /** Título principal del mensaje */
  title?: string;
  /** Párrafo(s) descriptivos del cuerpo del correo */
  text?: string | string[];
  /** Tarjeta de datos clave o resumen (ej: rol, correo, montos, fecha) */
  details?: EmailDetailRow[];
  /** Botón de llamada a la acción */
  ctaButton?: {
    text: string;
    url: string;
  };
  /** Cuadro informativo o de seguridad (ej: expiración de enlace) */
  noticeText?: string;
  /** Contenido HTML adicional personalizado */
  htmlContent?: string;
  /** Nota al pie específica para este correo */
  footerNote?: string;
}

/**
 * Obtiene la API Key de Resend activa (prioriza la configurada en CMS, luego constantes/env)
 */
export function getActiveResendApiKey(): string {
  try {
    const config = getLocalConfig();
    const configKey = config?.email?.resend_api_key?.trim();
    if (configKey) return configKey;
  } catch {}
  return RESEND_API_KEY || DEFAULT_RESEND_API_KEY;
}

/**
 * Obtiene el remitente configurado o el valor por defecto
 */
export function getActiveSender(): { email: string; name: string; full: string } {
  let email = 'onboarding@resend.dev';
  let name = 'Altario CMS';

  try {
    const config = getLocalConfig();
    if (config?.email?.remitente_email?.trim()) {
      email = config.email.remitente_email.trim();
    }
    if (config?.email?.remitente_nombre?.trim()) {
      name = config.email.remitente_nombre.trim();
    }
  } catch {}

  return { email, name, full: `${name} <${email}>` };
}

/**
 * Renderiza un correo usando el diseño minimalista de Sensilo:
 * tipografía cuidada, tarjeta blanca sobre fondo cálido neutro (#f6f5f2),
 * botón en negro (#111111) y firma del sistema.
 */
export function renderEmail(
  title: string,
  content: string,
  actionText?: string,
  actionUrl?: string,
  footerNote?: string
): string {
  const actionSection = actionText && actionUrl
    ? `
      <tr>
        <td style="padding: 24px 0 8px 0;">
          <a href="${actionUrl}" style="display: inline-block; background-color: #111111; color: #ffffff !important; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 500; letter-spacing: -0.01em;">
            ${actionText}
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding-top: 8px; font-size: 11px; color: #a8a29e; word-break: break-all; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
          <a href="${actionUrl}" style="color: #78716c; text-decoration: underline;">${actionUrl}</a>
        </td>
      </tr>
    `
    : '';

  const footerNoteSection = footerNote
    ? `
      <tr>
        <td style="padding-top: 16px; font-size: 12px; color: #78716c; line-height: 1.5;">
          ${footerNote}
        </td>
      </tr>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f6f5f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1c1917;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e7e4de; padding: 32px; text-align: left;" border="0" cellspacing="0" cellpadding="0">
          
          <!-- Header Logo / Brand -->
          <tr>
            <td style="padding-bottom: 24px;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align: middle; padding-right: 10px;">
                    <div style="width: 22px; height: 22px; background-color: #111111; color: #ffffff; border-radius: 5px; text-align: center; line-height: 22px; font-weight: 600; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      A
                    </div>
                  </td>
                  <td style="vertical-align: middle;">
                    <span style="font-size: 16px; font-weight: 500; color: #111111; letter-spacing: -0.02em;">Altario</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td>
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111111; line-height: 1.35; letter-spacing: -0.02em;">
                ${title}
              </h1>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="font-size: 14px; line-height: 1.6; color: #44403c;">
              ${content}
            </td>
          </tr>

          <!-- Action Button (optional) -->
          ${actionSection}

          <!-- Footer Note (optional) -->
          ${footerNoteSection}

          <!-- System Signature -->
          <tr>
            <td style="padding-top: 32px; border-top: 1px solid #f0ece6; font-size: 11px; color: #a8a29e; line-height: 1.4;">
              Altario &middot; Parroquia Santa Mar&iacute;a de la Ayuda
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Genera el HTML completo a partir de BaseEmailOptions usando la base idéntica a Sensilo
 */
export function renderBaseEmailTemplate(options: BaseEmailOptions): string {
  const paragraphs = Array.isArray(options.text)
    ? options.text
    : options.text
    ? [options.text]
    : [];

  const greetingHtml = options.recipientName
    ? `<p style="margin: 0 0 14px 0; font-weight: 500; color: #111111;">Hola ${options.recipientName},</p>`
    : '';

  const bodyHtml = paragraphs
    .map((p) => `<p style="margin: 0 0 14px 0;">${p}</p>`)
    .join('');

  const detailsHtml =
    options.details && options.details.length > 0
      ? `
        <div style="margin: 18px 0; background-color: #fafaf9; border: 1px solid #e7e4de; border-radius: 6px; padding: 12px 16px;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; font-size: 13px;">
            ${options.details
              .map(
                (d, idx) => `
              <tr style="${idx < options.details!.length - 1 ? 'border-bottom: 1px solid #f0ece6;' : ''}">
                <td style="padding: 6px 0; color: #78716c; font-weight: 400;">${d.label}:</td>
                <td style="padding: 6px 0; text-align: right; color: #1c1917; font-weight: 500;">${d.value}</td>
              </tr>
            `
              )
              .join('')}
          </table>
        </div>
      `
      : '';

  const fullContent = `
    ${greetingHtml}
    ${bodyHtml}
    ${options.htmlContent || ''}
    ${detailsHtml}
    ${options.noticeText ? `<div style="margin-top: 12px; font-size: 12px; color: #78716c; line-height: 1.5;">${options.noticeText}</div>` : ''}
  `;

  return renderEmail(
    options.title || 'Altario',
    fullContent,
    options.ctaButton?.text,
    options.ctaButton?.url,
    options.footerNote
  );
}

/**
 * Envía un correo electrónico a través de la API REST de Resend
 * Si se ejecuta desde el navegador, se envía a través del endpoint local /api/email/send
 * para evitar restricciones de CORS del navegador.
 */
export async function sendEmailViaResend(options: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = (options.apiKey || getActiveResendApiKey()).trim();
  const sender = options.from || getActiveSender().full;
  const to = Array.isArray(options.to) ? options.to : [options.to];

  // Si estamos en el navegador (cliente), usamos el endpoint proxy de Astro para evitar CORS
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          from: sender,
          to,
          subject: options.subject,
          html: options.html,
          ...(options.text ? { text: options.text } : {}),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        const errorMsg = data?.error || data?.message || `Error ${res.status}: ${res.statusText}`;
        console.warn('[Email Proxy] Error al enviar email:', errorMsg);
        return { ok: false, error: errorMsg };
      }

      return { ok: true, id: data?.id };
    } catch (err: any) {
      console.error('[Email Proxy] Excepción de red al enviar email:', err);
      return { ok: false, error: err?.message || 'Error de conexión con el servicio de correo' };
    }
  }

  // Si estamos en el servidor (Node.js)
  if (!apiKey) {
    return { ok: false, error: 'No hay API Key de Resend configurada' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: sender,
        to,
        subject: options.subject,
        html: options.html,
        ...(options.text ? { text: options.text } : {}),
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data?.message || data?.error?.message || `Error ${res.status}: ${res.statusText}`;
      console.warn('[Resend] Error al enviar email:', errorMsg);
      return { ok: false, error: errorMsg };
    }

    return { ok: true, id: data?.id };
  } catch (err: any) {
    console.error('[Resend] Excepción de red al enviar email:', err);
    return { ok: false, error: err?.message || 'Error de conexión con el servicio de correo' };
  }
}

/**
 * Función genérica para enviar correos usando la plantilla base.
 */
export async function sendTemplatedEmail(options: {
  to: string | string[];
  subject: string;
  template: BaseEmailOptions;
  apiKey?: string;
  from?: string;
}): Promise<SendEmailResult> {
  const html = renderBaseEmailTemplate(options.template);
  return sendEmailViaResend({
    to: options.to,
    subject: options.subject,
    html,
    apiKey: options.apiKey,
    from: options.from,
  });
}

/**
 * Envía el correo de recuperación de contraseña con enlace seguro usando la plantilla base estilo Sensilo
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  resetToken: string;
  userName?: string;
  appOrigin?: string;
}): Promise<SendEmailResult> {
  const origin =
    params.appOrigin ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://app.santamariadelaayuda.org');

  const resetLink = `${origin}/login?reset_token=${encodeURIComponent(params.resetToken)}`;

  return sendTemplatedEmail({
    to: params.to,
    subject: 'Recuperación de contraseña — Altario',
    template: {
      title: 'Recuperación de contraseña',
      text: [
        `Hola, recibimos una solicitud para restablecer la contraseña de tu cuenta <strong>${params.to}</strong> en Altario.`,
        'Haz clic en el siguiente botón para crear una nueva contraseña:',
      ],
      ctaButton: {
        text: 'Restablecer contraseña',
        url: resetLink,
      },
      footerNote: 'Este enlace vence en 30 minutos. Si no solicitaste este cambio, puedes ignorar este mensaje con seguridad.',
    },
  });
}

/**
 * Envía un correo de bienvenida/invitación a un usuario nuevo usando la plantilla base estilo Sensilo
 */
export async function sendWelcomeEmail(params: {
  to: string;
  userName: string;
  userRole: string;
  setupPasswordLink?: string;
  appOrigin?: string;
}): Promise<SendEmailResult> {
  const origin =
    params.appOrigin ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://app.santamariadelaayuda.org');

  const actionLink = params.setupPasswordLink || `${origin}/login`;
  const roleDisplay =
    params.userRole === 'admin'
      ? 'Administrador'
      : params.userRole === 'editor'
      ? 'Editor'
      : 'Solo lectura';

  return sendTemplatedEmail({
    to: params.to,
    subject: 'Invitación a Altario CMS',
    template: {
      title: 'Invitación a Altario',
      text: [
        `Hola <strong>${params.userName}</strong>, te invitaron a unirte a <strong>Altario</strong> (Parroquia Santa María de la Ayuda) como <strong>${roleDisplay}</strong>.`,
        'Haz clic en el siguiente botón para crear tu contraseña y comenzar:',
      ],
      details: [
        { label: 'Correo', value: params.to },
        { label: 'Rol asignado', value: roleDisplay },
      ],
      ctaButton: {
        text: 'Aceptar invitación',
        url: actionLink,
      },
      footerNote: `Este enlace de invitación vence en 7 días y es exclusivo para ${params.to}.`,
    },
  });
}

/**
 * Envía un correo de prueba para verificar las credenciales de Resend usando la plantilla base estilo Sensilo
 */
export async function sendTestEmail(params: {
  to: string;
  apiKey?: string;
  fromEmail?: string;
  fromName?: string;
}): Promise<SendEmailResult> {
  const from = params.fromEmail
    ? `${params.fromName || 'Altario'} <${params.fromEmail}>`
    : undefined;

  return sendTemplatedEmail({
    to: params.to,
    subject: 'Prueba de configuración de correo — Altario',
    apiKey: params.apiKey,
    from,
    template: {
      title: 'Configuración de correo verificada',
      text: [
        'Este es un correo de prueba enviado desde <strong>Altario</strong> para verificar la conexión con Resend.',
        'El servicio de correo está funcionando correctamente y listo para enviar invitaciones y notificaciones.',
      ],
      details: [
        { label: 'Fecha y hora', value: new Date().toLocaleString('es-UY') },
        { label: 'Servicio', value: 'Resend API REST' },
      ],
      footerNote: 'Configuración verificada desde el panel de Altario.',
    },
  });
}
