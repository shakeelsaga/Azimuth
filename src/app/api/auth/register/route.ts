import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createApiError } from '@/lib/env';
import { hashOpaqueToken } from '@/lib/auth-email';

const RegisterSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(200),
  code: z.string().trim().regex(/^\d{6}$/, 'Verification code must be 6 digits.'),
});

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createApiError('validation_failed', 'Please provide valid registration details.', 400);
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || 'Please provide a name, valid email, 8+ character password, and 6-digit code.';
    return createApiError('validation_failed', errorMsg, 400);
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return createApiError('email_unavailable', 'An account already exists for that email.', 409);
  }

  // Verify the 6-digit code against the database
  const identifier = `signup:${email}`;
  const tokenHash = hashOpaqueToken(parsed.data.code);
  const tokenRecord = await prisma.verificationToken.findFirst({
    where: {
      identifier,
      token: tokenHash,
      expires: { gt: new Date() },
    },
  });

  if (!tokenRecord) {
    return createApiError('invalid_code', 'Invalid or expired verification code. Please request a new code.', 400);
  }

  // Create verified user
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: await hash(parsed.data.password, 12),
      emailVerified: new Date(),
    },
    select: { id: true, name: true, email: true },
  });

  // Clean up used verification token
  await prisma.verificationToken.deleteMany({ where: { identifier } });

  return Response.json(user, { status: 201 });
}
