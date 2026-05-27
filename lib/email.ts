// Lightweight email sender. Currently supports Resend (https://resend.com).
// If RESEND_API_KEY is not set, falls back to logging the message to the
// server console — keeps dev environments working without forcing setup.
//
// Required env vars (production):
//   RESEND_API_KEY       — your Resend API key (re_...)
//   EMAIL_FROM           — verified sender address, e.g. "Fashion Store <noreply@example.com>"
//
// Optional:
//   EMAIL_REPLY_TO       — reply-to address shown in clients

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

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const replyTo = params.replyTo || process.env.EMAIL_REPLY_TO;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[email] RESEND_API_KEY or EMAIL_FROM is not set in production. Email not delivered.');
      return { ok: false, delivered: false, error: 'Email transport not configured' };
    }
    console.log('[email:dev] Would send email:', {
      to: params.to,
      subject: params.subject,
      preview: params.text?.slice(0, 200) || params.html.slice(0, 200),
    });
    return { ok: true, delivered: false };
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
        reply_to: replyTo,
        tags: params.tags,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error('[email] Resend error', res.status, errBody);
      return { ok: false, delivered: false, error: `Resend ${res.status}` };
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, delivered: true, id: data.id };
  } catch (error: any) {
    console.error('[email] Network error', error?.message || error);
    return { ok: false, delivered: false, error: error?.message || 'Network error' };
  }
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

export function renderResetPasswordEmail(opts: { name?: string | null; resetUrl: string; expiresMinutes: number }) {
  const name = opts.name ? escapeHtml(opts.name) : 'клиент';
  const url = escapeHtml(opts.resetUrl);
  const html = `<!doctype html>
  <html><body style="font-family: -apple-system, Segoe UI, sans-serif; color:#111; max-width:560px; margin: 0 auto; padding: 24px;">
    <h2 style="margin:0 0 16px 0;">Сброс пароля</h2>
    <p>Здравствуйте, ${name}.</p>
    <p>Мы получили запрос на сброс пароля для вашего аккаунта. Нажмите на кнопку ниже, чтобы задать новый пароль.</p>
    <p style="margin: 24px 0;">
      <a href="${url}" style="background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;display:inline-block;">Сбросить пароль</a>
    </p>
    <p style="color:#666;font-size:13px;">Если кнопка не открывается, скопируйте ссылку: ${url}</p>
    <p style="color:#666;font-size:13px;">Ссылка действует ${opts.expiresMinutes} минут. Если вы не запрашивали сброс — просто проигнорируйте письмо.</p>
  </body></html>`;
  const text = `Сброс пароля\n\nЕсли вы запрашивали сброс пароля, перейдите по ссылке (действует ${opts.expiresMinutes} минут):\n${opts.resetUrl}\n\nЕсли это не вы — проигнорируйте письмо.`;
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
