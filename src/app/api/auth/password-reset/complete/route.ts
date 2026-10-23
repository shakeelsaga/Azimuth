import { hash } from 'bcryptjs';
import { z } from 'zod';
import { hashOpaqueToken } from '@/lib/auth-email';
import { createApiError } from '@/lib/env';
import { prisma } from '@/lib/prisma';

const CompleteSchema = z.object({
  email: z.string().trim().email().max(320),
  code: z.string().trim().regex(/^\d{6}$/, 'Reset code must be 6 digits.'),
  password: z.string().min(8).max(200),
});

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createApiError('validation_failed', 'Provide a valid email, reset code, and new password.', 400);
  }

  const parsed = CompleteSchema.safeParse(body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || 'Provide a valid email, 6-digit reset code, and 8+ character password.';
    return createApiError('validation_failed', errorMsg, 400);
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return createApiError('user_not_found', 'No account found with this email address.', 404);
  }

  // Verify the 6-digit code against PasswordResetToken
  const reset = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      tokenHash: hashOpaqueToken(parsed.data.code),
      expires: { gt: new Date() },
    },
  });

  if (!reset) {
    return createApiError('invalid_code', 'Invalid or expired reset code. Please check your code or request a new one.', 400);
  }

  // Update password and clear used token and any throttles
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hash(parsed.data.password, 12) },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.loginThrottle.deleteMany({ where: { key: user.email! } }),
  ]);

  return Response.json({ success: true, message: 'Password updated successfully.' });
}
