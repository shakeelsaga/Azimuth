import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createApiError } from '@/lib/env';
import { createOpaqueToken, sendAuthEmail } from '@/lib/auth-email';

const RegisterSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  password: z.string().min(12).max(200),
});

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createApiError('validation_failed', 'Please provide valid registration details.', 400);
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) return createApiError('validation_failed', 'Please provide a name, valid email, and a 12-character password.', 400);

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return createApiError('email_unavailable', 'An account already exists for that email.', 409);

  const user = await prisma.user.create({
    data: { name: parsed.data.name, email, passwordHash: await hash(parsed.data.password, 12) },
    select: { id: true, name: true, email: true },
  });
  const verification = createOpaqueToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: verification.tokenHash,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  const appUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  const emailSent = appUrl
    ? await sendAuthEmail({
        to: email,
        subject: 'Verify your Azimuth account',
        text: `Verify your account: ${appUrl}/api/auth/verify-email?token=${verification.token}`,
      })
    : false;
  if (!emailSent) {
    await prisma.user.delete({ where: { id: user.id } });
    return createApiError('email_unavailable', 'Email delivery is not configured. Please try again later.', 503);
  }
  return Response.json(user, { status: 201 });
}
