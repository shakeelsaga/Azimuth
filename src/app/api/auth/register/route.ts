import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createApiError } from '@/lib/env';
import { hashOpaqueToken } from '@/lib/auth-email';

const RegisterSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(200),
  code: z.string().trim().optional(),
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
    const errorMsg = parsed.error.issues[0]?.message || 'Please provide a name, valid email, and 8+ character password.';
    return createApiError('validation_failed', errorMsg, 400);
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return createApiError('email_unavailable', 'An account already exists for that email.', 409);
  }

  // --- VERIFICATION CODE UTILITY (PRESERVED FOR CUSTOM DOMAIN DEPLOYMENT) ---
  // In development sandbox mode without a verified custom domain, transactional email dispatch
  // to arbitrary domains is restricted by Resend. Email verification is temporarily bypassed
  // so users can directly create accounts.
  // When a custom domain is verified in Resend (e.g. @azimuth.travel) with SPF/DKIM records:
  // 1. Require `code` in RegisterSchema
  // 2. Uncomment the verification check below:
  /*
  if (parsed.data.code) {
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
      return createApiError('invalid_code', 'Invalid or expired verification code.', 400);
    }
    await prisma.verificationToken.deleteMany({ where: { identifier } });
  }
  */

  // Create user directly
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: await hash(parsed.data.password, 12),
      emailVerified: new Date(),
    },
    select: { id: true, name: true, email: true },
  });

  return Response.json(user, { status: 201 });
}
