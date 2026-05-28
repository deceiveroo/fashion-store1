// Email sender with support for SMTP (Yandex, Gmail, etc.) and Resend API.
// Priority: SMTP → Resend → dev log fallback.
//
// SMTP setup (Yandex example):
//   SMTP_HOST=smtp.yandex.ru
//   SMTP_PORT=465
//   SMTP_SECURE=true
//   SMTP_USER=your-email@yandex.ru
//   SMTP_PASSWORD=app-password-16-chars
//   EMAIL_FROM="Fashion Store <your-email@yandex.ru>"
//
// Resend setup (alternative):
//   RESEND_API_KEY=re_...
//   EMAIL_FROM="Fashion Store <noreply@yourdomain.com>"
//
// Optional:
//   EMAIL_REPLY_TO — reply-to address shown in clients

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  delivered: boolean; // false when in dev/log fallback mode
}

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

let smtpTransporter: Transporter | null = null;

function getSmtpTransporter(): Transporter | null {
  if (smtpTransporter) return smtpTransporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !port || !user || !pass) return null;

  const secure = process.env.SMTP_SECURE === 'true';

  smtpTransporter = nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure,
    auth: { user, pass },
  });

  return smtpTransporter;
}

async function sendViaSMTP(params: SendEmailParams): Promise<SendEmailResult> {
  const transporter = getSmtpTransporter();
  if (!transporter) return { ok: false, delivered: false, error: 'SMTP not configured' };

  const from = process.env.EMAIL_FROM;
  if (!from) return { ok: false, delivered: false, error: 'EMAIL_FROM not set' };

  try {
    const info = await transporter.sendMail({
      from,
      to: Array.isArray(params.to) ? params.to.join(', ') : params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo || process.env.EMAIL_REPLY_TO,
    });

    return { ok: true, delivered: true, id: info.messageId };
  } catch (error: any) {
    console.error('[email:smtp] Error:', error?.message || error);
    return { ok: false, delivered: false, error: error?.message || 'SMTP error' };
  }
}

async function sendViaResend(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return { ok: false, delivered: false, error: 'Resend not configured' };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        reply_to: params.replyTo || process.env.EMAIL_REPLY_TO,
        tags: params.tags,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error('[email:resend] Error', res.status, errBody);
      return { ok: false, delivered: false, error: `Resend ${res.status}` };
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, delivered: true, id: data.id };
  } catch (error: any) {
    console.error('[email:resend] Network error', error?.message || error);
    return { ok: false, delivered: false, error: error?.message || 'Network error' };
  }
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  // Priority: SMTP → Resend → dev log fallback
  if (process.env.SMTP_HOST) {
    const result = await sendViaSMTP(params);
    if (result.ok) return result;
    console.warn('[email] SMTP failed, trying Resend...');
  }

  if (process.env.RESEND_API_KEY) {
    return sendViaResend(params);
  }

  // Dev fallback: log to console
  if (process.env.NODE_ENV === 'production') {
    console.error('[email] No email transport configured in production. Email not delivered.');
    return { ok: false, delivered: false, error: 'Email transport not configured' };
  }

  console.log('[email:dev] Would send email:', {
    to: params.to,
    subject: params.subject,
    preview: params.text?.slice(0, 200) || params.html.slice(0, 200),
  });
  return { ok: true, delivered: false };
}

// Helpers ---------------------------------------------------------------

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderResetPasswordEmail(opts: { name?: string | null; resetCode: string; expiresMinutes: number }) {
  const name = opts.name ? escapeHtml(opts.name) : 'клиент';
  const code = escapeHtml(opts.resetCode);
  const html = `<!doctype html>
  <html><body style="font-family: -apple-system, Segoe UI, sans-serif; color:#111; max-width:560px; margin: 0 auto; padding: 24px;">
    <h2 style="margin:0 0 16px 0;">Код для сброса пароля</h2>
    <p>Здравствуйте, ${name}.</p>
    <p>Мы получили запрос на сброс пароля для вашего аккаунта. Используйте код ниже для подтверждения:</p>
    <div style="background:#f4f4f4;padding:20px;border-radius:8px;text-align:center;margin:24px 0;">
      <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#111;">${code}</div>
    </div>
    <p style="color:#666;font-size:13px;">Код действует ${opts.expiresMinutes} минут. Если вы не запрашивали сброс — просто проигнорируйте письмо.</p>
    <p style="color:#999;font-size:12px;margin-top:32px;">Никому не сообщайте этот код. Сотрудники Fashion Store никогда не попросят его у вас.</p>
  </body></html>`;
  const text = `Код для сброса пароля: ${opts.resetCode}\n\nКод действует ${opts.expiresMinutes} минут. Если вы не запрашивали сброс — проигнорируйте письмо.`;
  return { html, text };
}

export function renderOrderConfirmationEmail(opts: { name?: string | null; orderNumber: string; total: string; currency: string; orderUrl?: string }) {
  const name = opts.name ? escapeHtml(opts.name) : 'клиент';
  const html = `<!doctype html>
  <html><body style="font-family:-apple-system, Segoe UI, sans-serif; color:#111; max-width:560px; margin:0 auto; padding:24px;">
    <h2 style="margin:0 0 16px 0;">Заказ #${escapeHtml(opts.orderNumber)} принят</h2>
    <p>Спасибо, ${name}! Мы получили ваш заказ.</p>
    <p><b>Сумма к оплате:</b> ${escapeHtml(opts.total)} ${escapeHtml(opts.currency)}</p>
    ${opts.orderUrl ? `<p><a href="${escapeHtml(opts.orderUrl)}">Посмотреть заказ</a></p>` : ''}
    <p style="color:#666;font-size:13px;">Если у вас есть вопросы — ответьте на это письмо.</p>
  </body></html>`;
  const text = `Заказ #${opts.orderNumber} принят. Сумма: ${opts.total} ${opts.currency}.${opts.orderUrl ? `\n${opts.orderUrl}` : ''}`;
  return { html, text };
}

export function renderGiftCardEmail(opts: { recipientName?: string | null; code: string; amount: string; message?: string | null }) {
  const name = opts.recipientName ? escapeHtml(opts.recipientName) : 'друг';
  const message = opts.message ? `<blockquote style="border-left:3px solid #ccc;padding-left:12px;margin:16px 0;color:#444;">${escapeHtml(opts.message)}</blockquote>` : '';
  const html = `<!doctype html>
  <html><body style="font-family:-apple-system, Segoe UI, sans-serif; color:#111; max-width:560px; margin:0 auto; padding:24px;">
    <h2 style="margin:0 0 16px 0;">Вам подарили подарочную карту</h2>
    <p>Здравствуйте, ${name}!</p>
    ${message}
    <p>На вашу подарочную карту начислено <b>${escapeHtml(opts.amount)}</b>.</p>
    <p style="font-size:18px;background:#f4f4f4;padding:12px 16px;border-radius:6px;letter-spacing:2px;">${escapeHtml(opts.code)}</p>
    <p style="color:#666;font-size:13px;">Используйте этот код при оформлении заказа.</p>
  </body></html>`;
  const text = `Вам подарили подарочную карту на ${opts.amount}.\nКод: ${opts.code}${opts.message ? `\nСообщение: ${opts.message}` : ''}`;
  return { html, text };
}
