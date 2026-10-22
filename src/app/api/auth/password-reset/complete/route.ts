import { hash } from 'bcryptjs';
import { z } from 'zod';
import { hashOpaqueToken } from '@/lib/auth-email';
import { createApiError } from '@/lib/env';
import { prisma } from '@/lib/prisma';

const CompleteSchema = z.object({
  token: z.string().trim().min(20).max(200),
  password: z.string().min(12).max(200),
});

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createApiError('validation_failed', 'Provide a valid reset token and password.', 400);
  }
  const parsed = CompleteSchema.safeParse(body);
  if (!parsed.success) return createApiError('validation_failed', 'Provide a valid reset token and password.', 400);

  const reset = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashOpaqueToken(parsed.data.token) },
    include: { user: { select: { email: true } } },
  });
  if (!reset || reset.expires <= new Date()) return createApiError('invalid_token', 'This reset link is invalid or expired.', 400);

  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: await hash(parsed.data.password, 12) } }),
    prisma.passwordResetToken.delete({ where: { id: reset.id } }),
    ...(reset.user.email ? [prisma.loginThrottle.deleteMany({ where: { key: reset.user.email } })] : []),
  ]);
  return Response.json({ reset: true });
}
