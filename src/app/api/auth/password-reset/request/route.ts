import { z } from 'zod';
import { createOpaqueToken, sendAuthEmail } from '@/lib/auth-email';
import { createApiError } from '@/lib/env';
import { prisma } from '@/lib/prisma';

const RequestSchema = z.object({ email: z.string().trim().email().max(320) });

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createApiError('validation_failed', 'Provide a valid email address.', 400);
  }
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) return createApiError('validation_failed', 'Provide a valid email address.', 400);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (user?.passwordHash && user.email) {
    const reset = createOpaqueToken();
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: reset.tokenHash, expires: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const appUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
    if (appUrl) {
      await sendAuthEmail({
        to: user.email,
        subject: 'Reset your Azimuth password',
        text: `Reset your password: ${appUrl}/reset-password?token=${reset.token}`,
      });
    }
  }

  return Response.json({ accepted: true });
}
