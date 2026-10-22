import { createHash, randomBytes } from 'node:crypto';

export function createOpaqueToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: createHash('sha256').update(token).digest('hex') };
}

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function sendAuthEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY || !process.env.AUTH_FROM_EMAIL) return false;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.AUTH_FROM_EMAIL,
      to: [input.to],
      subject: input.subject,
      text: input.text,
    }),
  });
  return response.ok;
}
