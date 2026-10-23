import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const sendMail = vi.fn();
  return {
    createTransport: vi.fn(() => ({ sendMail })),
    sendMail,
  };
});

vi.mock('nodemailer', () => ({
  default: { createTransport: mocks.createTransport },
}));

import { sendAuthEmail } from '@/lib/auth-email';

const emailEnvironmentNames = [
  'AUTH_FROM_EMAIL',
  'GMAIL_APP_PASSWORD',
  'GMAIL_FROM_EMAIL',
  'GMAIL_USER',
  'RESEND_API_KEY',
  'SOS_FROM_EMAIL',
] as const;

const originalEnvironment = new Map(emailEnvironmentNames.map((name) => [name, process.env[name]]));

function restoreEnvironment(): void {
  for (const name of emailEnvironmentNames) {
    const value = originalEnvironment.get(name);
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
}

beforeEach(() => {
  restoreEnvironment();
  for (const name of emailEnvironmentNames) delete process.env[name];
  mocks.createTransport.mockClear();
  mocks.sendMail.mockReset();
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
  restoreEnvironment();
});

describe('sendAuthEmail', () => {
  const message = {
    to: 'traveler@example.com',
    subject: 'Your verification code',
    text: '123456',
    html: '<strong>123456</strong>',
  };

  it('uses Resend when its delivery succeeds', async () => {
    process.env.RESEND_API_KEY = 'resend-test-key';
    process.env.AUTH_FROM_EMAIL = 'Azimuth <onboarding@resend.dev>';
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendAuthEmail(message)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(mocks.createTransport).not.toHaveBeenCalled();
  });

  it('falls back to Gmail SMTP when Resend cannot deliver', async () => {
    process.env.RESEND_API_KEY = 'resend-test-key';
    process.env.AUTH_FROM_EMAIL = 'Azimuth <onboarding@resend.dev>';
    process.env.GMAIL_USER = 'azimuth.test@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'app-password';
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 403 }));
    vi.stubGlobal('fetch', fetchMock);
    mocks.sendMail.mockResolvedValue({ messageId: 'mail-1' });

    await expect(sendAuthEmail(message)).resolves.toBe(true);
    expect(mocks.createTransport).toHaveBeenCalledWith({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: 'azimuth.test@gmail.com', pass: 'app-password' },
    });
    expect(mocks.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: 'Azimuth <azimuth.test@gmail.com>',
      to: message.to,
      subject: message.subject,
    }));
  });

  it('returns false when neither delivery method is configured', async () => {
    await expect(sendAuthEmail(message)).resolves.toBe(false);
  });
});
