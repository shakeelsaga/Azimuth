import { createHash, randomBytes } from 'node:crypto';
import nodemailer from 'nodemailer';

type AuthEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export function createOpaqueToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: createHash('sha256').update(token).digest('hex') };
}

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateNumericCode(length = 6): string {
  const digits = '0123456789';
  let code = '';
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += digits[bytes[i] % 10];
  }
  return code;
}

async function sendWithResend(input: AuthEmailInput, fromEmail: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        ...(input.html ? { html: input.html } : {}),
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function sendWithGmail(input: AuthEmailInput): Promise<boolean> {
  const { GMAIL_USER: user, GMAIL_APP_PASSWORD: pass, GMAIL_FROM_EMAIL: from } = process.env;
  if (!user || !pass) return false;

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: from || `Azimuth <${user}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
    });
    return true;
  } catch {
    return false;
  }
}

export async function sendAuthEmail(input: AuthEmailInput): Promise<boolean> {
  const fromEmail = process.env.AUTH_FROM_EMAIL || process.env.SOS_FROM_EMAIL;
  if (process.env.RESEND_API_KEY && fromEmail && await sendWithResend(input, fromEmail)) return true;

  return sendWithGmail(input);
}

