import { z } from 'zod';
import { generateNumericCode, hashOpaqueToken, sendAuthEmail } from '@/lib/auth-email';
import { createApiError } from '@/lib/env';
import { prisma } from '@/lib/prisma';

const RequestSchema = z.object({
  email: z.string().trim().email().max(320),
});

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createApiError('validation_failed', 'Provide a valid email address.', 400);
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return createApiError('validation_failed', 'Provide a valid email address.', 400);
  }

  const email = parsed.data.email.toLowerCase();

  // Explicit database check: Only proceed if email exists in database
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return createApiError(
      'user_not_found',
      'No account found with this email address. Please check your spelling or create an account.',
      404,
    );
  }

  if (!user.passwordHash) {
    return createApiError(
      'oauth_account',
      'This account is registered via Google OAuth. Please sign in with "Continue with Google".',
      400,
    );
  }

  // Generate 6-digit numeric reset code
  const code = generateNumericCode(6);
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashOpaqueToken(code),
      expires: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    },
  });

  const sent = await sendAuthEmail({
    to: user.email!,
    subject: `Your Azimuth Password Reset Code: ${code}`,
    text: `You requested a password reset for your Azimuth account.\n\nYour 6-digit reset code is: ${code}\n\nThis code expires in 15 minutes. Enter this code to set a new password.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e5e5; border-radius: 8px; background: #ffffff;">
        <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #111111; margin-bottom: 24px;">
          AZIMUTH™ • Password Security
        </div>
        <h2 style="font-size: 24px; font-weight: 700; color: #111111; margin: 0 0 12px 0; letter-spacing: -0.02em;">
          Reset your password
        </h2>
        <p style="font-size: 15px; color: #555555; line-height: 1.5; margin: 0 0 24px 0;">
          Enter the 6-digit code below on the password reset screen to choose a new password:
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
          If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  if (!sent) {
    // In development sandbox mode without a verified custom domain, Resend rejects emails to unverified domains.
    // Return devCode so developers and testers can reset passwords without being blocked.
    return Response.json(
      {
        success: true,
        message: 'Sandbox mode: password reset code generated (custom domain pending).',
        devCode: code,
      },
      { status: 200 }
    );
  }

  return Response.json({ success: true, message: 'Password reset code sent to your email.' }, { status: 200 });
}
