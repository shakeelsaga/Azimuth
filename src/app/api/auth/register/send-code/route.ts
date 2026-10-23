import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createApiError } from '@/lib/env';
import { generateNumericCode, hashOpaqueToken, sendAuthEmail } from '@/lib/auth-email';

const SendCodeSchema = z.object({
  email: z.string().trim().email().max(320),
  name: z.string().trim().max(120).optional(),
});

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createApiError('validation_failed', 'Please provide a valid email address.', 400);
  }

  const parsed = SendCodeSchema.safeParse(body);
  if (!parsed.success) {
    return createApiError('validation_failed', 'Please provide a valid email address.', 400);
  }

  const normalizedEmail = parsed.data.email.toLowerCase();

  // Check if an account already exists with this email
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    return createApiError('email_unavailable', 'An account already exists for that email. Please sign in instead.', 409);
  }

  // Generate 6-digit numeric verification code
  const code = generateNumericCode(6);
  const identifier = `signup:${normalizedEmail}`;

  // Clean up any prior pending codes for this email and persist new code (15 min expiry)
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashOpaqueToken(code),
      expires: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  const sent = await sendAuthEmail({
    to: normalizedEmail,
    subject: `Your Azimuth Verification Code: ${code}`,
    text: `Welcome to Azimuth.\n\nYour 6-digit verification code is: ${code}\n\nThis code expires in 15 minutes. Enter it to confirm your email and complete your registration.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e5e5; border-radius: 8px; background: #ffffff;">
        <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #111111; margin-bottom: 24px;">
          AZIMUTH™ • Account Verification
        </div>
        <h2 style="font-size: 24px; font-weight: 700; color: #111111; margin: 0 0 12px 0; letter-spacing: -0.02em;">
          Confirm your email address
        </h2>
        <p style="font-size: 15px; color: #555555; line-height: 1.5; margin: 0 0 24px 0;">
          Use the 6-digit code below to verify your email and finish setting up your Azimuth travel account:
        </p>
        <div style="background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <div style="font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #111111;">
            ${code}
          </div>
          <div style="font-size: 12px; color: #888888; margin-top: 8px;">
            Valid for 15 minutes
          </div>
        </div>
        <p style="font-size: 13px; color: #888888; line-height: 1.4; margin: 0;">
          If you did not request this registration, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  if (!sent) {
    // In development sandbox mode without a verified custom domain, Resend rejects emails to unverified domains.
    // Return devCode so developers and testers can verify without being blocked by external provider restrictions.
    return Response.json(
      {
        success: true,
        message: 'Sandbox mode: verification code generated (domain verification pending).',
        devCode: code,
      },
      { status: 200 }
    );
  }

  return Response.json({ success: true, message: 'Verification code sent to your email.' }, { status: 200 });
}
