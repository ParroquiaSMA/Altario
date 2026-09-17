/**
 * Módulo para interactuar con la API de Mercado Pago Uruguay
 */

import { normalizePayerEmail } from './mercadopago-utils';

export interface PagoPuntualInput {
  token?: string;
  issuer_id?: string | number;
  payment_method_id: string;
  transaction_amount: number;
  installments?: number;
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  description?: string;
}

export interface SuscripcionInput {
  card_token_id: string;
  transaction_amount: number;
  payer_email: string;
  reason?: string;
  back_url?: string;
}

export interface ResultadoPago {
  success: boolean;
  id?: string | number;
  status: 'approved' | 'pending' | 'in_process' | 'rejected' | 'error';
  status_detail?: string;
  message: string;
  ticket_url?: string | null;
  payment_method_id?: string;
  monto?: number;
  error?: string;
}

const MP_ERROR_MESSAGES: Record<string, string> = {
  accredited: '¡Tu donación ha sido aprobada! Muchas gracias por colaborar.',
  pending_contingency: 'Estamos procesando tu pago. En breve te llegará la confirmación por correo.',
  pending_review_manual: 'El pago está en revisión por seguridad. Te avisaremos por correo.',
  pending_waiting_payment: 'Comprobante generado. Puedes pagar en la red de cobranza seleccionada (Abitab / Redpagos).',
  cc_rejected_bad_filled_card_number: 'Revisa el número de tarjeta ingresado.',
  cc_rejected_bad_filled_date: 'Revisa la fecha de vencimiento ingresada.',
  cc_rejected_bad_filled_other: 'Revisa los datos de la tarjeta.',
  cc_rejected_bad_filled_security_code: 'El código de seguridad (CVV) es incorrecto.',
  cc_rejected_blacklist: 'No pudimos procesar tu pago con este medio.',
  cc_rejected_call_for_authorize: 'Debes comunicarte con tu emisor de tarjeta para autorizar el pago.',
  cc_rejected_card_disabled: 'Tu tarjeta se encuentra inhabilitada. Comunícate con tu banco emisor.',
  cc_rejected_card_error: 'No pudimos procesar tu tarjeta. Intenta con otra.',
  cc_rejected_duplicated_payment: 'Ya realizaste un pago por este valor hace instantes.',
  cc_rejected_high_risk: 'La operación no pudo ser autorizada por seguridad.',
  cc_rejected_insufficient_amount: 'Fondos o límite insuficiente en la tarjeta.',
  cc_rejected_invalid_installments: 'La cantidad de cuotas no es válida.',
  cc_rejected_max_attempts: 'Superaste el límite de intentos permitidos. Intenta más tarde con otra tarjeta.',
  cc_rejected_other_reason: 'El banco emisor no autorizó el pago. Por favor intenta con otra tarjeta.',
};

function getAccessToken(): string {
  const globalProc = (globalThis as any).process;
  const token =
    (globalProc && globalProc.env && globalProc.env.MERCADO_PAGO_ACCESS_TOKEN) ||
    (import.meta as any).env?.MERCADO_PAGO_ACCESS_TOKEN ||
    '';
  return token.trim();
}

/**
 * Procesa un pago puntual (tarjeta de crédito, débito o ticket Abitab/Redpagos)
 */
export async function procesarPagoMercadoPago(data: PagoPuntualInput): Promise<ResultadoPago> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return {
      success: false,
      status: 'error',
      message: 'No está configurado el Access Token de Mercado Pago.',
      error: 'ACCESS_TOKEN_MISSING',
    };
  }

  const payerEmail = normalizePayerEmail(data.payer?.email);

  const payload: any = {
    payment_method_id: data.payment_method_id,
    transaction_amount: Number(data.transaction_amount),
    installments: Number(data.installments) || 1,
    description: data.description || 'Donación - Parroquia Santa María de la Ayuda',
    payer: {
      email: payerEmail,
      ...(data.payer.first_name ? { first_name: data.payer.first_name } : {}),
      ...(data.payer.last_name ? { last_name: data.payer.last_name } : {}),
      ...(data.payer.identification ? { identification: data.payer.identification } : {}),
    },
  };

  if (data.token) {
    payload.token = data.token;
  }
  if (data.issuer_id) {
    payload.issuer_id = data.issuer_id;
  }

  try {
    const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `mp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const res = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payload),
    });

    const mpData = await res.json();

    if (!res.ok) {
      console.error('Error respuesta Mercado Pago:', mpData);
      const detail = mpData.message || (mpData.cause && mpData.cause[0]?.description) || 'Error al procesar el pago';
      return {
        success: false,
        status: 'error',
        message: detail,
        error: mpData.error || 'PAYMENT_CREATION_FAILED',
      };
    }

    const status = mpData.status as 'approved' | 'pending' | 'in_process' | 'rejected';
    const statusDetail = mpData.status_detail || '';
    const message =
      MP_ERROR_MESSAGES[statusDetail] ||
      (status === 'approved'
        ? '¡Donación aprobada exitosamente! Muchas gracias por colaborar.'
        : status === 'pending'
        ? 'Tu donación está pendiente de confirmación.'
        : 'La operación no pudo ser autorizada.');

    return {
      success: status === 'approved' || status === 'pending' || status === 'in_process',
      id: mpData.id,
      status,
      status_detail: statusDetail,
      message,
      ticket_url: mpData.transaction_details?.external_resource_url || null,
      payment_method_id: mpData.payment_method_id,
      monto: mpData.transaction_amount,
    };
  } catch (err: any) {
    console.error('Excepción procesando pago en Mercado Pago:', err);
    return {
      success: false,
      status: 'error',
      message: 'Ocurrió un error inesperado al conectar con Mercado Pago. Intenta nuevamente.',
      error: err?.message || 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Crea una suscripción mensual recurrente en Mercado Pago (Preapproval API)
 */
export async function crearSuscripcionMercadoPago(data: SuscripcionInput): Promise<ResultadoPago> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return {
      success: false,
      status: 'error',
      message: 'No está configurado el Access Token de Mercado Pago.',
      error: 'ACCESS_TOKEN_MISSING',
    };
  }

  const payerEmail = normalizePayerEmail(data.payer_email);

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

  try {
    const res = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const mpData = await res.json();

    if (!res.ok) {
      console.error('Error respuesta Suscripción Mercado Pago:', mpData);
      const detail = mpData.message || (mpData.cause && mpData.cause[0]?.description) || 'Error al autorizar el débito mensual';
      return {
        success: false,
        status: 'error',
        message: detail,
        error: mpData.error || 'SUBSCRIPTION_CREATION_FAILED',
      };
    }

    return {
      success: true,
      id: mpData.id,
      status: 'approved',
      status_detail: 'subscription_authorized',
      message: '¡Aporte mensual registrado exitosamente! Se debitará automáticamente cada mes.',
      monto: Number(data.transaction_amount),
    };
  } catch (err: any) {
    console.error('Excepción al crear suscripción en Mercado Pago:', err);
    return {
      success: false,
      status: 'error',
      message: 'Error al conectar con Mercado Pago para configurar la suscripción.',
      error: err?.message || 'UNKNOWN_ERROR',
    };
  }
}
